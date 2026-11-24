import React, { useState, useEffect, useCallback } from 'react';

export default function Escalations({ provider, showToast }) {
  const [escalations, setEscalations] = useState([]);
  const [remarksInput, setRemarksInput] = useState({});
  const [filter, setFilter] = useState('ALL');

  const loadEscalations = useCallback(() => {
    try {
      // 1. Read c2b_provider_escalations
      let list = JSON.parse(localStorage.getItem('c2b_provider_escalations') || '[]');

      // 2. If empty, check c2b_support_tickets_v2 for any escalated tickets
      if (list.length === 0) {
        const supportTickets = JSON.parse(localStorage.getItem('c2b_support_tickets_v2') || '[]');
        const seeded = supportTickets
          .filter((t) => t.status === 'Escalated to Service Provider' || t.status === 'Pending Approval' || t.escalation)
          .map((t) => ({
            id: t.escalation?.id || `ESC-${t.id}`,
            ticketId: t.id,
            bookingId: t.bookingId || 'B001',
            customerName: t.customer,
            complaint: t.escalation?.complaint || t.subject,
            category: t.category || 'CANCELLATION',
            amountInvolved: t.fare || 2000,
            financialImpact: t.financialImpact,
            providerId: t.providerId || provider?.id || 'P002',
            providerName: t.serviceProvider || provider?.name || 'Kiran Travels',
            requiredAction: t.escalation?.requiredAction || 'Review cancellation & approve refund settlement',
            approvalRequired: true,
            status: t.escalation?.escalationStatus || t.status === 'Approved' ? 'Approved' : (t.status === 'Rejected' ? 'Rejected' : 'Pending Approval'),
            escalatedBy: t.assignedTo || 'Support Agent',
            escalatedAt: t.escalation?.escalatedAt || t.createdAt || new Date().toISOString(),
            providerRemarks: t.escalation?.providerRemarks || '',
          }));
        if (seeded.length > 0) {
          list = seeded;
          localStorage.setItem('c2b_provider_escalations', JSON.stringify(list));
        }
      }

      setEscalations(list);
    } catch (e) {
      console.warn('Failed to load escalations in provider app', e);
    }
  }, [provider]);

  useEffect(() => {
    loadEscalations();

    const onStorage = (e) => {
      if (!e.key || e.key.includes('escalation') || e.key.includes('ticket')) {
        loadEscalations();
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [loadEscalations]);

  const handleDecision = (esc, decision) => {
    const remark = (remarksInput[esc.id] || '').trim();
    const now = new Date().toISOString();

    // 1. Update c2b_provider_escalations
    const updatedEscs = escalations.map((item) => {
      if (item.id === esc.id || item.ticketId === esc.ticketId) {
        return {
          ...item,
          status: decision,
          providerRemarks: remark || (decision === 'Approved' ? 'Operator approved request.' : 'Operator rejected request.'),
          respondedBy: provider?.name || 'Fleet Operator',
          respondedAt: now,
          updatedAt: now,
        };
      }
      return item;
    });
    setEscalations(updatedEscs);
    localStorage.setItem('c2b_provider_escalations', JSON.stringify(updatedEscs));

    // 2. Synchronize c2b_support_tickets_v2
    try {
      const tickets = JSON.parse(localStorage.getItem('c2b_support_tickets_v2') || '[]');
      const updatedTickets = tickets.map((t) => {
        if (t.id === esc.ticketId || (esc.bookingId && t.bookingId === esc.bookingId)) {
          const auditEntry = {
            id: `AUD-SP-${Date.now()}`,
            action: decision === 'Approved' ? 'Operator Approved Escalation' : 'Operator Rejected Escalation',
            agentName: provider?.name || 'Fleet Operator',
            previousStatus: t.status,
            newStatus: decision,
            serviceProviderResponse: {
              decision,
              remarks: remark || `Operator ${decision.toLowerCase()} request.`,
              timestamp: now,
            },
            timestamp: now,
            remarks: remark || `Operator decision: ${decision}.`,
          };

          return {
            ...t,
            status: decision,
            escalation: {
              ...(t.escalation || {}),
              escalationStatus: decision,
              providerResponse: decision,
              providerRemarks: remark || `Operator marked request as ${decision}.`,
              respondedAt: now,
            },
            auditTrail: [auditEntry, ...(t.auditTrail || [])],
            updatedAt: now,
          };
        }
        return t;
      });
      localStorage.setItem('c2b_support_tickets_v2', JSON.stringify(updatedTickets));
    } catch (_) {}

    // 3. If approved cancellation, update c2b_bookings and c2b_refunds
    if (decision === 'Approved' && esc.bookingId) {
      try {
        const bookings = JSON.parse(localStorage.getItem('c2b_bookings') || '[]');
        bookings.forEach((b) => {
          if (b.bookingId === esc.bookingId || b.booking_id === esc.bookingId) {
            b.booking_status = 'CANCELLED';
            b.status = 'CANCELLED';
            b.cancellation_approved_by_provider = true;
          }
        });
        localStorage.setItem('c2b_bookings', JSON.stringify(bookings));
      } catch (_) {}

      try {
        const refList = JSON.parse(localStorage.getItem('c2b_refunds') || '[]');
        const refIdx = refList.findIndex((r) => r.booking_id === esc.bookingId || r.bookingId === esc.bookingId);
        const refAmt = esc.financialImpact?.customerRefund || (esc.amountInvolved ? esc.amountInvolved - 300 : 1700);
        const refItem = {
          refund_id: `REF-${esc.bookingId}`,
          booking_id: esc.bookingId,
          customer_name: esc.customerName || 'Passenger',
          amount: refAmt,
          refund_amount: refAmt,
          status: 'PROCESSING',
          request_date: now.split('T')[0],
          reason: `Operator approved cancellation: ${esc.complaint || 'Waiver granted'}`,
          provider_approved: true,
        };
        if (refIdx >= 0) {
          refList[refIdx] = { ...refList[refIdx], ...refItem };
        } else {
          refList.unshift(refItem);
        }
        localStorage.setItem('c2b_refunds', JSON.stringify(refList));
      } catch (_) {}
    }

    // 4. Dispatch storage event for real-time synchronization with Customer Support Portal
    window.dispatchEvent(new Event('storage'));

    if (showToast) {
      showToast(
        `✓ Request for Booking #${esc.bookingId} marked as ${decision}. Synced with Customer Support Portal.`,
        decision === 'Approved' ? 'success' : 'info'
      );
    }
  };

  const filteredEscalations = escalations.filter((e) => {
    if (filter === 'PENDING') return e.status === 'Pending Approval';
    if (filter === 'APPROVED') return e.status === 'Approved';
    if (filter === 'REJECTED') return e.status === 'Rejected';
    return true;
  });

  const pendingCount = escalations.filter((e) => e.status === 'Pending Approval').length;

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '10px 0' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
            Customer Support Escalations &amp; Dispute Desk
          </h2>
          <p style={{ fontSize: '0.82rem', color: '#64748B', marginTop: '4px' }}>
            Review passenger cancellation requests, approve refund settlements, and view operator financial loss impacts.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <span
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              background: pendingCount > 0 ? '#FFF7ED' : '#F0FDF4',
              color: pendingCount > 0 ? '#C2410C' : '#15803D',
              border: pendingCount > 0 ? '1px solid #FED7AA' : '1px solid #BBF7D0',
              fontWeight: 700,
              fontSize: '0.78rem',
            }}
          >
            {pendingCount > 0 ? `⏳ ${pendingCount} Awaiting Your Approval` : '✓ All Escalations Resolved'}
          </span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
        <button
          type="button"
          className="btn"
          style={{
            background: filter === 'ALL' ? '#F97316' : '#FFFFFF',
            color: filter === 'ALL' ? '#FFFFFF' : '#475569',
            border: '1.5px solid #E2E8F0',
            borderRadius: '8px',
            padding: '6px 14px',
            fontSize: '0.78rem',
            fontWeight: 700,
            cursor: 'pointer',
          }}
          onClick={() => setFilter('ALL')}
        >
          All Requests ({escalations.length})
        </button>
        <button
          type="button"
          className="btn"
          style={{
            background: filter === 'PENDING' ? '#F97316' : '#FFFFFF',
            color: filter === 'PENDING' ? '#FFFFFF' : '#475569',
            border: '1.5px solid #E2E8F0',
            borderRadius: '8px',
            padding: '6px 14px',
            fontSize: '0.78rem',
            fontWeight: 700,
            cursor: 'pointer',
          }}
          onClick={() => setFilter('PENDING')}
        >
          Pending Approval ({pendingCount})
        </button>
        <button
          type="button"
          className="btn"
          style={{
            background: filter === 'APPROVED' ? '#16A34A' : '#FFFFFF',
            color: filter === 'APPROVED' ? '#FFFFFF' : '#475569',
            border: '1.5px solid #E2E8F0',
            borderRadius: '8px',
            padding: '6px 14px',
            fontSize: '0.78rem',
            fontWeight: 700,
            cursor: 'pointer',
          }}
          onClick={() => setFilter('APPROVED')}
        >
          Approved ({escalations.filter((e) => e.status === 'Approved').length})
        </button>
        <button
          type="button"
          className="btn"
          style={{
            background: filter === 'REJECTED' ? '#DC2626' : '#FFFFFF',
            color: filter === 'REJECTED' ? '#FFFFFF' : '#475569',
            border: '1.5px solid #E2E8F0',
            borderRadius: '8px',
            padding: '6px 14px',
            fontSize: '0.78rem',
            fontWeight: 700,
            cursor: 'pointer',
          }}
          onClick={() => setFilter('REJECTED')}
        >
          Rejected ({escalations.filter((e) => e.status === 'Rejected').length})
        </button>
      </div>

      {/* Escalation Cards List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {filteredEscalations.length === 0 ? (
          <div
            style={{
              padding: '40px',
              textAlign: 'center',
              background: '#FFFFFF',
              borderRadius: '12px',
              border: '1px solid #E2E8F0',
              color: '#94A3B8',
            }}
          >
            No escalations found in this filter category.
          </div>
        ) : (
          filteredEscalations.map((esc) => {
            const isPending = esc.status === 'Pending Approval';
            const isApproved = esc.status === 'Approved';
            const isRejected = esc.status === 'Rejected';
            const fin = esc.financialImpact || {
              originalAmount: esc.amountInvolved || 2000,
              cancellationCharges: 300,
              customerRefund: 1700,
              providerOriginalShare: 1800,
              platformCommission: 200,
              providerCancellationShare: 270,
              providerFinancialLoss: 1530,
            };

            return (
              <div
                key={esc.id}
                style={{
                  background: '#FFFFFF',
                  borderRadius: '12px',
                  border: isPending ? '2px solid #FED7AA' : '1px solid #E2E8F0',
                  boxShadow: isPending ? '0 4px 14px rgba(249, 115, 22, 0.08)' : '0 2px 6px rgba(0,0,0,0.03)',
                  padding: '18px 22px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                }}
              >
                {/* Header row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span
                      style={{
                        fontFamily: 'monospace',
                        fontWeight: 800,
                        fontSize: '0.92rem',
                        color: '#EA580C',
                        background: '#FFF7ED',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        border: '1px solid #FED7AA',
                      }}
                    >
                      PNR #{esc.bookingId}
                    </span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0F172A' }}>
                      Passenger: {esc.customerName || 'Passenger'}
                    </span>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '12px',
                        background: '#EFF6FF',
                        color: '#1D4ED8',
                      }}
                    >
                      Ticket: {esc.ticketId}
                    </span>
                  </div>

                  <span
                    style={{
                      fontSize: '0.74rem',
                      fontWeight: 800,
                      padding: '4px 12px',
                      borderRadius: '20px',
                      background: isApproved ? '#DCFCE7' : isRejected ? '#FEE2E2' : '#FFF7ED',
                      color: isApproved ? '#15803D' : isRejected ? '#DC2626' : '#C2410C',
                      border: isApproved ? '1px solid #86EFAC' : isRejected ? '1px solid #FCA5A5' : '1px solid #FED7AA',
                    }}
                  >
                    {isApproved ? '✓ Approved by Operator' : isRejected ? '✗ Rejected by Operator' : '⏳ Pending Operator Decision'}
                  </span>
                </div>

                {/* Complaint details */}
                <div
                  style={{
                    background: '#F8FAFC',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                  }}
                >
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748B', marginBottom: '2px' }}>
                    CUSTOMER COMPLAINT / ESCALATED INQUIRY:
                  </div>
                  <div style={{ fontSize: '0.84rem', color: '#1E293B', fontWeight: 500, lineHeight: 1.45 }}>
                    {esc.complaint}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#7C3AED', fontWeight: 600, marginTop: '6px' }}>
                    Required Action: {esc.requiredAction}
                  </div>
                </div>

                {/* Financial Loss Impact Breakdown */}
                <div
                  style={{
                    background: '#FFFBEB',
                    border: '1px solid #FDE68A',
                    borderRadius: '8px',
                    padding: '12px 16px',
                  }}
                >
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#92400E', marginBottom: '8px' }}>
                    💰 Financial Breakdown &amp; Operator Settlement (90% Fleet Share / 10% Platform Commission)
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
                    <div>
                      <div style={{ fontSize: '0.68rem', color: '#78350F' }}>ORIGINAL FARE</div>
                      <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0F172A' }}>₹{fin.originalAmount}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.68rem', color: '#78350F' }}>CANCELLATION FEE</div>
                      <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#EF4444' }}>−₹{fin.cancellationCharges}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.68rem', color: '#78350F' }}>CUSTOMER REFUND</div>
                      <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#059669' }}>₹{fin.customerRefund}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.68rem', color: '#78350F' }}>RETAINED FEE (90%)</div>
                      <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#2563EB' }}>+₹{fin.providerCancellationShare}</div>
                    </div>
                    <div style={{ background: '#FEF2F2', padding: '6px 10px', borderRadius: '6px', border: '1px solid #FECACA' }}>
                      <div style={{ fontSize: '0.68rem', color: '#991B1B', fontWeight: 700 }}>NET LOSS TO OPERATOR</div>
                      <div style={{ fontSize: '0.98rem', fontWeight: 800, color: '#DC2626' }}>₹{fin.providerFinancialLoss}</div>
                    </div>
                  </div>
                </div>

                {/* Operator Response / Decision Controls */}
                {isPending ? (
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', marginTop: '4px' }}>
                    <input
                      type="text"
                      placeholder="Add operator response remarks (optional)..."
                      style={{
                        flex: '1 1 280px',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: '1px solid #CBD5E1',
                        fontSize: '0.8rem',
                      }}
                      value={remarksInput[esc.id] || ''}
                      onChange={(e) => setRemarksInput({ ...remarksInput, [esc.id]: e.target.value })}
                    />
                    <button
                      type="button"
                      style={{
                        background: '#16A34A',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '8px 16px',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                      onClick={() => handleDecision(esc, 'Approved')}
                    >
                      ✓ Approve Request
                    </button>
                    <button
                      type="button"
                      style={{
                        background: '#DC2626',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '8px 16px',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                      onClick={() => handleDecision(esc, 'Rejected')}
                    >
                      ✗ Reject Request
                    </button>
                  </div>
                ) : (
                  <div style={{ fontSize: '0.76rem', color: '#475569', fontStyle: 'italic', background: '#F1F5F9', padding: '8px 12px', borderRadius: '6px' }}>
                    <strong>Operator Decision:</strong> {esc.status} • "{esc.providerRemarks || 'Decision recorded and synchronized.'}"
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
