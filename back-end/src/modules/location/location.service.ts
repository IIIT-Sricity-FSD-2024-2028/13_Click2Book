import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { LocationRepository } from './location.repository';
import { CreateLocationRequestDto, RejectLocationRequestDto, DirectCreateLocationDto } from './dto/location.dto';
import { successResponse } from '../../common/utils/response.util';

interface CachedSearchResult {
  timestamp: number;
  data: any[];
}

@Injectable()
export class LocationService {
  // In-memory cache for Nominatim query results (1 hour TTL)
  private nominatimCache = new Map<string, CachedSearchResult>();
  private readonly CACHE_TTL_MS = 60 * 60 * 1000;

  // Rate limiting timestamp to respect Nominatim 1 req/sec policy
  private lastNominatimRequestTime = 0;

  constructor(private readonly locationRepo: LocationRepository) {}

  /**
   * Get all approved locations
   */
  getApprovedLocations(search?: string) {
    const locations = this.locationRepo.findAllApproved(search);
    return successResponse('Approved locations retrieved', locations);
  }

  /**
   * Search OpenStreetMap Nominatim with caching, rate limiting, and Indian boundary constraint.
   * Respects Nominatim usage policies by strictly limiting request rate and caching responses.
   */
  async searchOsmNominatim(query: string) {
    const cleanQuery = (query || '').trim();
    if (!cleanQuery || cleanQuery.length < 2) {
      return successResponse('Search results', []);
    }

    const normalizedQuery = cleanQuery.toLowerCase();

    // 1. Check local cache first
    const cached = this.nominatimCache.get(normalizedQuery);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
      return successResponse('Search results (cached)', this.enrichResultsWithDbStatus(cached.data));
    }

    // 2. Fetch from Nominatim with rate limiting
    let osmItems: any[] = [];
    try {
      await this.enforceNominatimRateLimit();

      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        cleanQuery,
      )}&format=json&addressdetails=1&countrycodes=in&limit=8&accept-language=en`;

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Click2Book-BusReservationSystem/1.0 (contact: admin@click2book.local)',
          Accept: 'application/json',
        },
      });

      if (response.ok) {
        const rawResults = await response.json();
        if (Array.isArray(rawResults)) {
          osmItems = rawResults.map((item) => this.mapNominatimItem(item));
          // Store in cache
          this.nominatimCache.set(normalizedQuery, {
            timestamp: Date.now(),
            data: osmItems,
          });
        }
      } else {
        console.warn(`[Nominatim] API responded with status ${response.status}`);
      }
    } catch (err) {
      console.warn('[Nominatim] Search request failed, falling back to local database:', err?.message);
    }

    // 3. Merge with local approved locations matching the query if OSM returned few/no results
    const localMatches = this.locationRepo.findAllApproved(cleanQuery).map((loc) => ({
      name: loc.name,
      displayName: loc.displayName,
      osmId: String(loc.osmId),
      osmType: loc.osmType || 'relation',
      locationType: loc.locationType,
      latitude: loc.latitude,
      longitude: loc.longitude,
      state: loc.state || (loc.address?.state ?? ''),
      address: loc.address || {},
      isApproved: true,
      isAlreadyApproved: true,
      hasPendingRequest: false,
      locationId: loc.locationId,
    }));

    // Merge without duplicates (by name/osmId)
    const combined: any[] = [...localMatches];
    for (const osmItem of osmItems) {
      const exists = combined.some(
        (c) =>
          c.name.toLowerCase() === osmItem.name.toLowerCase() ||
          String(c.osmId) === String(osmItem.osmId),
      );
      if (!exists) {
        combined.push(osmItem);
      }
    }

    const enriched = this.enrichResultsWithDbStatus(combined);
    return successResponse('Search results', enriched);
  }

  /**
   * Enriches OSM results with flags indicating whether they are already in the DB or have pending requests
   */
  private enrichResultsWithDbStatus(items: any[]): any[] {
    return items.map((item) => {
      const approvedLoc =
        this.locationRepo.findApprovedByOsmId(item.osmId) ||
        this.locationRepo.findApprovedByName(item.name);

      const pendingReq =
        this.locationRepo.findPendingRequestByOsmId(item.osmId) ||
        this.locationRepo.findPendingRequestByName(item.name);

      return {
        ...item,
        isAlreadyApproved: Boolean(approvedLoc),
        hasPendingRequest: Boolean(pendingReq),
        existingLocationId: approvedLoc?.locationId,
        existingRequestId: pendingReq?.requestId,
      };
    });
  }

  /**
   * Formats a raw Nominatim API item into Click2Book Location format
   */
  private mapNominatimItem(raw: any) {
    const address = raw.address || {};
    // Extract most meaningful location name
    const name =
      address.city ||
      address.town ||
      address.village ||
      address.bus_stop ||
      address.suburb ||
      address.municipality ||
      address.county ||
      (raw.name ? raw.name : raw.display_name.split(',')[0].trim());

    // Clean location type
    let locationType = raw.type || raw.class || 'town';
    if (raw.type === 'administrative' && address.city) locationType = 'city';
    if (raw.class === 'highway' && raw.type === 'bus_stop') locationType = 'bus_stop';
    if (address.bus_stop) locationType = 'bus_stop';

    return {
      name,
      displayName: raw.display_name,
      osmId: String(raw.osm_id),
      osmType: raw.osm_type || 'node',
      locationType,
      latitude: parseFloat(raw.lat),
      longitude: parseFloat(raw.lon),
      state: address.state || '',
      address,
    };
  }

  /**
   * Enforces at least 1000ms delay between consecutive Nominatim requests
   */
  private async enforceNominatimRateLimit(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.lastNominatimRequestTime;
    const minDelay = 1000; // 1 second

    if (elapsed < minDelay) {
      const waitTime = minDelay - elapsed;
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
    this.lastNominatimRequestTime = Date.now();
  }

  /* ── Location Requests ── */

  getLocationRequests(status?: string, providerId?: string) {
    const requests = this.locationRepo.findAllRequests(status, providerId);
    return successResponse('Location requests retrieved', requests);
  }

  getLocationRequestById(id: string) {
    const req = this.locationRepo.findRequestById(id);
    if (!req) throw new NotFoundException(`Location request ${id} not found`);
    return successResponse('Location request retrieved', req);
  }

  /**
   * Provider submits a new location request with validated OSM data
   */
  createLocationRequest(dto: CreateLocationRequestDto, authProviderId?: string, authProviderName?: string) {
    const cleanName = (dto.name || '').trim();
    if (!cleanName) throw new BadRequestException('Location name is required');
    if (!dto.osmId) throw new BadRequestException('OpenStreetMap ID is required');
    if (dto.latitude == null || dto.longitude == null) {
      throw new BadRequestException('Valid latitude and longitude coordinates are required from OpenStreetMap');
    }

    // 1. Prevent duplicate approved locations
    const existingApproved =
      this.locationRepo.findApprovedByOsmId(dto.osmId) ||
      this.locationRepo.findApprovedByName(cleanName);

    if (existingApproved) {
      throw new BadRequestException(
        `Location "${cleanName}" (OSM ID: ${dto.osmId}) is already approved in the platform network. You can select it immediately.`,
      );
    }

    // 2. Prevent duplicate pending requests
    const existingPending =
      this.locationRepo.findPendingRequestByOsmId(dto.osmId) ||
      this.locationRepo.findPendingRequestByName(cleanName);

    if (existingPending) {
      throw new BadRequestException(
        `A location request for "${cleanName}" (OSM ID: ${dto.osmId}) is already pending admin review.`,
      );
    }

    const providerId = authProviderId || dto.providerId || 'P001';
    const providerName = authProviderName || dto.providerName || 'Kiran Travels';

    const request = this.locationRepo.createRequest({
      osmId: String(dto.osmId),
      osmType: dto.osmType || 'node',
      name: cleanName,
      displayName: dto.displayName || cleanName,
      locationType: dto.locationType || 'city',
      latitude: dto.latitude,
      longitude: dto.longitude,
      address: dto.address || {},
      state: dto.state || (dto.address?.state ?? ''),
      providerId,
      providerName,
      connectingRoutes: dto.connectingRoutes || '',
      reason: dto.reason || 'New passenger route demand',
    });

    return successResponse('Location request submitted successfully for admin review', request);
  }

  /**
   * Admin approves a location request
   */
  approveLocationRequest(requestId: string, adminId?: string) {
    const req = this.locationRepo.findRequestById(requestId);
    if (!req) throw new NotFoundException(`Location request ${requestId} not found`);

    if (req.status !== 'PENDING') {
      throw new BadRequestException(`Cannot approve request with status ${req.status}`);
    }

    // Check if already approved in the meantime
    let approved =
      this.locationRepo.findApprovedByOsmId(req.osmId) ||
      this.locationRepo.findApprovedByName(req.name);

    if (!approved) {
      approved = this.locationRepo.createApproved({
        name: req.name,
        displayName: req.displayName,
        osmId: req.osmId,
        osmType: req.osmType,
        locationType: req.locationType,
        latitude: req.latitude,
        longitude: req.longitude,
        address: req.address,
        state: req.state,
        isApproved: true,
      });
    }

    const updated = this.locationRepo.updateRequest(requestId, {
      status: 'APPROVED',
      decidedAt: new Date().toISOString(),
      decidedBy: adminId || 'ADMIN',
    });

    return successResponse(`Location "${req.name}" approved and added to active network`, {
      request: updated,
      location: approved,
    });
  }

  /**
   * Admin rejects a location request
   */
  rejectLocationRequest(requestId: string, dto: RejectLocationRequestDto, adminId?: string) {
    const req = this.locationRepo.findRequestById(requestId);
    if (!req) throw new NotFoundException(`Location request ${requestId} not found`);

    if (req.status !== 'PENDING') {
      throw new BadRequestException(`Cannot reject request with status ${req.status}`);
    }

    const updated = this.locationRepo.updateRequest(requestId, {
      status: 'REJECTED',
      decidedAt: new Date().toISOString(),
      decidedBy: dto.decidedBy || adminId || 'ADMIN',
      rejectionReason: dto.reason || 'Not meeting platform operational criteria',
    });

    return successResponse(`Location request for "${req.name}" rejected`, updated);
  }

  /**
   * Direct add an approved location (Admin)
   */
  directCreateLocation(dto: DirectCreateLocationDto) {
    const cleanName = (dto.name || '').trim();
    if (!cleanName) throw new BadRequestException('Location name is required');

    const existing =
      this.locationRepo.findApprovedByOsmId(dto.osmId) ||
      this.locationRepo.findApprovedByName(cleanName);

    if (existing) {
      throw new BadRequestException(`Location "${cleanName}" already exists in the approved database.`);
    }

    const location = this.locationRepo.createApproved({
      name: cleanName,
      displayName: dto.displayName,
      osmId: dto.osmId,
      osmType: dto.osmType || 'node',
      locationType: dto.locationType || 'city',
      latitude: dto.latitude,
      longitude: dto.longitude,
      address: dto.address || {},
      state: dto.state || (dto.address?.state ?? ''),
      isApproved: true,
    });

    return successResponse(`Location "${cleanName}" created successfully`, location);
  }

  deleteLocation(id: string) {
    const loc = this.locationRepo.findApprovedById(id);
    if (!loc) throw new NotFoundException(`Location ${id} not found`);
    this.locationRepo.removeApproved(id);
    return successResponse(`Location "${loc.name}" removed from platform network`);
  }

  isLocationApproved(name: string): boolean {
    return this.locationRepo.isApproved(name);
  }
}

