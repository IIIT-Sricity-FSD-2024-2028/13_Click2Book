import React, { useState, useEffect, useMemo } from 'react';
import {
  getFleetBuses,
  getFleetStats,
  registerNewBus,
  saveBusSeatLayout,
  assignBusToRoute,
  changeBusRoute,
  saveRoundTripSchedules,
  updateBusStatus,
  deleteBus,
  generateDefaultSeatLayout,
  discoverRouteCorridors,
  getCityCoords,
  getApprovedCities,
  validateVehicleNumberPlate,
  normalizeVehiclePlate,
  isBusInActiveTrip,
  parseDurationToMinutes,
  computeArrivalTime,
  validateFutureDeparture,
  checkBusActiveBookings,
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
  { id: 'MON', label: 'Mon' },
  { id: 'TUE', label: 'Tue' },
  { id: 'WED', label: 'Wed' },
  { id: 'THU', label: 'Thu' },
  { id: 'FRI', label: 'Fri' },
  { id: 'SAT', label: 'Sat' },
  { id: 'SUN', label: 'Sun' },
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
  });
  const [regError, setRegError] = useState('');
  const [regLoading, setRegLoading] = useState(false);

  // ── Route Assignment State ──
  const [assignBusId, setAssignBusId] = useState('');
  const [assignOrigin, setAssignOrigin] = useState('Chennai');
  const [assignDest, setAssignDest] = useState('Vijayawada');
  const [discoveredCorridors, setDiscoveredCorridors] = useState([]);
  const [selectedCorridorId, setSelectedCorridorId] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignError, setAssignError] = useState('');

  // ── Change Route Modal State ──
  const [changeRouteData, setChangeRouteData] = useState({
    originCity: '',
    destCity: '',
    corridorId: '',
    corridorName: '',
    intermediateStops: [],
    effectiveDate: new Date().toISOString().split('T')[0],
  });
  const [changeConflicts, setChangeConflicts] = useState(null);
  const [changeError, setChangeError] = useState('');

  // ── Round-Trip (UP/DOWN) Scheduling State ──
  const [scheduleBusId, setScheduleBusId] = useState('');
  const [scheduleStartDate, setScheduleStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [scheduleEndDate, setScheduleEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  });
  const [upDepTime, setUpDepTime] = useState('06:00');
  const [upArrTime, setUpArrTime] = useState('14:30');
  const [upDays, setUpDays] = useState(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']);
  const [downDepTime, setDownDepTime] = useState('20:00');
  const [downArrTime, setDownArrTime] = useState('04:30');
  const [downDays, setDownDays] = useState(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']);
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
  };

  useEffect(() => {
    refreshFleet();
    window.addEventListener('storage', refreshFleet);
    return () => window.removeEventListener('storage', refreshFleet);
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

  // Assigned buses list
  const assignedBusesList = useMemo(() => {
    return buses.filter((b) => b.assignedRoute && b.status === 'Assigned');
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

  // Turnaround rest time calculation
  const turnaroundInfo = useMemo(() => {
    if (!upArrTime || !downDepTime) return { mins: 0, text: '—', isValid: true };
    const [uh, um] = upArrTime.split(':').map(Number);
    const [dh, dm] = downDepTime.split(':').map(Number);
    let diff = (dh * 60 + dm) - (uh * 60 + um);
    if (diff < 0) diff += 24 * 60;
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    const isValid = diff >= 60; // At least 1 hour rest time between journeys
    return {
      mins: diff,
      text: `${h}h ${m}m`,
      isValid,
    };
  }, [upArrTime, downDepTime]);

  // Route travel duration in minutes (derived from assigned corridor)
  const routeDurationMins = useMemo(() => {
    if (!currentScheduleBus?.assignedRoute?.durationEst) return 360;
    return parseDurationToMinutes(currentScheduleBus.assignedRoute.durationEst);
  }, [currentScheduleBus]);

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

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const curHHMM = useMemo(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }, []);

  /* ─────────────────────────────────────────────────────────────
     Delete Bus Handler (Protected: Cannot be deleted if in trip or has active bookings)
     ───────────────────────────────────────────────────────────── */
  const handleDeleteBus = async (bus) => {
    if (!bus) return;

    // 1. Strict Validation: Bus cannot be deleted if currently running an active trip
    const liveTrip = isBusInActiveTrip(bus.vehicleNumber);
    if (liveTrip) {
      showToast(
        `⛔ Cannot delete bus ${bus.vehicleNumber}! It is currently in a trip (${liveTrip.from} → ${liveTrip.to}, Trip ID: ${liveTrip.tripId}). Buses currently in a trip cannot be deleted.`,
        'error'
      );
      return;
    }

    // 2. Strict Validation: Bus cannot be deleted if upcoming confirmed bookings exist
    const activeBookings = checkBusActiveBookings(bus.vehicleNumber);
    if (activeBookings && activeBookings.length > 0) {
      showToast(
        `⛔ Cannot delete bus ${bus.vehicleNumber}! It has ${activeBookings.length} upcoming passenger bookings. Please complete or cancel bookings before deleting.`,
        'error'
      );
      return;
    }

    // 3. Confirm Deletion
    const isAssigned = bus.assignedRoute || bus.status === 'Assigned';
    const confirmMsg = isAssigned
      ? `Are you sure you want to permanently delete bus "${bus.vehicleNumber}" (${bus.busName})?\n\nThis bus is currently assigned to route "${bus.assignedRoute?.originCity} ↔ ${bus.assignedRoute?.destCity}". Deleting it will also remove this permanent route assignment.`
      : `Are you sure you want to delete bus "${bus.vehicleNumber}" (${bus.busName}) from your fleet?`;

    if (!window.confirm(confirmMsg)) {
      return;
    }

    try {
      await deleteBus(bus.vehicleId);
      refreshFleet();
      if (showBusDetailsModal) setShowBusDetailsModal(false);
      showToast(`Bus ${bus.vehicleNumber} successfully deleted from your fleet.`, 'success');
    } catch (err) {
      showToast(err.message || 'Failed to delete bus.', 'error');
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

      refreshFleet();
      showToast(`Bus ${newBus.vehicleNumber} (${regForm.busType}) registered successfully!`, 'success');

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
      });

      setSubTab('overview');
    } catch (err) {
      setRegError(err.message || 'Failed to register bus.');
    } finally {
      setRegLoading(false);
    }
  };

  /* ─────────────────────────────────────────────────────────────
     MODULE 3: Route Discovery & Permanent Assignment
     ───────────────────────────────────────────────────────────── */
  const handleDiscoverCorridors = async () => {
    setAssignError('');
    if (!assignOrigin || !assignDest) {
      setAssignError('Please select both Origin and Destination cities.');
      return;
    }
    if (assignOrigin.toLowerCase() === assignDest.toLowerCase()) {
      setAssignError('Origin and Destination cannot be the same city.');
      return;
    }

    setAssignLoading(true);
    try {
      const srcCoords = getCityCoords(assignOrigin) || { name: assignOrigin, lat: 13.0827, lng: 80.2707 };
      const dstCoords = getCityCoords(assignDest) || { name: assignDest, lat: 16.5062, lng: 80.6480 };

      const discovered = await discoverRouteCorridors(srcCoords, dstCoords);
      setDiscoveredCorridors(discovered);
      setSelectedCorridorId('');
      if (discovered.length === 0) {
        setAssignError('No route corridors discovered between these cities.');
      }
    } catch (err) {
      setAssignError(err.message || 'Failed to discover route corridors.');
    } finally {
      setAssignLoading(false);
    }
  };

  const handleConfirmPermanentAssignment = async () => {
    setAssignError('');
    if (!assignBusId) {
      setAssignError('Please select a registered bus to assign.');
      return;
    }
    if (!selectedCorridorId) {
      setAssignError('Please select an approved route corridor.');
      return;
    }

    const corridor = discoveredCorridors.find((c) => c.corridorId === selectedCorridorId);
    if (!corridor) {
      setAssignError('Selected corridor not found.');
      return;
    }

    try {
      await assignBusToRoute(assignBusId, {
        originCity: assignOrigin,
        destCity: assignDest,
        corridorId: corridor.corridorId,
        corridorName: corridor.name,
        distanceKm: corridor.distance,
        durationEst: corridor.duration,
        intermediateStops: corridor.majorTowns || [],
      });

      refreshFleet();
      showToast(`Bus permanently assigned to ${assignOrigin} ↔ ${assignDest}!`, 'success');
      setSubTab('assigned-table');
    } catch (err) {
      setAssignError(err.message || 'Failed to assign bus to route.');
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
    if (upDays.length === 0 || downDays.length === 0) {
      setScheduleError('Please select operating days for both UP and DOWN journeys.');
      return;
    }

    // Validate that buses cannot run in the past or present time
    const todayStr = new Date().toISOString().split('T')[0];
    const now = new Date();
    const curHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const todayDayName = dayNames[now.getDay()];

    if (scheduleStartDate < todayStr) {
      setScheduleError(`Schedule start date (${scheduleStartDate}) cannot be in the past.`);
      return;
    }
    if (scheduleStartDate === todayStr) {
      if (upDays.includes(todayDayName) && upDepTime <= curHHMM) {
        setScheduleError(
          `UP Journey departure time (${upDepTime}) cannot be earlier than or equal to current time (${curHHMM}) for today. Buses cannot depart in the present or past time. Please select a future departure time or set the start date from tomorrow.`
        );
        return;
      }
      if (downDays.includes(todayDayName) && downDepTime <= curHHMM) {
        setScheduleError(
          `DOWN Journey departure time (${downDepTime}) cannot be earlier than or equal to current time (${curHHMM}) for today. Buses cannot depart in the present or past time.`
        );
        return;
      }
    }

    if (!turnaroundInfo.isValid) {
      setScheduleError(`Warning: Inadequate turnaround rest time (${turnaroundInfo.text}). A minimum of 60 minutes rest between UP arrival and DOWN departure is required.`);
      return;
    }

    setScheduleLoading(true);
    try {
      const intermediateList = currentScheduleBus.assignedRoute.intermediateStops || [];

      await saveRoundTripSchedules(scheduleBusId, {
        upSchedule: {
          departureTime: upDepTime,
          arrivalTime: upArrTime,
          operatingDays: upDays,
          intermediateStops: intermediateList.map((stop) => ({ stopName: stop })),
        },
        downSchedule: {
          departureTime: downDepTime,
          arrivalTime: downArrTime,
          operatingDays: downDays,
          // Reverses intermediate stops automatically for DOWN journey
          intermediateStops: [...intermediateList].reverse().map((stop) => ({ stopName: stop })),
        },
        fare: Number(tripFare) || 650,
        validFrom: scheduleStartDate,
        validUntil: scheduleEndDate,
      });

      refreshFleet();
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
     MODULE 6: Change Route Assignment Handler
     ───────────────────────────────────────────────────────────── */
  const handleOpenChangeRoute = (bus) => {
    setSelectedBus(bus);
    setChangeError('');
    setChangeConflicts(null);
    setChangeRouteData({
      originCity: bus.assignedRoute?.originCity || 'Chennai',
      destCity: bus.assignedRoute?.destCity || 'Vijayawada',
      corridorId: bus.assignedRoute?.corridorId || '',
      corridorName: bus.assignedRoute?.corridorName || '',
      intermediateStops: bus.assignedRoute?.intermediateStops || [],
      effectiveDate: new Date().toISOString().split('T')[0],
    });
    setShowChangeRouteModal(true);
  };

  const handleConfirmChangeRoute = async (forceConfirm = false) => {
    setChangeError('');
    if (!selectedBus) return;

    try {
      const result = await changeBusRoute(
        selectedBus.vehicleId,
        changeRouteData,
        { forceConfirm }
      );

      if (!result.success && result.hasConflicts) {
        setChangeConflicts(result);
        return;
      }

      refreshFleet();
      setShowChangeRouteModal(false);
      showToast(`Route for ${selectedBus.vehicleNumber} successfully updated!`, 'success');
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

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
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
              <h4 style={{ margin: '0 0 6px', color: '#1e293b' }}>No buses match your filter criteria</h4>
              <p style={{ margin: 0, fontSize: '0.84rem', color: '#64748b' }}>
                Try adjusting your search query or register a new bus to your fleet.
              </p>
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
                        </>
                      ) : (
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                  Assigned Buses Table ({assignedBusesList.length} Active Assignments)
                </h4>
                <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#64748b' }}>
                  Buses with persistent corridor bindings and active UP/DOWN round-trip schedule definitions.
                </p>
              </div>
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

                      return (
                        <tr key={bus.vehicleId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '10px', fontWeight: 800, color: '#0f172a' }}>
                            {bus.vehicleNumber}
                            <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 400 }}>{bus.busName}</div>
                          </td>
                          <td style={{ padding: '10px' }}>{bus.busType || bus.vehicleType}</td>
                          <td style={{ padding: '10px', fontWeight: 700 }}>{bus.totalSeats} seats</td>
                          <td style={{ padding: '10px', fontWeight: 700, color: '#1d4ed8' }}>
                            {r.originCity} ↔ {r.destCity}
                          </td>
                          <td style={{ padding: '10px', fontSize: '0.74rem', color: '#475569' }}>
                            {r.corridorName}
                            <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: 2 }}>
                              ⏱️ Est. {r.durationEst || '—'} &bull; {r.distanceKm} km
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
                            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
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
                {buses.map((b) => (
                  <option key={b.vehicleId} value={b.vehicleId} disabled={b.status === 'Maintenance'}>
                    {b.vehicleNumber} &bull; {b.busName} ({b.totalSeats} seats) &bull; [{b.status}]
                    {b.assignedRoute ? ` — Already on ${b.assignedRoute.originCity} ↔ ${b.assignedRoute.destCity}` : ''}
                  </option>
                ))}
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
                onChange={(name) => setAssignOrigin(name)}
                approvedCities={approvedCities}
                placeholder="e.g. Chennai..."
              />
              <OsmLocationSelector
                label="Step 2B: Destination City *"
                value={assignDest}
                onChange={(name) => setAssignDest(name)}
                approvedCities={approvedCities}
                placeholder="e.g. Vijayawada or Guntur..."
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '1.25rem' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleDiscoverCorridors}
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
                        onClick={() => setSelectedCorridorId(c.corridorId)}
                        style={{
                          border: isSelected ? '2px solid #2563eb' : '1px solid #cbd5e1',
                          background: isSelected ? '#eff6ff' : '#ffffff',
                          borderRadius: 8,
                          padding: 12,
                          cursor: 'pointer',
                          transition: 'all 0.12s ease',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0f172a' }}>
                            {c.name}
                          </span>
                          <span style={{ fontWeight: 700, fontSize: '0.8rem', color: '#1e40af' }}>
                            {c.distance} km &bull; ⏱️ Est. Travel: {c.duration}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: 4 }}>
                          Major Stops: {c.majorTowns?.join(' ➔ ')}
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
                  Step 4: Interactive Route Corridor Map:
                </label>
                <RouteCorridorMap
                  source={getCityCoords(assignOrigin) || { name: assignOrigin, lat: 13.0827, lng: 80.2707 }}
                  destination={getCityCoords(assignDest) || { name: assignDest, lat: 16.5062, lng: 80.6480 }}
                  corridors={discoveredCorridors}
                  selectedCorridorId={selectedCorridorId || discoveredCorridors[0]?.corridorId}
                  onSelectCorridor={(id) => setSelectedCorridorId(id)}
                  routeStops={[]}
                  height={280}
                />
              </div>
            )}

            {/* Confirm Assignment Button */}
            {discoveredCorridors.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleConfirmPermanentAssignment}
                  disabled={!assignBusId || !selectedCorridorId}
                  style={{ padding: '9px 24px', fontWeight: 800, fontSize: '0.9rem' }}
                >
                  ✓ Confirm Permanent Route Assignment
                </button>
              </div>
            )}
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
                        onChange={(e) => setScheduleStartDate(e.target.value)}
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
                      <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: 3 }}>
                        Generates recurring journey instances across this window.
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

                    {/* Past / Present Departure Validation Warning */}
                    {scheduleStartDate === todayStr && upDepTime && upDepTime <= curHHMM && (
                      <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#991b1b', padding: '6px 8px', borderRadius: 6, fontSize: '0.72rem', fontWeight: 600, marginBottom: 10 }}>
                        ⚠️ Departure time ({upDepTime}) cannot be in the past or present (current clock: {curHHMM}). Please select a future time.
                      </div>
                    )}

                    {/* Intermediate stops list */}
                    <div style={{ fontSize: '0.74rem', color: '#475569', marginBottom: 10 }}>
                      <strong>Intermediate Stations ({currentScheduleBus.assignedRoute.intermediateStops?.length || 0}):</strong>
                      <div style={{ marginTop: 4, color: '#1e40af', fontWeight: 600 }}>
                        {currentScheduleBus.assignedRoute.intermediateStops?.join(' ➔ ') || 'Point to Point'}
                      </div>
                    </div>

                    {/* Operating Days */}
                    <div>
                      <label className="form-label" style={{ fontSize: '0.76rem', marginBottom: 4 }}>Operating Days</label>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {WEEKDAYS.map((d) => {
                          const isSel = upDays.includes(d.id);
                          return (
                            <button
                              key={d.id}
                              type="button"
                              onClick={() => {
                                if (isSel) setUpDays(upDays.filter((x) => x !== d.id));
                                else setUpDays([...upDays, d.id]);
                              }}
                              style={{
                                background: isSel ? '#16a34a' : '#f1f5f9',
                                color: isSel ? '#ffffff' : '#475569',
                                border: 'none',
                                borderRadius: 4,
                                padding: '3px 8px',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                            >
                              {d.label}
                            </button>
                          );
                        })}
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

                    {/* Past / Present Departure Validation Warning */}
                    {scheduleStartDate === todayStr && downDepTime && downDepTime <= curHHMM && (
                      <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#991b1b', padding: '6px 8px', borderRadius: 6, fontSize: '0.72rem', fontWeight: 600, marginBottom: 10 }}>
                        ⚠️ Departure time ({downDepTime}) cannot be in the past or present (current clock: {curHHMM}). Please select a future time.
                      </div>
                    )}

                    {/* Reversed Intermediate Stops */}
                    <div style={{ fontSize: '0.74rem', color: '#475569', marginBottom: 10 }}>
                      <strong>Reversed Return Stations (Auto-Synchronized):</strong>
                      <div style={{ marginTop: 4, color: '#b45309', fontWeight: 600 }}>
                        {[...(currentScheduleBus.assignedRoute.intermediateStops || [])].reverse().join(' ➔ ') || 'Point to Point'}
                      </div>
                    </div>

                    {/* Operating Days */}
                    <div>
                      <label className="form-label" style={{ fontSize: '0.76rem', marginBottom: 4 }}>Operating Days</label>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {WEEKDAYS.map((d) => {
                          const isSel = downDays.includes(d.id);
                          return (
                            <button
                              key={d.id}
                              type="button"
                              onClick={() => {
                                if (isSel) setDownDays(downDays.filter((x) => x !== d.id));
                                else setDownDays([...downDays, d.id]);
                              }}
                              style={{
                                background: isSel ? '#d97706' : '#f1f5f9',
                                color: isSel ? '#ffffff' : '#475569',
                                border: 'none',
                                borderRadius: 4,
                                padding: '3px 8px',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                            >
                              {d.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Rest / Turnaround Time & Fare Box */}
                <div
                  style={{
                    background: turnaroundInfo.isValid ? '#f0fdf4' : '#fef2f2',
                    border: `1px solid ${turnaroundInfo.isValid ? '#86efac' : '#fca5a5'}`,
                    borderRadius: 8,
                    padding: '12px 16px',
                    marginBottom: '1.5rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 12,
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: turnaroundInfo.isValid ? '#166534' : '#991b1b' }}>
                      ⏱️ Turnaround Rest Time: {turnaroundInfo.text}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: turnaroundInfo.isValid ? '#15803d' : '#b91c1c', marginTop: 2 }}>
                      {turnaroundInfo.isValid
                        ? '✓ Rest duration between UP arrival and DOWN departure is adequate for crew & vehicle turnaround.'
                        : '⚠️ Turnaround time is below 60 minutes. Please adjust times to ensure adequate rest.'}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>Standard Fare:</span>
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

                {/* Save Schedules Button */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleSaveRoundTripSchedules}
                    disabled={scheduleLoading}
                    style={{ padding: '9px 24px', fontWeight: 800, fontSize: '0.9rem' }}
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
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowBusDetailsModal(false)}
                  style={{ padding: '6px 14px' }}
                >
                  Close
                </button>
                {selectedBus.assignedRoute && (
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
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 620, width: '92%' }}>
            <div className="modal-header-row">
              <div>
                <div className="modal-title">🔄 Change Route Assignment: {selectedBus.vehicleNumber}</div>
                <div className="modal-sub">Move bus to a new route corridor safely without breaking bookings</div>
              </div>
              <button className="modal-close" onClick={() => setShowChangeRouteModal(false)}>✕</button>
            </div>

            <div className="modal-body-scroll">
              {changeError && <div className="alert alert-error" style={{ marginBottom: 12 }}>⚠️ {changeError}</div>}

              {/* Current Route Banner */}
              <div style={{ background: '#f8fafc', padding: 10, borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 12, fontSize: '0.8rem' }}>
                <div>Current Assigned Route: <strong>{selectedBus.assignedRoute?.originCity} ↔ {selectedBus.assignedRoute?.destCity}</strong></div>
                <div style={{ color: '#64748b', fontSize: '0.74rem' }}>{selectedBus.assignedRoute?.corridorName}</div>
              </div>

              {/* Conflict Warning if passenger bookings exist */}
              {changeConflicts && (
                <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', padding: 12, borderRadius: 8, marginBottom: 12 }}>
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

              {/* New Route Inputs */}
              <div className="form-row" style={{ marginBottom: 10 }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.78rem' }}>New Origin City *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={changeRouteData.originCity}
                    onChange={(e) => setChangeRouteData({ ...changeRouteData, originCity: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.78rem' }}>New Destination City *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={changeRouteData.destCity}
                    onChange={(e) => setChangeRouteData({ ...changeRouteData, destCity: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 12 }}>
                <label className="form-label" style={{ fontSize: '0.78rem' }}>New Route Corridor Name</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Corridor A: NH16 Direct Express"
                  value={changeRouteData.corridorName}
                  onChange={(e) => setChangeRouteData({ ...changeRouteData, corridorName: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 12 }}>
                <label className="form-label" style={{ fontSize: '0.78rem' }}>Effective Transition Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={changeRouteData.effectiveDate}
                  onChange={(e) => setChangeRouteData({ ...changeRouteData, effectiveDate: e.target.value })}
                />
                <span className="form-hint">* Date on which the new corridor becomes active.</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '12px 18px', borderTop: '1px solid #e2e8f0', gap: 8 }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setShowChangeRouteModal(false)}
                style={{ padding: '6px 14px' }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => handleConfirmChangeRoute(true)}
                style={{ padding: '6px 18px', fontWeight: 800 }}
              >
                Confirm Route Reassignment ➔
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
