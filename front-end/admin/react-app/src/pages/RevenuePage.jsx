import { useEffect, useRef, useState } from 'react';
import { loadAdminDashboardData } from '../lib/api.js';
import { money } from '../lib/format.js';
import { DASHBOARD_PATH } from '../lib/session.js';
import '../styles/revenue-dashboard.css';

export default function RevenuePage() {
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [error, setError] = useState('');
  const [lastSynced, setLastSynced] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const requestRef = useRef(null);
  const refreshRef = useRef(() => {});

  useEffect(() => {
    let active = true;
    const load = () => {
      if (requestRef.current) return requestRef.current;
      setRefreshing(true);
      requestRef.current = loadAdminDashboardData()
      .then((data) => {
        if (!active) return;
        setTotalRevenue(data.totalRevenue);
        setError('');
        setLastSynced(new Date());
      })
      .catch((loadError) => active && setError(`Live revenue unavailable: ${loadError.message}`));
      requestRef.current = requestRef.current.finally(() => {
        requestRef.current = null;
        if (active) setRefreshing(false);
      });
      return requestRef.current;
    };
    refreshRef.current = load;
    load();
    const timer = setInterval(load, 15000);
    const onFocus = () => load();
    window.addEventListener('focus', onFocus);
    return () => {
      active = false;
      clearInterval(timer);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  return (
    <>
      <header className="topbar">
        <div className="topbar-left">
          <a className="back-link" href={DASHBOARD_PATH}>← Dashboard</a>
          <div>
            <h1 className="page-title">Total Revenue</h1>
            <p className="page-sub">{error || (lastSynced ? `Live · Updated ${lastSynced.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}` : 'Connecting to live data…')}</p>
          </div>
        </div>
        <button type="button" className="revenue-refresh" onClick={() => refreshRef.current()} disabled={refreshing}>
          {refreshing ? 'Syncing…' : 'Refresh'}
        </button>
      </header>
      <main className="wrap">
        {error && <p className="admin-notice" role="alert">{error} Showing the last successful value.</p>}
        <section className="stats-grid" aria-label="Revenue summary">
          <article className="stat-card" style={{ '--accent': '#22c55e' }}>
            <div className="stat-value">{money(totalRevenue)}</div>
            <div className="stat-label">Total Revenue</div>
          </article>
        </section>
        <section className="card">
          <h2 className="card-title">Total Revenue</h2>
          <p className="card-sub">Successful payment total after refunds have been initiated or completed.</p>
        </section>
      </main>
    </>
  );
}
