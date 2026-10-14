import { useCallback, useEffect, useState } from 'react';
import DataTable from '../../components/DataTable.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import { apiFetch } from '../../lib/api.js';
import { displayDate } from '../../lib/format.js';

const isResolved = (alert) => String(alert.status).toLowerCase() === 'resolved';
const isOpen = (alert) => String(alert.status).toLowerCase() === 'open';

export default function EmergencySection({ notify }) {
  const [alerts, setAlerts] = useState([]);
  const [apiMessage, setApiMessage] = useState('');

  const load = useCallback(async () => {
    try {
      setAlerts(await apiFetch('/emergency'));
      setApiMessage('');
    } catch (error) {
      setAlerts([]);
      setApiMessage(`Emergency API unavailable: ${error.message}`);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const changeAlert = async (id, action) => {
    try {
      await apiFetch(`/emergency/${encodeURIComponent(id)}/${action}`, { method: 'PATCH' });
      await load();
      notify(`Alert ${id} ${action === 'resolve' ? 'resolved' : 'acknowledged'}.`);
    } catch (error) {
      notify(`Failed to update alert: ${error.message}`);
    }
  };

  return (
    <section className="bookings-section">
      <div className="section-header">
        <h2 className="section-title">Emergency Alerts</h2>
        <span className="badge badge-cancelled">{alerts.filter(isOpen).length} Open</span>
      </div>
      {apiMessage && <p className="admin-notice" role="status">{apiMessage}</p>}
      <DataTable headers={['Alert ID', 'Booking', 'Customer', 'Trip', 'Type', 'Message', 'Raised', 'Status', 'Action']}>
        {alerts.map((alert) => {
          const id = alert.alertId || alert.id || alert.emergencyId;
          return (
            <tr key={id}>
              <td>{id}</td>
              <td>{alert.bookingId || alert.booking_id || '—'}</td>
              <td>{alert.customerName || alert.customer || '—'}</td>
              <td>{alert.tripId || alert.trip || '—'}</td>
              <td>{alert.type || alert.alertType || '—'}</td>
              <td>{alert.message || '—'}</td>
              <td>{displayDate(alert.createdAt || alert.createdDate || alert.raisedAt)}</td>
              <td><StatusBadge status={alert.status} /></td>
              <td>
                {isResolved(alert) ? '—' : (
                  <div className="refund-actions">
                    <button className="action-btn btn-success" onClick={() => changeAlert(id, 'acknowledge')}>Acknowledge</button>
                    <button className="action-btn btn-danger" onClick={() => changeAlert(id, 'resolve')}>Resolve</button>
                  </div>
                )}
              </td>
            </tr>
          );
        })}
      </DataTable>
    </section>
  );
}
