import React, { useState, useEffect, useCallback } from 'react';
import { fetchLostFound, updateLostFoundStatus } from '../services/api';

const STATUS_BADGE = {
  REPORTED: 'badge-orange',
  FOUND:    'badge-blue',
  RETURNED: 'badge-green',
  CLOSED:   'badge-purple',
};

function LFCard({ item, onMarkStatus }) {
  const [note, setNote] = useState('');
  const isOpen = item.status === 'REPORTED' || item.status === 'FOUND';

  return (
    <div className="lf-card">
      <div className="card-title">
        {item.itemDescription}
        <span className={`badge ${STATUS_BADGE[item.status] || 'badge-orange'}`}>{item.status}</span>
      </div>
      <div className="card-meta" style={{ marginTop: 6 }}>
        <div className="card-meta-item">Trip {item.tripId} · Booking {item.bookingId}</div>
        <div className="card-meta-item">Lost on {item.dateLost} · Contact: {item.contactPhone}</div>
      </div>
      {item.foundNote && (
        <div style={{ fontSize: '0.8rem', marginTop: 6, color: '#6b7280' }}>Note: {item.foundNote}</div>
      )}
      {isOpen && (
        <>
          <input
            className="lf-note-input"
            placeholder="Add a note (e.g. where it is held)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <div className="lf-actions">
            {item.status === 'REPORTED' && (
              <button className="btn btn-secondary" style={{ color: '#2563eb', borderColor: '#bfdbfe', fontSize: '0.8rem', padding: '6px 14px' }}
                onClick={() => onMarkStatus(item.itemId, 'FOUND', note)}>
                Mark Found
              </button>
            )}
            <button className="btn btn-secondary" style={{ color: '#16a34a', borderColor: '#a7f3d0', fontSize: '0.8rem', padding: '6px 14px' }}
              onClick={() => onMarkStatus(item.itemId, 'RETURNED', note)}>
              Mark Returned
            </button>
            <button className="btn btn-secondary" style={{ color: '#ef4444', borderColor: '#fca5a5', fontSize: '0.8rem', padding: '6px 14px' }}
              onClick={() => onMarkStatus(item.itemId, 'CLOSED', note)}>
              Close
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function LostFound({ provider, showToast }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);

  const providerId = provider?.id
    || sessionStorage.getItem('c2b_loggedInId')
    || localStorage.getItem('c2b_loggedInId')
    || 'P001';

  const load = useCallback(async () => {
    const { data, isLive: live } = await fetchLostFound(providerId);
    setItems([...data].reverse());
    setIsLive(live);
    setLoading(false);
  }, [providerId]);

  useEffect(() => { load(); }, [load]);

  const handleMarkStatus = async (itemId, status, note) => {
    try {
      await updateLostFoundStatus(itemId, status, note);
      showToast(`Item ${itemId} marked as ${status}.`, 'success');
      await load();
    } catch (e) {
      showToast('Could not update report: ' + e.message, 'error');
    }
  };

  if (loading) return <div className="empty-state" style={{ paddingTop: '4rem' }}><p>⏳ Loading reports…</p></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h3>Lost &amp; Found</h3>
          <p>Items reported by customers on your trips</p>
        </div>
        {isLive ? (
          <span className="live-badge"><span className="live-dot" />Live</span>
        ) : (
          <span className="offline-badge">🟡 Backend offline</span>
        )}
      </div>

      {!isLive && (
        <div className="alert alert-error" style={{ marginBottom: 16 }}>
          Could not load reports — backend may be offline.
        </div>
      )}

      {items.length === 0 && isLive ? (
        <div className="empty-state"><p>No lost &amp; found reports on your trips.</p></div>
      ) : items.map((item) => (
        <LFCard key={item.itemId} item={item} onMarkStatus={handleMarkStatus} />
      ))}
    </div>
  );
}
