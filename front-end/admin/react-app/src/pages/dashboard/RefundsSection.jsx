import DataTable from '../../components/DataTable.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import { displayDate, money } from '../../lib/format.js';

export default function RefundsSection({ refunds, onDecision, busy = false }) {
  const pending = refunds.filter((refund) => refund.status === 'pending').length;
  return (
    <section className="bookings-section">
      <div className="section-header">
        <h2 className="section-title">Exceptional Refunds</h2>
        <span className="badge badge-pending">{pending} Needs Review</span>
      </div>
      <DataTable headers={['Refund ID', 'Booking ID', 'Customer', 'Amount', 'Reason', 'Date', 'Status', 'Action']}>
        {refunds.map((refund) => (
          <tr key={refund.id}>
            <td>{refund.id}</td>
            <td>{refund.bookingId}</td>
            <td>{refund.customer}</td>
            <td>{money(refund.amount)}</td>
            <td>{refund.reason}</td>
            <td>{displayDate(refund.date)}</td>
            <td><StatusBadge status={refund.status} /></td>
            <td>
              {refund.status === 'pending' ? (
                <div className="refund-actions">
                  <button className="action-btn btn-success" disabled={busy} onClick={() => onDecision(refund, 'approved')}>Approve</button>
                  <button className="action-btn btn-danger" disabled={busy} onClick={() => onDecision(refund, 'rejected')}>Reject</button>
                </div>
              ) : refund.status === 'processing' ? 'Auto initiated' : refund.status === 'approved' ? 'Refunded' : 'Processed'}
            </td>
          </tr>
        ))}
      </DataTable>
    </section>
  );
}
