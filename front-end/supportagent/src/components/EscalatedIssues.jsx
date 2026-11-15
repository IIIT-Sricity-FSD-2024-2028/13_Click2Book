import React, { useState } from 'react';
import {
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  ArrowDownCircle,
  Eye,
  Building2,
  DollarSign,
  Smartphone,
  Check,
  X,
  History,
  TrendingDown,
} from 'lucide-react';
import {
  formatRupees,
  calculateFinancialImpact,
  getProviderForBooking,
  detectTicketCategory,
  CATEGORY_DEFINITIONS,
} from '../services/api';

export default function EscalatedIssues({
  tickets = [],
  resolvedEscalations = [],
  onDeescalateTicket,
  onSelectTicket,
  onProviderDecision,
  onOpenResolutionModal,
}) {
  const [filterType, setFilterType] = useState('ALL'); // 'ALL' | 'PROVIDER' | 'TECH'

  const escalatedTickets = tickets.filter((t) => {
    const s = t.status;
    const isEsc =
      s === 'Escalated' ||
      s === 'Escalated to Service Provider' ||
      s === 'Escalated to Technical Team' ||
      s === 'Pending Approval' ||
      s === 'Approved' ||
      s === 'Rejected';

    if (!isEsc) return false;
    const cat = detectTicketCategory(t);
    if (filterType === 'PROVIDER') {
      return (
        s === 'Escalated to Service Provider' ||
        s === 'Pending Approval' ||
        s === 'Approved' ||
        s === 'Rejected' ||
        cat === 'CANCELLATION' ||
        cat === 'REFUND'
      );
    }
    if (filterType === 'TECH') {
      return s === 'Escalated to Technical Team' || cat === 'TECHNICAL';
    }
    return true;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Escalated to Service Provider':
        return { text: 'Escalated to Operator', bg: '#FFE4E6', color: '#BE123C', border: '#FECDD3' };
      case 'Pending Approval':
        return { text: 'Awaiting Operator Approval', bg: '#FFF7ED', color: '#C2410C', border: '#FED7AA' };
      case 'Approved':
        return { text: '✓ Operator Approved', bg: '#F0FDF4', color: '#15803D', border: '#BBF7D0' };
      case 'Rejected':
        return { text: '✗ Operator Rejected', bg: '#FEF2F2', color: '#DC2626', border: '#FECACA' };
      case 'Escalated to Technical Team':
        return { text: 'Escalated to Tech Team', bg: '#FAF5FF', color: '#7C3AED', border: '#DDD6FE' };
      default:
        return { text: status, bg: '#FFE4E6', color: '#BE123C', border: '#FECDD3' };
    }
  };

  return (
    <div>
      {/* Alert Warning Banner */}
      <div
        style={{
          background: '#FFF1F2',
          border: '1.5px solid #FECDD3',
          borderRadius: '14px',
          padding: '16px 20px',
          marginBottom: '20px',
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
            {escalatedTickets.length} Active Escalations &amp; Provider Approvals
          </strong>
          <div style={{ fontSize: '0.78rem', color: '#9F1239', marginTop: '2px', opacity: 0.9 }}>
            Critical complaints requiring external service provider authorization, technical engineering triage, or
            cancellation financial loss impact settlement.
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button
          type="button"
          className={`btn btn-sm ${filterType === 'ALL' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setFilterType('ALL')}
        >
          All Escalations ({tickets.filter((t) => t.status?.includes('Escalated') || t.status === 'Pending Approval' || t.status === 'Approved' || t.status === 'Rejected').length})
        </button>
        <button
          type="button"
          className={`btn btn-sm ${filterType === 'PROVIDER' ? 'btn-primary' : 'btn-outline'}`}
          style={filterType === 'PROVIDER' ? { background: '#EA580C', borderColor: '#EA580C' } : {}}
          onClick={() => setFilterType('PROVIDER')}
        >
          <Building2 size={13} /> Service Provider Escalations
        </button>
        <button
          type="button"
          className={`btn btn-sm ${filterType === 'TECH' ? 'btn-primary' : 'btn-outline'}`}
          style={filterType === 'TECH' ? { background: '#7C3AED', borderColor: '#7C3AED' } : {}}
          onClick={() => setFilterType('TECH')}
        >
          <Smartphone size={13} /> Technical Team Escalations
        </button>
      </div>

      {/* Active Escalated Tickets Card */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Critical Escalations &amp; Operator Desk</div>
            <div className="card-sub">
              Synchronized cross-actor approval workflow with automated loss impact computation
            </div>
          </div>
          <span className="badge badge-escalated">{escalatedTickets.length} In Queue</span>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Ticket ID</th>
                <th>Passenger &amp; Booking</th>
                <th>Issue &amp; Category</th>
                <th>Operator &amp; Financial Impact</th>
                <th>Escalation Status</th>
                <th>Supervisor Actions</th>
              </tr>
            </thead>
            <tbody>
              {escalatedTickets.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: '#16A34A', fontWeight: 600 }}>
                    ✓ No active escalations in this queue. All critical tickets are resolved or de-escalated.
                  </td>
                </tr>
              ) : (
                escalatedTickets.map((t) => {
                  const catKey = detectTicketCategory(t);
                  const isTech = catKey === 'TECHNICAL';
                  const catCfg = CATEGORY_DEFINITIONS[catKey] || CATEGORY_DEFINITIONS.OTHER;
                  const badge = getStatusBadge(t.status);
                  const prov = (!isTech && (t.serviceProvider || t.bookingId))
                    ? (t.serviceProvider ? { name: t.serviceProvider } : getProviderForBooking(t.bookingId))
                    : null;
                  const fare = isTech ? null : (t.fare || 2000);
                  const financialImpact = !isTech && fare
                    ? (t.financialImpact || calculateFinancialImpact(fare, catKey, t.cancellationCharges))
                    : null;

                  return (
                    <tr key={t.id}>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                          <span
                            onClick={() => onSelectTicket(t)}
                            style={{
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              padding: '2px 7px',
                              borderRadius: '5px',
                              fontSize: '0.74rem',
                              fontWeight: 800,
                              fontFamily: 'monospace',
                              background: '#EEF2FF',
                              color: '#4338CA',
                              border: '1px solid #C7D2FE',
                              letterSpacing: '0.2px',
                            }}
                          >
                            #{t.id}
                          </span>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              padding: '3px 8px',
                              borderRadius: '6px',
                              background: catCfg.bgColor,
                              color: catCfg.color,
                              border: `1.5px solid ${catCfg.borderColor}`,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            <span
                              style={{
                                width: '5px',
                                height: '5px',
                                borderRadius: '50%',
                                background: catCfg.color,
                                flexShrink: 0,
                              }}
                            />
                            {catCfg.label}
                          </span>
                        </div>
                      </td>

                      <td>
                        <span className="customer-name">{t.customer}</span>
                        {!isTech && t.bookingId && (
                          <div style={{ fontSize: '0.72rem', color: '#64748B', fontFamily: 'monospace' }}>
                            PNR: {t.bookingId}
                          </div>
                        )}
                        {!isTech && fare && (
                          <div style={{ fontSize: '0.7rem', color: '#059669', fontWeight: 600 }}>
                            Fare: {formatRupees(fare)}
                          </div>
                        )}
                        {isTech && (
                          <div style={{ fontSize: '0.68rem', color: '#7C3AED', fontWeight: 600 }}>
                            {t.technicalDetails?.customerDevice || 'Client Platform'}
                          </div>
                        )}
                      </td>

                      <td>
                        <div style={{ fontWeight: 600, color: '#1E293B', fontSize: '0.82rem' }}>{t.subject}</div>
                        <div style={{ fontSize: '0.74rem', color: '#64748B', marginTop: '2px' }}>
                          {t.description || 'Dispute escalated for operator authorization.'}
                        </div>
                        {t.escalation?.providerRemarks && (
                          <div
                            style={{
                              fontSize: '0.72rem',
                              color: t.status === 'Approved' ? '#15803D' : '#DC2626',
                              background: t.status === 'Approved' ? '#F0FDF4' : '#FEF2F2',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              marginTop: '4px',
                            }}
                          >
                            <strong>Operator Note:</strong> {t.escalation.providerRemarks}
                          </div>
                        )}
                      </td>

                      {/* Operator & Financial Loss (or Technical Escalation Target) */}
                      <td>
                        {isTech ? (
                          <div>
                            <div style={{ fontWeight: 700, color: '#6B21A8', fontSize: '0.8rem' }}>
                              Technical Engineering Team
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#7C3AED', marginTop: '2px' }}>
                              Module: {t.technicalDetails?.affectedModule || 'Platform Defect'}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: '#DC2626', fontWeight: 700 }}>
                              Severity: {t.technicalDetails?.severity || 'Critical'}
                            </div>
                          </div>
                        ) : (
                          <>
                            <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.8rem' }}>
                              {prov?.name || 'Assigned Operator'}
                            </div>
                            {financialImpact && (
                              <div style={{ marginTop: '4px', fontSize: '0.72rem' }}>
                                <div style={{ color: '#64748B' }}>
                                  Refund: <strong>{formatRupees(financialImpact.customerRefund)}</strong>
                                </div>
                                <div style={{ color: '#BE123C', fontWeight: 700 }}>
                                  Est. Loss: {formatRupees(financialImpact.providerFinancialLoss)}
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </td>

                      <td>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            fontSize: '0.71rem',
                            fontWeight: 700,
                            padding: '4px 9px',
                            borderRadius: '6px',
                            background: badge.bg,
                            color: badge.color,
                            border: `1.5px solid ${badge.border}`,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          <span
                            style={{
                              width: '5px',
                              height: '5px',
                              borderRadius: '50%',
                              background: badge.color,
                              flexShrink: 0,
                            }}
                          />
                          {badge.text}
                        </span>
                      </td>

                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {/* If pending approval, show direct simulator buttons */}
                          {(t.status === 'Escalated to Service Provider' || t.status === 'Pending Approval') && onProviderDecision && (
                            <div style={{ display: 'flex', gap: '4px' }}>
                              <button
                                type="button"
                                className="btn btn-outline btn-sm"
                                style={{ padding: '3px 6px', fontSize: '0.68rem', borderColor: '#16A34A', color: '#16A34A' }}
                                onClick={() => onProviderDecision(t.id, 'Approved', 'Operator approved cancellation waiver.')}
                                title="Approve cancellation from operator desk"
                              >
                                <Check size={11} /> Approve
                              </button>
                              <button
                                type="button"
                                className="btn btn-outline btn-sm"
                                style={{ padding: '3px 6px', fontSize: '0.68rem', borderColor: '#DC2626', color: '#DC2626' }}
                                onClick={() => onProviderDecision(t.id, 'Rejected', 'Departure within 2-hour non-refundable threshold.')}
                                title="Reject cancellation from operator desk"
                              >
                                <X size={11} /> Reject
                              </button>
                            </div>
                          )}

                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            style={{ background: t.status === 'Approved' ? '#16A34A' : '#7C3AED' }}
                            onClick={() => onOpenResolutionModal ? onOpenResolutionModal(t) : onSelectTicket(t)}
                          >
                            <ShieldCheck size={12} /> {t.status === 'Approved' ? 'Finalize Resolution' : 'Review & Resolve'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Historical Resolved Escalations Log */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Supervisor Resolution Log &amp; Audit Trail</div>
            <div className="card-sub">Recently closed escalations with verified settlements</div>
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
