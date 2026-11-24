import { useCallback, useEffect, useState, useMemo } from 'react';
import DataTable from './DataTable.jsx';
import StatusBadge from './StatusBadge.jsx';
import { apiFetch } from '../lib/api.js';

export default function LocationsSection({ onAction, busy = false }) {
  const [activeTab, setActiveTab] = useState('requests'); // 'requests' | 'approved' | 'search_osm'
  const [requests, setRequests] = useState([]);
  const [approvedLocations, setApprovedLocations] = useState([]);
  const [requestFilter, setRequestFilter] = useState('ALL'); // 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');

  // OSM Search Tool in Admin
  const [osmQuery, setOsmQuery] = useState('');
  const [osmResults, setOsmResults] = useState([]);
  const [osmLoading, setOsmLoading] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setError('');
      // Load requests
      const reqRes = await apiFetch('/locations/requests').catch(() => []);
      setRequests(Array.isArray(reqRes) ? reqRes : reqRes.data || []);

      // Load approved locations
      const locRes = await apiFetch('/locations').catch(() => []);
      const locList = Array.isArray(locRes) ? locRes : locRes.data || [];
      setApprovedLocations(locList);

      // Sync to localStorage for cross-actor compatibility
      if (locList.length > 0) {
        const cityNames = locList.map((l) => l.name);
        localStorage.setItem('c2b_approved_cities', JSON.stringify(cityNames));
      }
    } catch (cause) {
      setError(cause.message || 'Failed to load locations data');
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Approve Request
  const handleApprove = async (req) => {
    const adminId = sessionStorage.getItem('c2b_loggedInId') || localStorage.getItem('c2b_loggedInId') || 'A001';
    await onAction(
      async () => {
        const res = await apiFetch(`/locations/requests/${req.requestId}/approve`, {
          method: 'PATCH',
          headers: { 'x-user-id': adminId },
        });

        // Update local storage approved cities
        const custom = JSON.parse(localStorage.getItem('c2b_approved_cities') || '[]');
        if (!custom.some((c) => c.toLowerCase() === req.name.toLowerCase())) {
          custom.push(req.name);
          localStorage.setItem('c2b_approved_cities', JSON.stringify(custom));
        }

        return res;
      },
      `Location "${req.name}" approved! It is now accessible to all service providers.`,
      `Failed to approve location ${req.name}.`
    );
    loadData();
  };

  // Reject Request
  const handleReject = async (req) => {
    const reason = window.prompt(
      `Enter reason for rejecting "${req.name}":`,
      'Route operational corridor not viable at this time'
    );
    if (reason === null) return;

    const adminId = sessionStorage.getItem('c2b_loggedInId') || localStorage.getItem('c2b_loggedInId') || 'A001';
    await onAction(
      () =>
        apiFetch(`/locations/requests/${req.requestId}/reject`, {
          method: 'PATCH',
          headers: { 'x-user-id': adminId },
          body: JSON.stringify({ reason: reason.trim(), decidedBy: adminId }),
        }),
      `Location request "${req.name}" rejected.`,
      `Failed to reject request.`
    );
    loadData();
  };

  // Direct OSM search for Admin explorer
  const handleOsmSearch = async (e) => {
    e?.preventDefault();
    if (!osmQuery.trim() || osmQuery.length < 2) return;
    setOsmLoading(true);
    try {
      const res = await apiFetch(`/locations/osm-search?query=${encodeURIComponent(osmQuery.trim())}`);
      setOsmResults(Array.isArray(res) ? res : res.data || []);
    } catch (err) {
      setError(err.message || 'OSM search failed');
    } finally {
      setOsmLoading(false);
    }
  };

  // Direct add location from OSM search
  const handleDirectAdd = async (osmItem) => {
    await onAction(
      () =>
        apiFetch('/locations', {
          method: 'POST',
          body: JSON.stringify({
            name: osmItem.name,
            displayName: osmItem.displayName,
            osmId: String(osmItem.osmId),
            locationType: osmItem.locationType || 'city',
            latitude: osmItem.latitude,
            longitude: osmItem.longitude,
            state: osmItem.state,
            address: osmItem.address,
          }),
        }),
      `Location "${osmItem.name}" added to approved database.`,
      'Failed to add location.'
    );
    loadData();
    handleOsmSearch();
  };

  // Summary Metrics
  const metrics = useMemo(() => {
    const pending = requests.filter((r) => r.status === 'PENDING').length;
    const approved = requests.filter((r) => r.status === 'APPROVED').length;
    const rejected = requests.filter((r) => r.status === 'REJECTED').length;
    return {
      totalApproved: approvedLocations.length,
      pending,
      approved,
      rejected,
    };
  }, [requests, approvedLocations]);

  // Filtered requests
  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      if (requestFilter !== 'ALL' && r.status !== requestFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = (r.name || '').toLowerCase().includes(q);
        const matchProvider = (r.providerName || '').toLowerCase().includes(q);
        const matchRoutes = (r.connectingRoutes || '').toLowerCase().includes(q);
        const matchOsm = String(r.osmId || '').includes(q);
        if (!matchName && !matchProvider && !matchRoutes && !matchOsm) return false;
      }
      return true;
    });
  }, [requests, requestFilter, searchQuery]);

  // Filtered approved locations
  const filteredLocations = useMemo(() => {
    if (!searchQuery.trim()) return approvedLocations;
    const q = searchQuery.toLowerCase();
    return approvedLocations.filter(
      (loc) =>
        loc.name.toLowerCase().includes(q) ||
        loc.displayName.toLowerCase().includes(q) ||
        (loc.state && loc.state.toLowerCase().includes(q)) ||
        String(loc.osmId).includes(q)
    );
  }, [approvedLocations, searchQuery]);

  return (
    <section
      className="bookings-section"
      style={{
        background: '#ffffff',
        borderRadius: '14px',
        padding: '24px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        border: '1px solid #f1f5f9',
      }}
    >
      {/* Section Header */}
      <div
        className="section-header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: '20px',
        }}
      >
        <div>
          <h2 className="section-title" style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
            📍 OpenStreetMap Location &amp; Destination Management
          </h2>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px', margin: 0 }}>
            Approve service provider location requests, validate OSM coordinates, and maintain the approved routes network.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div style={{ display: 'flex', gap: 6, background: '#f1f5f9', padding: '4px', borderRadius: '8px' }}>
          <button
            type="button"
            onClick={() => setActiveTab('requests')}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: 'none',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              background: activeTab === 'requests' ? '#ffffff' : 'transparent',
              color: activeTab === 'requests' ? '#0f172a' : '#64748b',
              boxShadow: activeTab === 'requests' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            Location Requests {metrics.pending > 0 && <span style={{ background: '#f59e0b', color: '#fff', padding: '1px 6px', borderRadius: '10px', fontSize: '11px', marginLeft: 4 }}>{metrics.pending}</span>}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('approved')}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: 'none',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              background: activeTab === 'approved' ? '#ffffff' : 'transparent',
              color: activeTab === 'approved' ? '#0f172a' : '#64748b',
              boxShadow: activeTab === 'approved' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            Approved Network ({metrics.totalApproved})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('search_osm')}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: 'none',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              background: activeTab === 'search_osm' ? '#ffffff' : 'transparent',
              color: activeTab === 'search_osm' ? '#0f172a' : '#64748b',
              boxShadow: activeTab === 'search_osm' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            OSM Search &amp; Add
          </button>
        </div>
      </div>

      {error && <p className="admin-notice" role="alert" style={{ marginBottom: 16 }}>{error}</p>}

      {/* KPI Stat Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 12,
          marginBottom: 20,
        }}
      >
        <div style={{ background: '#f8fafc', padding: '14px 18px', borderRadius: 10, border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Approved Active Hubs</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', marginTop: 4 }}>{metrics.totalApproved}</div>
          <div style={{ fontSize: '11px', color: '#10b981', marginTop: 2 }}>Ready for route scheduling</div>
        </div>
        <div style={{ background: '#fffbeb', padding: '14px 18px', borderRadius: 10, border: '1px solid #fef3c7' }}>
          <div style={{ fontSize: '12px', color: '#b45309', fontWeight: 600 }}>Pending Review</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#d97706', marginTop: 4 }}>{metrics.pending}</div>
          <div style={{ fontSize: '11px', color: '#b45309', marginTop: 2 }}>Requires admin action</div>
        </div>
        <div style={{ background: '#f0fdf4', padding: '14px 18px', borderRadius: 10, border: '1px solid #bbf7d0' }}>
          <div style={{ fontSize: '12px', color: '#166534', fontWeight: 600 }}>Approved Requests</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#16a34a', marginTop: 4 }}>{metrics.approved}</div>
          <div style={{ fontSize: '11px', color: '#166534', marginTop: 2 }}>Added to database</div>
        </div>
        <div style={{ background: '#fef2f2', padding: '14px 18px', borderRadius: 10, border: '1px solid #fecaca' }}>
          <div style={{ fontSize: '12px', color: '#991b1b', fontWeight: 600 }}>Rejected Requests</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#dc2626', marginTop: 4 }}>{metrics.rejected}</div>
          <div style={{ fontSize: '11px', color: '#991b1b', marginTop: 2 }}>Ineligible or duplicate</div>
        </div>
      </div>

      {/* ── TAB 1: LOCATION REQUESTS ── */}
      {activeTab === 'requests' && (
        <>
          {/* Controls: Filter buttons + Search */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
              marginBottom: 16,
            }}
          >
            <div style={{ display: 'flex', gap: 6 }}>
              {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setRequestFilter(st)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    border: '1px solid',
                    cursor: 'pointer',
                    background: requestFilter === st ? '#0f172a' : '#ffffff',
                    color: requestFilter === st ? '#ffffff' : '#475569',
                    borderColor: requestFilter === st ? '#0f172a' : '#cbd5e1',
                  }}
                >
                  {st === 'ALL' ? 'All Requests' : st}
                </button>
              ))}
            </div>

            <div>
              <input
                type="text"
                placeholder="Search location, provider, OSM ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 6,
                  border: '1px solid #cbd5e1',
                  fontSize: '12px',
                  width: 260,
                }}
              />
            </div>
          </div>

          <DataTable
            headers={[
              'Request ID',
              'Location Name & Type',
              'OSM ID & Coordinates',
              'Requesting Provider',
              'Corridor / Reason',
              'Status',
              'Actions',
            ]}
            emptyText="No location requests match your filter."
          >
            {filteredRequests.map((req) => {
              const isPending = req.status === 'PENDING';
              const osmMapUrl = `https://www.openstreetmap.org/?mlat=${req.latitude}&mlon=${req.longitude}#map=14/${req.latitude}/${req.longitude}`;

              return (
                <tr key={req.requestId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '14px 18px', fontSize: '13px', fontWeight: 700, color: '#0B2447' }}>
                    {req.requestId}
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <div style={{ fontWeight: 700, fontSize: '13px', color: '#1e293b' }}>{req.name}</div>
                    <div style={{ fontSize: '11px', color: '#64748b', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={req.displayName}>
                      {req.displayName}
                    </div>
                    <span
                      style={{
                        display: 'inline-block',
                        background: '#e0f2fe',
                        color: '#0369a1',
                        fontSize: '10px',
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: 4,
                        marginTop: 3,
                        textTransform: 'uppercase',
                      }}
                    >
                      {req.locationType || 'city'}
                    </span>
                  </td>

                  <td style={{ padding: '14px 18px' }}>
                    <div style={{ fontSize: '12px', color: '#334155', fontWeight: 600 }}>OSM: {req.osmId}</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>
                      {req.latitude.toFixed(4)}°, {req.longitude.toFixed(4)}°
                    </div>
                    <a
                      href={osmMapUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{ fontSize: '11px', color: '#2563eb', textDecoration: 'underline', marginTop: 2, display: 'inline-block' }}
                    >
                      View on OSM ↗
                    </a>
                  </td>

                  <td style={{ padding: '14px 18px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>{req.providerName || 'Provider'}</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>ID: {req.providerId}</div>
                  </td>

                  <td style={{ padding: '14px 18px', maxWidth: 220 }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#0f172a' }}>{req.connectingRoutes || 'General Network'}</div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: 2 }}>{req.reason || 'New route demand'}</div>
                    {req.rejectionReason && (
                      <div style={{ fontSize: '11px', color: '#dc2626', marginTop: 4, fontStyle: 'italic' }}>
                        Rejection reason: {req.rejectionReason}
                      </div>
                    )}
                  </td>

                  <td style={{ padding: '14px 18px' }}>
                    <StatusBadge status={req.status ? req.status.toLowerCase() : 'pending'} />
                  </td>

                  <td style={{ padding: '14px 18px', whiteSpace: 'nowrap' }}>
                    {isPending ? (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => handleApprove(req)}
                          style={{
                            padding: '6px 14px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 700,
                            border: 'none',
                            background: '#22c55e',
                            color: '#ffffff',
                            cursor: busy ? 'default' : 'pointer',
                          }}
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => handleReject(req)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 600,
                            border: 'none',
                            background: '#fee2e2',
                            color: '#dc2626',
                            cursor: busy ? 'default' : 'pointer',
                          }}
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                        {req.status === 'APPROVED' ? 'Approved & Live' : 'Rejected'}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </DataTable>
        </>
      )}

      {/* ── TAB 2: APPROVED LOCATIONS DATABASE ── */}
      {activeTab === 'approved' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: '13px', color: '#475569' }}>
              Showing <strong>{filteredLocations.length}</strong> approved hubs available for scheduling routes.
            </div>
            <input
              type="text"
              placeholder="Search approved cities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                padding: '6px 12px',
                borderRadius: 6,
                border: '1px solid #cbd5e1',
                fontSize: '12px',
                width: 240,
              }}
            />
          </div>

          <DataTable
            headers={['Location ID', 'City / Hub Name', 'State', 'Type', 'Coordinates', 'OSM ID', 'Status']}
            emptyText="No locations found."
          >
            {filteredLocations.map((loc) => {
              const osmMapUrl = `https://www.openstreetmap.org/?mlat=${loc.latitude}&mlon=${loc.longitude}#map=13/${loc.latitude}/${loc.longitude}`;

              return (
                <tr key={loc.locationId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 18px', fontSize: '13px', fontWeight: 700, color: '#0B2447' }}>
                    {loc.locationId}
                  </td>
                  <td style={{ padding: '12px 18px' }}>
                    <div style={{ fontWeight: 700, fontSize: '13px', color: '#1e293b' }}>{loc.name}</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>{loc.displayName}</div>
                  </td>
                  <td style={{ padding: '12px 18px', fontSize: '13px', color: '#475569' }}>
                    {loc.state || loc.address?.state || '—'}
                  </td>
                  <td style={{ padding: '12px 18px' }}>
                    <span
                      style={{
                        background: '#f1f5f9',
                        color: '#334155',
                        padding: '2px 8px',
                        borderRadius: 4,
                        fontSize: '11px',
                        fontWeight: 600,
                        textTransform: 'capitalize',
                      }}
                    >
                      {loc.locationType}
                    </span>
                  </td>
                  <td style={{ padding: '12px 18px', fontSize: '12px', color: '#475569' }}>
                    {loc.latitude.toFixed(4)}°, {loc.longitude.toFixed(4)}°
                    <br />
                    <a href={osmMapUrl} target="_blank" rel="noreferrer" style={{ fontSize: '11px', color: '#2563eb' }}>
                      View on Map
                    </a>
                  </td>
                  <td style={{ padding: '12px 18px', fontSize: '12px', color: '#64748b' }}>
                    {loc.osmId}
                  </td>
                  <td style={{ padding: '12px 18px' }}>
                    <span
                      style={{
                        background: '#dcfce7',
                        color: '#15803d',
                        padding: '2px 8px',
                        borderRadius: 4,
                        fontSize: '11px',
                        fontWeight: 700,
                      }}
                    >
                      Approved
                    </span>
                  </td>
                </tr>
              );
            })}
          </DataTable>
        </>
      )}

      {/* ── TAB 3: OSM SEARCH & DIRECT ADD ── */}
      {activeTab === 'search_osm' && (
        <div style={{ background: '#f8fafc', padding: 20, borderRadius: 10, border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: '0 0 6px' }}>
            🔍 OpenStreetMap Nominatim Live Explorer
          </h3>
          <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 16px' }}>
            Directly test searching Indian cities, towns, and bus stops via OpenStreetMap Nominatim and add them to the platform network.
          </p>

          <form onSubmit={handleOsmSearch} style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
            <input
              type="text"
              placeholder="Enter Indian city, town, or bus terminus name (e.g. Tirupati, Warangal, CMBT)..."
              value={osmQuery}
              onChange={(e) => setOsmQuery(e.target.value)}
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                fontSize: '13px',
              }}
            />
            <button
              type="submit"
              disabled={osmLoading || !osmQuery.trim()}
              style={{
                padding: '10px 20px',
                borderRadius: 8,
                border: 'none',
                background: '#0B2447',
                color: '#fff',
                fontWeight: 700,
                fontSize: '13px',
                cursor: osmLoading ? 'default' : 'pointer',
              }}
            >
              {osmLoading ? 'Searching OSM...' : 'Search OSM'}
            </button>
          </form>

          {osmResults.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {osmResults.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    background: '#ffffff',
                    padding: '14px 18px',
                    borderRadius: 8,
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 16,
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '14px', color: '#0f172a' }}>
                      {item.name}{' '}
                      <span
                        style={{
                          background: '#f1f5f9',
                          color: '#475569',
                          fontSize: '11px',
                          padding: '2px 6px',
                          borderRadius: 4,
                          marginLeft: 6,
                        }}
                      >
                        {item.locationType}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: 2 }}>{item.displayName}</div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: 2 }}>
                      OSM ID: {item.osmId} | Lat: {item.latitude} | Lon: {item.longitude}
                    </div>
                  </div>

                  <div>
                    {item.isAlreadyApproved ? (
                      <span
                        style={{
                          background: '#dcfce7',
                          color: '#15803d',
                          padding: '6px 12px',
                          borderRadius: 6,
                          fontSize: '12px',
                          fontWeight: 700,
                        }}
                      >
                        ✓ Already in Database
                      </span>
                    ) : item.hasPendingRequest ? (
                      <span
                        style={{
                          background: '#fef3c7',
                          color: '#b45309',
                          padding: '6px 12px',
                          borderRadius: 6,
                          fontSize: '12px',
                          fontWeight: 700,
                        }}
                      >
                        ⏳ Request Pending
                      </span>
                    ) : (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleDirectAdd(item)}
                        style={{
                          background: '#0B2447',
                          color: '#ffffff',
                          padding: '6px 14px',
                          borderRadius: 6,
                          fontSize: '12px',
                          fontWeight: 700,
                          border: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        + Add to Approved Network
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
