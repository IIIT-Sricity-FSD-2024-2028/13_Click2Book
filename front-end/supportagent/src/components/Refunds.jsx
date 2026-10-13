import React, { useState } from 'react';
import { RotateCcw, CheckCircle, Clock, XCircle, ArrowRight, DollarSign } from 'lucide-react';
import { formatRupees } from '../services/api';

export default function Refunds({ refunds = [], onUpdateStatus }) {
  const [filterStatus, setFilterStatus] = useState('');

  const filtered = refunds.filter((r) => {
    if (filterStatus && r.status !== filterStatus) return false;
    return true;
  });

  const totalAmount = refunds
    .filter((r) => r.status === 'COMPLETED')
    .reduce((s, r) => s + r.amount, 0);

  const pendingAmount = refunds
    .filter((r) => r.status === 'REQUESTED' || r.status === 'PROCESSING')
    .reduce((s, r) => s + r.amount, 0);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'COMPLETED':
        return <span className="badge badge-resolved">Completed</span>;
      case 'PROCESSING':
        return <span className="badge badge-inprogress">Processing</span>;
      case 'REQUESTED':
        return <span className="badge badge-medium">Requested</span>;
      case 'REJECTED':
        return <span className="badge badge-high">Rejected</span>;
      default:
        return <span className="badge badge-low">{status}</span>;
    }
  };

  return (
    <div>
      {/* Refund Metrics */}
      <div className="stats-grid">
        <div className="stat-card" style={{ '--accent': '#7C3AED' }}>
          <div className="stat-icon" style={{ background: '#FAF5FF', color: '#7C3AED' }}>
            <RotateCcw size={20} />
          </div>
          <div className="stat-value">{refunds.length}</div>
          <div className="stat-label">Total Claims Raised</div>
        </div>

        <div className="stat-card" style={{ '--accent': '#16A34A' }}>
          <div className="stat-icon" style={{ background: '#DCFCE7', color: '#16A34A' }}>
            <CheckCircle size={20} />
          </div>
          <div className="stat-value">{formatRupees(totalAmount)}</div>
          <div className="stat-label">Total Disbursed</div>
        </div>

        <div className="stat-card" style={{ '--accent': '#F59E0B' }}>
          <div className="stat-icon" style={{ background: '#FEF3C7', color: '#F59E0B' }}>
            <Clock size={20} />
          </div>
          <div className="stat-value">{formatRupees(pendingAmount)}</div>
          <div className="stat-label">Pending In Queue</div>
        </div>

        <div className="stat-card" style={{ '--accent': '#EF4444' }}>
          <div className="stat-icon" style={{ background: '#FEE2E2', color: '#EF4444' }}>
            <XCircle size={20} />
          </div>
          <div className="stat-value">
            {refunds.filter((r) => r.status === 'REJECTED').length}
          </div>
          <div className="stat-label">Rejected Claims</div>
        </div>
      </div>

      {/* Refunds Table */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Customer Refund Processing Queue</div>
            <div className="card-sub">
              Cancellation refunds, double-charge rollbacks and operator disruption credits
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <select
              className="filter-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="REQUESTED">Requested</option>
              <option value="PROCESSING">Processing</option>
              <option value="COMPLETED">Completed</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Refund ID</th>
                <th>Booking ID</th>
                <th>Passenger</th>
                <th style={{ textAlign: 'right' }}>Claim Amount</th>
                <th>Status</th>
                <th>Date</th>
                <th>Cancellation Context</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: '#94A3B8' }}>
                    No refund claims match this filter.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.refundId}>
                    <td>
                      <span className="ticket-id">{r.refundId}</span>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>
                        {r.bookingId}
                      </span>
                    </td>
                    <td>
                      <span className="customer-name">{r.customer}</span>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 800, color: '#0F172A', fontFamily: 'monospace' }}>
                      {formatRupees(r.amount)}
                    </td>
                    <td>{getStatusBadge(r.status)}</td>
                    <td style={{ color: '#64748B', fontSize: '0.78rem' }}>{r.date}</td>
                    <td style={{ fontSize: '0.74rem', color: '#475569', maxWidth: '240px' }}>
                      {r.reason}
                    </td>
                    <td>
                      {r.status === 'REQUESTED' ? (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => onUpdateStatus(r.refundId, 'PROCESSING')}
                          >
                            Process
                          </button>
                          <button
                            className="btn btn-ghost btn-sm"
                            style={{ color: '#EF4444' }}
                            onClick={() => onUpdateStatus(r.refundId, 'REJECTED')}
                          >
                            Reject
                          </button>
                        </div>
                      ) : r.status === 'PROCESSING' ? (
                        <button
                          className="btn btn-primary btn-sm"
                          style={{ background: '#16A34A' }}
                          onClick={() => onUpdateStatus(r.refundId, 'COMPLETED')}
                        >
                          Disburse (Complete)
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 600 }}>
                          Settled
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
