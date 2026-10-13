import React, { useState } from 'react';
import {
  Receipt,
  AlertCircle,
  Coins,
  PlusCircle,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import { formatPaiseToRupees } from '../services/api';

export default function CostImpact({
  costTickets = [],
  onCreateCostTicket,
  onResolveCostTicket,
  onRefresh,
  isLive,
}) {
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [newBookingId, setNewBookingId] = useState('');
  const [newCategory, setNewCategory] = useState('complaint');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculations
  const filteredTickets = costTickets.filter((t) => {
    if (statusFilter && t.status !== statusFilter) return false;
    if (categoryFilter && t.category !== categoryFilter) return false;
    return true;
  });

  const openTickets = costTickets.filter((t) => t.status === 'open');
  const totalCostPaise = costTickets.reduce((sum, t) => sum + (t.costApplied || 0), 0);
  const openCostPaise = openTickets.reduce((sum, t) => sum + (t.costApplied || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newBookingId.trim()) return;
    setIsSubmitting(true);
    await onCreateCostTicket({
      bookingId: newBookingId.trim().toUpperCase(),
      category: newCategory,
      sourceModule: 'manual',
    });
    setNewBookingId('');
    setIsSubmitting(false);
  };

  return (
    <div>
      {/* Financial Summary Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card" style={{ '--accent': '#7C3AED' }}>
          <div className="stat-icon" style={{ background: '#FAF5FF', color: '#7C3AED' }}>
            <Receipt size={20} />
          </div>
          <div className="stat-value">{costTickets.length}</div>
          <div className="stat-label">Total Cost Tickets</div>
        </div>

        <div className="stat-card" style={{ '--accent': '#DC2626' }}>
          <div className="stat-icon" style={{ background: '#FEF2F2', color: '#DC2626' }}>
            <AlertCircle size={20} />
          </div>
          <div className="stat-value">{openTickets.length}</div>
          <div className="stat-label">Open Cost Liabilities</div>
        </div>

        <div className="stat-card" style={{ '--accent': '#F59E0B' }}>
          <div className="stat-icon" style={{ background: '#FFFBEB', color: '#F59E0B' }}>
            <Coins size={20} />
          </div>
          <div className="stat-value" style={{ fontSize: '1.45rem' }}>
            {formatPaiseToRupees(totalCostPaise)}
          </div>
          <div className="stat-label">Total Ledger Deductions</div>
        </div>

        <div className="stat-card" style={{ '--accent': '#3B82F6' }}>
          <div className="stat-icon" style={{ background: '#EFF6FF', color: '#3B82F6' }}>
            <Coins size={20} />
          </div>
          <div className="stat-value" style={{ fontSize: '1.45rem', color: '#2563EB' }}>
            {formatPaiseToRupees(openCostPaise)}
          </div>
          <div className="stat-label">Open Unresolved Deductions</div>
        </div>
      </div>

      {/* Main Ledger Table Card */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Booking Ledger Support Deductions</div>
            <div className="card-sub">
              Deductions applied automatically by cancellations, complaints, SOS &amp; lost items
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button className="btn btn-ghost btn-sm" onClick={onRefresh} title="Reload Ledger">
              <RefreshCw size={13} /> Refresh Ledger
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div style={{ padding: '16px 20px 0', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="open">Open</option>
            <option value="resolved">Resolved</option>
          </select>

          <select
            className="filter-select"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">All Categories</option>
            <option value="complaint">Complaint</option>
            <option value="dispute">Dispute</option>
            <option value="cancellation">Cancellation</option>
            <option value="lost_and_found">Lost &amp; Found</option>
            <option value="sos">SOS Emergency</option>
          </select>
        </div>

        <div className="table-wrap" style={{ marginTop: '12px' }}>
          <table>
            <thead>
              <tr>
                <th>Ticket ID</th>
                <th>Booking ID</th>
                <th>Category</th>
                <th>Source Module</th>
                <th style={{ textAlign: 'right' }}>Cost Applied</th>
                <th>Raised Timestamp</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: '#94A3B8' }}>
                    No support cost ledger records match this filter.
                  </td>
                </tr>
              ) : (
                filteredTickets.map((t) => (
                  <tr key={t.ticketId}>
                    <td>
                      <span className="ticket-id">{t.ticketId}</span>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#1E293B' }}>
                        {t.bookingId}
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          background: '#F5F3FF',
                          color: '#6D28D9',
                          textTransform: 'capitalize',
                        }}
                      >
                        {(t.category || '').replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ color: '#64748B', fontSize: '0.78rem' }}>
                      {t.sourceModule || '—'}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, fontFamily: 'monospace', color: '#0F172A' }}>
                      {formatPaiseToRupees(t.costApplied)}
                    </td>
                    <td style={{ color: '#64748B', fontSize: '0.76rem' }}>
                      {new Date(t.createdAt).toLocaleString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td>
                      <span className={`badge ${t.status === 'open' ? 'badge-high' : 'badge-resolved'}`}>
                        {t.status}
                      </span>
                    </td>
                    <td>
                      {t.status === 'open' ? (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => onResolveCostTicket(t.ticketId)}
                        >
                          <CheckCircle2 size={13} /> Resolve
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: '#16A34A', fontWeight: 600 }}>
                          ✓ Settled
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

      {/* Manual Ticket Creator Card */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Raise Manual Support Ticket</div>
            <div className="card-sub">
              For traveler complaints or booking disputes requiring immediate ledger attribution
            </div>
          </div>
        </div>

        <div style={{ padding: '20px 24px' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: '1', minWidth: '180px' }}>
              <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                Booking Reference ID
              </label>
              <input
                type="text"
                className="search-input"
                style={{ paddingLeft: '12px' }}
                placeholder="e.g. B004"
                value={newBookingId}
                onChange={(e) => setNewBookingId(e.target.value)}
                required
              />
            </div>

            <div style={{ minWidth: '180px' }}>
              <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                Dispute Category
              </label>
              <select
                className="filter-select"
                style={{ width: '100%' }}
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
              >
                <option value="complaint">Complaint (Deduction: ₹3,500)</option>
                <option value="dispute">Dispute (Deduction: ₹5,000)</option>
                <option value="cancellation">Cancellation (Deduction: ₹800)</option>
                <option value="lost_and_found">Lost &amp; Found (Deduction: ₹1,000)</option>
              </select>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
              style={{ height: '38px', padding: '0 20px' }}
            >
              <PlusCircle size={15} />
              {isSubmitting ? 'Posting…' : 'Create Ledger Ticket'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
