import { useCallback, useEffect, useState } from 'react';
import DataTable from '../../components/DataTable.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import { apiFetch } from '../../lib/api.js';
import { displayDate, humanize } from '../../lib/format.js';

export default function SupportSection({ onAction, busy = false }) {
  const [staff, setStaff] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const load = useCallback(() => Promise.all([apiFetch('/support-staff'), apiFetch('/support-ticket'), apiFetch('/support-requests')])
    .then(([agents, items, requestItems]) => { setStaff(agents); setTickets(items); setRequests(requestItems); setError(''); })
    .catch((cause) => setError(cause.message)), []);
  useEffect(() => { load(); }, [load]);

  const createAgent = async (event) => {
    event.preventDefault();
    const succeeded = await onAction(() => apiFetch('/support-staff', { method: 'POST', body: JSON.stringify(form) }), 'Support agent added.', 'Failed to add support agent.');
    if (!succeeded) return;
    setForm({ name: '', email: '', password: '' });
    load();
  };
  const resolve = async (ticket) => {
    await onAction(() => apiFetch(`/support-ticket/${ticket.ticketId}/resolve`, { method: 'PATCH' }), `Ticket ${ticket.ticketId} resolved.`, 'Failed to resolve support ticket.');
    load();
  };
  const updateRequest = async (request, changes) => {
    const ok = await onAction(() => apiFetch(`/support-requests/${request.requestId}`, { method: 'PATCH', body: JSON.stringify(changes) }), `Request ${request.requestId} updated.`, 'Failed to update support request.');
    if (ok) load();
  };
  const toggleAgent = async (agent) => {
    const status = (agent.status || 'ACTIVE') === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const ok = await onAction(() => apiFetch(`/support-staff/${agent.supporterId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }), `Agent ${agent.name} ${status.toLowerCase()}.`, 'Failed to update agent status.');
    if (ok) load();
  };
  const staffById = new Map(staff.map((agent) => [agent.supporterId, agent.name]));

  return (
    <>
      <section className="bookings-section" style={{ background: '#ffffff', borderRadius: '14px', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9', marginBottom: '24px' }}>
        <div className="section-header" style={{ marginBottom: '20px' }}>
          <h2 className="section-title" style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>Support Agent Directory</h2>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>Manage agents and review their account status</p>
        </div>
        {error && <p className="admin-notice" role="alert">{error}</p>}
        <form onSubmit={createAgent} style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
          <input required aria-label="Agent name" placeholder="Agent name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={inputStyle} />
          <input required type="email" aria-label="Agent email" placeholder="Agent email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={inputStyle} />
          <input required minLength={6} type="password" aria-label="Temporary password" placeholder="Temporary password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} style={inputStyle} />
          <button type="submit" disabled={busy} style={{ padding: '8px 14px', borderRadius: '8px', border: 'none', fontSize: '13px', fontWeight: 600, background: '#0B2447', color: '#fff', cursor: busy ? 'default' : 'pointer' }}>Add Support Agent</button>
        </form>
        <DataTable headers={['Agent ID', 'Name', 'Email', 'Role', 'Status', 'Joined', 'Action']} emptyText="No support agents found.">
          {staff.map((agent) => (
            <tr key={agent.supporterId} style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={{ padding: '14px 18px', fontSize: '13px', fontWeight: 700, color: '#0B2447' }}>{agent.supporterId}</td>
              <td style={{ padding: '14px 18px', fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>{agent.name}</td>
              <td style={{ padding: '14px 18px', fontSize: '13px', color: '#475569' }}>{agent.email}</td>
              <td style={{ padding: '14px 18px', fontSize: '13px', color: '#334155' }}>{humanize(agent.role || 'support')}</td>
              <td style={{ padding: '14px 18px' }}><StatusBadge status={(agent.status || 'ACTIVE').toLowerCase()} /></td>
              <td style={{ padding: '14px 18px', fontSize: '13px', color: '#64748b' }}>{displayDate(agent.createdAt)}</td>
              <td style={{ padding: '14px 18px' }}><button type="button" disabled={busy} onClick={() => toggleAgent(agent)}>{(agent.status || 'ACTIVE') === 'ACTIVE' ? 'Deactivate' : 'Activate'}</button></td>
            </tr>
          ))}
        </DataTable>
      </section>
      <section className="bookings-section" style={{ background: '#ffffff', borderRadius: '14px', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9', marginBottom: '24px' }}>
        <div className="section-header" style={{ marginBottom: '20px' }}><h2 className="section-title" style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>Customer Support Requests</h2></div>
        <DataTable headers={['Request ID', 'Booking', 'Category', 'Description', 'Assigned Agent', 'Status', 'Actions']} emptyText="No customer requests found.">
          {requests.map((request) => <tr key={request.requestId} style={{ borderBottom: '1px solid #f1f5f9' }}>
            <td style={cellStyle}>{request.requestId}</td><td style={cellStyle}>{request.bookingId || '—'}</td><td style={cellStyle}>{humanize(request.category || 'general')}</td><td style={cellStyle}>{request.description}</td>
            <td style={cellStyle}><select disabled={busy || request.status === 'RESOLVED'} value={request.supporterId || ''} onChange={(e) => updateRequest(request, { supporterId: e.target.value })}><option value="">Unassigned</option>{staff.filter((agent) => (agent.status || 'ACTIVE') === 'ACTIVE').map((agent) => <option key={agent.supporterId} value={agent.supporterId}>{agent.name}</option>)}</select></td>
            <td style={cellStyle}><StatusBadge status={String(request.status || 'OPEN').toLowerCase()} /></td><td style={cellStyle}>{request.status !== 'RESOLVED' && <button type="button" disabled={busy} onClick={() => updateRequest(request, { status: 'RESOLVED' })}>Resolve</button>}</td>
          </tr>)}
        </DataTable>
      </section>
      <section className="bookings-section" style={{ background: '#ffffff', borderRadius: '14px', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9' }}>
        <div className="section-header" style={{ marginBottom: '20px' }}>
          <h2 className="section-title" style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>Support Tickets</h2>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>Track requests assigned to support agents</p>
        </div>
        <DataTable headers={['Ticket ID', 'Booking ID', 'Category', 'Assigned Agent', 'Status', 'Created', 'Action']} emptyText="No support tickets found.">
          {tickets.map((ticket) => (
            <tr key={ticket.ticketId} style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={{ padding: '14px 18px', fontSize: '13px', fontWeight: 700, color: '#0B2447' }}>{ticket.ticketId}</td>
              <td style={{ padding: '14px 18px', fontSize: '13px', color: '#334155' }}>{ticket.bookingId}</td>
              <td style={{ padding: '14px 18px', fontSize: '13px', color: '#334155' }}>{humanize(ticket.category || '')}</td>
              <td style={{ padding: '14px 18px', fontSize: '13px', color: '#475569' }}>{staffById.get(ticket.agentId) || 'Unassigned'}</td>
              <td style={{ padding: '14px 18px' }}><StatusBadge status={ticket.status} /></td>
              <td style={{ padding: '14px 18px', fontSize: '13px', color: '#64748b' }}>{displayDate(ticket.createdAt)}</td>
              <td style={{ padding: '14px 18px' }}>{ticket.status === 'open' && <button type="button" disabled={busy} onClick={() => resolve(ticket)} style={{ padding: '5px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, border: 'none', background: '#dcfce7', color: '#15803d', cursor: busy ? 'default' : 'pointer' }}>Resolve</button>}</td>
            </tr>
          ))}
        </DataTable>
      </section>
    </>
  );
}

const inputStyle = { padding: '8px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', color: '#334155', background: '#fff', outline: 'none', minWidth: '190px' };
const cellStyle = { padding: '14px 18px', fontSize: '13px', color: '#334155' };
