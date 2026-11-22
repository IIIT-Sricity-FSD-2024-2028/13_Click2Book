import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MapPin, Navigation, Compass, Layers, CheckCircle, PlusCircle, Trash2, ArrowRight } from 'lucide-react';

/* ── Helper: Convert lat/lng to Web Mercator projection x,y in range [0, 1] ── */
function projectLatLng(lat, lng) {
  const sinY = Math.min(Math.max(Math.sin((lat * Math.PI) / 180), -0.9999), 0.9999);
  return {
    x: (lng + 180) / 360,
    y: 0.5 - Math.log((1 + sinY) / (1 - sinY)) / (4 * Math.PI),
  };
}

export default function RouteCorridorMap({
  source,
  destination,
  corridors = [],
  selectedCorridorId,
  onSelectCorridor,
  routeStops = [],
  suggestedStops = [],
  onToggleStop,
  interactive = true,
  height = 380,
}) {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [activeMarker, setActiveMarker] = useState(null);
  const [hoveredCorridor, setHoveredCorridor] = useState(null);
  const [mapMode, setMapMode] = useState('osm'); // 'osm' or 'satellite'
  const containerRef = useRef(null);

  // Active corridor
  const selectedCorridor = useMemo(() => {
    return corridors.find((c) => c.corridorId === selectedCorridorId) || corridors[0] || null;
  }, [corridors, selectedCorridorId]);

  // Collect all points across source, destination, corridors, and stops for bounding box
  const allPoints = useMemo(() => {
    const pts = [];
    if (source?.lat && source?.lng) pts.push({ lat: source.lat, lng: source.lng, name: source.name, role: 'source' });
    if (destination?.lat && destination?.lng) pts.push({ lat: destination.lat, lng: destination.lng, name: destination.name, role: 'dest' });

    (routeStops || []).forEach((st, idx) => {
      if (st.lat && st.lng) pts.push({ ...st, role: 'stop', order: idx + 1 });
    });

    (suggestedStops || []).forEach((st) => {
      if (st.lat && st.lng && !routeStops.some((s) => s.name?.toLowerCase() === st.name?.toLowerCase())) {
        pts.push({ ...st, role: 'suggested' });
      }
    });

    corridors.forEach((c) => {
      (c.polyline || []).forEach((pt) => {
        const [lat, lng] = Array.isArray(pt) ? pt : [pt.lat, pt.lng];
        if (lat && lng) pts.push({ lat, lng, role: 'poly' });
      });
    });

    return pts;
  }, [source, destination, routeStops, suggestedStops, corridors]);

  // Compute map bounding box
  const bounds = useMemo(() => {
    if (allPoints.length === 0) {
      return { minLat: 12.0, maxLat: 17.5, minLng: 77.0, maxLng: 82.0 };
    }
    let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;
    allPoints.forEach((p) => {
      if (p.lat < minLat) minLat = p.lat;
      if (p.lat > maxLat) maxLat = p.lat;
      if (p.lng < minLng) minLng = p.lng;
      if (p.lng > maxLng) maxLng = p.lng;
    });
    // Add 12% padding
    const latSpan = Math.max(0.3, maxLat - minLat);
    const lngSpan = Math.max(0.3, maxLng - minLng);
    return {
      minLat: minLat - latSpan * 0.12,
      maxLat: maxLat + latSpan * 0.12,
      minLng: minLng - lngSpan * 0.12,
      maxLng: maxLng + lngSpan * 0.12,
    };
  }, [allPoints]);

  // Coordinate to SVG Viewport mapping (1000 x 600 coordinate space)
  const mapWidth = 1000;
  const mapHeight = 600;

  const toSvgCoords = (lat, lng) => {
    const latFrac = (lat - bounds.minLat) / (bounds.maxLat - bounds.minLat || 1);
    const lngFrac = (lng - bounds.minLng) / (bounds.maxLng - bounds.minLng || 1);
    const x = lngFrac * (mapWidth - 80) + 40;
    const y = (1 - latFrac) * (mapHeight - 80) + 40;
    return { x, y };
  };

  // Convert polyline to SVG Path data
  const getPolylinePath = (pts) => {
    if (!pts || pts.length < 2) return '';
    return pts
      .map((p, i) => {
        const [lat, lng] = Array.isArray(p) ? p : [p.lat, p.lng];
        const { x, y } = toSvgCoords(lat, lng);
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');
  };

  // Zoom controls
  const handleZoomIn = () => setZoomLevel((z) => Math.min(2.5, z + 0.25));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(0.8, z - 0.25));
  const handleResetZoom = () => setZoomLevel(1);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        borderRadius: 12,
        overflow: 'hidden',
        border: '1.5px solid #cbd5e1',
        background: '#0f172a',
        boxShadow: '0 4px 16px -2px rgba(15, 23, 42, 0.15)',
        position: 'relative',
        userSelect: 'none',
      }}
    >
      {/* ── Top Bar: Corridor Selector Tabs & Stats ── */}
      <div
        style={{
          background: '#1e293b',
          borderBottom: '1px solid #334155',
          padding: '8px 14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 8,
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.74rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>
            Available Corridors:
          </span>
          {corridors.map((c, idx) => {
            const isSelected = c.corridorId === (selectedCorridor?.corridorId || selectedCorridorId);
            const letter = String.fromCharCode(65 + idx);
            return (
              <button
                key={c.corridorId}
                type="button"
                onClick={() => onSelectCorridor && onSelectCorridor(c.corridorId)}
                onMouseEnter={() => setHoveredCorridor(c.corridorId)}
                onMouseLeave={() => setHoveredCorridor(null)}
                style={{
                  background: isSelected ? '#2563eb' : '#334155',
                  color: '#ffffff',
                  border: isSelected ? '1.5px solid #60a5fa' : '1px solid #475569',
                  borderRadius: 6,
                  padding: '4px 10px',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  transition: 'all 0.15s ease',
                }}
              >
                <span>Corridor {letter}</span>
                <span style={{ opacity: 0.85, fontSize: '0.7rem' }}>({c.distance} km)</span>
                {isSelected && <span style={{ fontSize: '0.68rem', background: '#1d4ed8', padding: '1px 5px', borderRadius: 4 }}>Active</span>}
              </button>
            );
          })}
        </div>

        {selectedCorridor && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.76rem', color: '#e2e8f0' }}>
            <span>
              🛣️ <strong>{selectedCorridor.distance} km</strong>
            </span>
            <span>
              ⏱️ <strong>{selectedCorridor.duration}</strong>
            </span>
            <span>
              📍 <strong>{1 + (routeStops || []).length + 1} Stations</strong>
            </span>
          </div>
        )}
      </div>

      {/* ── Interactive SVG Map Surface ── */}
      <div
        style={{
          width: '100%',
          height: `${height}px`,
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #0b1329 0%, #172554 50%, #0f172a 100%)',
        }}
      >
        {/* Subtle Map Grid / Latitude-Longitude Gridlines */}
        <svg
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            opacity: 0.25,
          }}
        >
          <defs>
            <pattern id="route-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#38bdf8" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#route-grid)" />
        </svg>

        {/* Dynamic Interactive SVG Canvas */}
        <svg
          viewBox={`0 0 ${mapWidth} ${mapHeight}`}
          preserveAspectRatio="xMidYMid meet"
          style={{
            width: '100%',
            height: '100%',
            transform: `scale(${zoomLevel})`,
            transition: 'transform 0.25s ease',
            transformOrigin: 'center center',
          }}
        >
          <defs>
            {/* Glowing filter for selected corridor */}
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#38bdf8" floodOpacity="0.6" />
            </filter>
            {/* Soft shadow for pins */}
            <filter id="pin-shadow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="3" stdDeviation="2" floodColor="#000000" floodOpacity="0.5" />
            </filter>
          </defs>

          {/* 1. Alternative Unselected Corridors (Rendered First in Background) */}
          {corridors.map((c, idx) => {
            const isSelected = c.corridorId === selectedCorridor?.corridorId;
            if (isSelected) return null;
            const pathData = getPolylinePath(c.polyline);
            if (!pathData) return null;
            const isHovered = hoveredCorridor === c.corridorId;

            return (
              <g
                key={`alt-${c.corridorId}`}
                style={{ cursor: 'pointer' }}
                onClick={() => onSelectCorridor && onSelectCorridor(c.corridorId)}
                onMouseEnter={() => setHoveredCorridor(c.corridorId)}
                onMouseLeave={() => setHoveredCorridor(null)}
              >
                {/* Invisible wide hit-area for easy clicking */}
                <path d={pathData} fill="none" stroke="transparent" strokeWidth="20" />
                <path
                  d={pathData}
                  fill="none"
                  stroke={isHovered ? '#f59e0b' : '#64748b'}
                  strokeWidth={isHovered ? '4' : '2.5'}
                  strokeDasharray="6 6"
                  opacity={isHovered ? 0.95 : 0.65}
                />
              </g>
            );
          })}

          {/* 2. Selected Active Corridor Polyline (Highlighted) */}
          {selectedCorridor && (
            <g filter="url(#glow)">
              {/* Outer glow stroke */}
              <path
                d={getPolylinePath(selectedCorridor.polyline)}
                fill="none"
                stroke="#0284c7"
                strokeWidth="7"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.4"
              />
              {/* Main polyline */}
              <path
                d={getPolylinePath(selectedCorridor.polyline)}
                fill="none"
                stroke="#38bdf8"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
          )}

          {/* 3. Unselected Suggested Stops (Light gray / Amber dashed circles) */}
          {(suggestedStops || []).map((stop) => {
            const isAdded = (routeStops || []).some(
              (s) => s.name?.toLowerCase() === stop.name?.toLowerCase()
            );
            if (isAdded) return null; // Already rendered as active stop
            const coords = toSvgCoords(stop.lat, stop.lng);

            return (
              <g
                key={`sug-${stop.name}`}
                style={{ cursor: 'pointer' }}
                onClick={() => onToggleStop && onToggleStop(stop)}
                onMouseEnter={() => setActiveMarker(stop)}
              >
                <circle
                  cx={coords.x}
                  cy={coords.y}
                  r="7"
                  fill="#1e293b"
                  stroke="#f59e0b"
                  strokeWidth="1.5"
                  strokeDasharray="2 2"
                />
                <circle cx={coords.x} cy={coords.y} r="2.5" fill="#f59e0b" />
                <text
                  x={coords.x}
                  y={coords.y - 11}
                  fill="#fde68a"
                  fontSize="10"
                  fontWeight="600"
                  textAnchor="middle"
                  style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}
                >
                  {stop.name}
                </text>
              </g>
            );
          })}

          {/* 4. Active Confirmed Intermediate Stops (Blue Pin with Order Number) */}
          {(routeStops || []).map((stop, idx) => {
            const coords = toSvgCoords(stop.lat, stop.lng);
            return (
              <g
                key={`stop-${stop.name}-${idx}`}
                filter="url(#pin-shadow)"
                style={{ cursor: 'pointer' }}
                onClick={() => setActiveMarker({ ...stop, order: idx + 1, isSelected: true })}
                onMouseEnter={() => setActiveMarker({ ...stop, order: idx + 1, isSelected: true })}
              >
                {/* Connecting circle pulse */}
                <circle cx={coords.x} cy={coords.y} r="14" fill="#3b82f6" opacity="0.3" />
                <circle cx={coords.x} cy={coords.y} r="10" fill="#2563eb" stroke="#ffffff" strokeWidth="2" />
                <text
                  x={coords.x}
                  y={coords.y + 3.5}
                  fill="#ffffff"
                  fontSize="10"
                  fontWeight="800"
                  textAnchor="middle"
                >
                  {idx + 1}
                </text>
                <text
                  x={coords.x}
                  y={coords.y - 13}
                  fill="#ffffff"
                  fontSize="11"
                  fontWeight="700"
                  textAnchor="middle"
                  style={{ textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}
                >
                  {stop.name}
                </text>
              </g>
            );
          })}

          {/* 5. Origin Departure Hub (Green Flag & Pin) */}
          {source?.lat && source?.lng && (
            <g
              filter="url(#pin-shadow)"
              style={{ cursor: 'pointer' }}
              onClick={() => setActiveMarker({ ...source, role: 'source' })}
            >
              {(() => {
                const { x, y } = toSvgCoords(source.lat, source.lng);
                return (
                  <>
                    <circle cx={x} cy={y} r="16" fill="#16a34a" opacity="0.25" />
                    <circle cx={x} cy={y} r="11" fill="#16a34a" stroke="#ffffff" strokeWidth="2.5" />
                    <text x={x} y={y + 4} fill="#ffffff" fontSize="10" fontWeight="900" textAnchor="middle">
                      🏁
                    </text>
                    <rect
                      x={x - 45}
                      y={y + 14}
                      width="90"
                      height="18"
                      rx="4"
                      fill="#14532d"
                      stroke="#22c55e"
                      strokeWidth="1"
                    />
                    <text x={x} y={y + 26} fill="#86efac" fontSize="9.5" fontWeight="800" textAnchor="middle">
                      {source.name || 'Origin'}
                    </text>
                  </>
                );
              })()}
            </g>
          )}

          {/* 6. Destination Hub (Red Flag & Pin) */}
          {destination?.lat && destination?.lng && (
            <g
              filter="url(#pin-shadow)"
              style={{ cursor: 'pointer' }}
              onClick={() => setActiveMarker({ ...destination, role: 'dest' })}
            >
              {(() => {
                const { x, y } = toSvgCoords(destination.lat, destination.lng);
                return (
                  <>
                    <circle cx={x} cy={y} r="16" fill="#dc2626" opacity="0.25" />
                    <circle cx={x} cy={y} r="11" fill="#dc2626" stroke="#ffffff" strokeWidth="2.5" />
                    <text x={x} y={y + 4} fill="#ffffff" fontSize="10" fontWeight="900" textAnchor="middle">
                      🎯
                    </text>
                    <rect
                      x={x - 45}
                      y={y + 14}
                      width="90"
                      height="18"
                      rx="4"
                      fill="#7f1d1d"
                      stroke="#ef4444"
                      strokeWidth="1"
                    />
                    <text x={x} y={y + 26} fill="#fca5a5" fontSize="9.5" fontWeight="800" textAnchor="middle">
                      {destination.name || 'Destination'}
                    </text>
                  </>
                );
              })()}
            </g>
          )}
        </svg>

        {/* ── Zoom Controls Overlay ── */}
        <div
          style={{
            position: 'absolute',
            bottom: 14,
            right: 14,
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            zIndex: 10,
          }}
        >
          <button
            type="button"
            onClick={handleZoomIn}
            title="Zoom In"
            style={{
              width: 32,
              height: 32,
              background: '#1e293b',
              color: '#ffffff',
              border: '1px solid #475569',
              borderRadius: 6,
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '1.1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
            }}
          >
            +
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            title="Zoom Out"
            style={{
              width: 32,
              height: 32,
              background: '#1e293b',
              color: '#ffffff',
              border: '1px solid #475569',
              borderRadius: 6,
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '1.1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
            }}
          >
            -
          </button>
          <button
            type="button"
            onClick={handleResetZoom}
            title="Center Corridor View"
            style={{
              width: 32,
              height: 32,
              background: '#1e293b',
              color: '#38bdf8',
              border: '1px solid #475569',
              borderRadius: 6,
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
            }}
          >
            ⌖
          </button>
        </div>

        {/* ── Map Legend Overlay (Bottom Left) ── */}
        <div
          style={{
            position: 'absolute',
            bottom: 12,
            left: 12,
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(6px)',
            border: '1px solid #334155',
            borderRadius: 8,
            padding: '6px 10px',
            fontSize: '0.7rem',
            color: '#cbd5e1',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            zIndex: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#16a34a', display: 'inline-block' }} />
            <span>Departure Hub</span>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#dc2626', display: 'inline-block', marginLeft: 6 }} />
            <span>Destination Hub</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b82f6', display: 'inline-block' }} />
            <span>Confirmed Stop (Travel Order)</span>
            <span style={{ width: 8, height: 8, borderRadius: '50%', border: '1px dashed #f59e0b', display: 'inline-block', marginLeft: 6 }} />
            <span>Suggested Stop</span>
          </div>
        </div>

        {/* ── Active Marker Popup Card (Centered Top) ── */}
        {activeMarker && (
          <div
            style={{
              position: 'absolute',
              top: 12,
              left: '50%',
              transform: 'translateX(-50%)',
              background: '#ffffff',
              borderRadius: 8,
              border: '1.5px solid #3b82f6',
              boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
              padding: '10px 14px',
              minWidth: 260,
              maxWidth: 340,
              zIndex: 20,
              color: '#0f172a',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
              <div>
                <span
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: activeMarker.role === 'source' ? '#16a34a' : activeMarker.role === 'dest' ? '#dc2626' : '#2563eb',
                  }}
                >
                  {activeMarker.role === 'source'
                    ? '🏁 Origin Hub'
                    : activeMarker.role === 'dest'
                    ? '🎯 Destination Hub'
                    : `📍 Intermediate Stop #${activeMarker.order || ''}`}
                </span>
                <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#0f172a' }}>
                  {activeMarker.name}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveMarker(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  color: '#94a3b8',
                  padding: 0,
                  marginLeft: 8,
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ fontSize: '0.74rem', color: '#64748b', marginBottom: 6 }}>
              {activeMarker.boardingPoint && <div><strong>Boarding:</strong> {activeMarker.boardingPoint}</div>}
              {activeMarker.droppingPoint && <div><strong>Dropping:</strong> {activeMarker.droppingPoint}</div>}
              <div><strong>GPS:</strong> {activeMarker.lat?.toFixed(4)}° N, {activeMarker.lng?.toFixed(4)}° E</div>
              {activeMarker.arrivalTime && (
                <div><strong>ETA:</strong> Arr {activeMarker.arrivalTime} &bull; Dep {activeMarker.departureTime}</div>
              )}
            </div>

            {/* Action button if it's an intermediate stop */}
            {activeMarker.role !== 'source' && activeMarker.role !== 'dest' && onToggleStop && (
              <button
                type="button"
                onClick={() => {
                  onToggleStop(activeMarker);
                  setActiveMarker(null);
                }}
                style={{
                  width: '100%',
                  padding: '5px 10px',
                  borderRadius: 6,
                  border: 'none',
                  background: activeMarker.isSelected ? '#fee2e2' : '#2563eb',
                  color: activeMarker.isSelected ? '#dc2626' : '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.76rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 5,
                }}
              >
                {activeMarker.isSelected ? '✕ Remove Stop from Route' : '+ Add Stop to Route'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Selected Corridor Banner Under Map ── */}
      {selectedCorridor && (
        <div
          style={{
            background: '#1e293b',
            borderTop: '1px solid #334155',
            padding: '10px 14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 8,
          }}
        >
          <div>
            <div style={{ color: '#38bdf8', fontWeight: 800, fontSize: '0.84rem' }}>
              ✓ Selected Corridor: {selectedCorridor.name}
            </div>
            <div style={{ color: '#94a3b8', fontSize: '0.74rem', marginTop: 2 }}>
              {selectedCorridor.description}
            </div>
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
            OpenStreetMap &bull; Nominatim Geocoding Verified
          </div>
        </div>
      )}
    </div>
  );
}
