import React from 'react';
import { AlertTriangle, ShieldCheck, CheckCircle2, ArrowDownCircle, Eye } from 'lucide-react';

export default function EscalatedIssues({
  tickets = [],
  resolvedEscalations = [],
  onDeescalateTicket,
  onSelectTicket,
}) {
  const activeEscalations = tickets.filter((t) => t.status === 'Escalated');

  return (
    <div>
      {/* Alert Warning Banner */}
      <div
        style={{
          background: '#FFF1F2',
          border: '1.5px solid #FECDD3',
          borderRadius: '14px',
          padding: '16px 20px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          color: '#9F1239',
        }}
      >
        <div
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: '#FFE4E6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            color: '#E11D48',
          }}
        >
          <AlertTriangle size={22} />
        </div>
        <div>
          <strong style={{ fontSize: '0.92rem', display: 'block', color: '#881337' }}>
            {activeEscalations.length} Active High-Priority Escalations
          </strong>
          <div style={{ fontSize: '0.78rem', color: '#9F1239', marginTop: '2px', opacity: 0.9 }}>
            These tickets involve severe service disruption, wrong coach dispatch, or multiple transaction failures requiring supervisor authority.
          </div>
        </div>
      </div>

      {/* Active Escalated Tickets Card */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Critical Escalations Queue</div>
            <div className="card-sub">Supervisor intervention requested by travelers or agents</div>
          </div>
          <span className="badge badge-escalated">
            {activeEscalations.length} Active In Desk
          </span>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Ticket ID</th>
                <th>Customer</th>
                <th>Issue Description</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Supervisor Actions</th>
              </tr>
            </thead>
            <tbody>
              {activeEscalations.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: '#16A34A', fontWeight: 600 }}>
                    ✓ No active escalations at this time. All critical queries have been de-escalated.
                  </td>
                </tr>
              ) : (
                activeEscalations.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <span className="ticket-id" onClick={() => onSelectTicket(t)}>
                        {t.id}
                      </span>
                    </td>
                    <td>
                      <span className="customer-name">{t.customer}</span>
                      {t.bookingId && (
                        <div style={{ fontSize: '0.7rem', color: '#64748B', fontFamily: 'monospace' }}>
                          Booking: {t.bookingId}
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#1E293B' }}>{t.subject}</div>
                      <div style={{ fontSize: '0.74rem', color: '#64748B', marginTop: '3px' }}>
                        {t.description || 'Passenger experienced serious service failure on departure.'}
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-high">{t.priority}</span>
                    </td>
                    <td>
                      <span className="badge badge-escalated">{t.status}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          className="btn btn-primary btn-sm"
                          style={{ background: '#E11D48' }}
                          onClick={() => onDeescalateTicket(t.id)}
                          title="De-escalate and mark resolved"
                        >
                          <ArrowDownCircle size={13} /> De-escalate &amp; Close
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => onSelectTicket(t)}
                        >
                          <Eye size={13} /> Details
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Historical Resolved Escalations */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Supervisor Resolution Log</div>
            <div className="card-sub">Recently closed escalations with settlement notes</div>
          </div>
          <span style={{ fontSize: '0.75rem', color: '#16A34A', fontWeight: 700 }}>
            Audit Log Verified
          </span>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Ticket ID</th>
                <th>Customer</th>
                <th>Subject &amp; Resolution Settlement</th>
                <th>Resolved Date</th>
                <th>Supervisor</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {resolvedEscalations.map((r) => (
                <tr key={r.id}>
                  <td>
                    <span className="ticket-id">{r.id}</span>
                  </td>
                  <td>
                    <span className="customer-name">{r.customer}</span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#1E293B' }}>{r.subject}</div>
                    <div
                      style={{
                        fontSize: '0.74rem',
                        color: '#15803D',
                        background: '#F0FDF4',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        marginTop: '4px',
                        border: '1px solid #DCFCE7',
                      }}
                    >
                      {r.resolutionNote || 'Refund processed and customer notified.'}
                    </div>
                  </td>
                  <td style={{ color: '#64748B', fontSize: '0.76rem', whiteSpace: 'nowrap' }}>
                    {r.resolvedDate || 'Recent'}
                  </td>
                  <td>
                    <span style={{ fontSize: '0.76rem', fontWeight: 600, color: '#475569' }}>
                      {r.resolvedBy || 'Support Agent'}
                    </span>
                  </td>
                  <td>
                    <span className="badge badge-resolved">Resolved</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
