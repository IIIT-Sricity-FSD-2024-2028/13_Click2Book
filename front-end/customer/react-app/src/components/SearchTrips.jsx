import React, { useState, useEffect } from 'react';
import { ArrowLeftRight, Search, Star, Wifi, Wind, Zap, Coffee, Shield, Calendar, ArrowRight } from 'lucide-react';
import SeatMap from './SeatMap';
import PassengerForms from './PassengerForms';
import PaymentModal from './PaymentModal';
import BookingConfirmed from './BookingConfirmed';
import CityAutocomplete from './CityAutocomplete';
import { API } from '../services/api';
import { MOCK_BUSES } from '../services/mockData';
import busHeroImg from '../assets/bus_hero.png';
import { calculateSeatDistributions, validateSeatBookings, executeSeatPayments } from '../utils/paymentRetry';
import { liveSync } from '../services/liveSync';

export { calculateSeatDistributions, validateSeatBookings, executeSeatPayments };

export function normalizeCityName(city) {
  if (!city || typeof city !== 'string') return '';
  const c = city.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  if (['visakhapatnam', 'vishakapatnam', 'vishakapatanam', 'vizag', 'visakha', 'vskp'].includes(c)) {
    return 'visakhapatnam';
  }
  if (['chennai', 'madras'].includes(c)) {
    return 'chennai';
  }
  if (['bangalore', 'bengaluru', 'blr'].includes(c)) {
    return 'bangalore';
  }
  if (['hyderabad', 'secunderabad', 'hyd'].includes(c)) {
    return 'hyderabad';
  }
  if (['vijayawada', 'bezawada', 'vja'].includes(c)) {
    return 'vijayawada';
  }
  return c;
}

export function getCanonicalCityName(norm) {
  if (norm === 'visakhapatnam') return 'Visakhapatnam';
  if (norm === 'chennai') return 'Chennai';
  if (norm === 'bangalore') return 'Bangalore';
  if (norm === 'hyderabad') return 'Hyderabad';
  if (norm === 'vijayawada') return 'Vijayawada';
  return null;
}

export function getNumericSeat(seatLabel, totalSeats = 40) {
  if (!seatLabel) return 1;
  const str = String(seatLabel).trim().toUpperCase();
  if (/^\d+$/.test(str)) {
    const n = parseInt(str, 10);
    return n > 0 && n <= totalSeats ? n : ((n - 1) % totalSeats) + 1;
  }
  const half = Math.floor(totalSeats / 2);
  const lMatch = str.match(/^L(\d+)$/);
  if (lMatch) {
    const num = parseInt(lMatch[1], 10);
    return Math.min(half, Math.max(1, num));
  }
  const uMatch = str.match(/^U(\d+)$/);
  if (uMatch) {
    const num = parseInt(uMatch[1], 10);
    return Math.min(totalSeats, half + Math.max(1, num));
  }
  const alphaMatch = str.match(/^([A-Z])(\d+)$/);
  if (alphaMatch) {
    const row = alphaMatch[1].charCodeAt(0) - 65;
    const col = parseInt(alphaMatch[2], 10);
    return ((row * 4 + col - 1) % totalSeats) + 1;
  }
  return 1;
}

const DEFAULT_CITIES = [
  'Adilabad',
  'Agra',
  'Ahmedabad',
  'Ajmer',
  'Alappuzha',
  'Amritsar',
  'Anakapalle',
  'Anantapur',
  'Annavaram',
  'Aurangabad',
  'Bangalore',
  'Bapatla',
  'Belgaum',
  'Bellary',
  'Bhavnagar',
  'Bhopal',
  'Bhubaneswar',
  'Calicut',
  'Chandigarh',
  'Chennai',
  'Chikmagalur',
  'Chilakaluripet',
  'Chirala',
  'Chittoor',
  'Coimbatore',
  'Cuttack',
  'Davanagere',
  'Dehradun',
  'Delhi',
  'Dindigul',
  'Eluru',
  'Erode',
  'Goa',
  'Gokarna',
  'Gudur',
  'Gulbarga',
  'Guntur',
  'Gurgaon',
  'Guwahati',
  'Gwalior',
  'Hampi',
  'Haridwar',
  'Hassan',
  'Hubli',
  'Hyderabad',
  'Indore',
  'Jabalpur',
  'Jaipur',
  'Jamnagar',
  'Jamshedpur',
  'Jodhpur',
  'Kadapa',
  'Kakinada',
  'Kannur',
  'Kanpur',
  'Kanyakumari',
  'Karimnagar',
  'Kavali',
  'Khammam',
  'Kochi',
  'Kodaikanal',
  'Kolhapur',
  'Kolkata',
  'Kollam',
  'Kota',
  'Kurnool',
  'Lucknow',
  'Ludhiana',
  'Madurai',
  'Mahabaleshwar',
  'Mahbubnagar',
  'Manali',
  'Mangalore',
  'Munnar',
  'Mumbai',
  'Mysore',
  'Nagpur',
  'Nalgonda',
  'Nashik',
  'Nayudupeta',
  'Nellore',
  'Nizamabad',
  'Noida',
  'Ongole',
  'Ooty',
  'Palakkad',
  'Patna',
  'Pondicherry',
  'Prayagraj',
  'Pune',
  'Puri',
  'Raipur',
  'Rajahmundry',
  'Rajkot',
  'Ramagundam',
  'Rameswaram',
  'Ranchi',
  'Rishikesh',
  'Salem',
  'Samalkot',
  'Shimla',
  'Shimoga',
  'Shirdi',
  'Siliguri',
  'Solapur',
  'SriCity',
  'Surat',
  'Suryapet',
  'Tada',
  'Tadepalligudem',
  'Tanuku',
  'Thanjavur',
  'Thiruvananthapuram',
  'Thrissur',
  'Tiruchirappalli',
  'Tirunelveli',
  'Tirupati',
  'Tuni',
  'Udaipur',
  'Udupi',
  'Vadodara',
  'Varanasi',
  'Vellore',
  'Vijayawada',
  'Visakhapatnam',
  'Vizianagaram',
  'Warangal',
  'Wayanad',
];

export const NH16_COASTAL_STOPS = [
  'chennai', 'tada', 'sricity', 'nayudupeta', 'gudur', 'nellore', 'kavali',
  'ongole', 'chilakaluripet', 'guntur', 'vijayawada', 'eluru', 'tadepalligudem',
  'tanuku', 'rajahmundry', 'samalkot', 'kakinada', 'annavaram', 'tuni', 'anakapalle', 'visakhapatnam'
];

export function getBusCorridorStops(bus, isReverse = false) {
  const origNorm = normalizeCityName(bus?.assignedRoute?.originCity || bus?.originCity || bus?.source || bus?.from || '');
  const destNorm = normalizeCityName(bus?.assignedRoute?.destCity || bus?.destCity || bus?.destination || bus?.to || '');

  const rawStops = [
    origNorm,
    ...(bus?.assignedRoute?.intermediateStops || bus?.intermediateStops || bus?.allStops || []).map((s) =>
      normalizeCityName(typeof s === 'string' ? s : s?.name || s?.stopName)
    ),
    destNorm,
  ].filter(Boolean);

  let stops = rawStops;
  const isChennaiVskp =
    (origNorm === 'chennai' && destNorm === 'visakhapatnam') ||
    (origNorm === 'visakhapatnam' && destNorm === 'chennai') ||
    (bus?.assignedRoute?.corridorId && String(bus.assignedRoute.corridorId).includes('VSKP'));

  if (isChennaiVskp && stops.length <= 2) {
    stops = origNorm === 'visakhapatnam' ? [...NH16_COASTAL_STOPS].reverse() : [...NH16_COASTAL_STOPS];
  }

  return isReverse ? [...stops].reverse() : stops;
}

export function calculateJourneyDuration(depTime, arrTime, providedDuration) {
  if (providedDuration && typeof providedDuration === 'string' && providedDuration.trim() && providedDuration !== '—') {
    return providedDuration.trim();
  }
  if (!depTime || !arrTime || typeof depTime !== 'string' || typeof arrTime !== 'string') return 'Unavailable';
  const parseTime = (t) => {
    const match = t.trim().match(/^(\d{1,2}):(\d{2})/);
    if (!match) return null;
    return [parseInt(match[1], 10), parseInt(match[2], 10)];
  };
  const dParsed = parseTime(depTime);
  const aParsed = parseTime(arrTime);
  if (!dParsed || !aParsed) return 'Unavailable';
  const [dh, dm] = dParsed;
  const [ah, am] = aParsed;
  if (isNaN(dh) || isNaN(dm) || isNaN(ah) || isNaN(am)) return 'Unavailable';
  let diff = (ah * 60 + am) - (dh * 60 + dm);
  if (diff <= 0) diff += 24 * 60; // Handles journeys that cross midnight
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export function isDepartureTimeReached(journeyDate, departureTime) {
  try {
    if (!departureTime || departureTime === '—') return false;
    const cleanTime = String(departureTime).split('→')[0].trim();
    const timeMatch = cleanTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (!timeMatch) return false;
    let hh = parseInt(timeMatch[1], 10);
    const mm = parseInt(timeMatch[2], 10);
    const meridiem = (timeMatch[3] || '').toUpperCase();
    if (meridiem === 'PM' && hh < 12) hh += 12;
    if (meridiem === 'AM' && hh === 12) hh = 0;

    const now = new Date();
    let y = now.getFullYear();
    let m = now.getMonth();
    let d = now.getDate();

    if (journeyDate) {
      const dateStr = String(journeyDate).split('T')[0];
      const dateParts = dateStr.split('-').map(Number);
      if (dateParts.length >= 3) {
        y = dateParts[0];
        m = dateParts[1] - 1;
        d = dateParts[2];
      }
    }

    const depDate = new Date(y, m, d, hh, mm, 0, 0);
    if (isNaN(depDate.getTime())) return false;
    return now >= depDate;
  } catch {
    return false;
  }
}

export default function SearchTrips({
  customer: propCustomer,
  user: propUser,
  onOpenLogin,
  showToast,
  onNavigate,
  onNavigateToBookings,
}) {
  const customer = propCustomer || propUser;
  const [step, setStep] = useState('search'); // 'search' | 'buses' | 'seats' | 'passenger' | 'payment' | 'confirmed'

  // Date limits: Today to 2 months ahead
  const todayStr = new Date().toISOString().split('T')[0];
  const maxDate = new Date();
  maxDate.setMonth(maxDate.getMonth() + 2);
  const maxStr = maxDate.toISOString().split('T')[0];

  // Search parameters (matches search-trips.html defaults)
  const [fromCity, setFromCity] = useState(() => sessionStorage.getItem('searchFrom') || 'MUMBAI');
  const [toCity, setToCity] = useState(() => sessionStorage.getItem('searchTo') || 'PUNE');
  const [travelDate, setTravelDate] = useState(() => {
    const stored = sessionStorage.getItem('searchDate');
    if (stored && stored >= todayStr) return stored;
    return todayStr;
  });

  const [searchError, setSearchError] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [matchingBuses, setMatchingBuses] = useState([]);
  const [availableCities, setAvailableCities] = useState(DEFAULT_CITIES);

  // Fetch unique routes dynamically from backend + local provider schedules to derive city list
  useEffect(() => {
    let mounted = true;
    const updateCities = async () => {
      const cities = new Set(DEFAULT_CITIES);
      // Backend routes
      try {
        if (API.routes && typeof API.routes.getAll === 'function') {
          const routes = await API.routes.getAll();
          if (Array.isArray(routes) && routes.length > 0) {
            routes.forEach((r) => {
              if (r.source) cities.add(r.source.trim());
              if (r.destination) cities.add(r.destination.trim());
            });
          }
        }
      } catch {}

      // Local provider schedules
      try {
        const localScheds = JSON.parse(localStorage.getItem('c2b_bus_schedules') || '[]');
        localScheds.forEach((s) => {
          const sFrom = (s.from || s.source || '').trim();
          const sTo = (s.to || s.destination || '').trim();
          if (sFrom) cities.add(sFrom);
          if (sTo) cities.add(sTo);
        });
      } catch {}

      if (mounted && cities.size > 0) {
        setAvailableCities(Array.from(cities).sort());
      }
    };

    updateCities();
    window.addEventListener('storage', updateCities);
    window.addEventListener('c2b_sync', updateCities);
    return () => {
      mounted = false;
      window.removeEventListener('storage', updateCities);
      window.removeEventListener('c2b_sync', updateCities);
    };
  }, []);

  // Selected Booking Flow States
  const [selectedBus, setSelectedBus] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [bookedSeats, setBookedSeats] = useState([]);
  const [passengers, setPassengers] = useState([]);
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [pendingBackendBookings, setPendingBackendBookings] = useState(() => {
    try {
      const saved = sessionStorage.getItem('c2b_pendingBookingRecord');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.status === 'CANCELLED' || parsed.booking_status === 'CANCELLED') {
          sessionStorage.removeItem('c2b_pendingBookingRecord');
          return null;
        }
        if (parsed.seatBookings && Array.isArray(parsed.seatBookings)) {
          return {
            primaryBackendId: parsed.primaryBackendId || parsed.bookingId || null,
            seatBookings: parsed.seatBookings,
            tripId: parsed.tripId || parsed.backendTripId || null,
          };
        }
      }
    } catch {}
    return null;
  });

  const handleSwapCities = () => {
    const tmp = fromCity;
    setFromCity(toCity);
    setToCity(tmp);
  };


  const handleSearch = async (e, customFrom, customTo, customDate) => {
    if (e) e.preventDefault();
    setSearchError('');

    const targetFrom = (customFrom !== undefined ? customFrom : fromCity).trim();
    const targetTo = (customTo !== undefined ? customTo : toCity).trim();
    const targetDate = (customDate !== undefined ? customDate : travelDate);

    if (!targetFrom || !targetTo) {
      setSearchError('Please enter both departure and destination cities.');
      return;
    }
    if (/^\d+$/.test(targetFrom) || /^\d+$/.test(targetTo)) {
      setSearchError('City names cannot be numbers only.');
      return;
    }
    if (targetFrom.toLowerCase() === targetTo.toLowerCase()) {
      setSearchError('Departure and destination cannot be the same city.');
      return;
    }
    if (!targetDate) {
      setSearchError('Please select a travel date.');
      return;
    }
    if (targetDate < todayStr) {
      setSearchError(`Travel date cannot be in the past (${todayStr}).`);
      return;
    }
    if (targetDate > maxStr) {
      setSearchError(`Travel date cannot exceed 2 months in advance (${maxStr}).`);
      return;
    }

    setFromCity(targetFrom);
    setToCity(targetTo);
    setTravelDate(targetDate);
    setSelectedBus(null);
    setSelectedSeats([]);
    setPendingBackendBookings(null);
    try { sessionStorage.removeItem('c2b_pendingBookingRecord'); } catch {}

    sessionStorage.setItem('searchFrom', targetFrom);
    sessionStorage.setItem('searchTo', targetTo);
    sessionStorage.setItem('searchDate', targetDate);

    setIsSearching(true);
    let results = [];
    const localSchedules = JSON.parse(localStorage.getItem('c2b_bus_schedules') || '[]');
    const localBookings = JSON.parse(localStorage.getItem('c2b_bookings') || '[]');
    const statuses = JSON.parse(localStorage.getItem('c2b_trip_statuses') || '{}');
    const FRESH_KEY = 'c2b_fleet_fresh_v6';
    try {
      if (!localStorage.getItem(FRESH_KEY)) {
        localStorage.setItem(FRESH_KEY, 'true');
        const existingRaw = JSON.parse(localStorage.getItem('c2b_registered_fleet') || '[]');
        const cleanedRaw = existingRaw.filter((b) => !/^V0\d\d$/.test(b.vehicleId || b.id || '') && !/^BUS_10\d\d$/.test(b.vehicleId || b.id || ''));
        localStorage.setItem('c2b_registered_fleet', JSON.stringify(cleanedRaw));
        const scheds = JSON.parse(localStorage.getItem('c2b_bus_schedules') || '[]');
        const cleanScheds = scheds.filter((s) => !/^V0\d\d$/.test(s.vehicleId || '') && !/^T0\d\d$/.test(s.id || s.tripId || ''));
        localStorage.setItem('c2b_bus_schedules', JSON.stringify(cleanScheds));
      }
    } catch {}

    let fleetBuses = JSON.parse(localStorage.getItem('c2b_registered_fleet') || '[]');
    try {
      const vRes = await safeFetch('/vehicles', { timeout: 1200 });
      const bVehicles = Array.isArray(vRes?.data) ? vRes.data : Array.isArray(vRes) ? vRes : [];
      const deletedBuses = JSON.parse(localStorage.getItem('c2b_deleted_buses') || '[]');
      const clean = (s) => String(s || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');

      if (bVehicles.length > 0) {
        let updatedFleet = false;
        bVehicles.forEach((bv) => {
          const vNum = bv.vehicleNumber || bv.regNo;
          const vId = bv.vehicleId || bv.id;
          const isDel = deletedBuses.some(
            (d) => (vId && clean(d.id || d.vehicleId) === clean(vId)) || (vNum && clean(d.plate || d.vehicleNumber) === clean(vNum))
          );
          if (isDel) {
            const delIdx = fleetBuses.findIndex(
              (f) => (vId && clean(f.vehicleId || f.id) === clean(vId)) || (vNum && clean(f.vehicleNumber) === clean(vNum))
            );
            if (delIdx >= 0) {
              fleetBuses.splice(delIdx, 1);
              updatedFleet = true;
            }
            return;
          }

          const idx = fleetBuses.findIndex(
            (f) => (bv.vehicleId && f.vehicleId === bv.vehicleId) ||
                   (vNum && clean(f.vehicleNumber) === clean(vNum))
          );
          if (idx >= 0) {
            fleetBuses[idx] = {
              ...fleetBuses[idx],
              ...bv,
              assignedRoute: bv.assignedRoute || fleetBuses[idx].assignedRoute,
              roundTripSchedule: bv.roundTripSchedule || fleetBuses[idx].roundTripSchedule,
              seatLayout: bv.seatLayout || fleetBuses[idx].seatLayout,
            };
          } else {
            fleetBuses.push(bv);
            updatedFleet = true;
          }
        });
        if (updatedFleet) {
          localStorage.setItem('c2b_registered_fleet', JSON.stringify(fleetBuses));
        }
      }
    } catch {}

    const normTargetFrom = normalizeCityName(targetFrom);
    const normTargetTo = normalizeCityName(targetTo);
    const apiFrom = getCanonicalCityName(normTargetFrom) || targetFrom;
    const apiTo = getCanonicalCityName(normTargetTo) || targetTo;

    // 1. Live Backend Search
    try {
      const apiData = await API.trips.search(apiFrom, apiTo, targetDate);
      if (Array.isArray(apiData) && apiData.length > 0) {
        results = apiData.map((r) => {
          const tid = r.tripId || r.id;
          const matchingFleet = fleetBuses.find(
            (fb) => fb.vehicleId === r.vehicleId || (fb.vehicleNumber && r.vehicleNumber && fb.vehicleNumber === r.vehicleNumber)
          );
          const tripBookings = localBookings.filter((bk) =>
            bk.status !== 'CANCELLED' && bk.booking_status !== 'CANCELLED' &&
            (bk.tripId === tid || (bk.busName && r.busName && bk.busName.toLowerCase() === r.busName.toLowerCase()))
          );
          const bookedCount = tripBookings.reduce((sum, b) => sum + (Array.isArray(b.seat_list) ? b.seat_list.length : (b.seats ? b.seats.split(',').length : 1)), 0);
          const totalSeats = r.totalSeats || 40;
          const availableSeats = Math.max(0, (r.availableSeats != null ? r.availableSeats : totalSeats) - bookedCount);
          const hasStarted = statuses[tid] === 'IN_PROGRESS' || isDepartureTimeReached(targetDate, r.departureTime);

          return {
            tripId: tid,
            busName: r.busName || r.vehicleName || 'Express Bus',
            vehicleType: r.vehicleType || 'AC Sleeper',
            providerName: r.providerName || 'Click2Book Partner',
            departureTime: r.departureTime || '21:00',
            arrivalTime: r.arrivalTime || '06:00',
            duration: r.duration || calculateJourneyDuration(r.departureTime, r.arrivalTime, '9h 00m'),
            price: Number(r.price || r.fare || matchingFleet?.roundTripSchedule?.fare || 850),
            fare: Number(r.fare || r.price || matchingFleet?.roundTripSchedule?.fare || 850),
            totalSeats,
            availableSeats,
            rating: r.rating || matchingFleet?.rating || 4.8,
            amenities: r.amenities || matchingFleet?.amenities || ['AC', 'Charging Point', 'WiFi'],
            vehicleId: r.vehicleId || matchingFleet?.vehicleId || '',
            vehicleNumber: matchingFleet?.vehicleNumber || r.vehicleNumber || '',
            plateNumber: matchingFleet?.vehicleNumber || r.vehicleNumber || '',
            seatLayout: matchingFleet?.seatLayout || r.seatLayout || null,
            providerId: r.providerId || 'P001',
            typeColor: (r.vehicleType || '').toLowerCase().includes('volvo') ? '#2563eb' : (r.vehicleType || '').toLowerCase().includes('sleeper') ? '#9333ea' : '#ea580c',
            status: hasStarted ? 'IN_PROGRESS' : (statuses[tid] || r.tripStatus || 'SCHEDULED'),
            boardingPoint: targetFrom,
            droppingPoint: targetTo,
            source: targetFrom,
            destination: targetTo,
          };
        });
      }
    } catch (err) {
      console.warn('Live API search error:', err.message);
    }

    // 2. Local schedules created or updated by Provider
    try {
      const localMatches = localSchedules.filter((b) => {
        const bFrom = normalizeCityName(b.from || b.source || '');
        const bTo = normalizeCityName(b.to || b.destination || '');
        if (!bFrom || !bTo) return false;
        
        const directMatch = (bFrom === normTargetFrom && bTo === normTargetTo);
        const allStops = (b.allStops || [b.from, ...(b.intermediateStops || []), b.to]).map((s) =>
          normalizeCityName(typeof s === 'string' ? s : s?.name || s?.stopName)
        );
        let fIdx = allStops.indexOf(normTargetFrom);
        let tIdx = allStops.indexOf(normTargetTo);
        if (fIdx === -1 || tIdx === -1) {
          const corridorStops = getBusCorridorStops(b, false);
          fIdx = corridorStops.indexOf(normTargetFrom);
          tIdx = corridorStops.indexOf(normTargetTo);
        }
        const haltMatch = fIdx !== -1 && tIdx !== -1 && fIdx < tIdx;
        if (!directMatch && !haltMatch) return false;

        const bDate = (b.journeyDate || b.date || '').split('T')[0];
        if (bDate && bDate !== targetDate) return false;
        return true;
      });

      localMatches.forEach((b, idx) => {
        const tid = b.backendTripId || b.tripId || b.id || `LOCAL_${idx}`;
        const totalSeats = parseInt(b.totalSeats || b.total_seats, 10) || 40;
        const matchingFleet = fleetBuses.find(
          (fb) => fb.vehicleId === b.vehicleId || (fb.vehicleNumber && b.vehicleNumber && fb.vehicleNumber === b.vehicleNumber)
        );

        // Compute actual booked seats for this local bus
        const tripBookings = localBookings.filter((bk) =>
          bk.status !== 'CANCELLED' && bk.booking_status !== 'CANCELLED' &&
          (bk.tripId === tid || bk.tripId === b.tripId || (b.backendTripId && bk.tripId === b.backendTripId) || (bk.busName && b.busName && bk.busName.toLowerCase() === b.busName.toLowerCase()))
        );
        const bookedCount = tripBookings.reduce((sum, bk) => sum + (Array.isArray(bk.seat_list) ? bk.seat_list.length : (bk.seats ? bk.seats.split(',').length : 1)), 0);
        const effectiveBooked = Math.max(b.bookedSeats || 0, bookedCount);
        const availableSeats = Math.max(0, totalSeats - effectiveBooked);

        const hasStarted = statuses[tid] === 'IN_PROGRESS' || (b.tripId && statuses[b.tripId] === 'IN_PROGRESS') || isDepartureTimeReached(b.journeyDate || targetDate, b.departureTime);

        const localBusItem = {
          tripId: tid,
          backendTripId: b.backendTripId || (/^T\d+$/.test(b.tripId) ? b.tripId : null),
          busName: b.busName || b.vehicleName || 'New Schedule Bus',
          vehicleNumber: b.vehicleNumber || matchingFleet?.vehicleNumber || '',
          plateNumber: b.vehicleNumber || matchingFleet?.vehicleNumber || '',
          vehicleType: b.busType || b.vehicleType || 'AC',
          providerName: b.providerName || 'Verified Provider',
          departureTime: b.departureTime || '08:00',
          arrivalTime: b.arrivalTime || '16:00',
          duration: b.duration || calculateJourneyDuration(b.departureTime, b.arrivalTime, '8h 00m'),
          price: parseInt(b.fare, 10) || 550,
          totalSeats,
          availableSeats,
          rating: b.rating || 4.5,
          amenities: b.amenities || ['AC', 'WiFi'],
          vehicleId: b.vehicleId || '',
          providerId: b.providerId || 'P001',
          seatLayout: b.seatLayout || matchingFleet?.seatLayout || null,
          typeColor: (b.busType || b.vehicleType || '').toLowerCase().includes('sleeper') ? '#9333ea' : '#ea580c',
          status: hasStarted ? 'IN_PROGRESS' : (statuses[tid] || (b.tripId && statuses[b.tripId]) || b.status || 'SCHEDULED'),
        };

        // If this trip was already returned from backend, override it with provider's updated schedule
        const existingIdx = results.findIndex((r) => r.tripId === tid || (b.backendTripId && r.tripId === b.backendTripId));
        if (existingIdx >= 0) {
          results[existingIdx] = localBusItem;
        } else {
          results.push(localBusItem);
        }
      });

      // 2b. Merge registered fleet buses assigned to this corridor for the requested date
      fleetBuses.forEach((bus) => {
        if (!bus.assignedRoute && bus.status !== 'Assigned') return;
        const origNorm = normalizeCityName(bus.assignedRoute?.originCity || bus.originCity || '');
        const destNorm = normalizeCityName(bus.assignedRoute?.destCity || bus.destCity || '');

        const upStops = getBusCorridorStops(bus, false);
        const downStops = getBusCorridorStops(bus, true);

        const upFIdx = upStops.indexOf(normTargetFrom);
        const upTIdx = upStops.indexOf(normTargetTo);
        const isUp = (origNorm === normTargetFrom && destNorm === normTargetTo) ||
                     (upFIdx !== -1 && upTIdx !== -1 && upFIdx < upTIdx);

        const dnFIdx = downStops.indexOf(normTargetFrom);
        const dnTIdx = downStops.indexOf(normTargetTo);
        const isDown = (destNorm === normTargetFrom && origNorm === normTargetTo) ||
                       (dnFIdx !== -1 && dnTIdx !== -1 && dnFIdx < dnTIdx);

        if (!isUp && !isDown) return;

        const plate = bus.vehicleNumber || bus.regNo || 'BUS';
        const cleanPlate = plate.toUpperCase().replace(/[^A-Z0-9]/g, '');
        const tripDir = isUp ? 'UP' : 'DOWN';
        const synthTripId = `T_${tripDir}_${cleanPlate}_${targetDate.replace(/-/g, '')}`;

        const alreadyExists = results.some(
          (r) =>
            r.tripId === synthTripId ||
            (r.vehicleNumber && r.vehicleNumber.replace(/[^A-Z0-9]/g, '') === cleanPlate)
        );
        if (alreadyExists) return;

        const sched = bus.roundTripSchedule;
        const dirSched = isUp ? sched?.upSchedule : sched?.downSchedule;
        const depTime = dirSched?.departureTime || (isUp ? '19:30' : '20:00');
        const arrTime = dirSched?.arrivalTime || (isUp ? '09:00' : '09:30');
        const totalSeats = Number(bus.totalSeats) || Number(bus.seatLayout?.totalSeats) || 40;
        const isSleeper = (bus.busType || bus.vehicleType || '').toLowerCase().includes('sleeper') || Boolean(bus.seatLayout?.hasUpperDeck);
        const fare = Number(sched?.fare || bus.fare || bus.price || (isSleeper ? 850 : 650));

        const busBookings = localBookings.filter(
          (bk) =>
            bk.status !== 'CANCELLED' &&
            bk.booking_status !== 'CANCELLED' &&
            (bk.vehicleNumber === bus.vehicleNumber || (bk.busName && bk.busName.includes(bus.vehicleNumber))) &&
            (!bk.journeyDate || bk.journeyDate === targetDate)
        );
        const bookedCount = busBookings.reduce(
          (sum, bk) =>
            sum + (Array.isArray(bk.seat_list) ? bk.seat_list.length : bk.seats ? bk.seats.split(',').length : 1),
          0
        );
        const availableSeats = Math.max(0, totalSeats - bookedCount);

        results.push({
          tripId: synthTripId,
          backendTripId: null,
          busName: bus.busName || `${bus.vehicleNumber} (${bus.busType || (isSleeper ? 'AC Sleeper' : 'Express')})`,
          vehicleNumber: bus.vehicleNumber,
          plateNumber: bus.vehicleNumber,
          vehicleType: bus.busType || bus.vehicleType || (isSleeper ? 'AC Sleeper' : 'Express'),
          providerName: bus.providerName || 'Verified Provider',
          departureTime: depTime,
          arrivalTime: arrTime,
          duration: bus.assignedRoute?.durationEst || calculateJourneyDuration(depTime, arrTime, '13h 30m'),
          price: fare,
          fare: fare,
          totalSeats,
          availableSeats,
          rating: bus.rating || 4.8,
          amenities: Array.isArray(bus.amenities) ? bus.amenities : ['AC', 'WiFi', 'Charging Point'],
          vehicleId: bus.vehicleId || '',
          providerId: bus.providerId || 'P001',
          typeColor: isSleeper ? '#9333ea' : '#ea580c',
          status: 'SCHEDULED',
          seatLayout: bus.seatLayout,
          source: targetFrom,
          destination: targetTo,
          boardingPoint: targetFrom,
          droppingPoint: targetTo,
        });
      });
    } catch (err) {
      console.warn('Local schedule merge notice:', err);
    }

    // 3. NO MOCK BUSES EVER INVENTED (Only real provider & backend buses shown)
    setMatchingBuses(results);
    setIsSearching(false);
    setStep('buses');
  };

  // Auto-search trigger when arriving from Landing Page
  useEffect(() => {
    const autoSearch = sessionStorage.getItem('c2b_autoSearch');
    if (autoSearch === 'true') {
      sessionStorage.removeItem('c2b_autoSearch');
      const sf = sessionStorage.getItem('searchFrom') || fromCity;
      const st = sessionStorage.getItem('searchTo') || toCity;
      const sd = sessionStorage.getItem('searchDate') || travelDate;
      handleSearch(null, sf, st, sd);
    }
  }, []);

  // Live dynamic update of matching buses when provider adds or updates a schedule
  useEffect(() => {
    if (step !== 'buses') return;

    const handleLiveScheduleSync = () => {
      if (fromCity && toCity && travelDate) {
        handleSearch(null, fromCity, toCity, travelDate);
      }
    };

    window.addEventListener('storage', handleLiveScheduleSync);
    window.addEventListener('c2b_sync', handleLiveScheduleSync);
    return () => {
      window.removeEventListener('storage', handleLiveScheduleSync);
      window.removeEventListener('c2b_sync', handleLiveScheduleSync);
    };
  }, [step, fromCity, toCity, travelDate]);

  // Fetch occupied seats for vehicle / trip
  const fetchOccupiedSeats = async (bus) => {
    const occupied = new Set();
    const cleanPlate = (p) => String(p || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    const busPlate = cleanPlate(bus?.vehicleNumber || bus?.plateNumber);

    // Check localStorage bookings for matching trip or same bus on same date
    try {
      const localBookings = JSON.parse(localStorage.getItem('c2b_bookings') || '[]');
      const targetDate = bus?.date || bus?.journeyDate || travelDate;
      localBookings.forEach((b) => {
        if (
          b.status !== 'CANCELLED' &&
          b.booking_status !== 'CANCELLED'
        ) {
          const bPlate = cleanPlate(b.vehicleNumber || b.plateNumber);
          const matchesTrip = (b.tripId && bus?.tripId && b.tripId === bus.tripId) ||
                              (b.backendTripId && bus?.backendTripId && b.backendTripId === bus.backendTripId);
          const matchesVehicle = busPlate && bPlate && busPlate === bPlate;
          const matchesBusAndDate = (matchesVehicle || (b.busName && bus?.busName && b.busName.toLowerCase() === bus.busName.toLowerCase())) &&
                                    (!b.date || b.date === targetDate || !b.journeyDate || b.journeyDate === targetDate);
          if (matchesTrip || matchesBusAndDate) {
            if (Array.isArray(b.seat_list)) b.seat_list.forEach((s) => occupied.add(String(s).trim()));
            else if (b.seats) b.seats.split(',').forEach((s) => occupied.add(String(s).trim()));
            else if (b.seatNumber) occupied.add(String(b.seatNumber).trim());
          }
        }
      });

      // Check operator blocked seats
      const seatBlocks = JSON.parse(localStorage.getItem('c2b_seat_blocks') || '[]');
      seatBlocks.forEach((blk) => {
        const blkPlate = cleanPlate(blk.vehicleNumber);
        const busMatch = (blk.busId && (blk.busId === bus?.vehicleId || blk.busId === bus?.tripId)) ||
                         (busPlate && blkPlate && busPlate === blkPlate);
        const dateMatch = !blk.date || blk.date === targetDate;
        if (busMatch && dateMatch && blk.seatNumber) {
          occupied.add(String(blk.seatNumber).trim());
        }
      });
    } catch {}

    // Check backend seat status
    if (bus?.vehicleId) {
      try {
        const seats = await API.seats.getByVehicle(bus.vehicleId);
        if (Array.isArray(seats)) {
          const tot = bus.totalSeats || 40;
          const half = Math.ceil(tot / 2);
          seats.forEach((s) => {
            if (s.seatStatus === 'BOOKED' || s.seatStatus === 'BLOCKED') {
              occupied.add(String(s.seatNumber));
              if (s.seatNumber <= half) {
                occupied.add(`L${s.seatNumber}`);
              } else {
                occupied.add(`U${s.seatNumber - half}`);
              }
              const rowIndex = Math.floor((s.seatNumber - 1) / 4);
              const colIndex = ((s.seatNumber - 1) % 4) + 1;
              const rowLetter = String.fromCharCode(65 + rowIndex);
              occupied.add(`${rowLetter}${colIndex}`);
            }
          });
        }
      } catch {}
    }

    return Array.from(occupied);
  };

  const handleSelectBus = async (bus) => {
    let effectiveBus = { ...bus };
    if (!effectiveBus.seatLayout) {
      try {
        const fleetBuses = JSON.parse(localStorage.getItem('c2b_registered_fleet') || '[]');
        const match = fleetBuses.find(
          (f) => (bus.vehicleId && f.vehicleId === bus.vehicleId) ||
                 (bus.vehicleNumber && f.vehicleNumber === bus.vehicleNumber)
        );
        if (match?.seatLayout) {
          effectiveBus.seatLayout = match.seatLayout;
        }
      } catch {}
    }
    setSelectedBus(effectiveBus);
    setSelectedSeats([]);
    setPendingBackendBookings(null);
    try {
      sessionStorage.removeItem('c2b_pendingBookingRecord');
    } catch {}
    const occupied = await fetchOccupiedSeats(effectiveBus);
    setBookedSeats(occupied);
    setStep('seats');
  };

  const handleToggleSeat = (seatId) => {
    setSelectedSeats((prev) =>
      prev.includes(seatId) ? prev.filter((s) => s !== seatId) : [...prev, seatId]
    );
  };

  // Revalidate seat availability before proceeding to passenger details
  const revalidateSeatsAndProceed = async (bus, seatsToValidate) => {
    const latestOccupied = await fetchOccupiedSeats(bus);
    const unavailable = seatsToValidate.filter((s) => latestOccupied.includes(s));

    if (unavailable.length > 0) {
      setBookedSeats(latestOccupied);
      setSelectedSeats((prev) => prev.filter((s) => !unavailable.includes(s)));
      showToast(
        `Seat(s) ${unavailable.join(', ')} are no longer available. Please select another seat.`,
        'error'
      );
      setStep('seats');
      return false;
    }

    setBookedSeats(latestOccupied);
    setStep('passenger');
    return true;
  };

  const handleProceedFromSeats = async () => {
    if (selectedSeats.length === 0) {
      showToast('Please select at least one seat.', 'error');
      return;
    }

    if (!customer || !customer.id || !customer.isLoggedIn) {
      // Guest booking interception: store pending selection safely
      sessionStorage.setItem('c2b_returnAfterLogin', 'passenger');
      sessionStorage.setItem('c2b_proceedToPassenger', 'true');
      sessionStorage.setItem('c2b_redirectAfterLogin', '#search-trips');
      sessionStorage.setItem('c2b_pendingBus', selectedBus?.busName || '');
      sessionStorage.setItem('c2b_pendingType', selectedBus?.vehicleType || '');
      sessionStorage.setItem('c2b_pendingPrice', `₹${selectedBus?.price || 0}`);
      sessionStorage.setItem('c2b_pendingFare', String(selectedBus?.price || 0));
      sessionStorage.setItem('c2b_pendingSeats', JSON.stringify(selectedSeats));
      sessionStorage.setItem(
        'c2b_pendingBooking',
        JSON.stringify({
          bus: selectedBus,
          fromCity,
          toCity,
          travelDate,
          selectedSeats,
        })
      );

      sessionStorage.setItem('c2b_loginPrompt', 'Please sign in to continue with your booking.');
      if (onOpenLogin) {
        onOpenLogin({
          promptMessage: 'Please sign in to continue with your booking.',
          redirectAfterLogin: '#search-trips',
        });
      } else {
        window.location.hash = '#login';
      }
      return;
    }

    // Authenticated user: revalidate and advance
    await revalidateSeatsAndProceed(selectedBus, selectedSeats);
  };

  // Restore pending booking when customer logs in
  useEffect(() => {
    const pendingRaw = sessionStorage.getItem('c2b_pendingBooking');
    const returnFlag =
      sessionStorage.getItem('c2b_returnAfterLogin') === 'passenger' ||
      sessionStorage.getItem('c2b_proceedToPassenger') === 'true';

    if (customer && customer.isLoggedIn && (pendingRaw || returnFlag)) {
      try {
        let restoredBus = selectedBus;
        let restoredSeats = selectedSeats;
        let restoredFrom = fromCity;
        let restoredTo = toCity;
        let restoredDate = travelDate;

        if (pendingRaw) {
          const parsed = JSON.parse(pendingRaw);
          if (parsed.bus) restoredBus = parsed.bus;
          if (parsed.selectedSeats) restoredSeats = parsed.selectedSeats;
          if (parsed.fromCity) restoredFrom = parsed.fromCity;
          if (parsed.toCity) restoredTo = parsed.toCity;
          if (parsed.travelDate) restoredDate = parsed.travelDate;
        }

        sessionStorage.removeItem('c2b_returnAfterLogin');
        sessionStorage.removeItem('c2b_proceedToPassenger');
        sessionStorage.removeItem('c2b_redirectAfterLogin');

        if (restoredBus && restoredSeats && restoredSeats.length > 0) {
          setSelectedBus(restoredBus);
          setSelectedSeats(restoredSeats);
          setFromCity(restoredFrom);
          setToCity(restoredTo);
          setTravelDate(restoredDate);

          revalidateSeatsAndProceed(restoredBus, restoredSeats);
        }
      } catch (err) {
        console.warn('Failed restoring pending booking state:', err);
      }
    }
  }, [customer]);

  const handleProceedToPayment = (paxList) => {
    setPassengers(paxList);
    setStep('payment');
  };

  const handleConfirmPayment = async (paymentDetails) => {
    if (isProcessingPayment) return;
    setIsProcessingPayment(true);
    setPaymentError('');

    const customerId = customer?.id || 'C001';
    let primaryBackendId = pendingBackendBookings?.primaryBackendId || null;
    let seatBookings = pendingBackendBookings?.seatBookings
      ? pendingBackendBookings.seatBookings.map((sb) => ({ ...sb }))
      : [];

    try {
      // Check if selectedBus has an authoritative backend trip ID
      let effectiveTripId = (selectedBus?.backendTripId && /^T\d+$/.test(selectedBus.backendTripId))
        ? selectedBus.backendTripId
        : (selectedBus?.tripId && /^T\d+$/.test(selectedBus.tripId) ? selectedBus.tripId : null);

      const safeFetch = async (endpoint, opts = {}) => {
        try {
          const r = await fetch(endpoint.startsWith('/api') ? endpoint : `/api${endpoint}`, opts);
          return await r.json().catch(() => ({}));
        } catch {
          const direct = endpoint.startsWith('/api') ? `http://localhost:3000${endpoint}` : `http://localhost:3000/api${endpoint}`;
          const r = await fetch(direct, opts);
          return await r.json().catch(() => ({}));
        }
      };

      // If effectiveTripId is provided, verify it actually matches this route on the backend
      if (effectiveTripId) {
        try {
          const tripCheck = await safeFetch(`/trips/${effectiveTripId}`);
          if (!tripCheck || tripCheck.success === false || !tripCheck.data) {
            effectiveTripId = null; // Trip does not exist on backend, must resolve/create
          } else {
            const td = tripCheck.data;
            const s = (td?.source || td?.route || td?.trip?.source || '').toLowerCase();
            const d = (td?.destination || td?.route || td?.trip?.destination || '').toLowerCase();
            const targetS = fromCity.trim().toLowerCase();
            const targetD = toCity.trim().toLowerCase();
            if (s && d && (!s.includes(targetS) || !d.includes(targetD))) {
              effectiveTripId = null; // Mismatched route trip ID, must resolve/create for this route
            }
          }
        } catch {
          effectiveTripId = null;
        }
      }

      // If the selected bus does not have a canonical backend trip ID for this route,
      // resolve or create the backend trip record before creating the booking.
      if (!effectiveTripId) {
        try {
          // First, check if backend already has an authoritative trip for this route and bus
          const src = encodeURIComponent(fromCity.trim());
          const dst = encodeURIComponent(toCity.trim());
          const tripsRes = await safeFetch(`/trips?source=${src}&destination=${dst}`);
          const tripsList = Array.isArray(tripsRes?.data) ? tripsRes.data : (Array.isArray(tripsRes) ? tripsRes : []);
          const matchedTrip = tripsList.find((t) =>
            (t.busName && selectedBus?.busName && t.busName.toLowerCase() === selectedBus.busName.toLowerCase()) ||
            (selectedBus?.departureTime && t.departureTime === selectedBus.departureTime)
          ) || (tripsList.length > 0 ? tripsList[0] : null);

          if (matchedTrip?.tripId && /^T\d+$/.test(matchedTrip.tripId)) {
            effectiveTripId = matchedTrip.tripId;
            selectedBus.tripId = effectiveTripId;
            selectedBus.backendTripId = effectiveTripId;
          }
        } catch (e) {
          console.warn('Backend trip lookup notice:', e);
        }

        // If still not a canonical trip ID, create the route, vehicle, schedule, and trip on backend
        if (!effectiveTripId || !/^T\d+$/.test(effectiveTripId)) {
          try {
            const providerId = (selectedBus?.providerId && /^P\d+$/.test(selectedBus.providerId)) ? selectedBus.providerId : 'P001';

            // Step 1: Route
            const rRes = await safeFetch('/routes', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'x-role': 'PROVIDER' },
              body: JSON.stringify({ source: fromCity.trim(), destination: toCity.trim(), distance: 300 }),
            });
            const routeId = rRes?.data?.routeId || rRes?.routeId || 'R001';

            // Step 2: Vehicle - lookup existing vehicle or create new
            const normalizedType = (() => {
              const bt = selectedBus?.vehicleType || selectedBus?.busType;
              if (!bt) return 'AC';
              if (bt === 'Sleeper AC' || bt === 'AC Sleeper') return 'AC Sleeper';
              if (bt === 'Volvo AC') return 'Volvo AC';
              if (bt === 'Non-AC') return 'Non-AC';
              if (bt === 'Semi-Sleeper') return 'Semi-Sleeper';
              if (bt === 'AC Seater') return 'AC Seater';
              if (bt === 'Luxury') return 'Luxury';
              return bt;
            })();

            const cleanVNum = (((selectedBus?.busName || 'BUS').replace(/[^A-Za-z0-9]/g, '').toUpperCase()) + '0000').slice(0, 10);
            let vehicleId = null;

            try {
              const vehListRes = await safeFetch('/vehicles', {
                headers: { 'x-role': 'PROVIDER' },
              });
              const vehList = Array.isArray(vehListRes?.data) ? vehListRes.data : (Array.isArray(vehListRes) ? vehListRes : []);
              const existingVeh = vehList.find((v) =>
                v.vehicleNumber?.toUpperCase() === cleanVNum.toUpperCase() ||
                (v.busName && selectedBus?.busName && v.busName.toLowerCase() === selectedBus.busName.toLowerCase()) ||
                v.vehicleNumber?.toUpperCase() === selectedBus?.busName?.toUpperCase()
              );
              if (existingVeh?.vehicleId) {
                vehicleId = existingVeh.vehicleId;
              }
            } catch (vErr) {
              console.warn('Vehicle lookup note:', vErr);
            }

            if (!vehicleId) {
              const vRes = await safeFetch('/vehicles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-role': 'PROVIDER' },
                body: JSON.stringify({
                  providerId,
                  vehicleNumber: cleanVNum,
                  vehicleType: normalizedType,
                  totalSeats: Number(selectedBus?.totalSeats) || 40,
                  remainingSeats: Number(selectedBus?.totalSeats) || 40,
                  busName: selectedBus?.busName || 'Express Bus',
                  amenities: ['AC', 'WiFi'],
                  rating: 4.5,
                  boardingPoint: fromCity.trim(),
                  droppingPoint: toCity.trim(),
                }),
              });
              vehicleId = vRes?.data?.vehicleId || vRes?.vehicleId || 'V001';
            }

            // Step 3: Schedule
            const validJourneyDate = travelDate || new Date().toISOString().split('T')[0];
            const sRes = await safeFetch('/schedules', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'x-role': 'PROVIDER' },
              body: JSON.stringify({
                routeId,
                providerId,
                departureTime: selectedBus?.departureTime || '08:00',
                arrivalTime: selectedBus?.arrivalTime || '12:00',
                journeyDate: validJourneyDate,
                arrivalTimeToDestination: selectedBus?.arrivalTime || '12:00',
                fare: Number(selectedBus?.price) || 500,
              }),
            });
            const scheduleId = sRes?.data?.scheduleId || sRes?.scheduleId || 'SCH001';

            // Step 4: Trip
            const tRes = await safeFetch('/trips', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'x-role': 'PROVIDER' },
              body: JSON.stringify({ vehicleId, scheduleId }),
            });
            const canonicalTripId = tRes?.data?.tripId || tRes?.tripId;
            if (canonicalTripId && /^T\d+$/.test(canonicalTripId)) {
              effectiveTripId = canonicalTripId;
              selectedBus.tripId = effectiveTripId;
              selectedBus.backendTripId = effectiveTripId;
            }
          } catch (e) {
            console.warn('Auto-register backend trip error:', e);
          }
        }

        // Validate that we have a real authoritative backend trip ID before creating bookings
        if (!effectiveTripId || !/^T\d+$/.test(effectiveTripId)) {
          throw new Error(`Unable to resolve authoritative backend trip for ${selectedBus?.busName || 'selected bus'}. Please retry or choose a scheduled trip.`);
        }

        // Synchronize canonical backend trip ID back to localStorage c2b_bus_schedules
        try {
          const raw = localStorage.getItem('c2b_bus_schedules');
          if (raw) {
            const schedules = JSON.parse(raw);
            let updated = false;
            schedules.forEach((s) => {
              if (
                s.tripId === selectedBus?.tripId ||
                s.id === selectedBus?.tripId ||
                (s.busName && selectedBus?.busName && s.busName.toLowerCase() === selectedBus.busName.toLowerCase())
              ) {
                s.tripId = effectiveTripId;
                s.id = effectiveTripId;
                s.backendTripId = effectiveTripId;
                updated = true;
              }
            });
            if (updated) {
              localStorage.setItem('c2b_bus_schedules', JSON.stringify(schedules));
            }
          }
        } catch (storageErr) {
          console.warn('Sync canonical trip to local schedules notice:', storageErr);
        }
      }

      // Only consider pendingBackendBookings if it matches the current trip and bus
      const isMatchingPendingTrip =
        pendingBackendBookings &&
        (pendingBackendBookings.tripId === effectiveTripId ||
         pendingBackendBookings.backendTripId === effectiveTripId ||
         selectedBus?.tripId === pendingBackendBookings.tripId);

      // 1. Initialize seatBookings for all selected seats
      seatBookings = selectedSeats.map((seatLabel) => {
        const numericSeat = getNumericSeat(seatLabel, selectedBus.totalSeats || 40);
        const matched = isMatchingPendingTrip
          ? pendingBackendBookings?.seatBookings?.find(
              (b) => b.seatLabel === seatLabel && b.bookingId
            )
          : null;
        return {
          seatLabel,
          numericSeat,
          bookingId: matched?.bookingId || null,
          paid: matched?.paid || false,
        };
      });

      // 2. Validate any existing bookingId and create backend booking reservations for any seat lacking an active PENDING booking
      for (let sIdx = 0; sIdx < seatBookings.length; sIdx++) {
        const sb = seatBookings[sIdx];
        let needsCreate = !sb.bookingId;

        if (sb.bookingId) {
          try {
            const check = await API.bookings.getById(sb.bookingId);
            const bData = check?.data !== undefined ? check.data : check;
            if (
              !bData ||
              bData.bookingStatus !== 'PENDING' ||
              (effectiveTripId && bData.tripId !== effectiveTripId) ||
              bData.seatNumber !== sb.numericSeat
            ) {
              needsCreate = true;
              sb.bookingId = null;
              sb.paid = false;
            }
          } catch {
            needsCreate = true;
            sb.bookingId = null;
            sb.paid = false;
          }
        }

        if (needsCreate) {
          if (sIdx === 0) {
            primaryBackendId = null;
          }
          // Apply offerCode only on primary seat reservation so discount is not multiplied per seat
          const offerToPass = sIdx === 0 ? paymentDetails.offerCode : null;
          const bRes = await API.bookings.create(effectiveTripId, sb.numericSeat, offerToPass);
          const backendId = bRes?.bookingId || bRes?.data?.bookingId;
          if (!backendId) {
            throw new Error(`Failed to create booking reservation for seat ${sb.seatLabel}`);
          }
          sb.bookingId = backendId;
          if (!primaryBackendId || sIdx === 0) {
            primaryBackendId = backendId;
          }
        }
      }

      // 3. Validate that every selected seat has a valid backend booking ID
      const preVal = validateSeatBookings(seatBookings, selectedSeats.length);
      if (!preVal.valid) {
        throw new Error(`Cannot proceed with payment: ${preVal.error}`);
      }

      const currentPrimary = seatBookings[0]?.bookingId || primaryBackendId;
      primaryBackendId = currentPrimary;
      setPendingBackendBookings({
        primaryBackendId: currentPrimary,
        seatBookings: seatBookings.map((sb) => ({ ...sb })),
        tripId: effectiveTripId,
      });

      // 4. Execute payments with retry logic:
      // Skips already paid seats, marks each seat as paid immediately after pay() succeeds,
      // and retains successful payment statuses if partway payment fails.
      await executeSeatPayments({
        seatBookings,
        totalAmount: paymentDetails.total,
        totalDiscount: paymentDetails.discount,
        paymentMethod: paymentDetails.method,
        discountAllocation: 'first',
        payFn: (bId, amt, method, disc) => API.payments.pay(bId, amt, method, disc),
        onSeatPaid: (sIdx, paidSeat, allSeats) => {
          setPendingBackendBookings({
            primaryBackendId: currentPrimary,
            seatBookings: allSeats.map((sb) => ({ ...sb })),
          });
          try {
            const inProgressRecord = {
              bookingId: currentPrimary,
              booking_id: currentPrimary,
              primaryBackendId: currentPrimary,
              backendBookingIds: allSeats.map((s) => s.bookingId).filter(Boolean),
              seatBookings: allSeats.map((sb) => ({ ...sb })),
              customerId,
              customer_id: customerId,
              customerName: passengers[0]?.name || customer?.name || 'Customer',
              passengerName: passengers[0]?.name || customer?.name || 'Passenger',
              tripId: effectiveTripId,
              backendTripId: effectiveTripId,
              busName: selectedBus.busName,
              busType: selectedBus.vehicleType,
              from: fromCity.trim(),
              to: toCity.trim(),
              date: travelDate,
              journeyDate: travelDate,
              seats: selectedSeats.join(', '),
              seat_list: selectedSeats,
              passengerCount: selectedSeats.length,
              paymentMethod: paymentDetails.method,
              discount: paymentDetails.discount,
              total: paymentDetails.total,
              subtotal: paymentDetails.total,
              status: 'PENDING',
              booking_status: 'PENDING',
              createdAt: new Date().toISOString(),
              passengers,
              providerId: selectedBus.providerId || 'P001',
              provider_id: selectedBus.providerId || 'P001',
            };
            sessionStorage.setItem('c2b_pendingBookingRecord', JSON.stringify(inProgressRecord));
          } catch {}
        },
      });

      // 5. Final validation before claiming booking is confirmed:
      // Validate that every selected seat has a valid backend booking ID and is paid
      const finalVal = validateSeatBookings(seatBookings, selectedSeats.length);
      if (!finalVal.valid) {
        throw new Error(`Cannot confirm booking: ${finalVal.error}`);
      }
      const unpaidSeats = seatBookings.filter((sb) => !sb.paid);
      if (unpaidSeats.length > 0) {
        throw new Error(`Cannot confirm booking: seats ${unpaidSeats.map((u) => u.seatLabel).join(', ')} remain unpaid.`);
      }

      const bookingId = primaryBackendId || seatBookings[0]?.bookingId;
      const backendBookingIds = seatBookings.map((sb) => sb.bookingId).filter(Boolean);

      // 6. Create confirmed booking object with full multi-portal metadata
      const leadPax = passengers[0] || {};
      const seatCount = selectedSeats.length || 1;
      const basePrice = Number(selectedBus.price) || 500;
      const grossFare = paymentDetails.subtotal != null ? Number(paymentDetails.subtotal) : (basePrice * seatCount);
      const couponCode = paymentDetails.offerCode || paymentDetails.couponCode || null;
      const couponDiscount = Number(paymentDetails.discount) || 0;
      const platformCommission = Math.round(grossFare * 0.10);
      const operatorPayout = Math.max(0, grossFare - platformCommission);
      const gst = paymentDetails.gst != null ? Number(paymentDetails.gst) : Math.round(grossFare * 0.18);
      const platformFee = paymentDetails.platformFee != null ? Number(paymentDetails.platformFee) : 25;
      const totalAmount = Number(paymentDetails.total) || Math.max(0, grossFare + gst + platformFee - couponDiscount);

      const newBooking = {
        bookingId,
        booking_id: bookingId,
        primaryBackendId: bookingId,
        backendBookingIds: backendBookingIds.length > 0 ? backendBookingIds : undefined,
        seatBookings: seatBookings.map((sb) => ({ ...sb })),
        customerId,
        customer_id: customerId,
        customerName: leadPax.name || customer?.name || 'Customer',
        passengerName: leadPax.name || customer?.name || 'Passenger',
        phone: leadPax.phone || customer?.phone || '—',
        email: leadPax.email || customer?.email || '—',
        gender: leadPax.gender || 'General',
        age: leadPax.age || '—',
        tripId: effectiveTripId,
        backendTripId: effectiveTripId,
        vehicleId: selectedBus.vehicleId || '',
        vehicleNumber: selectedBus.vehicleNumber || selectedBus.plateNumber || '',
        plateNumber: selectedBus.vehicleNumber || selectedBus.plateNumber || '',
        busName: selectedBus.busName,
        busType: selectedBus.vehicleType,
        from: fromCity.trim(),
        to: toCity.trim(),
        date: travelDate,
        journeyDate: travelDate,
        departureTime: selectedBus.departureTime || '08:00',
        arrivalTime: selectedBus.arrivalTime || '12:00',
        seats: selectedSeats.join(', '),
        seat_list: selectedSeats,
        seatNumber: selectedSeats[0] || '',
        passengerCount: selectedSeats.length,
        paymentMethod: paymentDetails.method,
        couponCode: couponCode || 'NONE',
        offerCode: couponCode || null,
        discount: couponDiscount,
        couponDiscount,
        grossFare,
        subtotal: grossFare,
        gst,
        platformFee,
        platformCommission,
        operatorPayout,
        total: totalAmount,
        amount: totalAmount,
        fare: selectedBus.price,
        status: 'CONFIRMED',
        booking_status: 'CONFIRMED',
        createdAt: new Date().toISOString(),
        passengers: (Array.isArray(passengers) ? passengers : []).map((p, idx) => ({
          seat: p.seat || selectedSeats[idx] || `S${idx + 1}`,
          seatNumber: p.seat || p.seatNumber || selectedSeats[idx] || `S${idx + 1}`,
          name: p.name || 'Passenger',
          phone: p.phone || leadPax.phone || customer?.phone || '—',
          email: p.email || leadPax.email || customer?.email || '—',
          gender: p.gender || 'General',
          age: p.age || '—',
        })),
        providerId: selectedBus.providerId || 'P001',
        provider_id: selectedBus.providerId || 'P001',
      };

      // 7. Save confirmed booking to localStorage (prevent duplicates by booking ID)
      const existing = JSON.parse(localStorage.getItem('c2b_bookings') || '[]');
      const filtered = existing.filter((b) => (b.bookingId || b.booking_id) !== bookingId);
      filtered.unshift(newBooking);
      localStorage.setItem('c2b_bookings', JSON.stringify(filtered));

      // 7b. Update schedule in c2b_bus_schedules so provider immediately sees booked count & revenue
      try {
        const localScheds = JSON.parse(localStorage.getItem('c2b_bus_schedules') || '[]');
        let updatedSched = false;
        localScheds.forEach((s) => {
          const tid = s.id || s.tripId;
          const matchId = tid && (tid === effectiveTripId || tid === selectedBus.tripId || tid === selectedBus.backendTripId);
          const matchRoute = s.from?.toLowerCase() === fromCity.trim().toLowerCase() &&
                             s.to?.toLowerCase() === toCity.trim().toLowerCase() &&
                             (!s.journeyDate || s.journeyDate === travelDate);
          if (matchId || matchRoute) {
            if (effectiveTripId && /^T\d+$/.test(effectiveTripId)) {
              s.id = effectiveTripId;
              s.tripId = effectiveTripId;
              s.backendTripId = effectiveTripId;
            }
            s.bookedSeats = (s.bookedSeats || 0) + selectedSeats.length;
            s.availableSeats = Math.max(0, (s.totalSeats || 40) - s.bookedSeats);
            s.revenue = (s.revenue || 0) + grossFare;
            s.operatorPayout = (s.operatorPayout || 0) + operatorPayout;
            updatedSched = true;
          }
        });
        if (updatedSched) {
          localStorage.setItem('c2b_bus_schedules', JSON.stringify(localScheds));
        }
      } catch (err) {
        console.warn('Could not update schedule booking stats:', err);
      }
      try { window.dispatchEvent(new Event('storage')); } catch {}
      try { liveSync.syncBooking(newBooking); } catch (e) { console.warn('Sync booking error:', e); }

      // 8. Update sessionStorage for confirmation page and legacy parity
      sessionStorage.setItem('lastBookingId', bookingId);
      sessionStorage.setItem('lastBusName', selectedBus.busName);
      sessionStorage.setItem('lastSeats', selectedSeats.join(', '));
      sessionStorage.setItem('lastTotal', paymentDetails.total.toString());
      sessionStorage.setItem('lastDiscount', paymentDetails.discount.toString());
      sessionStorage.setItem('lastFrom', fromCity.trim());
      sessionStorage.setItem('lastTo', toCity.trim());
      sessionStorage.setItem('lastDate', travelDate);
      sessionStorage.setItem('lastBusType', selectedBus.vehicleType || 'AC');
      sessionStorage.setItem('lastPayMethod', paymentDetails.method);
      sessionStorage.setItem('lastPassengerCount', selectedSeats.length.toString());
      sessionStorage.setItem('lastPassengers', JSON.stringify(passengers));

      // 9. Clear pending booking state and any stale redirect targets
      sessionStorage.removeItem('c2b_pendingBooking');
      sessionStorage.removeItem('c2b_pendingBookingRecord');
      sessionStorage.removeItem('c2b_pendingSeats');
      sessionStorage.removeItem('c2b_pendingBus');
      sessionStorage.removeItem('c2b_pendingType');
      sessionStorage.removeItem('c2b_pendingPrice');
      sessionStorage.removeItem('c2b_pendingFare');
      sessionStorage.removeItem('c2b_returnAfterLogin');
      sessionStorage.removeItem('c2b_proceedToPassenger');
      sessionStorage.removeItem('c2b_redirectAfterLogin');

      setPendingBackendBookings(null);
      showToast(`Booking ${bookingId} confirmed successfully!`, 'success');
      setConfirmedBooking(newBooking);
      setStep('confirmed');
    } catch (err) {
      console.warn('Payment failed:', err.message);
      const errText = err.message || 'Payment processing failed. Please check your payment details and retry.';
      setPaymentError(errText);
      showToast(`⚠️ Payment failed: ${errText} Booking remains in PENDING status.`, 'error');

      const currentSeatBookings = seatBookings.length > 0 ? seatBookings : (pendingBackendBookings?.seatBookings || []);
      const pendingId = primaryBackendId || currentSeatBookings[0]?.bookingId || ('PENDING_' + Date.now());
      const pendingRecord = {
        bookingId: pendingId,
        booking_id: pendingId,
        primaryBackendId: pendingId,
        backendBookingIds: currentSeatBookings.map((s) => s.bookingId).filter(Boolean),
        seatBookings: currentSeatBookings.map((sb) => ({ ...sb })),
        customerId,
        customer_id: customerId,
        customerName: passengers[0]?.name || customer?.name || 'Customer',
        passengerName: passengers[0]?.name || customer?.name || 'Passenger',
        tripId: effectiveTripId || selectedBus?.tripId,
        backendTripId: effectiveTripId || selectedBus?.backendTripId,
        busName: selectedBus?.busName,
        busType: selectedBus?.vehicleType,
        from: fromCity.trim(),
        to: toCity.trim(),
        date: travelDate,
        journeyDate: travelDate,
        seats: selectedSeats.join(', '),
        seat_list: selectedSeats,
        passengerCount: selectedSeats.length,
        paymentMethod: paymentDetails.method,
        discount: paymentDetails.discount,
        total: paymentDetails.total,
        status: 'PENDING',
        booking_status: 'PENDING',
        createdAt: new Date().toISOString(),
        passengers,
        providerId: selectedBus?.providerId || 'P001',
        provider_id: selectedBus?.providerId || 'P001',
      };

      try {
        sessionStorage.setItem('c2b_pendingBookingRecord', JSON.stringify(pendingRecord));
      } catch {}

      // Retain the seatBookings state in React so retry immediately has access to already paid seats
      if (currentSeatBookings.length > 0) {
        setPendingBackendBookings({
          primaryBackendId: pendingId,
          seatBookings: currentSeatBookings.map((sb) => ({ ...sb })),
        });
      }
    } finally {
      setIsProcessingPayment(false);
    }
  };

  return (
    <div>
      {/* ─────────── VIEW 1: SEARCH TRIPS ─────────── */}
      {step === 'search' && (
        <div id="view-search" className="view active">
          <div className="page-content two-col">

            {/* Left: Search form */}
            <section className="search-section">
              <div className="section-heading">
                <h1 className="section-title">Search Your Perfect Trip</h1>
                <p className="section-desc">Book your journey with ease and comfort</p>
              </div>

              {searchError && (
                <div style={{ background: '#fff1f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '10px 16px', fontSize: '0.82rem', color: '#ef4444', fontWeight: 600, marginBottom: '16px' }}>
                  ⚠️ {searchError}
                </div>
              )}

              <div className="search-card">
                <div className="form-group">
                  <label className="form-label" htmlFor="fromCity">FROM</label>
                  <CityAutocomplete
                    id="fromCity"
                    value={fromCity}
                    onChange={(val) => setFromCity(val)}
                    options={availableCities}
                    placeholder="Departure city"
                    ariaLabel="Departure city"
                  />
                </div>

                <div className="swap-wrapper">
                  <button
                    type="button"
                    className="swap-btn"
                    id="swapBtn"
                    aria-label="Swap cities"
                    onClick={handleSwapCities}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v10m0 0-3-3m3 3 3-3"/><path d="M12 22V12m0 0-3 3m3-3 3 3"/></svg>
                  </button>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="toCity">TO</label>
                  <CityAutocomplete
                    id="toCity"
                    value={toCity}
                    onChange={(val) => setToCity(val)}
                    options={availableCities}
                    placeholder="Destination city"
                    ariaLabel="Destination city"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="travelDate">TRAVEL DATE</label>
                  <div className="input-wrapper">
                    <span className="input-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    </span>
                    <input
                      type="date"
                      id="travelDate"
                      className="form-input date-input"
                      value={travelDate}
                      onChange={(e) => setTravelDate(e.target.value)}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  className="search-btn"
                  id="searchBtn"
                  onClick={handleSearch}
                  disabled={isSearching}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                  {isSearching ? 'Finding Available Buses…' : 'Find Available Buses'}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14m-6-7 7 7-7 7"/></svg>
                </button>
              </div>

              <div className="recent-searches">
                <p className="recent-label">Recent Searches</p>
                <div className="recent-tags">
                  <button
                    type="button"
                    className="recent-tag"
                    onClick={() => { setFromCity('MUMBAI'); setToCity('PUNE'); }}
                  >
                    🚌 Mumbai → Pune
                  </button>
                  <button
                    type="button"
                    className="recent-tag"
                    onClick={() => { setFromCity('DELHI'); setToCity('AGRA'); }}
                  >
                    🏛 Delhi → Agra
                  </button>
                  <button
                    type="button"
                    className="recent-tag"
                    onClick={() => { setFromCity('BANGALORE'); setToCity('MYSORE'); }}
                  >
                    🚌 Bangalore → Mysore
                  </button>
                </div>
              </div>
            </section>

            {/* Right: Hero */}
            <section className="hero-section">
              <div className="hero-card">
                <div className="available-badge">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="8" width="20" height="12" rx="3"/><rect x="5" y="5" width="14" height="5" rx="2"/><circle cx="6.5" cy="20" r="1.5" fill="#f97316" stroke="none"/><circle cx="17.5" cy="20" r="1.5" fill="#f97316" stroke="none"/></svg>
                  <div className="available-text">
                    <span className="avail-label">Available</span>
                    <span className="avail-count">200+</span>
                  </div>
                </div>
                <div className="hero-img-wrapper">
                  <img src={busHeroImg} alt="Luxury bus traveling through mountains" className="hero-img" />
                  <div className="hero-overlay"></div>
                </div>
                <div className="rating-bar">
                  <div className="stars">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <svg key={s} width="16" height="16" viewBox="0 0 24 24" fill="#f97316"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                    ))}
                  </div>
                  <span className="rating-value">4.8</span>
                </div>
              </div>
              <div className="feature-pills">
                <div className="pill"><span className="pill-dot green"></span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>Safe Travel</div>
                <div className="pill"><span className="pill-dot blue"></span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>On Time</div>
                <div className="pill"><span className="pill-dot pink"></span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ec4899" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>Easy Payment</div>
              </div>
            </section>
          </div>
        </div>
      )}

      {/* ─────────── VIEW 2: AVAILABLE BUSES ─────────── */}
      {step === 'buses' && (
        <div id="view-buses" className="view active">
          <div className="page-content single-col">
            {/* Stepper */}
            <div className="stepper-row">
              <button type="button" className="back-btn" onClick={() => setStep('search')}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg> Back
              </button>
              <div className="stepper">
                <div className="step-item done"><div className="step-circle done"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div><span className="step-label">Search</span></div>
                <div className="step-line done"></div>
                <div className="step-item active"><div className="step-circle active">2</div><span className="step-label active-lbl">Select Bus</span></div>
                <div className="step-line"></div>
                <div className="step-item"><div className="step-circle">3</div><span className="step-label">Choose Seat</span></div>
                <div className="step-line"></div>
                <div className="step-item"><div className="step-circle">4</div><span className="step-label">Passenger Info</span></div>
                <div className="step-line"></div>
                <div className="step-item"><div className="step-circle">5</div><span className="step-label">Payment</span></div>
                <div className="step-line"></div>
                <div className="step-item"><div className="step-circle">6</div><span className="step-label">Confirm</span></div>
              </div>
            </div>

            <div className="route-header">
              <h1 className="route-title" id="busRouteTitle">{fromCity} → {toCity}</h1>
              <p className="route-meta" id="busRouteMeta">{travelDate} · {matchingBuses.length} bus{matchingBuses.length !== 1 ? 'es' : ''} available</p>
            </div>

            {matchingBuses.length === 0 ? (
              <div
                className="empty-state-card"
                style={{
                  textAlign: 'center',
                  padding: '48px 24px',
                  background: '#ffffff',
                  borderRadius: '16px',
                  border: '1.5px dashed #cbd5e1',
                  marginTop: '20px',
                }}
              >
                <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🚌</div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b', marginBottom: '8px' }}>
                  No buses available for this route
                </h3>
                <p style={{ color: '#64748b', fontSize: '0.9rem', maxWidth: '440px', margin: '0 auto 20px', lineHeight: 1.5 }}>
                  We couldn't find any scheduled buses between <strong>{fromCity}</strong> and <strong>{toCity}</strong> on <strong>{travelDate}</strong>.
                </p>
                <button
                  type="button"
                  className="select-seat-btn"
                  style={{ display: 'inline-flex', width: 'auto', padding: '10px 24px', margin: '0 auto' }}
                  onClick={() => setStep('search')}
                >
                  Modify Search
                </button>
              </div>
            ) : (
              <div className="bus-list" id="busList">
                {matchingBuses.map((bus, idx) => {
                  const colorClass = ['orange', 'green', 'blue', 'purple'][idx % 4];
                  return (
                    <div key={bus.tripId} className="bus-card dynamic-bus">
                      <div className="bus-info">
                        <div className="bus-name-row">
                          <span className="bus-name">{bus.busName}</span>
                          <span className={`bus-type-badge ${colorClass}`}>{bus.vehicleType}</span>
                          {bus.status === 'IN_PROGRESS' && (
                            <span style={{ background: '#dcfce7', color: '#15803d', fontSize: '.68rem', fontWeight: 800, padding: '2px 8px', borderRadius: '50px', border: '1px solid #86efac' }}>
                              🟢 Trip Started / In Progress
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '.72rem', color: '#94a3b8', marginBottom: '6px' }}>
                          Date: <strong>{travelDate}</strong> &nbsp;·&nbsp; {fromCity} → {toCity}
                        </div>
                        <div className="bus-timing">
                          <span className="time">{bus.departureTime}</span>
                          <span className="route-line" title={`Estimated Duration: ${calculateJourneyDuration(bus.departureTime, bus.arrivalTime, bus.duration)}`}>
                            <span className="dot-line"></span>
                            <span style={{ fontSize: '.68rem', color: '#64748b', fontWeight: 600, padding: '0 4px', whiteSpace: 'nowrap' }}>
                              {calculateJourneyDuration(bus.departureTime, bus.arrivalTime, bus.duration)}
                            </span>
                            <span className="dot-line"></span>
                          </span>
                          <span className="time">{bus.arrivalTime}</span>
                        </div>
                        <div className="bus-meta-row">
                          <span className="star-inline">★ {bus.rating || 4.5}</span>
                          <span className="seats-left green-txt">{bus.availableSeats}/{bus.totalSeats || 40} seats available</span>
                          <span className="journey-duration" style={{ fontSize: '.72rem', fontWeight: 700, color: '#475569', background: '#f1f5f9', padding: '2px 8px', borderRadius: '6px' }}>
                            ⏱️ Estimated Duration: {calculateJourneyDuration(bus.departureTime, bus.arrivalTime, bus.duration)}
                          </span>
                          <span className="amenity-icon">🌬️</span>
                          <span className="new-badge" style={{ background: '#dcfce7', color: '#16a34a', fontSize: '.65rem', fontWeight: 800, padding: '2px 8px', borderRadius: '50px', border: '1px solid #86efac' }}>NEW</span>
                        </div>
                      </div>
                      <div className="bus-price-col">
                        <span className="bus-price">₹{bus.price}</span>
                        <button
                          type="button"
                          className="select-seat-btn"
                          onClick={() => handleSelectBus(bus)}
                        >
                          Select Seats <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 3: SEAT MAP */}
      {step === 'seats' && selectedBus && (
        <SeatMap
          bus={selectedBus}
          selectedSeats={selectedSeats}
          onToggleSeat={handleToggleSeat}
          bookedSeats={bookedSeats}
          onProceed={handleProceedFromSeats}
          onBack={() => setStep('buses')}
        />
      )}

      {/* Step 4: PASSENGER FORMS */}
      {step === 'passenger' && selectedBus && (
        <PassengerForms
          selectedSeats={selectedSeats}
          customer={customer}
          onProceed={handleProceedToPayment}
          onBack={() => setStep('seats')}
        />
      )}

      {/* Step 5: PAYMENT MODAL / REVIEW */}
      {step === 'payment' && selectedBus && (
        <PaymentModal
          bus={selectedBus}
          selectedSeats={selectedSeats}
          passengers={passengers}
          onConfirmPayment={handleConfirmPayment}
          onBack={() => setStep('passenger')}
          isProcessing={isProcessingPayment}
          paymentError={paymentError}
        />
      )}

      {/* Step 6: BOOKING CONFIRMED */}
      {step === 'confirmed' && confirmedBooking && (
        <BookingConfirmed
          booking={confirmedBooking}
          onGoToBookings={onNavigateToBookings || (() => onNavigate && onNavigate('my-bookings'))}
          onNewSearch={() => {
            setSelectedBus(null);
            setSelectedSeats([]);
            setConfirmedBooking(null);
            setPendingBackendBookings(null);
            try { sessionStorage.removeItem('c2b_pendingBookingRecord'); } catch {}
            setStep('search');
          }}
        />
      )}
    </div>
  );
}
