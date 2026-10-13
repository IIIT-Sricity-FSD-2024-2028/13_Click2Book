import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, EmptyRow, KPI, Pill, Table, matches } from '../components/ui';
import { adminActions, formatINR } from '../lib/adminData';

const REQ_TONE = { OPEN: 'orange', IN_PROGRESS: 'blue', ESCALATED: 'red', RESOLVED: 'green' };
const REQ_LABEL = { OPEN: 'Open', IN_PROGRESS: 'In progress', ESCALATED: 'Escalated', RESOLVED: 'Resolved' };
const SOS_TONE = { OPEN: 'red', ACKNOWLEDGED: 'orange', RESOLVED: 'green' };

export default function Support({ ctx }) {
  const { data, q, act, busy } = ctx;
  const [reqFilter, setReqFilter] = useState('unresolved');
  const requests = data.requests.filter(
    (r) =>
      (reqFilter === 'all' || (reqFilter === 'unresolved' ? r.status !== 'RESOLVED' : r.status === reqFilter)) &&
      matches(q, r.requestId, r.customerId, r.description, r.status),
  );
  const emergencies = data.emergencies.filter((e) => matches(q, e.alertId, e.bookingId, e.type, e.status));
  const tickets = data.tickets.filter((t) => matches(q, t.ticketId, t.bookingId, t.category, t.status));
  const customer = (id) => data.customerNames[id]?.name || id;

  /* Team performance: requests assigned to each agent */
  const team = data.staff.map((st) => {
    const mine = data.requests.filter((r) => r.supporterId === st.supporterId);
    const resolved = mine.filter((r) => r.status === 'RESOLVED').length;
    return { ...st, assigned: mine.length, resolved, open: mine.length - resolved, rate: mine.length ? resolved / mine.length : null };
  });
  const unassigned = data.requests.filter((r) => !r.supporterId && r.status !== 'RESOLVED').length;

  /* Resolution report */
  const byStatus = Object.fromEntries(Object.keys(REQ_LABEL).map((k) => [k, data.requests.filter((r) => r.status === k).length]));
  const total = data.requests.length;
  const resolutionRate = total ? Math.round((byStatus.RESOLVED / total) * 100) : 0;

  const setStatus = (r, status, confirmText) =>
    act(r.requestId, `${r.requestId} → ${REQ_LABEL[status]}.`, () => adminActions.updateRequest(r.requestId, status), confirmText);

  return (
    <>
      <div className="kpi-grid" id="supportKpis">
        <KPI
          label="Unresolved complaints"
          value={data.stats.openRequests}
          sub={`${unassigned} unassigned`}
          tone={data.stats.openRequests ? 'orange' : undefined}
        />
        <KPI label="Escalated" value={byStatus.ESCALATED} sub="need supervisor review" tone={byStatus.ESCALATED ? 'red' : undefined} />
        <KPI label="Open SOS alerts" value={data.stats.openEmergencies} tone={data.stats.openEmergencies ? 'red' : undefined} />
        <KPI label="Resolution rate" value={`${resolutionRate}%`} sub={`${byStatus.RESOLVED} of ${total} resolved`} tone="green" />
      </div>

      <Card title="🚨 SOS Alerts" count={emergencies.length} id="sosCard">
        <Table head={['Alert', 'Type', 'Booking', 'Trip', 'Message', 'Raised', 'Status', 'Action']} id="emergencyTable">
          {emergencies.length === 0 ? (
            <EmptyRow icon="✅" message="No SOS alerts." />
          ) : (
            emergencies.map((e) => (
              <tr key={e.alertId}>
                <td className="booking-id">{e.alertId}</td>
                <td>{e.type}</td>
                <td>{e.bookingId}</td>
                <td>{e.tripId}</td>
                <td>{e.message || '—'}</td>
                <td>{String(e.createdAt).replace('T', ' ').slice(0, 16)}</td>
                <td>
                  <Pill tone={SOS_TONE[e.status]}>{e.status}</Pill>
                </td>
                <td className="actions-cell">
                  {e.status === 'OPEN' && (
                    <button
                      className="action-btn btn-warn"
                      disabled={busy === e.alertId}
                      onClick={() => act(e.alertId, `Alert ${e.alertId} acknowledged.`, () => adminActions.acknowledgeEmergency(e.alertId))}
                    >
                      Acknowledge
                    </button>
                  )}{' '}
                  {e.status !== 'RESOLVED' && (
                    <button
                      className="action-btn btn-success"
                      disabled={busy === e.alertId}
                      onClick={() => act(e.alertId, `Alert ${e.alertId} resolved.`, () => adminActions.resolveEmergency(e.alertId))}
                    >
                      Resolve
                    </button>
                  )}
                </td>
              </tr>
            ))
          )}
        </Table>
      </Card>

      <Card
        title="💬 Customer Complaints"
        count={requests.length}
        id="requestsCard"
        actions={
          <>
            <select className="filter-select" id="requestFilter" value={reqFilter} onChange={(e) => setReqFilter(e.target.value)}>
              <option value="unresolved">Unresolved</option>
              <option value="ESCALATED">Escalated</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="all">All</option>
            </select>
            <Link to="/support" className="action-btn btn-ghost">
              Open Support Panel ›
            </Link>
          </>
        }
      >
        <Table head={['Request', 'Customer', 'Complaint', 'Agent', 'Created', 'Status', 'Action']} id="requestsTable">
          {requests.length === 0 ? (
            <EmptyRow icon="💬" message="No complaints match." />
          ) : (
            requests.map((r) => (
              <tr key={r.requestId}>
                <td className="booking-id">{r.requestId}</td>
                <td>{customer(r.customerId)}</td>
                <td className="wrap-cell">{r.description}</td>
                <td>{data.staff.find((s) => s.supporterId === r.supporterId)?.name || <span className="muted">Unassigned</span>}</td>
                <td>{r.createdDate}</td>
                <td>
                  <Pill tone={REQ_TONE[r.status]}>{REQ_LABEL[r.status] || r.status}</Pill>
                </td>
                <td className="actions-cell">
                  {r.status !== 'ESCALATED' && r.status !== 'RESOLVED' && (
                    <button
                      className="action-btn btn-danger"
                      disabled={busy === r.requestId}
                      onClick={() =>
                        setStatus(
                          r,
                          'ESCALATED',
                          `Escalate ${r.requestId}? It moves to the support team's Escalated queue for supervisor review.`,
                        )
                      }
                    >
                      Escalate
                    </button>
                  )}{' '}
                  {r.status !== 'RESOLVED' && (
                    <button className="action-btn btn-success" disabled={busy === r.requestId} onClick={() => setStatus(r, 'RESOLVED')}>
                      Resolve
                    </button>
                  )}
                  {r.status === 'RESOLVED' && (
                    <button className="action-btn btn-ghost" disabled={busy === r.requestId} onClick={() => setStatus(r, 'OPEN')}>
                      Reopen
                    </button>
                  )}
                </td>
              </tr>
            ))
          )}
        </Table>
      </Card>

      <div className="two-col">
        <Card title="Support Team Performance" id="teamCard">
          <Table head={['Agent', 'Assigned', 'Resolved', 'Open', 'Resolution rate']} id="teamTable">
            {team.length === 0 ? (
              <EmptyRow icon="👥" message="No support staff found." />
            ) : (
              team.map((t) => (
                <tr key={t.supporterId}>
                  <td>
                    <strong>{t.name}</strong>
                    <div className="sub-line">{t.email}</div>
                  </td>
                  <td>{t.assigned}</td>
                  <td>{t.resolved}</td>
                  <td>{t.open}</td>
                  <td>{t.rate == null ? '—' : `${Math.round(t.rate * 100)}%`}</td>
                </tr>
              ))
            )}
          </Table>
          {unassigned > 0 && <p className="card-note">⚠️ {unassigned} unresolved complaint(s) have no agent assigned.</p>}
        </Card>

        <Card title="Complaint Resolution Report" id="resolutionCard">
          <Table head={['Status', 'Complaints', 'Share']} id="resolutionTable">
            {Object.entries(byStatus).map(([k, n]) => (
              <tr key={k}>
                <td>
                  <Pill tone={REQ_TONE[k]}>{REQ_LABEL[k]}</Pill>
                </td>
                <td>{n}</td>
                <td>{total ? `${Math.round((n / total) * 100)}%` : '—'}</td>
              </tr>
            ))}
            <tr className="total-row">
              <td>Total</td>
              <td>{total}</td>
              <td>{resolutionRate}% resolved</td>
            </tr>
          </Table>
        </Card>
      </div>

      <Card title="Support Cost Tickets" count={tickets.length} id="ticketsCard">
        <p className="card-note">
          Tickets created by cancellations, lost &amp; found and disputes. Each carries a support cost deducted from platform revenue.
        </p>
        <Table head={['Ticket', 'Booking', 'Category', 'Cost', 'Created', 'Status', 'Action']} id="ticketsTable">
          {tickets.length === 0 ? (
            <EmptyRow icon="🎫" message="No support tickets." />
          ) : (
            tickets.map((t) => (
              <tr key={t.ticketId}>
                <td className="booking-id">{t.ticketId}</td>
                <td>{t.bookingId}</td>
                <td>{String(t.category).replace(/_/g, ' ')}</td>
                <td className="amount">{formatINR((Number(t.costApplied) || 0) / 100)}</td>
                <td>{String(t.createdAt).slice(0, 10)}</td>
                <td>
                  <Pill tone={t.status === 'resolved' ? 'green' : 'orange'}>{t.status}</Pill>
                </td>
                <td>
                  {t.status !== 'resolved' ? (
                    <button
                      className="action-btn btn-success"
                      disabled={busy === t.ticketId}
                      onClick={() => act(t.ticketId, `Ticket ${t.ticketId} resolved.`, () => adminActions.resolveTicket(t.ticketId))}
                    >
                      Resolve
                    </button>
                  ) : (
                    <span className="muted">—</span>
                  )}
                </td>
              </tr>
            ))
          )}
        </Table>
      </Card>
    </>
  );
}
