import React, { useState, useEffect } from 'react';
import { getDashboardData } from '../services/api';

export default function Dashboard({ onNavigate }) {
  const [data, setData] = useState({ buses: [], totalPax: 0, totalRev: 0 });

  useEffect(() => {
    const refresh = () => setData(getDashboardData());
    refresh();
    window.addEventListener('storage', refresh);
    const interval = setInterval(refresh, 3000);
    return () => {
      window.removeEventListener('storage', refresh);
      clearInterval(interval);
    };
  }, []);

  const { buses, totalPax, totalRev } = data;

  const stats = [
    {
      color: 'orange',
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>,
      value: buses.length,
      label: 'Active Buses',
      trend: 'Fleet',
    },
    {
      color: 'green',
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
      value: totalPax,
      label: 'Booked Passengers',
      trend: 'Live',
    },
    {
      color: 'blue',
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
      value: buses.length + 3,
      label: 'Scheduled Trips',
      trend: 'Routes',
    },
    {
      color: 'purple',
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
      value: `₹${totalRev.toLocaleString('en-IN')}`,
      label: 'Net Operator Revenue',
      trend: 'Earnings',
    },
  ];

  return (
    <div>
      {/* Stats */}
      <div className="stats-grid">
        {stats.map((s) => (
          <div key={s.label} className={`stat-card ${s.color}`}>
            <div className="stat-header">
              <div className={`stat-icon ${s.color}`}>{s.icon}</div>
              <span className="stat-trend">{s.trend}</span>
            </div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Schedule Table */}
      <div className="card">
        <div className="card-header">
          <h3>Today's Schedule &amp; Fleet Occupancy</h3>
          <button
            className="btn btn-primary"
            style={{ padding: '0.45rem 1rem', fontSize: '0.82rem' }}
            onClick={() => onNavigate('add-schedule')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add Schedule
          </button>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ROUTE</th>
                <th>DEPARTURE</th>
                <th>VEHICLE</th>
                <th>SEATS</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {buses.length === 0 ? (
                <tr><td colSpan={5} style={{textAlign:'center',padding:'2rem',color:'#9ca3af'}}>No schedules found.</td></tr>
              ) : (
                buses.map((bus) => {
                  const pct = Math.min(100, Math.round(((bus.booked || 0) / (bus.total || 40)) * 100));
                  const barColor = pct >= 100 ? 'red' : 'green';
                  const isFull = pct >= 100;
                  return (
                    <tr key={bus.id}>
                      <td className="font-medium">{bus.route}</td>
                      <td className="text-muted">{bus.dep}</td>
                      <td className="text-muted">{bus.name}</td>
                      <td>
                        <div className="seat-progress">
                          <div className="progress-bar-container">
                            <div className={`progress-bar ${barColor}`} style={{ width: `${pct}%` }} />
                          </div>
                          <span className="seat-text">{bus.booked || 0}/{bus.total || 40}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${isFull ? 'badge-red' : 'badge-green'}`}>
                          {isFull ? 'Full' : 'Active'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
