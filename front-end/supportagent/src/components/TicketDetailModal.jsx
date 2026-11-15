import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  User,
  Ticket,
  Calendar,
  ShieldAlert,
  Building2,
  DollarSign,
  History,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { CATEGORY_CHECKLISTS, CATEGORY_DEFINITIONS, detectTicketCategory, formatRupees } from '../services/api';

export default function TicketDetailModal({
  ticket,
  onClose,
  onResolve,
  onDeescalate,
  onOpenResolutionWorkflow,
}) {
  if (!ticket) return null;

  const [notes, setNotes] = useState('');
  const [showAuditTrail, setShowAuditTrail] = useState(false);

  const categoryKey = detectTicketCategory(ticket);
  const categoryConfig = CATEGORY_DEFINITIONS[categoryKey] || CATEGORY_DEFINITIONS.OTHER;
  const checklistTemplate = CATEGORY_CHECKLISTS[categoryKey] || CATEGORY_CHECKLISTS.OTHER;

  const totalSteps = checklistTemplate.length;
  const completedSteps = checklistTemplate.filter(
    (step) => ticket.verificationChecklist?.[step.id]
  ).length;

  const handleStartStructuredResolution = () => {
    if (onOpenResolutionWorkflow) {
      onOpenResolutionWorkflow(ticket);
    } else if (onResolve) {
      onResolve(ticket.id, notes);
    }
  };

  const handleDeescalate = () => {
    if (onOpenResolutionWorkflow) {
      onOpenResolutionWorkflow(ticket);
    } else if (onDeescalate) {
      onDeescalate(ticket.id, notes);
      onClose();
    }
  };

  const getStatusBadgeClass = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'open':
        return 'badge-open';
      case 'under investigation':
      case 'pending verification':
      case 'in progress':
        return 'badge-inprogress';
      case 'resolved':
        return 'badge-resolved';
      case 'approved':
        return 'badge-resolved';
      case 'rejected':
      case 'escalated':
      case 'escalated to service provider':
      case 'escalated to technical team':
        return 'badge-escalated';
      default:
        return 'badge-open';
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span
              style={{
                fontFamily: 'monospace',
                fontWeight: 800,
                fontSize: '0.86rem',
                color: '#4338CA',
                background: '#EEF2FF',
                padding: '3px 8px',
                borderRadius: '6px',
                border: '1px solid #C7D2FE',
              }}
            >
              #{ticket.id}
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '3px 9px',
                borderRadius: '6px',
                background: categoryConfig.bgColor,
                color: categoryConfig.color,
                border: `1.5px solid ${categoryConfig.borderColor}`,
              }}
            >
              <span
                style={{
                  width: '5px',
                  height: '5px',
                  borderRadius: '50%',
                  background: categoryConfig.color,
                  flexShrink: 0,
                }}
              />
              {categoryConfig.label}
            </span>
            <span
              className={`badge ${getStatusBadgeClass(ticket.status)}`}
              style={{ borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700, padding: '3px 9px' }}
            >
              {ticket.status}
            </span>
            <span
              className={`badge ${ticket.priority === 'High' ? 'badge-high' : 'badge-low'}`}
              style={{ borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700, padding: '3px 9px' }}
            >
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
              marginBottom: '16px',
            }}
          >
            <div>
              <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700 }}>PASSENGER</div>
              <div style={{ fontWeight: 700, color: '#0F172A', marginTop: '2px' }}>{ticket.customer}</div>
              <div style={{ fontSize: '0.72rem', color: '#64748B' }}>ID: {ticket.customerId || 'CUST-REF'}</div>
            </div>

            {categoryKey === 'TECHNICAL' ? (
              <div>
                <div style={{ fontSize: '0.7rem', color: '#7C3AED', fontWeight: 700 }}>TECHNICAL MODULE &amp; OS</div>
                <div style={{ fontWeight: 700, color: '#4C1D95', marginTop: '2px' }}>
                  {ticket.technicalDetails?.affectedModule || 'Payment Gateway / OTP'}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>
                  {ticket.technicalDetails?.customerDevice || 'Client App'} • Severity: {ticket.technicalDetails?.severity || 'Critical'}
                </div>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700 }}>BOOKING &amp; OPERATOR</div>
                <div style={{ fontWeight: 700, color: '#0F172A', marginTop: '2px', fontFamily: 'monospace' }}>
                  {ticket.bookingId ? `PNR #${ticket.bookingId}` : 'No Direct Booking'}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#7C3AED', fontWeight: 600 }}>
                  {ticket.serviceProvider || 'Click2Book Fleet'} {ticket.fare ? `• ${formatRupees(ticket.fare)}` : ''}
                </div>
              </div>
            )}
          </div>

          {/* Procedure & Verification Progress Bar */}
          <div
            style={{
              background: '#F1F5F9',
              borderRadius: '8px',
              padding: '10px 14px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569' }}>
                PROCEDURE VERIFICATION STATUS
              </div>
              <div style={{ fontSize: '0.82rem', fontWeight: 800, color: completedSteps === totalSteps ? '#16A34A' : '#D97706', marginTop: '2px' }}>
                {completedSteps} of {totalSteps} Checklist Steps Completed
              </div>
            </div>

            {ticket.status !== 'Resolved' && (
              <button
                type="button"
                className="btn btn-sm btn-outline"
                style={{ borderColor: '#7C3AED', color: '#7C3AED' }}
                onClick={handleStartStructuredResolution}
              >
                Open Verification Desk →
              </button>
            )}
          </div>

          {/* Financial Loss Summary (If Cancellation or Refund) */}
          {ticket.financialImpact && (
            <div
              style={{
                background: '#FFF7ED',
                border: '1px solid #FED7AA',
                borderRadius: '8px',
                padding: '10px 14px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#9A3412' }}>
                  OPERATOR FINANCIAL IMPACT (90/10 RULE)
                </span>
                <div style={{ fontSize: '0.78rem', color: '#C2410C', marginTop: '2px' }}>
                  Fare: {formatRupees(ticket.financialImpact.originalAmount)} • Refund: {formatRupees(ticket.financialImpact.customerRefund)}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#9A3412' }}>ESTIMATED LOSS</div>
                <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#BE123C' }}>
                  {formatRupees(ticket.financialImpact.providerFinancialLoss)}
                </div>
              </div>
            </div>
          )}

          {/* Issue Subject & Message */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
              CUSTOMER COMPLAINT / INQUIRY
            </label>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1E293B', marginBottom: '6px' }}>
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

          {/* Resolution Outcome if Resolved */}
          {ticket.status === 'Resolved' && (
            <div
              style={{
                background: '#F0FDF4',
                border: '1px solid #BBF7D0',
                borderRadius: '8px',
                padding: '12px 14px',
                marginBottom: '16px',
              }}
            >
              <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#15803D', marginBottom: '4px' }}>
                ✓ OFFICIAL RESOLUTION SETTLEMENT
              </div>
              <div style={{ fontSize: '0.82rem', color: '#166534', lineHeight: 1.4 }}>
                {ticket.resolution || 'Issue investigated and resolved in accordance with Click2Book service policies.'}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#65A30D', marginTop: '6px' }}>
                Resolved by <strong>{ticket.resolvedBy || 'Support Agent'}</strong> on{' '}
                {ticket.resolvedAt ? new Date(ticket.resolvedAt).toLocaleDateString() : 'Recent'}
              </div>
            </div>
          )}

          {/* Audit Trail Toggle */}
          <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '10px' }}>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              style={{ width: '100%', display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}
              onClick={() => setShowAuditTrail(!showAuditTrail)}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: '#475569', fontSize: '0.78rem' }}>
                <History size={14} /> Ticket Activity History ({ticket.auditTrail?.length || 0} events)
              </span>
              <span style={{ fontSize: '0.72rem', color: '#7C3AED' }}>
                {showAuditTrail ? 'Hide ▲' : 'Show ▼'}
              </span>
            </button>

            {showAuditTrail && (
              <div style={{ marginTop: '8px', background: '#F8FAFC', borderRadius: '6px', padding: '8px', maxHeight: '140px', overflowY: 'auto' }}>
                {(ticket.auditTrail || []).map((ev, i) => (
                  <div key={ev.id || i} style={{ fontSize: '0.74rem', padding: '6px', borderBottom: '1px solid #E2E8F0' }}>
                    <div style={{ fontWeight: 700, color: '#1E293B' }}>{ev.action}</div>
                    <div style={{ color: '#64748B', fontSize: '0.7rem' }}>
                      By {ev.agentName} {ev.newStatus ? `• Status: ${ev.newStatus}` : ''}
                    </div>
                    {ev.remarks && <div style={{ color: '#334155', fontStyle: 'italic', marginTop: '2px' }}>"{ev.remarks}"</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>
            Dismiss
          </button>

          {ticket.status !== 'Resolved' && (
            <button
              className="btn btn-primary"
              onClick={handleStartStructuredResolution}
            >
              <CheckCircle2 size={14} /> Open Structured Resolution
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
