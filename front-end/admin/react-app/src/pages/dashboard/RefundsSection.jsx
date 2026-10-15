import React from 'react';
import DataTable from '../../components/DataTable.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import { displayDate, money } from '../../lib/format.js';

export default function RefundsSection({ refunds = [], onDecision, busy = false }) {
  const pendingCount = refunds.filter((refund) => String(refund.status).toLowerCase() === 'pending').length;

  return (
    <section className="bookings-section" style={{ background: '#ffffff', borderRadius: '14px', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9' }}>
      <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
        <div>
          <h2 className="section-title" style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>Refund Requests & Decisions</h2>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>Review cancellation refund claims and authorize payout disbursement</p>
        </div>
        <div>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 12px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 700,
              background: pendingCount > 0 ? '#fff7ed' : '#f1f5f9',
              color: pendingCount > 0 ? '#ea580c' : '#64748b',
              border: `1px solid ${pendingCount > 0 ? '#fed7aa' : '#e2e8f0'}`
            }}
          >
            <span>{pendingCount > 0 ? '⚠️' : '✓'}</span> {pendingCount} Pending Review
          </span>
        </div>
      </div>
      <DataTable headers={['Refund ID', 'Booking ID', 'Customer Name', 'Refund Amount', 'Cancellation Reason', 'Request Date', 'Status', 'Review Action']} emptyText="No refund requests found.">
        {refunds.map((refund) => (
          <tr key={refund.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
            <td style={{ padding: '14px 18px', fontSize: '13px', fontWeight: 700, color: '#0B2447' }}>{refund.id}</td>
            <td style={{ padding: '14px 18px', fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>{refund.bookingId}</td>
            <td style={{ padding: '14px 18px', fontSize: '13px', color: '#334155' }}>{refund.customer}</td>
            <td style={{ padding: '14px 18px', fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{money(refund.amount)}</td>
            <td style={{ padding: '14px 18px', fontSize: '13px', color: '#64748b' }}>{refund.reason || 'Requested by customer'}</td>
            <td style={{ padding: '14px 18px', fontSize: '13px', color: '#64748b' }}>{displayDate(refund.date)}</td>
            <td style={{ padding: '14px 18px' }}><StatusBadge status={refund.status} /></td>
            <td style={{ padding: '14px 18px' }}>
              {String(refund.status).toLowerCase() === 'pending' ? (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => onDecision(refund, 'approved')}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: 'none',
                      background: '#dcfce7',
                      color: '#15803d'
                    }}
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => onDecision(refund, 'rejected')}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: 'none',
                      background: '#fee2e2',
                      color: '#b91c1c'
                    }}
                  >
                    Reject
                  </button>
                </div>
              ) : String(refund.status).toLowerCase() === 'processing' ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => onDecision(refund, 'refunded')}
                  style={{ padding: '5px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: busy ? 'default' : 'pointer', border: 'none', background: '#dcfce7', color: '#15803d' }}
                >
                  Mark Refunded
                </button>
              ) : (
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>Processed</span>
              )}
            </td>
          </tr>
        ))}
      </DataTable>
    </section>
  );
}
