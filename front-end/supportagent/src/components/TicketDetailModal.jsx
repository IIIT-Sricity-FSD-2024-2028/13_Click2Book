import React, { useState } from 'react';
import { X, CheckCircle2, User, Ticket, Calendar, ShieldAlert } from 'lucide-react';

export default function TicketDetailModal({
  ticket,
  onClose,
  onResolve,
  onDeescalate,
}) {
  if (!ticket) return null;

  const [notes, setNotes] = useState('');

  const handleResolve = () => {
    onResolve(ticket.id, notes);
    onClose();
  };

  const handleDeescalate = () => {
    onDeescalate(ticket.id, notes);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="ticket-id" style={{ fontSize: '0.9rem' }}>
              {ticket.id}
            </span>
            <span className={`badge ${ticket.status === 'Resolved' ? 'badge-resolved' : (ticket.status === 'Escalated' ? 'badge-escalated' : 'badge-open')}`}>
              {ticket.status}
            </span>
            <span className={`badge ${ticket.priority === 'High' ? 'badge-high' : 'badge-low'}`}>
              {ticket.priority} Priority
            </span>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose} style={{ padding: '6px' }}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body">
          {/* Passenger & Booking Details */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              padding: '14px',
              background: '#F8FAFC',
              borderRadius: '10px',
              border: '1px solid #E2E8F0',
              marginBottom: '18px',
            }}
          >
            <div>
              <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700 }}>
                PASSENGER
              </div>
              <div style={{ fontWeight: 700, color: '#0F172A', marginTop: '2px' }}>
                {ticket.customer}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
                ID: {ticket.customerId || 'CUST-REF'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700 }}>
                BOOKING &amp; CATEGORY
              </div>
              <div style={{ fontWeight: 700, color: '#0F172A', marginTop: '2px', fontFamily: 'monospace' }}>
                {ticket.bookingId ? `PNR #${ticket.bookingId}` : 'No Direct Booking'}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#7C3AED', fontWeight: 600 }}>
                {ticket.category || 'General Support'}
              </div>
            </div>
          </div>

          {/* Issue Subject & Message */}
          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
              SUBJECT / INQUIRY
            </label>
            <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#1E293B', marginBottom: '8px' }}>
              {ticket.subject}
            </div>
            <div
              style={{
                fontSize: '0.82rem',
                color: '#334155',
                lineHeight: 1.5,
                padding: '12px 14px',
                background: '#FAF5FF',
                borderRadius: '8px',
                border: '1px solid #E9D5FF',
              }}
            >
              {ticket.description || 'Passenger contacted support regarding booking discrepancy.'}
            </div>
          </div>

          {/* Resolution Notes Box */}
          {ticket.status !== 'Resolved' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                SUPERVISOR RESOLUTION REMARKS
              </label>
              <textarea
                rows={3}
                className="search-input"
                style={{ padding: '10px 12px', resize: 'vertical' }}
                placeholder="Enter actions taken (e.g. refund initiated, bus operator dispatched backup coach)..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>
            Dismiss
          </button>

          {ticket.status === 'Escalated' && (
            <button
              className="btn btn-primary"
              style={{ background: '#E11D48' }}
              onClick={handleDeescalate}
            >
              <ShieldAlert size={14} /> De-escalate &amp; Resolve
            </button>
          )}

          {ticket.status !== 'Resolved' && ticket.status !== 'Escalated' && (
            <button className="btn btn-primary" onClick={handleResolve}>
              <CheckCircle2 size={14} /> Mark as Resolved
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
