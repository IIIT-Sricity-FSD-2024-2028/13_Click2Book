import { useEffect, useState } from 'react';
import DataTable from '../../components/DataTable.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import { apiFetch } from '../../lib/api.js';
import { displayDate } from '../../lib/format.js';

export default function LostFoundSection() {
  const [items, setItems] = useState([]);
  const [apiMessage, setApiMessage] = useState('');

  useEffect(() => {
    let active = true;
    apiFetch('/lost-found')
      .then((data) => {
        if (!active) return;
        setItems(data);
        setApiMessage('');
      })
      .catch((error) => {
        if (!active) return;
        setItems([]);
        setApiMessage(`Lost & Found API unavailable: ${error.message}`);
      });
    return () => { active = false; };
  }, []);

  return (
    <section className="bookings-section">
      <div className="section-header">
        <h2 className="section-title">Lost &amp; Found — All Providers</h2>
      </div>
      {apiMessage && <p className="admin-notice" role="status">{apiMessage}</p>}
      <DataTable headers={['Item ID', 'Trip', 'Booking', 'Description', 'Category', 'Date Lost', 'Contact', 'Status', 'Note']}>
        {items.map((item) => (
          <tr key={item.itemId || item.id}>
            <td>{item.itemId || item.id}</td>
            <td>{item.tripId || item.trip || '—'}</td>
            <td>{item.bookingId || '—'}</td>
            <td>{item.description || '—'}</td>
            <td>{item.category || '—'}</td>
            <td>{displayDate(item.dateLost || item.createdAt)}</td>
            <td>{item.contact || item.contactInfo || '—'}</td>
            <td><StatusBadge status={item.status} /></td>
            <td>{item.note || '—'}</td>
          </tr>
        ))}
      </DataTable>
    </section>
  );
}
