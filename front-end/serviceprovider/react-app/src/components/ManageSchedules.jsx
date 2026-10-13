import React, { useState, useEffect } from 'react';
import { fetchSchedulesFromAPI } from '../services/api';

const STATUS_COLORS = {
  SCHEDULED: '#3b82f6', IN_PROGRESS: '#f59e0b',
  COMPLETED: '#16a34a', DELAYED: '#ef4444', CANCELLED: '#6b7280',
};

export default function ManageSchedules({ onNavigate, showToast }) {
  const [trips, setTrips] = useState([]);
  const [isLive, setIsLive] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSchedulesFromAPI().then(({ data, isLive: live }) => {
      setTrips(data);
      setIsLive(live);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="empty-state" style={{ paddingTop: '4rem' }}>
        <p>⏳ Loading schedules…</p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h3>Manage Schedules</h3>
          <p style={{ marginTop: 4 }}>
            {isLive ? (
              <span className="live-badge"><span className="live-dot" />Live — {trips.length} trips</span>
            ) : (
              <span className="offline-badge">🟡 Offline — {trips.length} local trips</span>
            )}
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => onNavigate('add-schedule')}>
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add New
        </button>
      </div>

      {trips.length === 0 ? (
        <div className="empty-state">
          <p>No schedules found. <button className="btn btn-primary" onClick={() => onNavigate('add-schedule')} style={{display:'inline-flex',marginLeft:8}}>+ Add one</button></p>
        </div>
      ) : (
        <div className="schedule-list">
          {trips.map((t, i) => {
            const avail = parseInt(t.availableSeats) || 0;
            const total = parseInt(t.totalSeats) || 1;
            const pct = Math.round((avail / total) * 100);
            const barColor = pct > 60 ? '#16a34a' : pct > 30 ? '#f59e0b' : '#ef4444';
            const stCol = STATUS_COLORS[t.status] || '#6b7280';
            return (
              <div
                key={t.tripId || i}
                className="list-card"
                style={{ borderLeftColor: barColor }}
              >
                <div className="card-meta-row" style={{ flex: 1 }}>
                  <div className="card-route">
                    {t.source} → {t.destination}
                    {t.via && <span className="via-tag">Via: {t.via}</span>}
                    {t.isNew && <span className="new-tag">NEW</span>}
                  </div>
                  <div className="card-time">
                    {t.departureTime} → {t.arrivalTime} · <strong>{t.busName}</strong> · {t.vehicleType}
                  </div>
                  <div className="card-id">
                    Trip: {t.tripId} · Date: {t.journeyDate} ·{' '}
                    <span style={{ color: stCol, fontWeight: 700 }}>{t.status}</span>
                  </div>
                </div>
                <div className="card-right-info">
                  <div
                    className="card-seats"
                    style={{ color: barColor }}
                  >
                    {t.availableSeats}/{t.totalSeats} seats
                  </div>
                  <button
                    className="btn btn-outline"
                    style={{ marginTop: 6, padding: '4px 12px', fontSize: '0.78rem' }}
                    onClick={() => showToast(`Editing trip ${t.tripId} — edit flow coming soon.`, 'info')}
                  >
                    ✏ Edit
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
