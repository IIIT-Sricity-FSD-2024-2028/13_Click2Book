import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  getFleetBuses,
  getBackendFleetBuses,
  getFleetStats,
  registerNewBus,
  saveBusSeatLayout,
  assignBusToRoute,
  changeBusRoute,
  saveRoundTripSchedules,
  updateBusStatus,
  deleteBus,
  clearAllBuses,
  unassignBusRoute,
  generateDefaultSeatLayout,
  discoverRouteCorridors,
  getOrderedCorridorStations,
  computeStopScheduleTimes,
  getCityCoords,
  getApprovedCities,
  validateVehicleNumberPlate,
  normalizeVehiclePlate,
  isBusInActiveTrip,
  parseDurationToMinutes,
  computeArrivalTime,
  validateFutureDeparture,
  checkBusActiveBookings,
  submitOsmLocationRequest,
  approveDestinationRequest,
  searchOsmLocations,
} from '../services/api';
import RouteCorridorMap from './RouteCorridorMap';
import OsmLocationSelector from './OsmLocationSelector';
import BusSeatLayout from './BusSeatLayout';

const BUS_TYPES = [
  'AC Sleeper',
  'Non-AC Sleeper',
  'AC Seater',
  'Non-AC Seater',
  'Semi-Sleeper',
  'Volvo AC',
  'Luxury Sleeper',
  'Luxury Seater',
];

const AMENITY_OPTIONS = [
  'AC',
  'Charging point',
  'Wi-Fi',
  'Water bottle',
  'Reading light',
  'Blanket',
  'Pillow',
  'GPS',
  'Personal TV',
  'Emergency Exit',
];

const WEEKDAYS = [
  { id: 'MON', label: 'Mon', fullName: 'Monday' },
  { id: 'TUE', label: 'Tue', fullName: 'Tuesday' },
  { id: 'WED', label: 'Wed', fullName: 'Wednesday' },
  { id: 'THU', label: 'Thu', fullName: 'Thursday' },
  { id: 'FRI', label: 'Fri', fullName: 'Friday' },
  { id: 'SAT', label: 'Sat', fullName: 'Saturday' },
  { id: 'SUN', label: 'Sun', fullName: 'Sunday' },
];

const DAY_NAMES = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const DAY_TO_IDX = { SUN: 0, MON: 1, TUE: 2, WED: 3, THU: 4, FRI: 5, SAT: 6 };

const STATE_OPTIONS = [
  'Andhra Pradesh',
  'Telangana',
  'Tamil Nadu',
  'Karnataka',
  'Maharashtra',
  'Kerala',
  'Odisha',
];

const HUB_TYPES = [
  'Major District Headquarters',
  'Commercial Transit Junction',
  'Industrial & Tech Corridor',
  'Pilgrim / Tourist Destination',
  'Suburban Satellite Hub',
];

export default function BusFleetManagement({ provider, showToast, onNavigate }) {
  const providerId = provider?.id || 'P001';

  // Navigation Sub-tabs: 'overview' | 'register' | 'assigned-table' | 'assign-route' | 'roundtrip-schedule'
  const [subTab, setSubTab] = useState('overview');

  // Fleet data state
  const [buses, setBuses] = useState([]);
  const [stats, setStats] = useState({ totalBuses: 0, assignedBuses: 0, availableBuses: 0, maintenanceBuses: 0 });
  const [approvedCities, setApprovedCities] = useState([]);

  // Filter & search state in Overview
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');

  // Selected bus for modal / editor / assignment
  const [selectedBus, setSelectedBus] = useState(null);
  const [showBusDetailsModal, setShowBusDetailsModal] = useState(false);
  const [showChangeRouteModal, setShowChangeRouteModal] = useState(false);

  // ── Register Bus Form State ──
  const [regForm, setRegForm] = useState({
    vehicleNumber: '',
    busName: '',
    busType: 'AC Sleeper',
    totalSeats: 40,
    lowerBerths: 20,
    upperBerths: 20,
    status: 'Available',
    amenities: ['AC', 'Charging point', 'Wi-Fi', 'GPS', 'Blanket', 'Pillow'],
    autoAssignRoute: true,
    originCity: 'Chennai',
    destCity: 'Vijayawada',
  });
  const [regError, setRegError] = useState('');
  const [regLoading, setRegLoading] = useState(false);

  // ── Route Assignment State ──
  const [assignBusId, setAssignBusId] = useState('');
  const [assignOrigin, setAssignOrigin] = useState('Chennai');
  const [assignDest, setAssignDest] = useState('Vijayawada');
  // Full location objects from OsmLocationSelector (includes lat/lng for any city)
  const [assignOriginCoords, setAssignOriginCoords] = useState(null);
  const [assignDestCoords, setAssignDestCoords] = useState(null);
  const [discoveredCorridors, setDiscoveredCorridors] = useState([]);
  const [selectedCorridorId, setSelectedCorridorId] = useState('');
  const [orderedCorridorStations, setOrderedCorridorStations] = useState([]);
  const [selectedStationIds, setSelectedStationIds] = useState([]);
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignError, setAssignError] = useState('');

  // ── Change Route Modal State (Module 6: Steps 2, 3, 4, 5) ──
  const [changeOrigin, setChangeOrigin] = useState('Chennai');
  const [changeDest, setChangeDest] = useState('Vijayawada');
  // Full location objects from OsmLocationSelector (includes lat/lng for any city)
  const [changeOriginCoords, setChangeOriginCoords] = useState(null);
  const [changeDestCoords, setChangeDestCoords] = useState(null);
  const [changeCorridors, setChangeCorridors] = useState([]);
  const [selectedChangeCorridorId, setSelectedChangeCorridorId] = useState('');
  const [changeOrderedStations, setChangeOrderedStations] = useState([]);
  const [selectedChangeStationIds, setSelectedChangeStationIds] = useState([]);
  const [changeEffectiveDate, setChangeEffectiveDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [changeLoading, setChangeLoading] = useState(false);
  const [changeConflicts, setChangeConflicts] = useState(null);
  const [changeError, setChangeError] = useState('');

  // ── Route / Destination Request Modal State ──
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedOsmItem, setSelectedOsmItem] = useState(null);
  const [modalOsmSearch, setModalOsmSearch] = useState('');
  const [modalOsmResults, setModalOsmResults] = useState([]);
  const [modalOsmLoading, setModalOsmLoading] = useState(false);
  const [requestTargetContext, setRequestTargetContext] = useState('assign');
  const [reqForm, setReqForm] = useState({
    cityName: '',
    state: 'Andhra Pradesh',
    osmId: '',
    osmType: 'node',
    displayName: '',
    locationType: 'city',
    latitude: null,
    longitude: null,
    hubType: 'Major District Headquarters',
    connectingRoutes: '',
    reason: 'Expanding high-frequency intercity passenger route network.',
  });
  const [reqLoading, setReqLoading] = useState(false);
  const [reqError, setReqError] = useState('');
  const [reqSuccess, setReqSuccess] = useState('');
  const modalDebounce = useRef(null);

  // ── Round-Trip (UP/DOWN) Scheduling State ──
  const [scheduleBusId, setScheduleBusId] = useState('');
  const [scheduleStartDate, setScheduleStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [scheduleEndDate, setScheduleEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const handleStartDateChange = (val) => {
    setScheduleStartDate(val);
    if (val) {
      const d = new Date(val);
      if (!isNaN(d.getTime())) {
        d.setDate(d.getDate() + 30);
        setScheduleEndDate(d.toISOString().split('T')[0]);
      }
    }
  };
  const [upDepTime, setUpDepTime] = useState('06:00');
  const [upArrTime, setUpArrTime] = useState('14:30');
  const [upDays, setUpDays] = useState(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']);
  const [downDepTime, setDownDepTime] = useState('20:00');
  const [downArrTime, setDownArrTime] = useState('04:30');
  const [downDays, setDownDays] = useState(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']);
  const [restHoursBuffer, setRestHoursBuffer] = useState('2');
  const [tripFare, setTripFare] = useState('650');
  const [scheduleError, setScheduleError] = useState('');
  const [scheduleSuccess, setScheduleSuccess] = useState('');
  const [scheduleLoading, setScheduleLoading] = useState(false);

  // Refresh fleet data
  const refreshFleet = () => {
    const list = getFleetBuses(providerId);
    setBuses(list);
    setStats(getFleetStats(providerId));
    setApprovedCities(getApprovedCities());
    getBackendFleetBuses(providerId).then((backendBuses) => {
      const merged = [...list];
      backendBuses.forEach((backendBus) => {
        const match = merged.findIndex((bus) =>
          bus.vehicleId === backendBus.vehicleId ||
          String(bus.vehicleNumber || bus.regNo || '').toUpperCase() === String(backendBus.vehicleNumber || '').toUpperCase()
        );
        if (match >= 0) merged[match] = { ...merged[match], ...backendBus };
        else merged.push(backendBus);
      });
      setBuses(merged);
      setStats({
        totalBuses: merged.length,
        assignedBuses: merged.filter((bus) => bus.status === 'Assigned' || bus.assignedRoute).length,
        availableBuses: merged.filter((bus) => bus.status === 'Available' && !bus.assignedRoute).length,
        maintenanceBuses: merged.filter((bus) => bus.status === 'Maintenance').length,
      });
    }).catch(() => {});
  };

  useEffect(() => {
    refreshFleet();
    window.addEventListener('storage', refreshFleet);
    window.addEventListener('c2b_sync', refreshFleet);
    window.addEventListener('focus', refreshFleet);
    return () => {
      window.removeEventListener('storage', refreshFleet);
      window.removeEventListener('c2b_sync', refreshFleet);
      window.removeEventListener('focus', refreshFleet);
    };
  }, [providerId]);

  // Filtered buses in Overview
  const filteredBuses = useMemo(() => {
    return buses.filter((b) => {
      const matchSearch =
        !searchQuery ||
        b.vehicleNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.busName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.assignedRoute?.originCity?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.assignedRoute?.destCity?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchStatus = statusFilter === 'ALL' || b.status === statusFilter;
      const matchType = typeFilter === 'ALL' || b.busType === typeFilter || b.vehicleType === typeFilter;

      return matchSearch && matchStatus && matchType;
    });
  }, [buses, searchQuery, statusFilter, typeFilter]);

  // Assigned buses list: Show all assigned buses regardless of minor status label differences
  const assignedBusesList = useMemo(() => {
    return buses.filter((b) => Boolean(b.assignedRoute || b.status === 'Assigned' || b.route));
  }, [buses]);

  // Selected bus for route assignment
  const currentAssignBus = useMemo(() => {
    return buses.find((b) => b.vehicleId === assignBusId || b.id === assignBusId) || null;
  }, [buses, assignBusId]);

  // Selected bus for round-trip scheduling
  const currentScheduleBus = useMemo(() => {
    return buses.find((b) => b.vehicleId === scheduleBusId || b.id === scheduleBusId) || null;
  }, [buses, scheduleBusId]);

  // When schedule bus changes, pre-populate if roundTripSchedule exists
  useEffect(() => {
    if (currentScheduleBus && currentScheduleBus.roundTripSchedule) {
      const rts = currentScheduleBus.roundTripSchedule;
      setUpDepTime(rts.upSchedule?.departureTime || '06:00');
      setUpArrTime(rts.upSchedule?.arrivalTime || '14:30');
      setUpDays(rts.upSchedule?.operatingDays || ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']);
      setDownDepTime(rts.downSchedule?.departureTime || '20:00');
      setDownArrTime(rts.downSchedule?.arrivalTime || '04:30');
      setDownDays(rts.downSchedule?.operatingDays || ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']);
      setTripFare(String(rts.fare || 650));
    }
  }, [currentScheduleBus]);

  // Route travel duration in minutes (derived from assigned corridor)
  const routeDurationMins = useMemo(() => {
    if (!currentScheduleBus?.assignedRoute?.durationEst) return 360;
    return parseDurationToMinutes(currentScheduleBus.assignedRoute.durationEst);
  }, [currentScheduleBus]);

  // Intermediate stations schedule timetable for UP Journey (Derived strictly from map progression)
  const upStationTimetable = useMemo(() => {
    const details = currentScheduleBus?.assignedRoute?.intermediateStopDetails || [];
    if (details.length === 0) return [];
    return computeStopScheduleTimes(details, upDepTime, routeDurationMins, false);
  }, [currentScheduleBus, upDepTime, routeDurationMins]);

  // Intermediate stations schedule timetable for DOWN Journey (Reversed Map Order)
  const downStationTimetable = useMemo(() => {
    const details = currentScheduleBus?.assignedRoute?.intermediateStopDetails || [];
    if (details.length === 0) return [];
    return computeStopScheduleTimes(details, downDepTime, routeDurationMins, true);
  }, [currentScheduleBus, downDepTime, routeDurationMins]);

  // Auto-compute UP Arrival Time when Departure Time changes
  const handleUpDepChange = (newDep) => {
    setUpDepTime(newDep);
    if (newDep) {
      const computed = computeArrivalTime(newDep, routeDurationMins, scheduleStartDate);
      if (computed?.arrTime) {
        setUpArrTime(computed.arrTime);
      }
    }
  };

  // Auto-compute DOWN Arrival Time when Departure Time changes
  const handleDownDepChange = (newDep) => {
    setDownDepTime(newDep);
    if (newDep) {
      const computed = computeArrivalTime(newDep, routeDurationMins, scheduleStartDate);
      if (computed?.arrTime) {
        setDownArrTime(computed.arrTime);
      }
    }
  };

  // Computed timeline previews (Date-to-Date and Arrival details)
  const upTimeline = useMemo(() => {
    if (!upDepTime) return null;
    return computeArrivalTime(upDepTime, routeDurationMins, scheduleStartDate);
  }, [upDepTime, routeDurationMins, scheduleStartDate]);

  const downTimeline = useMemo(() => {
    if (!downDepTime) return null;
    return computeArrivalTime(downDepTime, routeDurationMins, scheduleStartDate);
  }, [downDepTime, routeDurationMins, scheduleStartDate]);

  // Turnaround rest time calculation & 1 hr to 12 hrs validation
  const turnaroundInfo = useMemo(() => {
    if (!upArrTime || !downDepTime) {
      return { mins: 0, text: '—', isValid: true, error: '', origRestText: '—', origRestMins: 0 };
    }
    const [uh, um] = upArrTime.split(':').map(Number);
    const [dh, dm] = downDepTime.split(':').map(Number);
    let diff = (dh * 60 + dm) - (uh * 60 + um);
    if (diff < 0) diff += 24 * 60;
    const h = Math.floor(diff / 60);
    const m = diff % 60;

    // Strict validation: Rest must be between 1 hour (60 min) and 12 hours (720 min)
    let isValid = true;
    let error = '';
    if (diff < 60) {
      isValid = false;
      error = `Inadequate turnaround rest (${h}h ${m}m). Minimum 1 hour (60 min) rest is mandatory at destination before DOWN departure.`;
    } else if (diff > 720) {
      isValid = false;
      error = `Excessive idle rest (${h}h ${m}m). Continuous round-trip cycling requires turnaround within 12 hours.`;
    }

    // Origin turnaround rest between DOWN arrival and next UP departure
    let origRestText = '—';
    let origRestMins = 0;
    let origRestValid = true;
    if (downArrTime && upDepTime) {
      const [dah, dam] = downArrTime.split(':').map(Number);
      const [udh, udm] = upDepTime.split(':').map(Number);
      let origDiff = (udh * 60 + udm) - (dah * 60 + dam);
      if (origDiff < 0) origDiff += 24 * 60;
      origRestMins = origDiff;
      const oh = Math.floor(origDiff / 60);
      const om = origDiff % 60;
      origRestText = `${oh}h ${om}m`;
      origRestValid = origDiff >= 60;
    }

    return {
      mins: diff,
      text: `${h}h ${m}m`,
      isValid,
      error,
      origRestText,
      origRestMins,
      origRestValid,
    };
  }, [upArrTime, downDepTime, downArrTime, upDepTime]);

  // Apply selected rest duration (1 hr to 12 hrs) to compute DOWN departure
  const applyRestToDownDep = (hours = restHoursBuffer) => {
    if (!upArrTime) return;
    const [uh, um] = upArrTime.split(':').map(Number);
    const targetMins = (uh * 60 + um + Math.round(Number(hours) * 60)) % (24 * 60);
    const th = Math.floor(targetMins / 60);
    const tm = targetMins % 60;
    const newDownDep = `${String(th).padStart(2, '0')}:${String(tm).padStart(2, '0')}`;
    handleDownDepChange(newDownDep);
  };

  // Physical bus availability for UP journey across the week
  const availableUpDays = useMemo(() => {
    const allSchedules = JSON.parse(localStorage.getItem('c2b_bus_schedules') || '[]');
    const currentBusNumber = currentScheduleBus?.vehicleNumber;
    const busyDays = new Set();
    if (currentBusNumber) {
      allSchedules.forEach((s) => {
        if (s.vehicleNumber === currentBusNumber && s.corridorId && s.corridorId !== currentScheduleBus?.assignedRoute?.corridorId) {
          const d = new Date(s.journeyDate);
          if (!isNaN(d.getTime())) {
            busyDays.add(DAY_NAMES[d.getDay()]);
          }
        }
      });
    }
    return ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].filter((d) => !busyDays.has(d));
  }, [currentScheduleBus]);

  // Physical bus availability for DOWN journey (strictly locked to days when bus reaches destination and completes rest)
  const availableDownDays = useMemo(() => {
    if (!upDepTime || !upArrTime || !downDepTime || upDays.length === 0) {
      return ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
    }
    const [uh, um] = upArrTime.split(':').map(Number);
    const [dh, dm] = downDepTime.split(':').map(Number);
    // If DOWN departure clock time is earlier than UP arrival clock + 60m, DOWN departs on the following day
    const isDownNextDayAtDest = (dh * 60 + dm) < (uh * 60 + um) + 60;

    const validDays = new Set();
    upDays.forEach((uDay) => {
      const uIdx = DAY_TO_IDX[uDay];
      if (uIdx === undefined) return;
      let destArrIdx = upTimeline?.isNextDay ? (uIdx + 1) % 7 : uIdx;
      let downDepIdx = isDownNextDayAtDest ? (destArrIdx + 1) % 7 : destArrIdx;
      validDays.add(DAY_NAMES[downDepIdx]);
    });
    return Array.from(validDays);
  }, [upDays, upDepTime, upArrTime, downDepTime, upTimeline]);

  // Synchronize DOWN days with availableDownDays so locked days are automatically deselected
  useEffect(() => {
    if (availableDownDays.length > 0) {
      setDownDays((prev) => {
        const filtered = prev.filter((d) => availableDownDays.includes(d));
        return filtered.length > 0 ? filtered : [availableDownDays[0]];
      });
    }
  }, [availableDownDays]);

  // Strict validation for Tab 4 Permanent Route Assignment
  const assignRouteValidation = useMemo(() => {
    const errors = [];
    const cleanOrig = (assignOrigin || '').trim();
    const cleanDest = (assignDest || '').trim();

    if (!cleanOrig) errors.push('Origin City is required');
    if (!cleanDest) errors.push('Destination City is required');
    if (cleanOrig && cleanDest && cleanOrig.toLowerCase() === cleanDest.toLowerCase()) {
      errors.push('Origin and Destination cannot be the same city');
    }
    if (buses.length === 0) {
      errors.push('No registered bus available in fleet. Please register a bus first.');
    }
    const effectiveBusId = assignBusId || (buses.length > 0 ? (buses.find(b => !b.assignedRoute && b.status !== 'Maintenance') || buses[0])?.vehicleId || buses[0]?.id : '');
    if (!effectiveBusId && buses.length > 0) {
      errors.push('Please select a registered bus to assign');
    }
    const effectiveCorridorId = selectedCorridorId || (discoveredCorridors.length > 0 ? discoveredCorridors[0].corridorId : '');

    return {
      isValid: errors.length === 0 && Boolean(cleanOrig) && Boolean(cleanDest) && cleanOrig.toLowerCase() !== cleanDest.toLowerCase() && buses.length > 0,
      errors,
      effectiveBusId,
      effectiveCorridorId,
    };
  }, [assignOrigin, assignDest, discoveredCorridors, selectedCorridorId, buses, assignBusId]);

  // Quick 1-click corridor assignment handler
  const handleQuickAssign = async (bus, origin = 'Chennai', dest = 'Vijayawada') => {
    if (!bus) return;
    try {
      const corridors = await discoverRouteCorridors(origin, dest);
      const corr = (corridors && corridors[0]) || {
        corridorId: `CORR_${origin}_${dest}`,
        name: `${origin} ↔ ${dest} Corridor`,
        distance: 430,
        duration: '6h 30m',
      };
      const stops = getOrderedCorridorStations(corr, origin, dest, '06:00');
      await assignBusToRoute(bus.vehicleId, {
        originCity: origin,
        destCity: dest,
        corridorId: corr.corridorId,
        corridorName: corr.name,
        distanceKm: corr.distance || 430,
        durationEst: corr.duration || '6h 30m',
        intermediateStops: stops.map((s) => s.name),
        intermediateStopDetails: stops,
      });
      refreshFleet();
      try { window.dispatchEvent(new CustomEvent('c2b_sync', { detail: { type: 'FLEET_ASSIGNED', busId: bus.vehicleId } })); } catch {}
      try { window.dispatchEvent(new Event('storage')); } catch {}
      showToast(`Bus ${bus.vehicleNumber} successfully assigned to ${origin} ↔ ${dest}! Daily UP/DOWN schedules are now active in Manage Schedules.`, 'success');
      setSubTab('assigned-table');
    } catch (err) {
      showToast(err.message || 'Quick assignment failed.', 'error');
    }
  };

  // Strict validation for Modal 2 Change Route
  const changeRouteValidation = useMemo(() => {
    const errors = [];
    const cleanOrig = (changeOrigin || '').trim();
    const cleanDest = (changeDest || '').trim();
    const today = new Date().toISOString().split('T')[0];

    if (!cleanOrig) errors.push('New Origin City is required');
    if (!cleanDest) errors.push('New Destination City is required');
    if (cleanOrig && cleanDest && cleanOrig.toLowerCase() === cleanDest.toLowerCase()) {
      errors.push('Origin and Destination cannot be the same city');
    }
    if (changeCorridors.length === 0) {
      errors.push('No approved route corridors found between these locations');
    }
    if (!selectedChangeCorridorId && changeCorridors.length === 0) {
      errors.push('Please select a route corridor');
    }
    if (selectedChangeStationIds.length === 0 && changeOrderedStations.length === 0) {
      errors.push('At least one intermediate station halt must be selected');
    }
    if (!changeEffectiveDate) {
      errors.push('Effective transition date is required');
    } else if (changeEffectiveDate < today) {
      errors.push(`Effective transition date (${changeEffectiveDate}) cannot be in the past`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }, [changeOrigin, changeDest, changeCorridors, selectedChangeCorridorId, selectedChangeStationIds, changeOrderedStations, changeEffectiveDate]);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const curHHMM = useMemo(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }, []);

  /* ─────────────────────────────────────────────────────────────
     Delete Bus Handler (Permanently removes bus & persists across refresh)
     ───────────────────────────────────────────────────────────── */
  const handleDeleteBus = async (bus) => {
    if (!bus) return;

    const liveTrip = isBusInActiveTrip(bus.vehicleNumber);
    const activeBookings = checkBusActiveBookings(bus.vehicleNumber);

    let confirmMsg = `Are you sure you want to permanently delete bus "${bus.vehicleNumber}" (${bus.busName})?\n\nDeleting this bus will remove it permanently, clear its schedules, and it will not reappear after refresh.`;
    if (liveTrip || (activeBookings && activeBookings.length > 0)) {
      confirmMsg = `⚠️ Notice: Bus "${bus.vehicleNumber}" has active trips or bookings.\n\nAre you sure you want to delete this bus anyway? Deleting it will cancel its trips and bookings permanently.`;
    }

    if (!window.confirm(confirmMsg)) {
      return;
    }

    try {
      const bId = bus.vehicleId || bus.id || bus.vehicleNumber;
      await deleteBus(bId);
      refreshFleet();
      try { window.dispatchEvent(new CustomEvent('c2b_sync', { detail: { type: 'BUS_DELETED', busId: bId, vehicleNumber: bus.vehicleNumber } })); } catch {}
      try { window.dispatchEvent(new Event('storage')); } catch {}
      if (assignBusId === bus.vehicleId) setAssignBusId('');
      if (scheduleBusId === bus.vehicleId) setScheduleBusId('');
      if (showBusDetailsModal) setShowBusDetailsModal(false);
      showToast(`Bus ${bus.vehicleNumber} successfully deleted from your fleet.`, 'success');
    } catch (err) {
      showToast(err.message || 'Failed to delete bus.', 'error');
    }
  };

  /* ─────────────────────────────────────────────────────────────
     Clear All Buses Handler (Resets fleet to start completely fresh)
     ───────────────────────────────────────────────────────────── */
  const handleClearAllBuses = async () => {
    if (buses.length === 0) {
      showToast('No buses to clear. Fleet is already empty.', 'info');
      return;
    }

    const confirmMsg = `Are you sure you want to remove ALL ${buses.length} buses from your fleet?\n\nThis will clear all registered buses and schedules, allowing you to start completely fresh. This action cannot be undone.`;
    if (!window.confirm(confirmMsg)) return;

    try {
      await clearAllBuses(providerId);
      refreshFleet();
      setAssignBusId('');
      setScheduleBusId('');
      setShowBusDetailsModal(false);
      showToast('All buses cleared successfully. Fleet is now fresh and ready.', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to clear fleet.', 'error');
    }
  };

  /* ─────────────────────────────────────────────────────────────
     Unassign Route Handler (Removes corridor binding & deletes recurring schedules)
     ───────────────────────────────────────────────────────────── */
  const handleUnassignRoute = async (bus) => {
    if (!bus) return;
    const liveTrip = isBusInActiveTrip(bus.vehicleNumber);
    if (liveTrip) {
      showToast(
        `⛔ Cannot unassign bus ${bus.vehicleNumber}! It is currently running an active trip (${liveTrip.from} → ${liveTrip.to}).`,
        'error'
      );
      return;
    }

    const routeName = `${bus.assignedRoute?.originCity || bus.originCity || 'Origin'} ↔ ${bus.assignedRoute?.destCity || bus.destCity || 'Destination'}`;
    if (!window.confirm(`Are you sure you want to unassign bus "${bus.vehicleNumber}" (${bus.busName}) from route "${routeName}"?\n\nThis will remove its active corridor assignment and delete all its scheduled recurring trips.`)) {
      return;
    }

    try {
      await unassignBusRoute(bus.vehicleId);
      refreshFleet();
      try { window.dispatchEvent(new CustomEvent('c2b_sync', { detail: { type: 'ROUTE_UNASSIGNED', busId: bus.vehicleId } })); } catch {}
      try { window.dispatchEvent(new Event('storage')); } catch {}
      if (scheduleBusId === bus.vehicleId) setScheduleBusId('');
      if (showBusDetailsModal) setShowBusDetailsModal(false);
      showToast(`Bus ${bus.vehicleNumber} successfully unassigned from route. Schedules removed.`, 'success');
    } catch (err) {
      showToast(err.message || 'Failed to unassign route.', 'error');
    }
  };

  /* ─────────────────────────────────────────────────────────────
     MODULE 1: Register Bus Handler (Strict Indian Plate & Passenger Validation)
     ───────────────────────────────────────────────────────────── */
  const handleRegisterBusSubmit = async (e) => {
    e.preventDefault();
    setRegError('');

    // 1. Strict Indian Registration Number Plate Format Validation
    const plateCheck = validateVehicleNumberPlate(regForm.vehicleNumber);
    if (!plateCheck.valid) {
      setRegError(plateCheck.message);
      return;
    }

    // 2. Total Passenger Capacity Validation (Must be > 10 and < 80)
    const seatsNum = Number(regForm.totalSeats);
    if (isNaN(seatsNum) || seatsNum <= 10 || seatsNum >= 80) {
      setRegError(
        `Total passenger capacity must be more than 10 and less than 80 passengers (between 11 and 79 seats). Given: ${regForm.totalSeats}`
      );
      return;
    }

    const isSleeper =
      regForm.busType.toLowerCase().includes('sleeper') &&
      !regForm.busType.toLowerCase().includes('semi');
    const half = Math.ceil(seatsNum / 2);
    const lowerBerths = isSleeper ? half : 0;
    const upperBerths = isSleeper ? (seatsNum - half) : 0;

    const seatLayout = generateDefaultSeatLayout(regForm.busType, seatsNum);

    setRegLoading(true);
    try {
      const newBus = await registerNewBus({
        providerId,
        vehicleNumber: plateCheck.normalized,
        busName: regForm.busName || `${plateCheck.normalized} (${regForm.busType})`,
        busType: regForm.busType,
        vehicleType: regForm.busType,
        totalSeats: seatsNum,
        lowerBerths,
        upperBerths,
        amenities: regForm.amenities,
        status: regForm.status || 'Available',
        seatLayout,
      });

      // Immediate Route Assignment if selected (Default behavior)
      let wasAssigned = false;
      if (regForm.autoAssignRoute && regForm.originCity && regForm.destCity) {
        try {
          const corridors = await discoverRouteCorridors(regForm.originCity, regForm.destCity);
          const chosenCorr = (corridors && corridors[0]) || {
            corridorId: `CORR_${regForm.originCity}_${regForm.destCity}`,
            name: `${regForm.originCity} ↔ ${regForm.destCity} Corridor`,
            distance: 430,
            duration: '6h 30m',
          };
          const stops = getOrderedCorridorStations(chosenCorr, regForm.originCity, regForm.destCity, '06:00');
          await assignBusToRoute(newBus.vehicleId, {
            originCity: regForm.originCity,
            destCity: regForm.destCity,
            corridorId: chosenCorr.corridorId,
            corridorName: chosenCorr.name,
            distanceKm: chosenCorr.distance || 430,
            durationEst: chosenCorr.duration || '6h 30m',
            intermediateStops: stops.map((s) => s.name),
            intermediateStopDetails: stops,
          });
          wasAssigned = true;
        } catch (assignErr) {
          console.warn('Auto route assignment note:', assignErr);
        }
      }

      refreshFleet();
      try { window.dispatchEvent(new CustomEvent('c2b_sync', { detail: { type: 'BUS_REGISTERED', busId: newBus.vehicleId } })); } catch {}
      try { window.dispatchEvent(new Event('storage')); } catch {}

      if (wasAssigned) {
        showToast(`Bus ${newBus.vehicleNumber} registered & assigned to ${regForm.originCity} ↔ ${regForm.destCity}! UP & DOWN schedules are now active in Manage Schedules.`, 'success');
        setSubTab('assigned-table');
      } else {
        showToast(`Bus ${newBus.vehicleNumber} (${regForm.busType}) registered successfully!`, 'success');
        setSubTab('overview');
      }

      // Reset form
      setRegForm({
        vehicleNumber: '',
        busName: '',
        busType: 'AC Sleeper',
        totalSeats: 40,
        lowerBerths: 20,
        upperBerths: 20,
        status: 'Available',
        amenities: ['AC', 'Charging point', 'Wi-Fi', 'GPS', 'Blanket', 'Pillow'],
        autoAssignRoute: true,
        originCity: 'Chennai',
        destCity: 'Vijayawada',
      });
    } catch (err) {
      setRegError(err.message || 'Failed to register bus.');
    } finally {
      setRegLoading(false);
    }
  };

  /* ─────────────────────────────────────────────────────────────
     Route / Destination Request Handlers (Added from AddSchedule)
     Strict OpenStreetMap Locator & Non-editable Destination Name
     ───────────────────────────────────────────────────────────── */
  const handleOpenRequestModal = (prefillItem, context = 'assign') => {
    setRequestTargetContext(context);
    setSelectedOsmItem(prefillItem || null);
    const originCity = context === 'assign' ? assignOrigin : changeOrigin;
    setReqForm({
      cityName: prefillItem?.name || '',
      state: prefillItem?.state || 'Andhra Pradesh',
      osmId: prefillItem?.osmId || '',
      osmType: prefillItem?.osmType || 'node',
      displayName: prefillItem?.displayName || '',
      locationType: prefillItem?.locationType || 'city',
      latitude: prefillItem?.latitude || null,
      longitude: prefillItem?.longitude || null,
      hubType: prefillItem?.locationType === 'bus_stop' ? 'Commercial Transit Junction' : 'Major District Headquarters',
      connectingRoutes: originCity ? `${originCity} ↔ ${prefillItem?.name || ''}` : '',
      reason: 'Expanding high-frequency intercity passenger route network.',
    });
    setModalOsmSearch(prefillItem?.name || '');
    setModalOsmResults([]);
    setReqError('');
    setReqSuccess('');
    setShowRequestModal(true);
  };

  const handleModalSearchChange = (val) => {
    setModalOsmSearch(val);
    if (!val || val.trim().length < 2) {
      setModalOsmResults([]);
      return;
    }
    setModalOsmLoading(true);
    if (modalDebounce.current) clearTimeout(modalDebounce.current);
    modalDebounce.current = setTimeout(async () => {
      try {
        const results = await searchOsmLocations(val.trim());
        setModalOsmResults(results);
      } catch (err) {
        console.warn('Modal OSM search error:', err);
      } finally {
        setModalOsmLoading(false);
      }
    }, 400);
  };

  const handleSelectModalOsm = (item) => {
    setSelectedOsmItem(item);
    setModalOsmSearch(item.name);
    setModalOsmResults([]);
    const originCity = requestTargetContext === 'assign' ? assignOrigin : changeOrigin;
    setReqForm((prev) => ({
      ...prev,
      cityName: item.name,
      displayName: item.displayName,
      osmId: item.osmId,
      osmType: item.osmType || 'node',
      locationType: item.locationType || 'city',
      latitude: item.latitude,
      longitude: item.longitude,
      state: item.state || prev.state,
      address: item.address || {},
      hubType: item.locationType === 'bus_stop' ? 'Commercial Transit Junction' : 'Major District Headquarters',
      connectingRoutes: originCity ? `${originCity} ↔ ${item.name}` : prev.connectingRoutes,
    }));
  };

  const handleRaiseRequest = async (e) => {
    e.preventDefault();
    setReqError('');
    setReqSuccess('');

    const cleanCity = (reqForm.cityName || '').trim();
    if (!cleanCity) {
      setReqError('Please search and select a verified city, town, or bus stop from OpenStreetMap.');
      return;
    }

    if (!reqForm.osmId) {
      setReqError('OpenStreetMap validation required: Please select a location from the OSM suggestions below.');
      return;
    }

    setReqLoading(true);
    try {
      const created = await submitOsmLocationRequest({
        osmId: reqForm.osmId,
        osmType: reqForm.osmType || 'node',
        cityName: cleanCity,
        displayName: reqForm.displayName || `${cleanCity}, India`,
        locationType: reqForm.locationType || reqForm.hubType || 'city',
        latitude: reqForm.latitude,
        longitude: reqForm.longitude,
        state: reqForm.state,
        address: reqForm.address,
        hubType: reqForm.hubType,
        connectingRoutes: reqForm.connectingRoutes,
        reason: reqForm.reason,
      });

      refreshFleet();
      setReqSuccess(`✅ Request for "${cleanCity}" (OSM ID: ${reqForm.osmId}) submitted to Platform Admin.`);
      showToast(`Destination request for "${cleanCity}" submitted!`, 'info');

      // Auto-approve simulation so provider is unblocked
      try {
        if (created?.requestId) {
          approveDestinationRequest(created.requestId);
          refreshFleet();
        }
      } catch {}

      const coordsObj = {
        name: cleanCity,
        lat: reqForm.latitude,
        lng: reqForm.longitude,
        latitude: reqForm.latitude,
        longitude: reqForm.longitude,
      };

      if (requestTargetContext === 'assign') {
        setAssignDest(cleanCity);
        setAssignDestCoords(coordsObj);
        handleDiscoverCorridors(assignOrigin, cleanCity, assignOriginCoords, coordsObj);
      } else {
        setChangeDest(cleanCity);
        setChangeDestCoords(coordsObj);
        handleDiscoverChangeCorridors(changeOrigin, cleanCity, null, null, changeOriginCoords, coordsObj);
      }

      setTimeout(() => {
        setShowRequestModal(false);
        setReqSuccess('');
      }, 1000);
    } catch (err) {
      setReqError(err.message || 'Failed to submit destination request.');
    } finally {
      setReqLoading(false);
    }
  };

  /* ─────────────────────────────────────────────────────────────
     MODULE 3: Route Discovery & Permanent Assignment
     ───────────────────────────────────────────────────────────── */
  const handleDiscoverCorridors = async (srcOverride, dstOverride, srcCoordsOverride, dstCoordsOverride) => {
    const src = srcOverride || assignOrigin;
    const dst = dstOverride || assignDest;
    setAssignError('');
    if (!src || !dst) {
      setAssignError('Please select both Origin and Destination cities.');
      return;
    }
    if (src.toLowerCase() === dst.toLowerCase()) {
      setAssignError('Origin and Destination cannot be the same city.');
      return;
    }

    setAssignLoading(true);
    try {
      // Use actual lat/lng from OsmLocationSelector picker, then local DB, then let api.js geocode
      const srcCoords = srcCoordsOverride || assignOriginCoords || getCityCoords(src) || { name: src, lat: 13.0827, lng: 80.2707 };
      const dstCoords = dstCoordsOverride || assignDestCoords || getCityCoords(dst) || { name: dst, lat: 16.5062, lng: 80.6480 };

      const discovered = await discoverRouteCorridors(
        { name: src, lat: srcCoords.lat || srcCoords.latitude, lng: srcCoords.lng || srcCoords.longitude },
        { name: dst, lat: dstCoords.lat || dstCoords.latitude, lng: dstCoords.lng || dstCoords.longitude }
      );
      setDiscoveredCorridors(discovered);
      if (discovered.length > 0) {
        const first = discovered[0];
        setSelectedCorridorId(first.corridorId);
        const stops = getOrderedCorridorStations(first, src, dst, '06:00');
        setOrderedCorridorStations(stops);
        setSelectedStationIds(stops.map((s) => s.id));
      } else {
        setSelectedCorridorId('');
        setOrderedCorridorStations([]);
        setSelectedStationIds([]);
        setAssignError('No route corridors discovered between these cities.');
      }
    } catch (err) {
      setAssignError(err.message || 'Failed to discover route corridors.');
    } finally {
      setAssignLoading(false);
    }
  };

  // Automatically discover route corridors and intermediate stations whenever Origin or Destination changes
  useEffect(() => {
    if (assignOrigin && assignDest && assignOrigin.trim().toLowerCase() !== assignDest.trim().toLowerCase()) {
      handleDiscoverCorridors(assignOrigin, assignDest);
    }
  }, [assignOrigin, assignDest]);

  // Automatically pre-select first registered bus if none selected
  useEffect(() => {
    if (!assignBusId && buses.length > 0) {
      const unassigned = buses.find((b) => !b.assignedRoute && b.status !== 'Maintenance');
      const chosen = unassigned ? (unassigned.vehicleId || unassigned.id) : (buses[0].vehicleId || buses[0].id);
      if (chosen) setAssignBusId(chosen);
    }
  }, [buses, assignBusId]);

  const handleSelectCorridor = (corrId) => {
    setSelectedCorridorId(corrId);
    const corr = discoveredCorridors.find((c) => c.corridorId === corrId);
    if (corr) {
      const stops = getOrderedCorridorStations(corr, assignOrigin, assignDest, '06:00');
      setOrderedCorridorStations(stops);
      setSelectedStationIds(stops.map((s) => s.id));
    } else {
      setOrderedCorridorStations([]);
      setSelectedStationIds([]);
    }
  };

  const handleToggleStation = (stationId) => {
    setSelectedStationIds((prev) =>
      prev.includes(stationId) ? prev.filter((id) => id !== stationId) : [...prev, stationId]
    );
  };

  const handleSelectAllStations = () => {
    setSelectedStationIds(orderedCorridorStations.map((s) => s.id));
  };

  const handleSelectTerminalsOnly = () => {
    const ids = orderedCorridorStations.filter((s) => s.type === 'TERMINAL').map((s) => s.id);
    setSelectedStationIds(ids.length > 0 ? ids : orderedCorridorStations.map((s) => s.id));
  };

  const handleClearAllStations = () => {
    setSelectedStationIds([]);
  };

  const handleConfirmPermanentAssignment = async () => {
    setAssignError('');
    if (!assignRouteValidation.isValid) {
      setAssignError(`Cannot confirm route assignment: ${assignRouteValidation.errors.join('; ')}`);
      return;
    }
    let busToAssign = assignBusId;
    if (!busToAssign && buses.length > 0) {
      const unassigned = buses.find((b) => !b.assignedRoute && b.status !== 'Maintenance');
      busToAssign = unassigned ? (unassigned.vehicleId || unassigned.id) : (buses[0].vehicleId || buses[0].id);
      if (busToAssign) setAssignBusId(busToAssign);
    }
    if (!busToAssign) {
      setAssignError('Please select or register a bus to assign.');
      return;
    }

    let corrId = selectedCorridorId;
    if (!corrId && discoveredCorridors.length > 0) {
      corrId = discoveredCorridors[0].corridorId;
      setSelectedCorridorId(corrId);
    }
    if (!corrId) {
      setAssignError('Please select an approved route corridor.');
      return;
    }

    const corridor = discoveredCorridors.find((c) => c.corridorId === corrId) || discoveredCorridors[0];
    if (!corridor) {
      setAssignError('Selected corridor not found.');
      return;
    }

    let assignedStops = orderedCorridorStations.filter((s) => selectedStationIds.includes(s.id));
    if (assignedStops.length === 0 && orderedCorridorStations.length > 0) {
      assignedStops = orderedCorridorStations;
      setSelectedStationIds(orderedCorridorStations.map((s) => s.id));
    }

    setAssignLoading(true);
    try {
      await assignBusToRoute(busToAssign, {
        originCity: assignOrigin,
        destCity: assignDest,
        corridorId: corridor.corridorId,
        corridorName: corridor.name,
        distanceKm: corridor.distance,
        durationEst: corridor.duration,
        intermediateStops: assignedStops.map((s) => s.name),
        intermediateStopDetails: assignedStops,
      });

      refreshFleet();
      try { window.dispatchEvent(new CustomEvent('c2b_sync', { detail: { type: 'FLEET_ASSIGNED', busId: busToAssign } })); } catch {}
      try { window.dispatchEvent(new Event('storage')); } catch {}
      setScheduleBusId(busToAssign);
      const targetBus = buses.find((b) => (b.vehicleId || b.id) === busToAssign);
      showToast(`Bus ${targetBus?.vehicleNumber || ''} permanently assigned to ${assignOrigin} ↔ ${assignDest} with ${assignedStops.length} intermediate stations!`, 'success');
      setSubTab('assigned-table');
    } catch (err) {
      setAssignError(err.message || 'Failed to assign bus to route.');
    } finally {
      setAssignLoading(false);
    }
  };

  /* ─────────────────────────────────────────────────────────────
     MODULE 4 & 5: Save Round-Trip Schedules (UP and DOWN)
     ───────────────────────────────────────────────────────────── */
  const handleSaveRoundTripSchedules = async () => {
    setScheduleError('');
    setScheduleSuccess('');

    if (!scheduleBusId) {
      setScheduleError('Please select an assigned bus.');
      return;
    }
    if (!currentScheduleBus?.assignedRoute) {
      setScheduleError('Selected bus does not have an active permanent route assignment. Assign route first.');
      return;
    }
    if (!upDepTime || !upArrTime) {
      setScheduleError('Please enter valid UP journey departure and arrival times.');
      return;
    }
    if (!downDepTime || !downArrTime) {
      setScheduleError('Please enter valid DOWN journey departure and arrival times.');
      return;
    }

    // Validate that buses cannot run in the past or present time
    const todayStr = new Date().toISOString().split('T')[0];
    const now = new Date();
    const curHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    if (scheduleStartDate < todayStr) {
      setScheduleError(`Schedule start date (${scheduleStartDate}) cannot be in the past.`);
      return;
    }
    if (scheduleStartDate === todayStr) {
      if (upDepTime <= curHHMM) {
        showToast(`Notice: UP departure (${upDepTime}) is earlier than current clock (${curHHMM}) for today. Journey will be active in Confirm Trips.`, 'info');
      }
      if (downDepTime <= curHHMM) {
        showToast(`Notice: DOWN departure (${downDepTime}) is earlier than current clock (${curHHMM}) for today.`, 'info');
      }
    }

    if (!turnaroundInfo.isValid) {
      setScheduleError(turnaroundInfo.error || `Warning: Turnaround rest time must be between 1 hour and 12 hours.`);
      return;
    }

    setScheduleLoading(true);
    try {
      const intermediateList = currentScheduleBus.assignedRoute.intermediateStops || [];
      const intermediateDetails = currentScheduleBus.assignedRoute.intermediateStopDetails || [];
      const allSevenDays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

      await saveRoundTripSchedules(scheduleBusId, {
        upSchedule: {
          departureTime: upDepTime,
          arrivalTime: upArrTime,
          operatingDays: allSevenDays,
          intermediateStops: intermediateList.map((stop) => ({ stopName: stop })),
          intermediateStopDetails: upStationTimetable,
        },
        downSchedule: {
          departureTime: downDepTime,
          arrivalTime: downArrTime,
          operatingDays: allSevenDays,
          // Reverses intermediate stops automatically for DOWN journey
          intermediateStops: [...intermediateList].reverse().map((stop) => ({ stopName: stop })),
          intermediateStopDetails: downStationTimetable,
        },
        fare: Number(tripFare) || 650,
        validFrom: scheduleStartDate,
        validUntil: scheduleEndDate,
      });

      refreshFleet();
      try { window.dispatchEvent(new CustomEvent('c2b_sync', { detail: { type: 'SCHEDULES_SAVED', busId: scheduleBusId } })); } catch {}
      try { window.dispatchEvent(new Event('storage')); } catch {}
      setScheduleSuccess(
        `✅ UP and DOWN round-trip schedules saved for ${currentScheduleBus.vehicleNumber} (Operating window: ${scheduleStartDate} to ${scheduleEndDate})! Recurring schedules generated.`
      );
      showToast('Round-trip schedules published successfully!', 'success');
    } catch (err) {
      setScheduleError(err.message || 'Failed to save round-trip schedules.');
    } finally {
      setScheduleLoading(false);
    }
  };

  /* ─────────────────────────────────────────────────────────────
     MODULE 6: Change Route Assignment Handlers (Steps 2, 3, 4, 5)
     ───────────────────────────────────────────────────────────── */
  const handleOpenChangeRoute = (bus) => {
    setSelectedBus(bus);
    setChangeError('');
    setChangeConflicts(null);
    const orig = bus.assignedRoute?.originCity || 'Chennai';
    const dest = bus.assignedRoute?.destCity || 'Vijayawada';
    setChangeOrigin(orig);
    setChangeDest(dest);
    setChangeEffectiveDate(new Date().toISOString().split('T')[0]);
    setShowChangeRouteModal(true);
    handleDiscoverChangeCorridors(orig, dest, bus.assignedRoute?.corridorId, bus.assignedRoute?.intermediateStops);
  };

  const handleDiscoverChangeCorridors = async (srcOverride, dstOverride, preferredCorridorId, existingStops, srcCoordsOverride, dstCoordsOverride) => {
    const src = srcOverride || changeOrigin;
    const dst = dstOverride || changeDest;
    setChangeError('');
    if (!src || !dst) return;
    if (src.toLowerCase() === dst.toLowerCase()) {
      setChangeError('Origin and Destination cannot be the same city.');
      return;
    }

    setChangeLoading(true);
    try {
      const srcCoords = srcCoordsOverride || changeOriginCoords || getCityCoords(src) || { name: src, lat: 13.0827, lng: 80.2707 };
      const dstCoords = dstCoordsOverride || changeDestCoords || getCityCoords(dst) || { name: dst, lat: 16.5062, lng: 80.6480 };

      const discovered = await discoverRouteCorridors(
        { name: src, lat: srcCoords.lat || srcCoords.latitude, lng: srcCoords.lng || srcCoords.longitude },
        { name: dst, lat: dstCoords.lat || dstCoords.latitude, lng: dstCoords.lng || dstCoords.longitude }
      );
      setChangeCorridors(discovered);

      if (discovered.length > 0) {
        const activeCorr = (preferredCorridorId && discovered.find((c) => c.corridorId === preferredCorridorId)) || discovered[0];
        setSelectedChangeCorridorId(activeCorr.corridorId);
        const stops = getOrderedCorridorStations(activeCorr, src, dst, '06:00');
        setChangeOrderedStations(stops);
        if (existingStops && existingStops.length > 0) {
          const matchedIds = stops
            .filter((s) => existingStops.some((es) => es.toLowerCase() === s.name.toLowerCase() || s.name.toLowerCase().includes(es.toLowerCase())))
            .map((s) => s.id);
          setSelectedChangeStationIds(matchedIds.length > 0 ? matchedIds : stops.map((s) => s.id));
        } else {
          setSelectedChangeStationIds(stops.map((s) => s.id));
        }
      } else {
        setSelectedChangeCorridorId('');
        setChangeOrderedStations([]);
        setSelectedChangeStationIds([]);
        setChangeError('No route corridors discovered between these cities.');
      }
    } catch (err) {
      setChangeError(err.message || 'Failed to discover route corridors.');
    } finally {
      setChangeLoading(false);
    }
  };

  const handleSelectChangeCorridor = (corrId) => {
    setSelectedChangeCorridorId(corrId);
    const corr = changeCorridors.find((c) => c.corridorId === corrId);
    if (corr) {
      const stops = getOrderedCorridorStations(corr, changeOrigin, changeDest, '06:00');
      setChangeOrderedStations(stops);
      setSelectedChangeStationIds(stops.map((s) => s.id));
    } else {
      setChangeOrderedStations([]);
      setSelectedChangeStationIds([]);
    }
  };

  const handleToggleChangeStation = (stationId) => {
    setSelectedChangeStationIds((prev) =>
      prev.includes(stationId) ? prev.filter((id) => id !== stationId) : [...prev, stationId]
    );
  };

  const handleSelectAllChangeStations = () => {
    setSelectedChangeStationIds(changeOrderedStations.map((s) => s.id));
  };

  const handleSelectTerminalsOnlyChangeStations = () => {
    const ids = changeOrderedStations.filter((s) => s.type === 'TERMINAL').map((s) => s.id);
    setSelectedChangeStationIds(ids.length > 0 ? ids : changeOrderedStations.map((s) => s.id));
  };

  const handleClearAllChangeStations = () => {
    setSelectedChangeStationIds([]);
  };

  const handleConfirmChangeRoute = async (forceConfirm = false) => {
    setChangeError('');
    if (!changeRouteValidation.isValid) {
      setChangeError(`Cannot confirm route reassignment: ${changeRouteValidation.errors.join('; ')}`);
      return;
    }
    if (!selectedBus) return;

    let corr = changeCorridors.find((c) => c.corridorId === selectedChangeCorridorId);
    if (!corr && changeCorridors.length > 0) {
      corr = changeCorridors[0];
    }
    if (!corr) {
      setChangeError('Please select an approved route corridor.');
      return;
    }

    let assignedStops = changeOrderedStations.filter((s) => selectedChangeStationIds.includes(s.id));
    if (assignedStops.length === 0 && changeOrderedStations.length > 0) {
      assignedStops = changeOrderedStations;
    }

    const payload = {
      originCity: changeOrigin,
      destCity: changeDest,
      corridorId: corr.corridorId,
      corridorName: corr.name,
      distanceKm: corr.distance,
      durationEst: corr.duration,
      intermediateStops: assignedStops.map((s) => s.name),
      intermediateStopDetails: assignedStops,
      effectiveDate: changeEffectiveDate || new Date().toISOString().split('T')[0],
    };

    try {
      const result = await changeBusRoute(
        selectedBus.vehicleId,
        payload,
        { forceConfirm }
      );

      if (!result.success && result.hasConflicts) {
        setChangeConflicts(result);
        return;
      }

      refreshFleet();
      try { window.dispatchEvent(new CustomEvent('c2b_sync', { detail: { type: 'ROUTE_CHANGED', busId: selectedBus.vehicleId } })); } catch {}
      try { window.dispatchEvent(new Event('storage')); } catch {}
      setShowChangeRouteModal(false);
      showToast(`Route for ${selectedBus.vehicleNumber} successfully updated to ${changeOrigin} ↔ ${changeDest} with ${assignedStops.length} intermediate stops!`, 'success');
    } catch (err) {
      setChangeError(err.message || 'Failed to update route assignment.');
    }
  };

  /* ── Toggle Maintenance Status ── */
  const handleToggleMaintenance = async (bus) => {
    const nextStatus = bus.status === 'Maintenance' ? 'Available' : 'Maintenance';
    try {
      await updateBusStatus(bus.vehicleId, nextStatus);
      refreshFleet();
      try { window.dispatchEvent(new CustomEvent('c2b_sync', { detail: { type: 'STATUS_UPDATED', busId: bus.vehicleId } })); } catch {}
      try { window.dispatchEvent(new Event('storage')); } catch {}
      showToast(`Bus ${bus.vehicleNumber} status updated to ${nextStatus}.`, 'info');
    } catch (err) {
      showToast(err.message || 'Status update failed', 'error');
    }
  };

  return (
    <div style={{ maxWidth: 1040, margin: '0 auto' }}>
      {/* ── Page Header ── */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: '1.25rem' }}>
        <div>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>
            🚌 Bus Fleet &amp; Permanent Route Management
          </h3>
          <p style={{ margin: 0, fontSize: '0.86rem', color: '#64748b' }}>
            Register buses, configure dynamic seat layouts, assign permanent route corridors, and manage UP/DOWN round-trip schedules.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          {buses.length > 0 && (
            <button
              type="button"
              className="btn btn-outline"
              onClick={handleClearAllBuses}
              style={{
                padding: '8px 14px',
                fontWeight: 700,
                fontSize: '0.84rem',
                color: '#dc2626',
                borderColor: '#fca5a5',
                background: '#fff5f5',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
              title="Clear all buses from fleet to start fresh"
            >
              🧹 Clear Fleet / Start Fresh
            </button>
          )}
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setSubTab('register')}
            style={{ padding: '8px 16px', fontWeight: 700, fontSize: '0.84rem', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            ➕ Register New Bus
          </button>
        </div>
      </div>

      {/* ── Sub-navigation Tabs (Modules 1 to 7) ── */}
      <div
        style={{
          display: 'flex',
          background: '#ffffff',
          borderRadius: 10,
          border: '1px solid #e2e8f0',
          padding: '4px',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          gap: 4,
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}
      >
        {[
          { id: 'overview', label: `🚍 Fleet Overview (${buses.length})` },
          { id: 'register', label: '➕ Register Bus & Layout' },
          { id: 'assigned-table', label: `📋 Assigned Buses (${assignedBusesList.length})` },
          { id: 'assign-route', label: '🛣️ Assign Route Corridor' },
          { id: 'roundtrip-schedule', label: '🔄 Round-Trip Scheduling (UP/DOWN)' },
        ].map((tab) => {
          const isActive = subTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setSubTab(tab.id);
                if (tab.id === 'roundtrip-schedule' && !scheduleBusId && assignedBusesList.length > 0) {
                  setScheduleBusId(assignedBusesList[0].vehicleId);
                }
              }}
              style={{
                background: isActive ? '#2563eb' : 'transparent',
                color: isActive ? '#ffffff' : '#475569',
                border: 'none',
                borderRadius: 7,
                padding: '8px 14px',
                fontSize: '0.82rem',
                fontWeight: isActive ? 700 : 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ─────────────────────────────────────────────────────────────
         TAB 1: FLEET OVERVIEW (Module 7A)
         ───────────────────────────────────────────────────────────── */}
      {subTab === 'overview' && (
        <div>
          {/* KPI Stat Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '1.5rem' }}>
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '14px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Total Registered Buses</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0f172a', marginTop: 4 }}>{stats.totalBuses}</div>
              <div style={{ fontSize: '0.7rem', color: '#10b981', marginTop: 2 }}>Owned by {provider?.name || 'Operator'}</div>
            </div>

            <div style={{ background: '#ffffff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '14px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div style={{ fontSize: '0.74rem', color: '#1e40af', fontWeight: 700, textTransform: 'uppercase' }}>Assigned to Routes</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#2563eb', marginTop: 4 }}>{stats.assignedBuses}</div>
              <div style={{ fontSize: '0.7rem', color: '#3b82f6', marginTop: 2 }}>Permanent route active</div>
            </div>

            <div style={{ background: '#ffffff', border: '1px solid #bbf7d0', borderRadius: 10, padding: '14px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div style={{ fontSize: '0.74rem', color: '#166534', fontWeight: 700, textTransform: 'uppercase' }}>Available for Route</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#16a34a', marginTop: 4 }}>{stats.availableBuses}</div>
              <div style={{ fontSize: '0.7rem', color: '#15803d', marginTop: 2 }}>Ready for assignment</div>
            </div>

            <div style={{ background: '#ffffff', border: '1px solid #fde68a', borderRadius: 10, padding: '14px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div style={{ fontSize: '0.74rem', color: '#b45309', fontWeight: 700, textTransform: 'uppercase' }}>Under Maintenance</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#d97706', marginTop: 4 }}>{stats.maintenanceBuses}</div>
              <div style={{ fontSize: '0.7rem', color: '#92400e', marginTop: 2 }}>Service depot</div>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: 10,
              padding: '12px 16px',
              marginBottom: '1.25rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 10,
            }}
          >
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flex: 1, minWidth: 260 }}>
              <input
                type="text"
                placeholder="Search by registration number, bus name, city..."
                className="form-control"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ fontSize: '0.82rem', padding: '7px 12px' }}
              />
            </div>

            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <select
                className="form-control"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ fontSize: '0.82rem', padding: '6px 10px', width: 'auto' }}
              >
                <option value="ALL">All Statuses</option>
                <option value="Available">Available</option>
                <option value="Assigned">Assigned</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Inactive">Inactive</option>
              </select>

              <select
                className="form-control"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                style={{ fontSize: '0.82rem', padding: '6px 10px', width: 'auto' }}
              >
                <option value="ALL">All Bus Types</option>
                {BUS_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>

              {(searchQuery || statusFilter !== 'ALL' || typeFilter !== 'ALL') && (
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('ALL');
                    setTypeFilter('ALL');
                  }}
                  style={{ fontSize: '0.76rem', padding: '6px 10px' }}
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Grid of Registered Buses */}
          {filteredBuses.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 16px', background: '#ffffff', borderRadius: 10, border: '1px dashed #cbd5e1' }}>
              <div style={{ fontSize: '2.4rem', marginBottom: 8 }}>🚍</div>
              <h4 style={{ margin: '0 0 6px', color: '#1e293b' }}>
                {buses.length === 0 ? 'No buses registered in your fleet yet' : 'No buses match your filter criteria'}
              </h4>
              <p style={{ margin: 0, fontSize: '0.84rem', color: '#64748b' }}>
                {buses.length === 0
                  ? 'Your fleet is currently clean and empty. Click "Register New Bus" to add your physical coach and configure its dynamic seat layout.'
                  : 'Try adjusting your search query or status filter.'}
              </p>
              {buses.length === 0 && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setSubTab('register')}
                  style={{ marginTop: 14, padding: '8px 20px', fontWeight: 700, fontSize: '0.84rem' }}
                >
                  ➕ Register New Bus
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '14px' }}>
              {filteredBuses.map((bus) => {
                const isAssigned = bus.status === 'Assigned' || bus.assignedRoute;
                const isMaint = bus.status === 'Maintenance';

                return (
                  <div
                    key={bus.vehicleId || bus.vehicleNumber}
                    style={{
                      background: '#ffffff',
                      border: isAssigned ? '1.5px solid #bfdbfe' : isMaint ? '1.5px solid #fde68a' : '1px solid #e2e8f0',
                      borderRadius: 10,
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div>
                      {/* Top Row: Reg number & Status badge */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <span style={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a' }}>
                          {bus.vehicleNumber}
                        </span>
                        <span
                          style={{
                            background: isAssigned ? '#eff6ff' : isMaint ? '#fef3c7' : '#f0fdf4',
                            color: isAssigned ? '#1d4ed8' : isMaint ? '#b45309' : '#15803d',
                            border: `1px solid ${isAssigned ? '#bfdbfe' : isMaint ? '#fde68a' : '#bbf7d0'}`,
                            padding: '2px 8px',
                            borderRadius: 12,
                            fontSize: '0.7rem',
                            fontWeight: 700,
                          }}
                        >
                          {bus.status || 'Available'}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                        {bus.busName}
                      </div>

                      <div style={{ fontSize: '0.76rem', color: '#64748b', marginBottom: 8 }}>
                        🚌 <strong>{bus.busType || bus.vehicleType}</strong> &bull; 💺 <strong>{bus.totalSeats} Total Seats</strong>
                        {bus.lowerBerths > 0 && ` (${bus.lowerBerths}L / ${bus.upperBerths}U berths)`}
                      </div>

                      {/* Assigned Route Banner */}
                      {bus.assignedRoute ? (
                        <div
                          style={{
                            background: '#eff6ff',
                            border: '1px solid #bfdbfe',
                            borderRadius: 6,
                            padding: '8px 10px',
                            marginBottom: 10,
                            fontSize: '0.76rem',
                          }}
                        >
                          <div style={{ fontWeight: 700, color: '#1e40af', marginBottom: 2 }}>
                            🛣️ Route: {bus.assignedRoute.originCity} ↔ {bus.assignedRoute.destCity}
                          </div>
                          <div style={{ color: '#475569', fontSize: '0.7rem' }}>
                            {bus.assignedRoute.corridorName} &bull; {bus.assignedRoute.distanceKm} km &bull; ⏱️ Est. {bus.assignedRoute.durationEst || '6h 30m'}
                          </div>
                          {bus.roundTripSchedule && (
                            <div style={{ color: '#16a34a', fontWeight: 600, fontSize: '0.7rem', marginTop: 2 }}>
                              UP: {bus.roundTripSchedule.upSchedule?.departureTime} &bull; DOWN: {bus.roundTripSchedule.downSchedule?.departureTime}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div
                          style={{
                            background: '#f8fafc',
                            border: '1px dashed #cbd5e1',
                            borderRadius: 6,
                            padding: '6px 10px',
                            marginBottom: 10,
                            fontSize: '0.72rem',
                            color: '#94a3b8',
                          }}
                        >
                          No active route assigned. Click &ldquo;Assign Route&rdquo; to bind to a permanent corridor.
                        </div>
                      )}

                      {/* Amenities chips */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
                        {(bus.amenities || []).slice(0, 4).map((am) => (
                          <span
                            key={am}
                            style={{
                              background: '#f1f5f9',
                              color: '#475569',
                              fontSize: '0.66rem',
                              padding: '2px 6px',
                              borderRadius: 4,
                            }}
                          >
                            {am}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', paddingTop: 10, borderTop: '1px solid #f1f5f9' }}>
                      <button
                        type="button"
                        className="btn btn-outline"
                        onClick={() => {
                          setSelectedBus(bus);
                          setShowBusDetailsModal(true);
                        }}
                        style={{ padding: '4px 10px', fontSize: '0.74rem' }}
                      >
                        🔍 Details
                      </button>

                      {bus.assignedRoute ? (
                        <>
                          <button
                            type="button"
                            className="btn btn-outline"
                            onClick={() => handleOpenChangeRoute(bus)}
                            style={{ padding: '4px 10px', fontSize: '0.74rem', color: '#d97706', borderColor: '#fde68a' }}
                          >
                            🔄 Change Route
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline"
                            onClick={() => {
                              setScheduleBusId(bus.vehicleId);
                              setSubTab('roundtrip-schedule');
                            }}
                            style={{ padding: '4px 10px', fontSize: '0.74rem', color: '#2563eb', borderColor: '#bfdbfe' }}
                          >
                            ⏱️ Schedules
                          </button>
                          {onNavigate && (
                            <>
                              <button
                                type="button"
                                className="btn btn-outline"
                                onClick={() => onNavigate('manage-schedules')}
                                style={{ padding: '4px 10px', fontSize: '0.74rem', color: '#0369a1', borderColor: '#bae6fd', background: '#f0f9ff' }}
                                title="Open UP/DOWN active daily schedules in Manage Schedules"
                              >
                                📅 Manage Schedules
                              </button>
                              <button
                                type="button"
                                className="btn btn-outline"
                                onClick={() => onNavigate('seat-management')}
                                style={{ padding: '4px 10px', fontSize: '0.74rem', color: '#0f766e', borderColor: '#99f6e4', background: '#f0fdfa' }}
                                title="View real-time seat occupancy and passenger charts in Seat Management"
                              >
                                💺 View Seats
                              </button>
                              <button
                                type="button"
                                className="btn btn-outline"
                                onClick={() => onNavigate('confirm-trips')}
                                style={{ padding: '4px 10px', fontSize: '0.74rem', color: '#4338ca', borderColor: '#c7d2fe', background: '#eef2ff' }}
                                title="View dispatch status and confirmed trips in Confirm Trips"
                              >
                                🏁 Confirm Trips
                              </button>
                            </>
                          )}
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            className="btn btn-primary"
                            onClick={() => {
                              setAssignBusId(bus.vehicleId);
                              setSubTab('assign-route');
                            }}
                            style={{ padding: '4px 12px', fontSize: '0.74rem' }}
                          >
                            🛣️ Assign Route
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline"
                            onClick={() => handleQuickAssign(bus, 'Chennai', 'Vijayawada')}
                            style={{ padding: '4px 10px', fontSize: '0.74rem', color: '#16a34a', borderColor: '#86efac', background: '#f0fdf4' }}
                            title="Quick assign to Chennai ↔ Vijayawada Corridor and start schedules"
                          >
                            ⚡ Quick Assign
                          </button>
                        </>
                      )}

                      <button
                        type="button"
                        className="btn btn-outline"
                        onClick={() => handleToggleMaintenance(bus)}
                        style={{
                          padding: '4px 8px',
                          fontSize: '0.72rem',
                          color: isMaint ? '#16a34a' : '#64748b',
                          marginLeft: 'auto',
                        }}
                        title={isMaint ? 'Mark as Available' : 'Mark for Maintenance'}
                      >
                        {isMaint ? '🔧 Re-activate' : '🔧 Maint'}
                      </button>

                      <button
                        type="button"
                        className="btn btn-outline"
                        onClick={() => handleDeleteBus(bus)}
                        style={{
                          padding: '4px 8px',
                          fontSize: '0.72rem',
                          color: '#dc2626',
                          borderColor: '#fca5a5',
                          background: '#fff5f5',
                        }}
                        title="Delete bus from fleet (Blocked if bus is in trip or has bookings)"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
         TAB 2: REGISTER BUS & DYNAMIC SEAT LAYOUT (Module 1 & 2)
         ───────────────────────────────────────────────────────────── */}
      {subTab === 'register' && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header" style={{ padding: '14px 18px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
            <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
              Register New Bus &amp; Configure Dynamic Seat Layout
            </h4>
            <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#64748b' }}>
              Register your physical coach with official vehicle plate validation, certified passenger capacity, and authentic seat layout.
            </p>
          </div>

          <div className="card-body" style={{ padding: '18px' }}>
            {regError && <div className="alert alert-error" style={{ marginBottom: 12 }}>⚠️ {regError}</div>}

            <form onSubmit={handleRegisterBusSubmit}>
              {/* Form Row: Reg Number & Bus Display Name */}
              <div className="form-row" style={{ marginBottom: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">
                    Bus Registration Number * (Indian Transport Plate Format)
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. AP 27 AB 1234 or TS 08 XY 9012"
                    value={regForm.vehicleNumber}
                    onChange={(e) => {
                      setRegForm({ ...regForm, vehicleNumber: e.target.value.toUpperCase() });
                      setRegError('');
                    }}
                    onBlur={(e) => {
                      const res = validateVehicleNumberPlate(e.target.value);
                      if (res.valid) {
                        setRegForm((prev) => ({ ...prev, vehicleNumber: res.normalized }));
                      }
                    }}
                    required
                  />
                  <span className="form-hint" style={{ color: '#0369a1', fontWeight: 600 }}>
                    * Format: State (2 letters) + RTO (1-2 digits) + Series (1-3 letters) + 4 digits (e.g. AP 27 AB 1234 or TS 08 XY 9012). Only official plate format allowed.
                  </span>
                </div>

                <div className="form-group">
                  <label className="form-label">Bus Display Name / Coach Label</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Garuda Plus Multi-Axle, Star Sleeper"
                    value={regForm.busName}
                    onChange={(e) => setRegForm({ ...regForm, busName: e.target.value })}
                  />
                </div>
              </div>

              {/* Form Row: Bus Type & Capacity */}
              <div className="form-row" style={{ marginBottom: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Bus Type / Vehicle Class *</label>
                  <select
                    className="form-control"
                    value={regForm.busType}
                    onChange={(e) => {
                      const t = e.target.value;
                      const isSleeper = t.toLowerCase().includes('sleeper') && !t.toLowerCase().includes('semi');
                      const tot = Number(regForm.totalSeats) || 40;
                      const half = Math.ceil(tot / 2);
                      setRegForm({
                        ...regForm,
                        busType: t,
                        lowerBerths: isSleeper ? half : 0,
                        upperBerths: isSleeper ? (tot - half) : 0,
                      });
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <optgroup label="🛏️ Sleeper Buses (Lower & Upper Decks, 2+1 Berth Layout)">
                      <option value="AC Sleeper">AC Sleeper (2+1 Lower & Upper Berth)</option>
                      <option value="Non-AC Sleeper">Non-AC Sleeper (2+1 Lower & Upper Berth)</option>
                      <option value="Luxury Sleeper">Luxury Sleeper Multi-Axle</option>
                    </optgroup>
                    <optgroup label="💺 Seater & Semi-Sleeper Buses (Single Deck, 2+2 Layout)">
                      <option value="AC Seater">AC Seater (2+2 Pushback)</option>
                      <option value="Non-AC Seater">Non-AC Seater (2+2 Highback)</option>
                      <option value="Semi-Sleeper">Semi-Sleeper (2+2 Reclining Chairs)</option>
                      <option value="Volvo AC">Volvo AC Multi-Axle Executive</option>
                      <option value="Luxury Seater">Luxury Seater Coach</option>
                    </optgroup>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Total Passenger Capacity (Seats / Berths) *</label>
                  <input
                    type="number"
                    className="form-control"
                    value={regForm.totalSeats}
                    onChange={(e) => {
                      const num = parseInt(e.target.value, 10);
                      const isSleeper = regForm.busType.toLowerCase().includes('sleeper') && !regForm.busType.toLowerCase().includes('semi');
                      const half = Math.ceil((num || 0) / 2);
                      setRegForm({
                        ...regForm,
                        totalSeats: e.target.value,
                        lowerBerths: isSleeper ? half : 0,
                        upperBerths: isSleeper ? (num - half) : 0,
                      });
                      setRegError('');
                    }}
                    min={11}
                    max={79}
                    required
                  />
                  <span className="form-hint" style={{ color: '#059669', fontWeight: 600 }}>
                    * Capacity requirement: must be more than 10 and less than 80 passengers (between 11 and 79 seats).
                  </span>
                </div>
              </div>

              {/* Lower / Upper Berths Configuration for Sleepers */}
              {regForm.busType.toLowerCase().includes('sleeper') && !regForm.busType.toLowerCase().includes('semi') && (
                <div className="form-row" style={{ marginBottom: '1rem', background: '#f8fafc', padding: 10, borderRadius: 8 }}>
                  <div className="form-group">
                    <label className="form-label">Lower Berths Count</label>
                    <input
                      type="number"
                      className="form-control"
                      value={regForm.lowerBerths}
                      onChange={(e) => setRegForm({ ...regForm, lowerBerths: parseInt(e.target.value, 10) || 0 })}
                      min={1}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Upper Berths Count</label>
                    <input
                      type="number"
                      className="form-control"
                      value={regForm.upperBerths}
                      onChange={(e) => setRegForm({ ...regForm, upperBerths: parseInt(e.target.value, 10) || 0 })}
                      min={0}
                    />
                  </div>
                </div>
              )}

              {/* Amenities Selection */}
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label">Onboard Coach Amenities</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {AMENITY_OPTIONS.map((amenity) => {
                    const isChecked = regForm.amenities.includes(amenity);
                    return (
                      <label
                        key={amenity}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          background: isChecked ? '#eff6ff' : '#f8fafc',
                          border: `1px solid ${isChecked ? '#3b82f6' : '#cbd5e1'}`,
                          color: isChecked ? '#1d4ed8' : '#334155',
                          borderRadius: 6,
                          padding: '5px 10px',
                          fontSize: '0.76rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setRegForm({ ...regForm, amenities: [...regForm.amenities, amenity] });
                            } else {
                              setRegForm({ ...regForm, amenities: regForm.amenities.filter((a) => a !== amenity) });
                            }
                          }}
                        />
                        {amenity}
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Route Corridor Assignment on Registration */}
              <div
                style={{
                  background: '#f0fdf4',
                  border: '1.5px solid #86efac',
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: '1.5rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: regForm.autoAssignRoute ? 12 : 0 }}>
                  <input
                    type="checkbox"
                    id="regAutoAssignRoute"
                    checked={regForm.autoAssignRoute}
                    onChange={(e) => setRegForm({ ...regForm, autoAssignRoute: e.target.checked })}
                    style={{ marginTop: 3, cursor: 'pointer', width: 16, height: 16 }}
                  />
                  <div>
                    <label htmlFor="regAutoAssignRoute" style={{ fontWeight: 800, color: '#166534', fontSize: '0.92rem', cursor: 'pointer' }}>
                      🛣️ Assign to Route Corridor Immediately Upon Registration (Recommended)
                    </label>
                    <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#15803d' }}>
                      Automatically binds this coach to a corridor and generates continuous daily UP/DOWN round-trip schedules. The bus will immediately appear in <strong>Manage Schedules</strong>, <strong>Confirm Trips</strong>, and <strong>Seat Management</strong>!
                    </p>
                  </div>
                </div>

                {regForm.autoAssignRoute && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginTop: 10, background: '#ffffff', padding: 12, borderRadius: 8, border: '1px solid #bbf7d0' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1e293b' }}>
                        Origin City *
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Chennai"
                        value={regForm.originCity}
                        onChange={(e) => setRegForm({ ...regForm, originCity: e.target.value })}
                        required={regForm.autoAssignRoute}
                        style={{ fontSize: '0.82rem' }}
                      />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1e293b' }}>
                        Destination City *
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Vijayawada"
                        value={regForm.destCity}
                        onChange={(e) => setRegForm({ ...regForm, destCity: e.target.value })}
                        required={regForm.autoAssignRoute}
                        style={{ fontSize: '0.82rem' }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* ─────────────────────────────────────────────────────────────
                 MODULE 2: Dynamic Coach Seat Layout (from previous BusSeatLayout)
                 ───────────────────────────────────────────────────────────── */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1.5px solid #cbd5e1',
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: '1.5rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
                  <div>
                    <h5 style={{ margin: '0 0 2px', fontSize: '0.98rem', fontWeight: 800, color: '#0f172a' }}>
                      💺 Dynamic Coach Seat Layout ({regForm.busType} &bull; {regForm.totalSeats} Passengers)
                    </h5>
                    <p style={{ margin: 0, fontSize: '0.76rem', color: '#64748b' }}>
                      {regForm.busType.toLowerCase().includes('sleeper') && !regForm.busType.toLowerCase().includes('semi')
                        ? 'Lower & Upper Deck Sleeper Berths with Pillow Headrests, Driver Steering Wheel & Gangway'
                        : 'Single Deck 2+2 Upright Chairs with Cushion, Headrests, Armrests & Gangway'}
                    </p>
                  </div>
                  <div style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', padding: '4px 12px', borderRadius: 6, fontSize: '0.76rem', fontWeight: 700 }}>
                    {regForm.busType.toLowerCase().includes('sleeper') && !regForm.busType.toLowerCase().includes('semi')
                      ? `🛏️ Lower: ${Math.ceil((Number(regForm.totalSeats) || 40) / 2)} berths | Upper: ${(Number(regForm.totalSeats) || 40) - Math.ceil((Number(regForm.totalSeats) || 40) / 2)} berths`
                      : `💺 ${regForm.totalSeats || 40} Passenger Chairs`}
                  </div>
                </div>

                {/* Embedded previous BusSeatLayout component */}
                <div style={{ background: '#ffffff', borderRadius: 10, padding: 14, border: '1px solid #e2e8f0' }}>
                  <BusSeatLayout
                    busType={regForm.busType}
                    totalSeats={Number(regForm.totalSeats) || 40}
                    fare={650}
                    isPreview={true}
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setSubTab('overview')}
                  style={{ padding: '8px 16px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={regLoading}
                  style={{ padding: '8px 24px', fontWeight: 700 }}
                >
                  {regLoading ? 'Registering Bus…' : '✓ Save Registered Bus'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
         TAB 3: ASSIGNED BUSES TABLE (Module 7F)
         ───────────────────────────────────────────────────────────── */}
      {subTab === 'assigned-table' && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header" style={{ padding: '14px 18px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                  Assigned Buses Table ({assignedBusesList.length} Active Assignments)
                </h4>
                <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#64748b' }}>
                  Buses with persistent corridor bindings and active UP/DOWN round-trip schedule definitions.
                </p>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                {onNavigate && (
                  <>
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() => onNavigate('manage-schedules')}
                      style={{ padding: '6px 12px', fontSize: '0.78rem', color: '#0369a1', borderColor: '#bae6fd', background: '#f0f9ff' }}
                      title="Jump to Manage Schedules"
                    >
                      📅 Manage Schedules
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() => onNavigate('seat-management')}
                      style={{ padding: '6px 12px', fontSize: '0.78rem', color: '#0f766e', borderColor: '#99f6e4', background: '#f0fdfa' }}
                      title="Jump to Seat Management"
                    >
                      💺 Seat Management
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() => onNavigate('confirm-trips')}
                      style={{ padding: '6px 12px', fontSize: '0.78rem', color: '#4338ca', borderColor: '#c7d2fe', background: '#eef2ff' }}
                      title="Jump to Confirm Trips"
                    >
                      🏁 Confirm Trips
                    </button>
                  </>
                )}
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setSubTab('assign-route')}
                  style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                >
                  + Assign Another Bus
                </button>
              </div>
            </div>
          </div>

          <div className="card-body" style={{ padding: 18 }}>
            {assignedBusesList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '36px', color: '#94a3b8' }}>
                <div style={{ fontSize: '2rem', marginBottom: 8 }}>🛣️</div>
                <p style={{ margin: 0, fontWeight: 700 }}>No buses are currently assigned to routes.</p>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setSubTab('assign-route')}
                  style={{ marginTop: 12, padding: '6px 16px', fontSize: '0.8rem' }}
                >
                  Assign a Bus to a Route Corridor ➔
                </button>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                      <th style={{ padding: '10px' }}>Bus Reg Number</th>
                      <th style={{ padding: '10px' }}>Bus Type</th>
                      <th style={{ padding: '10px' }}>Capacity</th>
                      <th style={{ padding: '10px' }}>Assigned Route</th>
                      <th style={{ padding: '10px' }}>Corridor</th>
                      <th style={{ padding: '10px' }}>UP Departure</th>
                      <th style={{ padding: '10px' }}>DOWN Departure</th>
                      <th style={{ padding: '10px' }}>Status</th>
                      <th style={{ padding: '10px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignedBusesList.map((bus) => {
                      const r = bus.assignedRoute;
                      const sched = bus.roundTripSchedule;
                      const orig = r?.originCity || bus.originCity || (bus.route ? bus.route.split(/→|↔|-/)[0]?.trim() : '') || 'Chennai';
                      const dest = r?.destCity || bus.destCity || (bus.route ? bus.route.split(/→|↔|-/)[1]?.trim() : '') || 'Vijayawada';
                      const corrName = r?.corridorName || `${orig} ↔ ${dest} Corridor`;

                      return (
                        <tr key={bus.vehicleId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '10px', fontWeight: 800, color: '#0f172a' }}>
                            {bus.vehicleNumber}
                            <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 400 }}>{bus.busName}</div>
                          </td>
                          <td style={{ padding: '10px' }}>{bus.busType || bus.vehicleType}</td>
                          <td style={{ padding: '10px', fontWeight: 700 }}>{bus.totalSeats} seats</td>
                          <td style={{ padding: '10px', fontWeight: 700, color: '#1d4ed8' }}>
                            {orig} ↔ {dest}
                          </td>
                          <td style={{ padding: '10px', fontSize: '0.74rem', color: '#475569' }}>
                            {corrName}
                            <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: 2 }}>
                              ⏱️ Est. {r?.durationEst || '6h 30m'} &bull; {r?.distanceKm || 430} km
                            </div>
                          </td>
                          <td style={{ padding: '10px', fontWeight: 700, color: '#15803d' }}>
                            {sched?.upSchedule?.departureTime || '—'}
                          </td>
                          <td style={{ padding: '10px', fontWeight: 700, color: '#b45309' }}>
                            {sched?.downSchedule?.departureTime || '—'}
                          </td>
                          <td style={{ padding: '10px' }}>
                            <span style={{ background: '#eff6ff', color: '#1d4ed8', padding: '2px 8px', borderRadius: 10, fontSize: '0.72rem', fontWeight: 700 }}>
                              Active
                            </span>
                          </td>
                          <td style={{ padding: '10px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                              {onNavigate && (
                                <>
                                  <button
                                    type="button"
                                    className="btn btn-outline"
                                    onClick={() => onNavigate('manage-schedules')}
                                    style={{ padding: '3px 8px', fontSize: '0.72rem', color: '#0369a1', borderColor: '#bae6fd', background: '#f0f9ff' }}
                                    title="View in Manage Schedules"
                                  >
                                    📅 Schedules
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-outline"
                                    onClick={() => onNavigate('seat-management')}
                                    style={{ padding: '3px 8px', fontSize: '0.72rem', color: '#0f766e', borderColor: '#99f6e4', background: '#f0fdfa' }}
                                    title="View in Seat Management"
                                  >
                                    💺 Seats
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-outline"
                                    onClick={() => onNavigate('confirm-trips')}
                                    style={{ padding: '3px 8px', fontSize: '0.72rem', color: '#4338ca', borderColor: '#c7d2fe', background: '#eef2ff' }}
                                    title="View in Confirm Trips"
                                  >
                                    🏁 Confirm
                                  </button>
                                </>
                              )}
                              <button
                                type="button"
                                className="btn btn-outline"
                                onClick={() => handleOpenChangeRoute(bus)}
                                style={{ padding: '3px 8px', fontSize: '0.74rem', color: '#d97706' }}
                              >
                                Change Route
                              </button>
                              <button
                                type="button"
                                className="btn btn-outline"
                                onClick={() => {
                                  setScheduleBusId(bus.vehicleId);
                                  setSubTab('roundtrip-schedule');
                                }}
                                style={{ padding: '3px 8px', fontSize: '0.74rem', color: '#2563eb' }}
                              >
                                Schedules
                              </button>
                              <button
                                type="button"
                                className="btn btn-outline"
                                onClick={() => handleUnassignRoute(bus)}
                                style={{ padding: '3px 8px', fontSize: '0.74rem', color: '#b45309', borderColor: '#fde68a' }}
                                title="Unassign bus from route corridor"
                              >
                                Unassign Route
                              </button>
                              <button
                                type="button"
                                className="btn btn-outline"
                                onClick={() => handleDeleteBus(bus)}
                                style={{ padding: '3px 8px', fontSize: '0.74rem', color: '#dc2626', borderColor: '#fca5a5' }}
                                title="Delete bus from fleet"
                              >
                                🗑️ Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
         TAB 4: ASSIGN ROUTE CORRIDOR (Module 3)
         ───────────────────────────────────────────────────────────── */}
      {subTab === 'assign-route' && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header" style={{ padding: '14px 18px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
            <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
              Assign Bus to Permanent Route Corridor
            </h4>
            <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#64748b' }}>
              Select a registered bus and assign it permanently to an approved route corridor (e.g. <strong>Chennai ↔ Vijayawada</strong>).
            </p>
          </div>

          <div className="card-body" style={{ padding: 18 }}>
            {assignError && <div className="alert alert-error" style={{ marginBottom: 12 }}>⚠️ {assignError}</div>}

            {/* Step 1: Select Bus */}
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label">Step 1: Select Registered Bus *</label>
              <select
                className="form-control"
                value={assignBusId}
                onChange={(e) => setAssignBusId(e.target.value)}
                style={{ cursor: 'pointer' }}
              >
                <option value="">-- Choose a registered bus from fleet --</option>
                {buses.length === 0 && (
                  <option value="" disabled>No registered buses found — please register a bus first</option>
                )}
                {buses.map((b) => {
                  const bId = b.vehicleId || b.id;
                  return (
                    <option key={bId} value={bId} disabled={b.status === 'Maintenance'}>
                      {b.vehicleNumber} &bull; {b.busName} ({b.totalSeats} seats) &bull; [{b.status}]
                      {b.assignedRoute ? ` — Already on ${b.assignedRoute.originCity} ↔ ${b.assignedRoute.destCity}` : ''}
                    </option>
                  );
                })}
              </select>
            </div>

            {currentAssignBus && (
              <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: '1.25rem', fontSize: '0.8rem' }}>
                <div>Selected Bus: <strong>{currentAssignBus.vehicleNumber}</strong> ({currentAssignBus.busName})</div>
                <div>Status: <strong>{currentAssignBus.status}</strong> &bull; Total Seats: <strong>{currentAssignBus.totalSeats}</strong></div>
                {currentAssignBus.assignedRoute && (
                  <div style={{ color: '#d97706', marginTop: 2, fontWeight: 700 }}>
                    ⚠️ Currently assigned to: {currentAssignBus.assignedRoute.originCity} ↔ {currentAssignBus.assignedRoute.destCity} ({currentAssignBus.assignedRoute.corridorName})
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Origin & Destination */}
            <div className="form-row" style={{ marginBottom: '1.25rem' }}>
              <OsmLocationSelector
                label="Step 2A: Origin City *"
                value={assignOrigin}
                onChange={(name, item) => {
                  setAssignOrigin(name);
                  if (item) setAssignOriginCoords(item);
                }}
                approvedCities={approvedCities}
                placeholder="e.g. Chennai..."
              />
              <OsmLocationSelector
                label="Step 2B: Destination City *"
                value={assignDest}
                onChange={(name, item) => {
                  setAssignDest(name);
                  if (item) setAssignDestCoords(item);
                }}
                onRequestMissing={(item) => handleOpenRequestModal(item, 'assign')}
                approvedCities={approvedCities}
                placeholder="e.g. Ongole or Guntur or Vijayawada..."
              />
            </div>

            {/* Quick Helper for Missing City / Town Request */}
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '10px 14px',
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.78rem',
              }}
            >
              <span style={{ color: '#64748b' }}>
                🛡️ Operating on {approvedCities.length} verified platform hubs. Need to route to an unapproved town or bus stop?
              </span>
              <button
                type="button"
                onClick={() => handleOpenRequestModal(null, 'assign')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#2563eb',
                  fontWeight: 700,
                  cursor: 'pointer',
                  padding: 0,
                  textDecoration: 'underline',
                }}
              >
                + Raise Route Request →
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '1.25rem' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => handleDiscoverCorridors(assignOrigin, assignDest, assignOriginCoords, assignDestCoords)}
                disabled={assignLoading || !assignOrigin || !assignDest}
                style={{ padding: '8px 20px', fontWeight: 700 }}
              >
                {assignLoading ? '🔍 Discovering Corridors…' : '🔍 Find Available Corridors'}
              </button>
            </div>

            {/* Step 3: Select Discovered Corridor */}
            {discoveredCorridors.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <label className="form-label" style={{ fontWeight: 800, marginBottom: 8 }}>
                  Step 3: Select Route Corridor for this Bus:
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {discoveredCorridors.map((c, idx) => {
                    const isSelected = selectedCorridorId === c.corridorId;
                    return (
                      <div
                        key={c.corridorId}
                        onClick={() => handleSelectCorridor(c.corridorId)}
                        style={{
                          border: isSelected ? '2px solid #2563eb' : '1px solid #cbd5e1',
                          background: isSelected ? '#eff6ff' : '#ffffff',
                          borderRadius: 8,
                          padding: 12,
                          cursor: 'pointer',
                          transition: 'all 0.12s ease',
                          boxShadow: isSelected ? '0 2px 8px rgba(37, 99, 235, 0.12)' : 'none',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 800, fontSize: '0.9rem', color: isSelected ? '#1e40af' : '#0f172a' }}>
                            {c.name}
                          </span>
                          <span style={{ fontWeight: 700, fontSize: '0.8rem', color: '#1e40af' }}>
                            {c.distance} km &bull; ⏱️ Est. Travel: {c.duration}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: 4 }}>
                          Major Towns: {c.majorTowns?.join(' ➔ ')}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 4: Map Visualizer Preview */}
            {discoveredCorridors.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <label className="form-label" style={{ fontWeight: 800, marginBottom: 6 }}>
                  Step 4: Interactive Route Corridor Map & Stop Visualizer:
                </label>
                <RouteCorridorMap
                  source={assignOriginCoords || getCityCoords(assignOrigin) || { name: assignOrigin, lat: 13.0827, lng: 80.2707 }}
                  destination={assignDestCoords || getCityCoords(assignDest) || { name: assignDest, lat: 16.5062, lng: 80.6480 }}
                  corridors={discoveredCorridors}
                  selectedCorridorId={selectedCorridorId || discoveredCorridors[0]?.corridorId}
                  onSelectCorridor={handleSelectCorridor}
                  routeStops={orderedCorridorStations.filter((s) => selectedStationIds.includes(s.id))}
                  suggestedStops={orderedCorridorStations.filter((s) => !selectedStationIds.includes(s.id))}
                  onToggleStop={(st) => handleToggleStation(st.id)}
                  height={300}
                />
              </div>
            )}

            {/* Step 5: Pick Main Towns and Famous Places (In Map Progression Order) */}
            {discoveredCorridors.length > 0 && orderedCorridorStations.length > 0 && (
              <div
                style={{
                  marginBottom: '1.5rem',
                  border: '1.5px solid #bfdbfe',
                  borderRadius: 10,
                  background: '#f8fafc',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    background: '#eff6ff',
                    padding: '12px 16px',
                    borderBottom: '1px solid #bfdbfe',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 10,
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#1e40af' }}>
                      📍 Step 5: Main Towns & Famous RTC Places along Route Corridor (In Strict Map Order)
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#475569', marginTop: 2 }}>
                      Derived from road geometry & corridor polyline. Ordered strictly from {assignOrigin} to {assignDest}.
                      Check or uncheck stations to assign intermediate halts and estimated schedule times.
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={handleSelectAllStations}
                      style={{
                        background: '#2563eb',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 6,
                        padding: '4px 10px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      ✓ Select All ({orderedCorridorStations.length})
                    </button>
                    <button
                      type="button"
                      onClick={handleSelectTerminalsOnly}
                      style={{
                        background: '#7c3aed',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 6,
                        padding: '4px 10px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      🏛️ RTC Terminals Only ({orderedCorridorStations.filter((s) => s.type === 'TERMINAL').length})
                    </button>
                    <button
                      type="button"
                      onClick={handleClearAllStations}
                      style={{
                        background: '#e2e8f0',
                        color: '#475569',
                        border: 'none',
                        borderRadius: 6,
                        padding: '4px 10px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      ✕ Clear All
                    </button>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span
                        style={{
                          background: '#dcfce7',
                          color: '#15803d',
                          border: '1px solid #86efac',
                          padding: '3px 8px',
                          borderRadius: 6,
                          fontSize: '0.72rem',
                          fontWeight: 800,
                        }}
                      >
                        💰 Uniform Fare: ₹{tripFare || 650} for each station
                      </span>
                      <span
                        style={{
                          background: selectedStationIds.length > 0 ? '#dcfce7' : '#fee2e2',
                          color: selectedStationIds.length > 0 ? '#15803d' : '#991b1b',
                          padding: '4px 10px',
                          borderRadius: 6,
                          fontSize: '0.72rem',
                          fontWeight: 800,
                        }}
                      >
                        {selectedStationIds.length} of {orderedCorridorStations.length} Stations Assigned
                      </span>
                    </div>
                  </div>
                </div>

                {/* Stations Table */}
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                    <thead>
                      <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1', textAlign: 'left', color: '#475569' }}>
                        <th style={{ padding: '8px 12px', width: '40px', textAlign: 'center' }}>Assign</th>
                        <th style={{ padding: '8px 10px', width: '60px' }}>Seq #</th>
                        <th style={{ padding: '8px 12px' }}>Station & RTC Terminal Hub</th>
                        <th style={{ padding: '8px 12px' }}>Place Type</th>
                        <th style={{ padding: '8px 12px' }}>Distance from {assignOrigin}</th>
                        <th style={{ padding: '8px 12px' }}>Est. Travel Time</th>
                        <th style={{ padding: '8px 12px' }}>Schedule Halt (10m)</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right' }}>Ticket Fare</th>
                        <th style={{ padding: '8px 12px', textAlign: 'center' }}>Assignment Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orderedCorridorStations.map((st, idx) => {
                        const isAssigned = selectedStationIds.includes(st.id);
                        return (
                          <tr
                            key={st.id}
                            onClick={() => handleToggleStation(st.id)}
                            style={{
                              borderBottom: '1px solid #e2e8f0',
                              background: isAssigned ? '#ffffff' : '#f8fafc',
                              opacity: isAssigned ? 1 : 0.65,
                              cursor: 'pointer',
                              transition: 'background 0.1s ease',
                            }}
                          >
                            <td style={{ padding: '8px 12px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={isAssigned}
                                onChange={() => handleToggleStation(st.id)}
                                style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#2563eb' }}
                              />
                            </td>
                            <td style={{ padding: '8px 10px' }}>
                              <span
                                style={{
                                  background: isAssigned ? '#2563eb' : '#94a3b8',
                                  color: '#fff',
                                  borderRadius: '50%',
                                  width: 22,
                                  height: 22,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontWeight: 800,
                                  fontSize: '0.7rem',
                                }}
                              >
                                {idx + 1}
                              </span>
                            </td>
                            <td style={{ padding: '8px 12px' }}>
                              <div style={{ fontWeight: 800, color: isAssigned ? '#0f172a' : '#64748b' }}>
                                {st.fullName}
                              </div>
                              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                                Lat: {st.lat.toFixed(4)}, Lng: {st.lng.toFixed(4)}
                              </div>
                            </td>
                            <td style={{ padding: '8px 12px' }}>
                              <span
                                style={{
                                  background: st.type === 'TERMINAL' ? '#f3e8ff' : '#e0f2fe',
                                  color: st.type === 'TERMINAL' ? '#7e22ce' : '#0369a1',
                                  padding: '2px 7px',
                                  borderRadius: 4,
                                  fontWeight: 700,
                                  fontSize: '0.68rem',
                                }}
                              >
                                {st.type === 'TERMINAL' ? '🏛️ Famous RTC Terminal' : '🏙️ Main Town'}
                              </span>
                            </td>
                            <td style={{ padding: '8px 12px', fontWeight: 700, color: '#0f172a' }}>
                              📍 {st.distanceFromOriginKm} km
                            </td>
                            <td style={{ padding: '8px 12px', color: '#1e40af', fontWeight: 700 }}>
                              ⏱️ {st.elapsedTimeStr}
                            </td>
                            <td style={{ padding: '8px 12px' }}>
                              <div style={{ color: '#15803d', fontWeight: 700 }}>
                                🕒 Arr: {st.estimatedArrivalTime}
                              </div>
                              <div style={{ color: '#475569', fontSize: '0.7rem' }}>
                                ➔ Dep: {st.estimatedDepartureTime} (10m halt)
                              </div>
                            </td>
                            <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 800, color: '#16a34a' }}>
                              ₹{tripFare || 650}
                            </td>
                            <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                              <span
                                style={{
                                  background: isAssigned ? '#dcfce7' : '#f1f5f9',
                                  color: isAssigned ? '#15803d' : '#64748b',
                                  padding: '2px 8px',
                                  borderRadius: 12,
                                  fontWeight: 800,
                                  fontSize: '0.68rem',
                                }}
                              >
                                {isAssigned ? '✓ Assigned' : 'Excluded'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Confirm Assignment Button with Strict Validation */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, marginTop: 14 }}>
              {!assignRouteValidation.isValid && (
                <div style={{
                  background: '#fffbeb',
                  border: '1px solid #fde68a',
                  borderRadius: 6,
                  padding: '8px 12px',
                  fontSize: '0.74rem',
                  color: '#92400e',
                  width: '100%',
                }}>
                  <strong>⚠️ Incomplete Route Assignment:</strong>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                    {assignRouteValidation.errors.map((err, idx) => (
                      <span key={idx} style={{ background: '#fef3c7', padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>
                        &bull; {err}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <button
                type="button"
                className="btn btn-primary"
                onClick={handleConfirmPermanentAssignment}
                disabled={assignLoading || !assignRouteValidation.isValid}
                style={{
                  padding: '9px 24px',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  opacity: assignRouteValidation.isValid ? 1 : 0.45,
                  cursor: assignRouteValidation.isValid ? 'pointer' : 'not-allowed',
                }}
              >
                ✓ Confirm Permanent Route Assignment ({selectedStationIds.length > 0 ? selectedStationIds.length : orderedCorridorStations.length} Stations)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
         TAB 5: ROUND-TRIP SCHEDULING - UP AND DOWN (Module 4 & 5)
         ───────────────────────────────────────────────────────────── */}
      {subTab === 'roundtrip-schedule' && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header" style={{ padding: '14px 18px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
            <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
              Round-Trip Scheduling: UP and DOWN Journeys
            </h4>
            <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#64748b' }}>
              Configure recurring schedules for both travel directions on the same bus and permanent corridor.
            </p>
          </div>

          <div className="card-body" style={{ padding: 18 }}>
            {scheduleError && <div className="alert alert-error" style={{ marginBottom: 12 }}>⚠️ {scheduleError}</div>}
            {scheduleSuccess && <div className="alert alert-success" style={{ marginBottom: 12 }}>{scheduleSuccess}</div>}

            {/* Step 1: Select Assigned Bus */}
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label">Select Assigned Bus</label>
              <select
                className="form-control"
                value={scheduleBusId}
                onChange={(e) => setScheduleBusId(e.target.value)}
                style={{ cursor: 'pointer' }}
              >
                <option value="">-- Select assigned bus from fleet --</option>
                {assignedBusesList.length === 0 && (
                  <option value="" disabled>No route-assigned buses found — please assign a bus to a route first</option>
                )}
                {assignedBusesList.map((b) => (
                  <option key={b.vehicleId} value={b.vehicleId}>
                    {b.vehicleNumber} ({b.busName}) &bull; {b.assignedRoute?.originCity} ↔ {b.assignedRoute?.destCity}
                  </option>
                ))}
              </select>
            </div>

            {currentScheduleBus && currentScheduleBus.assignedRoute ? (
              <>
                {/* Permanent Route Header Banner */}
                <div
                  style={{
                    background: '#eff6ff',
                    border: '1.5px solid #bfdbfe',
                    borderRadius: 8,
                    padding: '12px 16px',
                    marginBottom: '1.5rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '0.74rem', color: '#1e40af', fontWeight: 700, textTransform: 'uppercase' }}>
                        Permanent Assigned Corridor
                      </div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0f172a', marginTop: 2 }}>
                        {currentScheduleBus.assignedRoute.originCity} ↔ {currentScheduleBus.assignedRoute.destCity}
                      </div>
                      <div style={{ fontSize: '0.76rem', color: '#475569', marginTop: 2 }}>
                        {currentScheduleBus.assignedRoute.corridorName} &bull; {currentScheduleBus.assignedRoute.distanceKm} km &bull; Approx {currentScheduleBus.assignedRoute.durationEst}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ background: '#dcfce7', color: '#15803d', padding: '3px 9px', borderRadius: 12, fontSize: '0.74rem', fontWeight: 800 }}>
                        ✓ Persistent Assignment
                      </span>
                    </div>
                  </div>
                </div>

                {/* ── MODULE 4: Route Corridor Travel Estimation Highlight ── */}
                <div
                  style={{
                    background: '#f8fafc',
                    border: '1.5px solid #cbd5e1',
                    borderRadius: 8,
                    padding: '12px 16px',
                    marginBottom: '1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 12,
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a' }}>
                      ⏱️ Estimated Route Travel Time: <span style={{ color: '#2563eb' }}>{currentScheduleBus.assignedRoute.durationEst || '6h 30m'}</span> &bull; Distance: <span style={{ color: '#059669' }}>{currentScheduleBus.assignedRoute.distanceKm || '450'} km</span>
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: 3 }}>
                      Entering a Departure Time below auto-computes the exact Arrival Time and date timeline (including overnight transitions).
                    </div>
                  </div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1e40af', background: '#dbeafe', padding: '4px 10px', borderRadius: 6 }}>
                    Travel Duration: approx. {routeDurationMins} minutes
                  </div>
                </div>

                {/* ── Operating Schedule Window: From Date to Date ── */}
                <div
                  style={{
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: 8,
                    padding: '12px 16px',
                    marginBottom: '1.25rem',
                  }}
                >
                  <div style={{ fontWeight: 800, fontSize: '0.84rem', color: '#0f172a', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    📅 Operating Schedule Window (From Date to Date)
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                    <div>
                      <label className="form-label" style={{ fontSize: '0.74rem', marginBottom: 4 }}>
                        From Start Date *
                      </label>
                      <input
                        type="date"
                        className="form-control"
                        min={todayStr}
                        value={scheduleStartDate}
                        onChange={(e) => handleStartDateChange(e.target.value)}
                      />
                      <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: 3 }}>
                        Buses cannot be scheduled for past dates or past clock times.
                      </div>
                    </div>
                    <div>
                      <label className="form-label" style={{ fontSize: '0.74rem', marginBottom: 4 }}>
                        To End Date (Schedule Horizon) *
                      </label>
                      <input
                        type="date"
                        className="form-control"
                        min={scheduleStartDate}
                        value={scheduleEndDate}
                        onChange={(e) => setScheduleEndDate(e.target.value)}
                      />
                      <div style={{ fontSize: '0.7rem', color: '#16a34a', fontWeight: 600, marginTop: 3 }}>
                        ⚡ Automatically generates continuous 30-day daily round-trip schedules.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Grid of UP and DOWN Schedules */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '16px', marginBottom: '1.5rem' }}>
                  {/* ── UP JOURNEY ── */}
                  <div
                    style={{
                      background: '#ffffff',
                      border: '1.5px solid #86efac',
                      borderRadius: 10,
                      padding: 16,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                      <span style={{ background: '#16a34a', color: '#fff', borderRadius: 4, padding: '2px 7px', fontSize: '0.72rem', fontWeight: 800 }}>
                        UP JOURNEY
                      </span>
                      <span style={{ fontWeight: 800, fontSize: '0.94rem', color: '#0f172a' }}>
                        {currentScheduleBus.assignedRoute.originCity} ➔ {currentScheduleBus.assignedRoute.destCity}
                      </span>
                    </div>

                    <div className="form-row" style={{ marginBottom: 10 }}>
                      <div className="form-group">
                        <label className="form-label" style={{ fontSize: '0.76rem' }}>Departure Time *</label>
                        <input
                          type="time"
                          className="form-control"
                          value={upDepTime}
                          onChange={(e) => handleUpDepChange(e.target.value)}
                        />
                        <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: 2 }}>
                          Auto-computes arrival time
                        </div>
                      </div>
                      <div className="form-group">
                        <label className="form-label" style={{ fontSize: '0.76rem' }}>Arrival Time * (Auto-computed)</label>
                        <input
                          type="time"
                          className="form-control"
                          value={upArrTime}
                          onChange={(e) => setUpArrTime(e.target.value)}
                        />
                        <div style={{ fontSize: '0.68rem', color: upTimeline?.isNextDay ? '#b45309' : '#15803d', marginTop: 2, fontWeight: 600 }}>
                          {upTimeline?.isNextDay ? '🌙 Next-Day Arrival (+1 Day)' : '☀️ Same-Day Arrival'}
                        </div>
                      </div>
                    </div>

                    {/* Auto-Computed Schedule Timeline Preview */}
                    {upTimeline && (
                      <div
                        style={{
                          background: '#f0fdf4',
                          border: '1px solid #bbf7d0',
                          borderRadius: 6,
                          padding: '8px 10px',
                          marginBottom: 10,
                          fontSize: '0.74rem',
                        }}
                      >
                        <div style={{ fontWeight: 700, color: '#166534', marginBottom: 3 }}>
                          🕒 Auto-Computed UP Journey Timeline:
                        </div>
                        <div style={{ color: '#15803d', display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <div>
                            <strong>Depart:</strong> {scheduleStartDate} at {upDepTime} ({currentScheduleBus.assignedRoute.originCity})
                          </div>
                          <div>
                            <strong>Arrive:</strong> {upTimeline.arrDateStr || scheduleStartDate} at {upArrTime} ({currentScheduleBus.assignedRoute.destCity})
                            {upTimeline.isNextDay && (
                              <span style={{ marginLeft: 6, background: '#fef08a', color: '#854d0e', padding: '1px 5px', borderRadius: 4, fontWeight: 700, fontSize: '0.68rem' }}>
                                +1 Day Overnight
                              </span>
                            )}
                          </div>
                          <div>
                            <strong>Estimated Journey Duration:</strong> {currentScheduleBus.assignedRoute.durationEst || 'Approx. 6h 30m'} ({currentScheduleBus.assignedRoute.distanceKm || '450'} km)
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Past / Present Departure Notice */}
                    {scheduleStartDate === todayStr && upDepTime && upDepTime <= curHHMM && (
                      <div style={{ background: '#f0fdf4', border: '1px solid #86efac', color: '#166534', padding: '6px 8px', borderRadius: 6, fontSize: '0.72rem', fontWeight: 600, marginBottom: 10 }}>
                        ℹ️ Departure time ({upDepTime}) is earlier than current clock ({curHHMM}). This journey will be active in Confirm Trips &amp; Manage Schedules.
                      </div>
                    )}

                    {/* Intermediate stations timetable with estimated arrival times */}
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#166534', marginBottom: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>📍 UP Journey Station Halts ({upStationTimetable.length > 0 ? upStationTimetable.length : currentScheduleBus.assignedRoute.intermediateStops?.length || 0}):</span>
                        <span style={{ fontSize: '0.68rem', color: '#15803d', fontWeight: 600 }}>In Exact Map Road Sequence</span>
                      </div>
                      {upStationTimetable.length > 0 ? (
                        <div style={{ maxHeight: 180, overflowY: 'auto', border: '1px solid #bbf7d0', borderRadius: 6, background: '#f0fdf4' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.72rem' }}>
                            <thead>
                              <tr style={{ background: '#dcfce7', borderBottom: '1px solid #bbf7d0', textAlign: 'left', color: '#166534' }}>
                                <th style={{ padding: '4px 8px', width: 24 }}>#</th>
                                <th style={{ padding: '4px 8px' }}>Station / RTC Stand</th>
                                <th style={{ padding: '4px 8px' }}>Distance</th>
                                <th style={{ padding: '4px 8px' }}>Est. Arrival</th>
                                <th style={{ padding: '4px 8px' }}>Departure (Halt)</th>
                                <th style={{ padding: '4px 8px', textAlign: 'right' }}>Ticket Fare</th>
                              </tr>
                            </thead>
                            <tbody>
                              {upStationTimetable.map((st, sidx) => (
                                <tr key={`up-st-${sidx}`} style={{ borderBottom: '1px solid #dcfce7' }}>
                                  <td style={{ padding: '4px 8px', fontWeight: 800, color: '#166534' }}>{sidx + 1}</td>
                                  <td style={{ padding: '4px 8px', fontWeight: 700, color: '#0f172a' }}>{st.name || st.fullName}</td>
                                  <td style={{ padding: '4px 8px', color: '#475569' }}>{st.distanceFromOriginKm} km</td>
                                  <td style={{ padding: '4px 8px', fontWeight: 700, color: '#15803d' }}>🕒 {st.estimatedArrivalTime}</td>
                                  <td style={{ padding: '4px 8px', color: '#166534' }}>{st.estimatedDepartureTime} (10m)</td>
                                  <td style={{ padding: '4px 8px', textAlign: 'right', fontWeight: 800, color: '#15803d' }}>₹{tripFare || 650}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div style={{ marginTop: 2, color: '#1e40af', fontWeight: 600, fontSize: '0.74rem' }}>
                          {currentScheduleBus.assignedRoute.intermediateStops?.join(' ➔ ') || 'Point to Point'}
                        </div>
                      )}
                    </div>

                    {/* Continuous 30-Day Automated Schedule Banner */}
                    <div style={{ marginTop: 12, padding: '10px 14px', background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: '1.15rem' }}>🔄</span>
                          <div>
                            <div style={{ fontWeight: 800, fontSize: '0.82rem', color: '#166534' }}>
                              Continuous 30-Day Daily Outbound Service (UP)
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#15803d', marginTop: 2 }}>
                              Runs automatically every day from <strong>{scheduleStartDate}</strong> to <strong>{scheduleEndDate}</strong> (All 7 days/week).
                            </div>
                          </div>
                        </div>
                        <span style={{ background: '#16a34a', color: '#ffffff', fontWeight: 800, fontSize: '0.72rem', padding: '3px 9px', borderRadius: 6 }}>
                          ✓ 7 Days / 30 Days Auto
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* ── DOWN JOURNEY (Automatically Reversed) ── */}
                  <div
                    style={{
                      background: '#ffffff',
                      border: '1.5px solid #fde68a',
                      borderRadius: 10,
                      padding: 16,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                      <span style={{ background: '#d97706', color: '#fff', borderRadius: 4, padding: '2px 7px', fontSize: '0.72rem', fontWeight: 800 }}>
                        DOWN JOURNEY
                      </span>
                      <span style={{ fontWeight: 800, fontSize: '0.94rem', color: '#0f172a' }}>
                        {currentScheduleBus.assignedRoute.destCity} ➔ {currentScheduleBus.assignedRoute.originCity}
                      </span>
                    </div>

                    <div className="form-row" style={{ marginBottom: 10 }}>
                      <div className="form-group">
                        <label className="form-label" style={{ fontSize: '0.76rem' }}>Departure Time *</label>
                        <input
                          type="time"
                          className="form-control"
                          value={downDepTime}
                          onChange={(e) => handleDownDepChange(e.target.value)}
                        />
                        <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: 2 }}>
                          Auto-computes arrival time
                        </div>
                      </div>
                      <div className="form-group">
                        <label className="form-label" style={{ fontSize: '0.76rem' }}>Arrival Time * (Auto-computed)</label>
                        <input
                          type="time"
                          className="form-control"
                          value={downArrTime}
                          onChange={(e) => setDownArrTime(e.target.value)}
                        />
                        <div style={{ fontSize: '0.68rem', color: downTimeline?.isNextDay ? '#b45309' : '#15803d', marginTop: 2, fontWeight: 600 }}>
                          {downTimeline?.isNextDay ? '🌙 Next-Day Arrival (+1 Day)' : '☀️ Same-Day Arrival'}
                        </div>
                      </div>
                    </div>

                    {/* Auto-Computed Schedule Timeline Preview */}
                    {downTimeline && (
                      <div
                        style={{
                          background: '#fffbeb',
                          border: '1px solid #fde68a',
                          borderRadius: 6,
                          padding: '8px 10px',
                          marginBottom: 10,
                          fontSize: '0.74rem',
                        }}
                      >
                        <div style={{ fontWeight: 700, color: '#92400e', marginBottom: 3 }}>
                          🕒 Auto-Computed DOWN Journey Timeline:
                        </div>
                        <div style={{ color: '#b45309', display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <div>
                            <strong>Depart:</strong> {scheduleStartDate} at {downDepTime} ({currentScheduleBus.assignedRoute.destCity})
                          </div>
                          <div>
                            <strong>Arrive:</strong> {downTimeline.arrDateStr || scheduleStartDate} at {downArrTime} ({currentScheduleBus.assignedRoute.originCity})
                            {downTimeline.isNextDay && (
                              <span style={{ marginLeft: 6, background: '#fef08a', color: '#854d0e', padding: '1px 5px', borderRadius: 4, fontWeight: 700, fontSize: '0.68rem' }}>
                                +1 Day Overnight
                              </span>
                            )}
                          </div>
                          <div>
                            <strong>Estimated Journey Duration:</strong> {currentScheduleBus.assignedRoute.durationEst || 'Approx. 6h 30m'} ({currentScheduleBus.assignedRoute.distanceKm || '450'} km)
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Past / Present Departure Notice */}
                    {scheduleStartDate === todayStr && downDepTime && downDepTime <= curHHMM && (
                      <div style={{ background: '#f0fdf4', border: '1px solid #86efac', color: '#166534', padding: '6px 8px', borderRadius: 6, fontSize: '0.72rem', fontWeight: 600, marginBottom: 10 }}>
                        ℹ️ Return departure time ({downDepTime}) is earlier than current clock ({curHHMM}). This journey will be active in Confirm Trips &amp; Manage Schedules.
                      </div>
                    )}

                    {/* Reversed return intermediate stations timetable with estimated arrival times */}
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#92400e', marginBottom: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>📍 DOWN Journey Return Halts ({downStationTimetable.length > 0 ? downStationTimetable.length : currentScheduleBus.assignedRoute.intermediateStops?.length || 0}):</span>
                        <span style={{ fontSize: '0.68rem', color: '#b45309', fontWeight: 600 }}>Reversed Return Map Order</span>
                      </div>
                      {downStationTimetable.length > 0 ? (
                        <div style={{ maxHeight: 180, overflowY: 'auto', border: '1px solid #fde68a', borderRadius: 6, background: '#fffbeb' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.72rem' }}>
                            <thead>
                              <tr style={{ background: '#fef3c7', borderBottom: '1px solid #fde68a', textAlign: 'left', color: '#92400e' }}>
                                <th style={{ padding: '4px 8px', width: 24 }}>#</th>
                                <th style={{ padding: '4px 8px' }}>Return Station / RTC Stand</th>
                                <th style={{ padding: '4px 8px' }}>Distance</th>
                                <th style={{ padding: '4px 8px' }}>Est. Arrival</th>
                                <th style={{ padding: '4px 8px' }}>Departure (Halt)</th>
                                <th style={{ padding: '4px 8px', textAlign: 'right' }}>Ticket Fare</th>
                              </tr>
                            </thead>
                            <tbody>
                              {downStationTimetable.map((st, sidx) => (
                                <tr key={`dn-st-${sidx}`} style={{ borderBottom: '1px solid #fef3c7' }}>
                                  <td style={{ padding: '4px 8px', fontWeight: 800, color: '#b45309' }}>{sidx + 1}</td>
                                  <td style={{ padding: '4px 8px', fontWeight: 700, color: '#0f172a' }}>{st.name || st.fullName}</td>
                                  <td style={{ padding: '4px 8px', color: '#475569' }}>{st.distanceFromOriginKm} km</td>
                                  <td style={{ padding: '4px 8px', fontWeight: 700, color: '#b45309' }}>🕒 {st.estimatedArrivalTime}</td>
                                  <td style={{ padding: '4px 8px', color: '#92400e' }}>{st.estimatedDepartureTime} (10m)</td>
                                  <td style={{ padding: '4px 8px', textAlign: 'right', fontWeight: 800, color: '#b45309' }}>₹{tripFare || 650}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div style={{ marginTop: 2, color: '#b45309', fontWeight: 600, fontSize: '0.74rem' }}>
                          {[...(currentScheduleBus.assignedRoute.intermediateStops || [])].reverse().join(' ➔ ') || 'Point to Point'}
                        </div>
                      )}
                    </div>

                    {/* Continuous 30-Day Automated Return Schedule Banner */}
                    <div style={{ marginTop: 12, padding: '10px 14px', background: '#fffbeb', border: '1.5px solid #fde68a', borderRadius: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: '1.15rem' }}>🔄</span>
                          <div>
                            <div style={{ fontWeight: 800, fontSize: '0.82rem', color: '#92400e' }}>
                              Continuous 30-Day Daily Return Service (DOWN)
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#b45309', marginTop: 2 }}>
                              Runs automatically every day from <strong>{scheduleStartDate}</strong> to <strong>{scheduleEndDate}</strong> (All 7 days/week).
                            </div>
                          </div>
                        </div>
                        <span style={{ background: '#d97706', color: '#ffffff', fontWeight: 800, fontSize: '0.72rem', padding: '3px 9px', borderRadius: 6 }}>
                          ✓ 7 Days / 30 Days Auto
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Rest / Turnaround Time & Fare Box */}
                <div
                  style={{
                    background: turnaroundInfo.isValid ? '#f0fdf4' : '#fef2f2',
                    border: `1.5px solid ${turnaroundInfo.isValid ? '#86efac' : '#fca5a5'}`,
                    borderRadius: 10,
                    padding: '14px 18px',
                    marginBottom: '1.5rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14, marginBottom: 12 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: '0.92rem', fontWeight: 800, color: turnaroundInfo.isValid ? '#166534' : '#991b1b' }}>
                          ⏱️ Destination Turnaround Rest: {turnaroundInfo.text}
                        </span>
                        <span
                          style={{
                            background: turnaroundInfo.isValid ? '#dcfce7' : '#fee2e2',
                            color: turnaroundInfo.isValid ? '#15803d' : '#991b1b',
                            border: `1px solid ${turnaroundInfo.isValid ? '#86efac' : '#fca5a5'}`,
                            padding: '2px 8px',
                            borderRadius: 6,
                            fontSize: '0.7rem',
                            fontWeight: 800,
                          }}
                        >
                          {turnaroundInfo.isValid ? '✓ Valid (1h – 12h)' : '⚠️ Out of Range (Must be 1h – 12h)'}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: turnaroundInfo.isValid ? '#15803d' : '#b91c1c', marginTop: 3 }}>
                        {turnaroundInfo.isValid
                          ? `✓ Rest buffer between UP arrival (${upArrTime}) and DOWN departure (${downDepTime}) is compliant.`
                          : turnaroundInfo.error}
                      </div>
                      {turnaroundInfo.origRestText !== '—' && (
                        <div style={{ fontSize: '0.72rem', color: '#475569', marginTop: 2 }}>
                          🏠 Origin Return Rest (DOWN Arrive {downArrTime} ➔ Next UP Depart {upDepTime}): <strong>{turnaroundInfo.origRestText}</strong>
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>Standard Fare:</div>
                        <div style={{ fontSize: '0.67rem', color: '#16a34a', fontWeight: 700 }}>Flat price for every intermediate station</div>
                      </div>
                      <div className="input-wrap" style={{ width: 110 }}>
                        <span style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', fontWeight: 700 }}>₹</span>
                        <input
                          type="number"
                          className="form-control"
                          style={{ paddingLeft: 22 }}
                          value={tripFare}
                          onChange={(e) => setTripFare(e.target.value)}
                          min={50}
                          max={4500}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Rest Duration Selector & Auto-Setter (1 hr to 12 hrs) */}
                  <div
                    style={{
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: 8,
                      padding: '10px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 10,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0f172a' }}>
                        ⏱️ Select Turnaround Rest Buffer (1h to 12h):
                      </span>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {['1', '2', '3', '4', '6', '8', '12'].map((hr) => {
                          const isSel = restHoursBuffer === hr;
                          return (
                            <button
                              key={`rest-${hr}`}
                              type="button"
                              onClick={() => {
                                setRestHoursBuffer(hr);
                                applyRestToDownDep(hr);
                              }}
                              style={{
                                background: isSel ? '#2563eb' : '#f1f5f9',
                                color: isSel ? '#ffffff' : '#334155',
                                border: isSel ? '1px solid #1d4ed8' : '1px solid #cbd5e1',
                                borderRadius: 4,
                                padding: '3px 8px',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                            >
                              {hr}h
                            </button>
                          );
                        })}
                      </div>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <input
                          type="number"
                          min={1}
                          max={12}
                          step={0.5}
                          value={restHoursBuffer}
                          onChange={(e) => {
                            const val = e.target.value;
                            setRestHoursBuffer(val);
                            if (Number(val) >= 1 && Number(val) <= 12) {
                              applyRestToDownDep(val);
                            }
                          }}
                          style={{ width: 55, padding: '3px 6px', fontSize: '0.74rem', borderRadius: 4, border: '1px solid #cbd5e1', textAlign: 'center' }}
                        />
                        <span style={{ fontSize: '0.72rem', color: '#64748b' }}>hrs</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() => applyRestToDownDep(restHoursBuffer)}
                      style={{ fontSize: '0.74rem', padding: '4px 10px', fontWeight: 700, color: '#2563eb', borderColor: '#93c5fd' }}
                    >
                      ⚡ Auto-Sync DOWN Dep ({restHoursBuffer}h from UP Arrival)
                    </button>
                  </div>
                </div>

                {/* Save Schedules Button */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                  {!turnaroundInfo.isValid && (
                    <div style={{ fontSize: '0.74rem', color: '#dc2626', fontWeight: 700 }}>
                      ⚠️ {turnaroundInfo.error}
                    </div>
                  )}
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleSaveRoundTripSchedules}
                    disabled={scheduleLoading || !turnaroundInfo.isValid}
                    style={{
                      padding: '9px 24px',
                      fontWeight: 800,
                      fontSize: '0.9rem',
                      opacity: (!turnaroundInfo.isValid) ? 0.5 : 1,
                      cursor: (!turnaroundInfo.isValid) ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {scheduleLoading ? 'Saving Schedules…' : '🚀 Save & Publish Round-Trip Schedules'}
                  </button>
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '36px', color: '#94a3b8' }}>
                Please select an assigned bus from the dropdown above to view its route and configure UP/DOWN schedules.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
         MODAL 1: BUS DETAILS & SPECIFICATIONS (Module 7C)
         ───────────────────────────────────────────────────────────── */}
      {showBusDetailsModal && selectedBus && (
        <div className="modal-overlay" onClick={() => setShowBusDetailsModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 650, width: '92%' }}>
            <div className="modal-header-row">
              <div>
                <div className="modal-title">🚍 {selectedBus.vehicleNumber} &bull; {selectedBus.busName}</div>
                <div className="modal-sub">Coach Details, Dynamic Seat Layout &amp; Operating Route</div>
              </div>
              <button className="modal-close" onClick={() => setShowBusDetailsModal(false)}>✕</button>
            </div>

            <div className="modal-body-scroll">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 14, fontSize: '0.82rem' }}>
                <div><strong>Bus Type:</strong> {selectedBus.busType || selectedBus.vehicleType}</div>
                <div><strong>Total Capacity:</strong> {selectedBus.totalSeats} Passenger Seats</div>
                <div><strong>Status:</strong> {selectedBus.status}</div>
                <div><strong>Rating:</strong> ⭐ {selectedBus.rating || 4.5}</div>
              </div>

              {/* Active Route Assignment */}
              <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 14 }}>
                <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#0f172a', marginBottom: 4 }}>
                  🛣️ Active Permanent Route Assignment
                </div>
                {selectedBus.assignedRoute ? (
                  <div style={{ fontSize: '0.78rem', color: '#334155', lineHeight: 1.5 }}>
                    <div><strong>Route:</strong> {selectedBus.assignedRoute.originCity} ↔ {selectedBus.assignedRoute.destCity}</div>
                    <div><strong>Corridor:</strong> {selectedBus.assignedRoute.corridorName} ({selectedBus.assignedRoute.distanceKm} km)</div>
                    <div><strong>Intermediate Stations:</strong> {selectedBus.assignedRoute.intermediateStops?.join(' ➔ ')}</div>
                    <div><strong>Standard Fare:</strong> ₹{selectedBus.roundTripSchedule?.fare || 650} (Flat price for all intermediate stations)</div>
                    <div><strong>Assigned On:</strong> {new Date(selectedBus.assignedRoute.assignedAt).toLocaleDateString()}</div>
                  </div>
                ) : (
                  <div style={{ fontSize: '0.76rem', color: '#94a3b8' }}>No permanent route assigned yet.</div>
                )}
              </div>

              {/* Dynamic Seat Layout Visualization from BusSeatLayout */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#0f172a', marginBottom: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>💺 Dynamic Coach Seat Layout ({selectedBus.totalSeats || 40} Seats)</span>
                  <span style={{ fontSize: '0.74rem', color: '#2563eb', fontWeight: 700 }}>{selectedBus.busType || selectedBus.vehicleType}</span>
                </div>
                <div style={{ background: '#f8fafc', padding: 12, borderRadius: 10, border: '1px solid #e2e8f0', overflowX: 'auto' }}>
                  <BusSeatLayout
                    busType={selectedBus.busType || selectedBus.vehicleType}
                    totalSeats={selectedBus.totalSeats || 40}
                    fare={selectedBus.roundTripSchedule?.fare || 650}
                    isPreview={true}
                  />
                </div>
              </div>

              {/* Amenities */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#0f172a', marginBottom: 6 }}>
                  Amenities
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {(selectedBus.amenities || []).map((am) => (
                    <span key={am} style={{ background: '#eff6ff', color: '#1d4ed8', fontSize: '0.72rem', padding: '3px 8px', borderRadius: 4, fontWeight: 600 }}>
                      ✓ {am}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 18px', borderTop: '1px solid #e2e8f0', flexWrap: 'wrap', gap: 8 }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => handleDeleteBus(selectedBus)}
                style={{ padding: '6px 14px', color: '#dc2626', borderColor: '#fca5a5', background: '#fff5f5' }}
                title="Delete this bus from fleet (Blocked if currently in trip or has active bookings)"
              >
                🗑️ Delete Bus
              </button>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowBusDetailsModal(false)}
                  style={{ padding: '6px 14px' }}
                >
                  Close
                </button>
                {(selectedBus.assignedRoute || selectedBus.status === 'Assigned') && (
                  <>
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() => handleUnassignRoute(selectedBus)}
                      style={{ padding: '6px 14px', color: '#b45309', borderColor: '#fde68a' }}
                      title="Unassign route from this bus"
                    >
                      Unassign Route
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => {
                        setShowBusDetailsModal(false);
                        handleOpenChangeRoute(selectedBus);
                      }}
                      style={{ padding: '6px 16px' }}
                    >
                      Change Route
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
         MODAL 2: CHANGE ROUTE ASSIGNMENT MODAL (Module 6)
         ───────────────────────────────────────────────────────────── */}
      {showChangeRouteModal && selectedBus && (
        <div className="modal-overlay" onClick={() => setShowChangeRouteModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 880, width: '95%', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header-row" style={{ padding: '14px 20px', borderBottom: '1px solid #e2e8f0' }}>
              <div>
                <div className="modal-title" style={{ fontSize: '1.08rem', fontWeight: 800 }}>
                  🔄 Change Route Assignment: {selectedBus.vehicleNumber} ({selectedBus.busName})
                </div>
                <div className="modal-sub" style={{ fontSize: '0.78rem', color: '#64748b' }}>
                  Reassign bus to a new route corridor with interactive road map & intermediate stop controls
                </div>
              </div>
              <button className="modal-close" onClick={() => setShowChangeRouteModal(false)}>✕</button>
            </div>

            <div className="modal-body-scroll" style={{ padding: '16px 20px', overflowY: 'auto' }}>
              {changeError && <div className="alert alert-error" style={{ marginBottom: 12 }}>⚠️ {changeError}</div>}

              {/* Current Route Banner */}
              <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 14, fontSize: '0.8rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    Current Assigned Route: <strong style={{ color: '#1d4ed8' }}>{selectedBus.assignedRoute?.originCity} ↔ {selectedBus.assignedRoute?.destCity}</strong>
                  </div>
                  <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: 12, fontSize: '0.72rem', fontWeight: 700 }}>
                    {selectedBus.assignedRoute?.distanceKm} km &bull; {selectedBus.assignedRoute?.durationEst}
                  </span>
                </div>
                <div style={{ color: '#64748b', fontSize: '0.74rem', marginTop: 3 }}>
                  Corridor: {selectedBus.assignedRoute?.corridorName}
                </div>
                {selectedBus.assignedRoute?.intermediateStops?.length > 0 && (
                  <div style={{ color: '#475569', fontSize: '0.72rem', marginTop: 3 }}>
                    Current Stops: {selectedBus.assignedRoute.intermediateStops.join(' ➔ ')}
                  </div>
                )}
              </div>

              {/* Conflict Warning if passenger bookings exist */}
              {changeConflicts && (
                <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', padding: 12, borderRadius: 8, marginBottom: 14 }}>
                  <div style={{ color: '#991b1b', fontWeight: 800, fontSize: '0.84rem', marginBottom: 4 }}>
                    ⚠️ {changeConflicts.conflictCount} Active Passenger Bookings Detected!
                  </div>
                  <div style={{ fontSize: '0.76rem', color: '#b91c1c', lineHeight: 1.4, marginBottom: 8 }}>
                    {changeConflicts.message}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#7f1d1d' }}>
                    Reassignment will end the current route at the effective date and create a new assignment while preserving old passenger trip history.
                  </div>
                </div>
              )}

              {/* Step 2: New Origin & Destination Selection */}
              <div style={{ marginBottom: 16 }}>
                <label className="form-label" style={{ fontWeight: 800, marginBottom: 8, fontSize: '0.84rem', color: '#0f172a' }}>
                  Step 2: Select New Origin & Destination Cities
                </label>
                <div className="form-row" style={{ marginBottom: 8 }}>
                  <OsmLocationSelector
                    label="New Origin City *"
                    value={changeOrigin}
                    onChange={(name, item) => {
                      setChangeOrigin(name);
                      if (item) setChangeOriginCoords(item);
                      if (name && changeDest && name.trim().toLowerCase() !== changeDest.trim().toLowerCase()) {
                        handleDiscoverChangeCorridors(name, changeDest, null, null, item, changeDestCoords);
                      }
                    }}
                    approvedCities={approvedCities}
                    placeholder="e.g. Chennai..."
                  />
                  <OsmLocationSelector
                    label="New Destination City *"
                    value={changeDest}
                    onChange={(name, item) => {
                      setChangeDest(name);
                      if (item) setChangeDestCoords(item);
                      if (changeOrigin && name && changeOrigin.trim().toLowerCase() !== name.trim().toLowerCase()) {
                        handleDiscoverChangeCorridors(changeOrigin, name, null, null, changeOriginCoords, item);
                      }
                    }}
                    onRequestMissing={(item) => handleOpenRequestModal(item, 'change')}
                    approvedCities={approvedCities}
                    placeholder="e.g. Ongole or Guntur or Vijayawada..."
                  />
                </div>
                {/* Quick Helper for Missing City / Town Request in Change Route Modal */}
                <div
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    marginBottom: 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.74rem',
                  }}
                >
                  <span style={{ color: '#64748b' }}>
                    🛡️ Target destination unapproved or missing? Raise platform request with OSM Locator:
                  </span>
                  <button
                    type="button"
                    onClick={() => handleOpenRequestModal(null, 'change')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#2563eb',
                      fontWeight: 700,
                      cursor: 'pointer',
                      padding: 0,
                      textDecoration: 'underline',
                    }}
                  >
                    + Raise Route Request →
                  </button>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => handleDiscoverChangeCorridors(changeOrigin, changeDest, null, null, changeOriginCoords, changeDestCoords)}
                    disabled={changeLoading || !changeOrigin || !changeDest}
                    style={{ padding: '5px 14px', fontSize: '0.76rem', fontWeight: 700 }}
                  >
                    {changeLoading ? '🔍 Discovering Corridors…' : '🔍 Find Available Corridors'}
                  </button>
                </div>
              </div>

              {/* Step 3: Select Discovered Corridor */}
              {changeCorridors.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <label className="form-label" style={{ fontWeight: 800, marginBottom: 8, fontSize: '0.84rem', color: '#0f172a' }}>
                    Step 3: Select New Route Corridor:
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {changeCorridors.map((c) => {
                      const isSelected = selectedChangeCorridorId === c.corridorId;
                      return (
                        <div
                          key={c.corridorId}
                          onClick={() => handleSelectChangeCorridor(c.corridorId)}
                          style={{
                            border: isSelected ? '2px solid #2563eb' : '1px solid #cbd5e1',
                            background: isSelected ? '#eff6ff' : '#ffffff',
                            borderRadius: 8,
                            padding: '10px 14px',
                            cursor: 'pointer',
                            transition: 'all 0.12s ease',
                            boxShadow: isSelected ? '0 2px 8px rgba(37, 99, 235, 0.12)' : 'none',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 800, fontSize: '0.86rem', color: isSelected ? '#1e40af' : '#0f172a' }}>
                              {c.name}
                            </span>
                            <span style={{ fontWeight: 700, fontSize: '0.78rem', color: '#1e40af' }}>
                              {c.distance} km &bull; ⏱️ Est. Travel: {c.duration}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 3 }}>
                            Major Towns: {c.majorTowns?.join(' ➔ ')}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Step 4: Map Visualizer Preview */}
              {changeCorridors.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <label className="form-label" style={{ fontWeight: 800, marginBottom: 6, fontSize: '0.84rem', color: '#0f172a' }}>
                    Step 4: Interactive Route Corridor Map & Stop Visualizer:
                  </label>
                  <RouteCorridorMap
                    source={changeOriginCoords || getCityCoords(changeOrigin) || { name: changeOrigin, lat: 13.0827, lng: 80.2707 }}
                    destination={changeDestCoords || getCityCoords(changeDest) || { name: changeDest, lat: 16.5062, lng: 80.6480 }}
                    corridors={changeCorridors}
                    selectedCorridorId={selectedChangeCorridorId || changeCorridors[0]?.corridorId}
                    onSelectCorridor={handleSelectChangeCorridor}
                    routeStops={changeOrderedStations.filter((s) => selectedChangeStationIds.includes(s.id))}
                    suggestedStops={changeOrderedStations.filter((s) => !selectedChangeStationIds.includes(s.id))}
                    onToggleStop={(st) => handleToggleChangeStation(st.id)}
                    height={260}
                  />
                </div>
              )}

              {/* Step 5: Pick Main Towns and Famous Places (In Map Progression Order) */}
              {changeCorridors.length > 0 && changeOrderedStations.length > 0 && (
                <div
                  style={{
                    marginBottom: 16,
                    border: '1.5px solid #bfdbfe',
                    borderRadius: 10,
                    background: '#f8fafc',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      background: '#eff6ff',
                      padding: '10px 14px',
                      borderBottom: '1px solid #bfdbfe',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 8,
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#1e40af' }}>
                        📍 Step 5: Main Towns & Famous RTC Places along Route Corridor (In Strict Map Order)
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#475569', marginTop: 2 }}>
                        Derived from road geometry & corridor polyline. Ordered strictly from {changeOrigin} to {changeDest}.
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={handleSelectAllChangeStations}
                        style={{
                          background: '#2563eb',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 6,
                          padding: '3px 8px',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        ✓ Select All ({changeOrderedStations.length})
                      </button>
                      <button
                        type="button"
                        onClick={handleSelectTerminalsOnlyChangeStations}
                        style={{
                          background: '#7c3aed',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 6,
                          padding: '3px 8px',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        🏛️ RTC Terminals Only ({changeOrderedStations.filter((s) => s.type === 'TERMINAL').length})
                      </button>
                      <button
                        type="button"
                        onClick={handleClearAllChangeStations}
                        style={{
                          background: '#e2e8f0',
                          color: '#475569',
                          border: 'none',
                          borderRadius: 6,
                          padding: '3px 8px',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        ✕ Clear All
                      </button>
                      <span
                        style={{
                          background: selectedChangeStationIds.length > 0 ? '#dcfce7' : '#fee2e2',
                          color: selectedChangeStationIds.length > 0 ? '#15803d' : '#991b1b',
                          padding: '3px 8px',
                          borderRadius: 6,
                          fontSize: '0.7rem',
                          fontWeight: 800,
                        }}
                      >
                        {selectedChangeStationIds.length} of {changeOrderedStations.length} Stations Assigned
                      </span>
                    </div>
                  </div>

                  {/* Stations Table */}
                  <div style={{ overflowX: 'auto', maxHeight: 220, overflowY: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.74rem' }}>
                      <thead>
                        <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1', textAlign: 'left', color: '#475569' }}>
                          <th style={{ padding: '6px 10px', width: '36px', textAlign: 'center' }}>Assign</th>
                          <th style={{ padding: '6px 8px', width: '50px' }}>Seq #</th>
                          <th style={{ padding: '6px 10px' }}>Station & RTC Hub</th>
                          <th style={{ padding: '6px 10px' }}>Type</th>
                          <th style={{ padding: '6px 10px' }}>Distance</th>
                          <th style={{ padding: '6px 10px' }}>Est. Travel</th>
                          <th style={{ padding: '6px 10px' }}>Schedule Halt (10m)</th>
                          <th style={{ padding: '6px 10px', textAlign: 'right' }}>Ticket Fare</th>
                          <th style={{ padding: '6px 10px', textAlign: 'center' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {changeOrderedStations.map((st, idx) => {
                          const isAssigned = selectedChangeStationIds.includes(st.id);
                          return (
                            <tr
                              key={st.id}
                              onClick={() => handleToggleChangeStation(st.id)}
                              style={{
                                borderBottom: '1px solid #e2e8f0',
                                background: isAssigned ? '#ffffff' : '#f8fafc',
                                opacity: isAssigned ? 1 : 0.65,
                                cursor: 'pointer',
                                transition: 'background 0.1s ease',
                              }}
                            >
                              <td style={{ padding: '6px 10px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="checkbox"
                                  checked={isAssigned}
                                  onChange={() => handleToggleChangeStation(st.id)}
                                  style={{ width: 15, height: 15, cursor: 'pointer', accentColor: '#2563eb' }}
                                />
                              </td>
                              <td style={{ padding: '6px 8px' }}>
                                <span
                                  style={{
                                    background: isAssigned ? '#2563eb' : '#94a3b8',
                                    color: '#fff',
                                    borderRadius: '50%',
                                    width: 20,
                                    height: 20,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 800,
                                    fontSize: '0.68rem',
                                  }}
                                >
                                  {idx + 1}
                                </span>
                              </td>
                              <td style={{ padding: '6px 10px' }}>
                                <div style={{ fontWeight: 800, color: isAssigned ? '#0f172a' : '#64748b' }}>
                                  {st.fullName}
                                </div>
                              </td>
                              <td style={{ padding: '6px 10px' }}>
                                <span
                                  style={{
                                    background: st.type === 'TERMINAL' ? '#f3e8ff' : '#e0f2fe',
                                    color: st.type === 'TERMINAL' ? '#7e22ce' : '#0369a1',
                                    padding: '1px 6px',
                                    borderRadius: 4,
                                    fontWeight: 700,
                                    fontSize: '0.65rem',
                                  }}
                                >
                                  {st.type === 'TERMINAL' ? '🏛️ Terminal' : '🏙️ Town'}
                                </span>
                              </td>
                              <td style={{ padding: '6px 10px', fontWeight: 700, color: '#0f172a' }}>
                                📍 {st.distanceFromOriginKm} km
                              </td>
                              <td style={{ padding: '6px 10px', color: '#1e40af', fontWeight: 700 }}>
                                ⏱️ {st.elapsedTimeStr}
                              </td>
                              <td style={{ padding: '6px 10px' }}>
                                <div style={{ color: '#15803d', fontWeight: 700 }}>
                                  🕒 Arr: {st.estimatedArrivalTime}
                                </div>
                                <div style={{ color: '#475569', fontSize: '0.68rem' }}>
                                  ➔ Dep: {st.estimatedDepartureTime}
                                </div>
                              </td>
                              <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 800, color: '#16a34a' }}>
                                ₹{selectedBus?.roundTripSchedule?.fare || tripFare || 650}
                              </td>
                              <td style={{ padding: '6px 10px', textAlign: 'center' }}>
                                <span
                                  style={{
                                    background: isAssigned ? '#dcfce7' : '#f1f5f9',
                                    color: isAssigned ? '#15803d' : '#64748b',
                                    padding: '2px 6px',
                                    borderRadius: 10,
                                    fontWeight: 800,
                                    fontSize: '0.65rem',
                                  }}
                                >
                                  {isAssigned ? '✓ Assigned' : 'Excluded'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Transition Date */}
              <div className="form-group" style={{ marginBottom: 12 }}>
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                  Effective Transition Date *
                </label>
                <input
                  type="date"
                  className="form-control"
                  value={changeEffectiveDate}
                  onChange={(e) => setChangeEffectiveDate(e.target.value)}
                />
                <span className="form-hint">* Date on which the new corridor becomes active.</span>
              </div>
            </div>

            <div style={{ padding: '12px 20px', borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
              {!changeRouteValidation.isValid && (
                <div style={{
                  background: '#fffbeb',
                  border: '1px solid #fde68a',
                  borderRadius: 6,
                  padding: '8px 12px',
                  fontSize: '0.74rem',
                  color: '#92400e',
                  marginBottom: 10,
                }}>
                  <strong>⚠️ Incomplete Route Reassignment:</strong>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                    {changeRouteValidation.errors.map((err, idx) => (
                      <span key={idx} style={{ background: '#fef3c7', padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>
                        &bull; {err}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowChangeRouteModal(false)}
                  style={{ padding: '7px 16px' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => handleConfirmChangeRoute(true)}
                  disabled={!changeRouteValidation.isValid || changeLoading}
                  style={{
                    padding: '7px 22px',
                    fontWeight: 800,
                    opacity: changeRouteValidation.isValid ? 1 : 0.45,
                    cursor: changeRouteValidation.isValid ? 'pointer' : 'not-allowed',
                  }}
                >
                  {changeLoading ? 'Reassigning…' : `Confirm Route Reassignment (${selectedChangeStationIds.length || changeOrderedStations.length} Stations) ➔`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
         MODAL 3: RAISE ROUTE DESTINATION REQUEST (OpenStreetMap Locator)
         City / Town Name is strictly NON-EDITABLE, populated exclusively
         from OpenStreetMap Locator selection.
         ───────────────────────────────────────────────────────────── */}
      {showRequestModal && (
        <div className="modal-overlay" onClick={() => setShowRequestModal(false)}>
          <div
            className="modal-box"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 640, width: '92%' }}
          >
            <div className="modal-header-row" style={{ padding: '14px 20px', borderBottom: '1px solid #e2e8f0' }}>
              <div>
                <div className="modal-title" style={{ fontSize: '1.05rem', fontWeight: 800 }}>
                  📍 Raise Route Destination Request
                </div>
                <div className="modal-sub" style={{ fontSize: '0.76rem', color: '#64748b' }}>
                  Request platform approval for a new town or bus stop via OpenStreetMap locator.
                </div>
              </div>
              <button className="modal-close" onClick={() => setShowRequestModal(false)}>
                ✕
              </button>
            </div>

            <div className="modal-body-scroll" style={{ padding: '16px 20px', maxHeight: '75vh', overflowY: 'auto' }}>
              {reqError && <div className="alert alert-error" style={{ marginBottom: 12 }}>⚠️ {reqError}</div>}
              {reqSuccess && <div className="alert alert-success" style={{ marginBottom: 12 }}>{reqSuccess}</div>}

              <form onSubmit={handleRaiseRequest}>
                {/* Step 1: OpenStreetMap Locator Live Search & Validation */}
                <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1rem' }}>
                  <label className="form-label" style={{ fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>
                    🔍 Search &amp; Validate Location on OpenStreetMap *
                  </label>
                  <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0 0 8px' }}>
                    Type the destination city, town, or bus stop. You must select a verified OpenStreetMap result to populate coordinates and OSM ID.
                  </p>

                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Nayudupeta, Kavali, Ongole, Tirupati, Chirala..."
                      value={modalOsmSearch}
                      onChange={(e) => handleModalSearchChange(e.target.value)}
                      style={{ paddingRight: modalOsmSearch ? '65px' : undefined }}
                    />
                    {modalOsmSearch && !modalOsmLoading && (
                      <button
                        type="button"
                        onClick={() => {
                          setModalOsmSearch('');
                          setModalOsmResults([]);
                          setSelectedOsmItem(null);
                          setReqForm((prev) => ({
                            ...prev,
                            cityName: '',
                            displayName: '',
                            osmId: '',
                            latitude: null,
                            longitude: null,
                          }));
                        }}
                        style={{
                          position: 'absolute',
                          right: 10,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#94a3b8',
                          fontSize: '0.85rem',
                        }}
                        title="Clear OSM search"
                      >
                        ✕
                      </button>
                    )}
                    {modalOsmLoading && (
                      <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: '0.75rem', color: '#3b82f6' }}>
                        Searching OSM...
                      </span>
                    )}
                  </div>

                  {/* OSM Live Search Results Dropdown */}
                  {modalOsmResults.length > 0 && (
                    <div
                      style={{
                        background: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: 6,
                        marginTop: 4,
                        maxHeight: 180,
                        overflowY: 'auto',
                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                      }}
                    >
                      {modalOsmResults.map((item, idx) => (
                        <div
                          key={idx}
                          onClick={() => handleSelectModalOsm(item)}
                          style={{
                            padding: '8px 12px',
                            borderBottom: '1px solid #f1f5f9',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = '#f0fdf4')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = '#ffffff')}
                        >
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>
                            {item.name} <span style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 600 }}>({item.locationType})</span>
                          </div>
                          <div style={{ color: '#64748b', fontSize: '0.72rem' }}>{item.displayName}</div>
                          <div style={{ color: '#94a3b8', fontSize: '0.68rem' }}>
                            OSM ID: {item.osmId} &bull; {item.latitude?.toFixed(4)}°, {item.longitude?.toFixed(4)}°
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Selected Verified OSM Location Card */}
                  {selectedOsmItem ? (
                    <div
                      style={{
                        background: '#ecfdf5',
                        border: '1px solid #a7f3d0',
                        borderRadius: 6,
                        padding: '10px 12px',
                        marginTop: 10,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.84rem', color: '#065f46' }}>
                          ✓ Verified OSM Location: {selectedOsmItem.name}
                        </span>
                        <span style={{ background: '#d1fae5', color: '#065f46', padding: '2px 8px', borderRadius: 10, fontSize: '0.7rem', fontWeight: 700 }}>
                          OSM ID: {selectedOsmItem.osmId}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#047857', marginTop: 2 }}>
                        {selectedOsmItem.displayName}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#059669', marginTop: 2 }}>
                        Type: <strong>{selectedOsmItem.locationType || 'city'}</strong> &bull; Lat: <strong>{selectedOsmItem.latitude}</strong> &bull; Lon: <strong>{selectedOsmItem.longitude}</strong>
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.72rem', color: '#d97706', marginTop: 6 }}>
                      ⚠️ No location selected yet. Search above and click a suggested OSM location.
                    </div>
                  )}
                </div>

                {/* City Name & State: STRICTLY NON-EDITABLE AS REQUIRED */}
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>City / Town Name *</span>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          color: reqForm.cityName ? '#16a34a' : '#d97706',
                        }}
                      >
                        {reqForm.cityName ? '🔒 Non-editable — Brought from OSM Locator' : '⚠️ Select from OSM above'}
                      </span>
                    </label>
                    <input
                      type="text"
                      className="form-control no-icon"
                      placeholder="Selected from OpenStreetMap (Non-editable)"
                      value={reqForm.cityName}
                      readOnly
                      required
                      style={{
                        backgroundColor: '#f1f5f9',
                        color: reqForm.cityName ? '#0f172a' : '#64748b',
                        cursor: 'not-allowed',
                        fontWeight: reqForm.cityName ? 700 : 400,
                        border: '1.5px solid #cbd5e1',
                      }}
                    />
                    <span className="form-hint" style={{ fontSize: '0.72rem', color: '#64748b' }}>
                      * Non-editable: Automatically brought from the OpenStreetMap selection above.
                    </span>
                  </div>

                  <div className="form-group">
                    <label className="form-label">State / Region *</label>
                    <select
                      className="form-control no-icon"
                      value={reqForm.state}
                      onChange={(e) => setReqForm({ ...reqForm, state: e.target.value })}
                      style={{ cursor: 'pointer' }}
                    >
                      {STATE_OPTIONS.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Hub Classification */}
                <div className="form-group">
                  <label className="form-label">Hub / Classification</label>
                  <select
                    className="form-control no-icon"
                    value={reqForm.hubType}
                    onChange={(e) => setReqForm({ ...reqForm, hubType: e.target.value })}
                    style={{ cursor: 'pointer' }}
                  >
                    {HUB_TYPES.map((ht) => (
                      <option key={ht} value={ht}>
                        {ht}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Proposed Corridor */}
                <div className="form-group">
                  <label className="form-label">Proposed Connecting Corridor</label>
                  <input
                    type="text"
                    className="form-control no-icon"
                    placeholder="e.g. Chennai ↔ Ongole via Nayudupeta, Nellore, Kavali"
                    value={reqForm.connectingRoutes}
                    onChange={(e) => setReqForm({ ...reqForm, connectingRoutes: e.target.value })}
                  />
                  <span className="form-hint">Specify which major approved cities this new destination will connect with.</span>
                </div>

                {/* Commuter Demand */}
                <div className="form-group">
                  <label className="form-label">Commuter Demand &amp; Justification</label>
                  <textarea
                    className="form-control no-icon"
                    rows={3}
                    placeholder="e.g. High weekend passenger traffic, IT corridor daily commuters, student movement. Expected daily occupancy > 80%."
                    value={reqForm.reason}
                    onChange={(e) => setReqForm({ ...reqForm, reason: e.target.value })}
                    style={{ resize: 'vertical' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
                  <button
                    type="button"
                    className="btn"
                    onClick={() => setShowRequestModal(false)}
                    style={{ padding: '8px 16px', background: '#f1f5f9', border: '1px solid #cbd5e1' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={reqLoading || !reqForm.cityName || !reqForm.osmId}
                    style={{ padding: '8px 20px', fontWeight: 700 }}
                  >
                    {reqLoading ? 'Submitting…' : 'Submit Request to Admin'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
