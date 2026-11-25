import React, { useState, useMemo, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Clock,
  ArrowRight,
  FileText,
  DollarSign,
  Building2,
  Smartphone,
  Send,
  RotateCcw,
  History,
  Check,
  AlertCircle,
  HelpCircle,
  TrendingDown,
} from 'lucide-react';
import {
  CATEGORY_CHECKLISTS,
  CATEGORY_DEFINITIONS,
  calculateFinancialImpact,
  getProviderForBooking,
  detectTicketCategory,
  formatRupees,
} from '../services/api';
import {
  setResolutionTicketId,
  saveTicketProgressThunk,
  escalateToProviderThunk,
  escalateToTechThunk,
  providerDecisionThunk,
  confirmResolutionThunk,
} from '../store/actions';

export default function ResolutionWorkflowModal() {
  const dispatch = useDispatch();
  const resolutionTicketId = useSelector((state) => state.tickets.resolutionTicketId);
  const ticket = useSelector((state) =>
    state.tickets.items.find((t) => t.id === resolutionTicketId) || null
  );
  const agentName = useSelector((state) => state.auth.agent?.name || 'Support Agent');

  const onClose = () => dispatch(setResolutionTicketId(null));
  const onSaveProgress = (ticketId, data) =>
    dispatch(saveTicketProgressThunk({ ticketId, data }));
  const onEscalateToProvider = (ticketId, escalationData) =>
    dispatch(escalateToProviderThunk({ ticketId, escalationData }));
  const onEscalateToTech = (ticketId, techData) =>
    dispatch(escalateToTechThunk({ ticketId, techData }));
  const onProviderDecision = (ticketId, decision, remarks = '') =>
    dispatch(providerDecisionThunk({ ticketId, decision, remarks }));
  const onConfirmResolution = (ticketId, resolutionData) =>
    dispatch(confirmResolutionThunk({ ticketId, resolutionData }));

  if (!ticket) return null;

  // Intelligent category detection & dynamic procedure switching
  const [activeCategory, setActiveCategory] = useState(() => detectTicketCategory(ticket));
  const categoryKey = activeCategory;
  const categoryConfig = CATEGORY_DEFINITIONS[categoryKey] || CATEGORY_DEFINITIONS.OTHER;
  const checklistTemplate = CATEGORY_CHECKLISTS[categoryKey] || CATEGORY_CHECKLISTS.OTHER;

  // Local state for checkboxes
  const [checklist, setChecklist] = useState(() => {
    const initial = {};
    checklistTemplate.forEach((item) => {
      initial[item.id] = ticket.verificationChecklist?.[item.id] || false;
    });
    return initial;
  });

  // Handle procedure category switch
  const handleCategoryChange = (newCat) => {
    setActiveCategory(newCat);
    const newTemplate = CATEGORY_CHECKLISTS[newCat] || CATEGORY_CHECKLISTS.OTHER;
    const initial = {};
    newTemplate.forEach((item) => {
      initial[item.id] = ticket.verificationChecklist?.[item.id] || false;
    });
    setChecklist(initial);
    setValidationError('');
  };

  // Local state for remarks
  const [remarks, setRemarks] = useState(ticket.resolution || ticket.notes || '');

  // Local state for Escalation form
  const [escalationRemarks, setEscalationRemarks] = useState('');
  const [showEscalatePanel, setShowEscalatePanel] = useState(false);
  const [escalateType, setEscalateType] = useState(() => (categoryKey === 'TECHNICAL' ? 'tech' : (categoryKey === 'PAYMENT' ? 'finance' : 'provider')));

  // Technical escalation fields
  const [affectedModule, setAffectedModule] = useState(ticket.technicalDetails?.affectedModule || 'Payment Gateway / OTP Screen');
  const [severity, setSeverity] = useState(ticket.technicalDetails?.severity || 'Critical');
  const [techLevel, setTechLevel] = useState(ticket.technicalDetails?.escalationLevel || 'Level 2: Technical Support Team');
  const [isReproducible, setIsReproducible] = useState(ticket.technicalDetails?.reproducible || 'Yes');

  // Refund outcome fields
  const [refundGatewayState, setRefundGatewayState] = useState(ticket.refundStatus || 'PENDING');
  const [refundArn, setRefundArn] = useState(ticket.referenceId || 'ARN-PG-8923419');

  // Provider rejection reason state
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);

  // Validation warning state
  const [validationError, setValidationError] = useState('');
  const [showAuditTrail, setShowAuditTrail] = useState(false);

  // Provider and Financials — strictly restricted to transit queries (No fare/operator for app crashes)
  const isTech = categoryKey === 'TECHNICAL';
  const provider = (!isTech && (ticket.serviceProvider || ticket.bookingId))
    ? (ticket.serviceProvider ? { name: ticket.serviceProvider, id: ticket.providerId } : getProviderForBooking(ticket.bookingId))
    : null;
  const fare = (!isTech && ticket.fare !== null && ticket.fare !== undefined)
    ? ticket.fare
    : (isTech ? null : (ticket.bookingId === 'B025' ? 2000 : 1450));

  const financialImpact = useMemo(() => {
    if (isTech) return null;
    return calculateFinancialImpact(fare || 0, categoryKey, ticket.cancellationCharges);
  }, [fare, categoryKey, ticket.cancellationCharges, isTech]);

  // Completion calculation
  const totalSteps = checklistTemplate.length;
  const completedSteps = checklistTemplate.filter((item) => checklist[item.id]).length;
  const progressPct = Math.round((completedSteps / totalSteps) * 100);
  const allStepsCompleted = completedSteps === totalSteps;

  const handleToggleCheck = (id) => {
    setChecklist((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
    setValidationError('');
  };

  const handleSaveDraft = () => {
    onSaveProgress(ticket.id, {
      category: activeCategory,
      verificationChecklist: checklist,
      notes: remarks,
      status: ticket.status === 'Open' ? 'Under Investigation' : ticket.status,
      technicalDetails: isTech ? {
        affectedModule,
        severity,
        escalationLevel: techLevel,
        reproducible: isReproducible,
      } : ticket.technicalDetails,
    });
  };

  const handleEscalateSubmit = () => {
    if (escalateType === 'provider') {
      onEscalateToProvider(ticket.id, {
        remarks: escalationRemarks || `Escalated to ${provider.name} for required authorization.`,
        requiredAction: categoryKey === 'CANCELLATION'
          ? 'Approve Cancellation & Refund Settlement'
          : 'Service Quality Investigation & Compensation Waiver',
      });
      setShowEscalatePanel(false);
    } else if (escalateType === 'tech') {
      onEscalateToTech(ticket.id, {
        affectedModule,
        severity,
        escalationLevel: techLevel,
        reproducible: isReproducible,
        remarks: escalationRemarks || `Technical issue escalated to ${techLevel}. Severity: ${severity}.`,
      });
      setShowEscalatePanel(false);
    } else {
      // Finance escalation
      onSaveProgress(ticket.id, {
        verificationChecklist: checklist,
        notes: `Escalated to Finance Team: ${escalationRemarks}`,
        status: 'Escalated to Technical Team', // or finance
      });
      setShowEscalatePanel(false);
    }
  };

  const handleFinalResolution = () => {
    // 1. Mandatory Checklist Check
    const missing = checklistTemplate.filter((item) => !checklist[item.id]);
    if (missing.length > 0) {
      setValidationError(
        `Resolution Blocked: You must complete all ${totalSteps} mandatory verification steps before resolving. (${missing.length} step(s) pending: "${missing[0].label}")`
      );
      return;
    }

    // 2. Cancellation Provider Approval Check
    if (categoryKey === 'CANCELLATION') {
      if (ticket.status === 'Escalated to Service Provider' || ticket.status === 'Pending Approval') {
        setValidationError(
          'Resolution Blocked: This cancellation request is awaiting Service Provider approval. The operator must approve or reject before resolution.'
        );
        return;
      }
    }

    // 3. Technical Team Investigation Check
    if (categoryKey === 'TECHNICAL' && ticket.status === 'Escalated to Technical Team') {
      if (!remarks.toLowerCase().includes('fix') && !remarks.toLowerCase().includes('patch') && !remarks.toLowerCase().includes('resolved')) {
        setValidationError(
          'Resolution Blocked: Technical tickets require technical confirmation or deployment patch notes in remarks.'
        );
        return;
      }
    }

    // 4. Remarks check
    if (!remarks.trim()) {
      setValidationError('Resolution Blocked: Investigation notes and resolution remarks are mandatory.');
      return;
    }

    // Validated!
    onConfirmResolution(ticket.id, {
      verificationChecklist: checklist,
      remarks: remarks.trim(),
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Open':
        return { text: 'Open', bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' };
      case 'Under Investigation':
        return { text: 'Under Investigation', bg: '#FFFBEB', color: '#B45309', border: '#FDE68A' };
      case 'Pending Verification':
        return { text: 'Pending Verification', bg: '#FAF5FF', color: '#7C3AED', border: '#DDD6FE' };
      case 'Escalated to Service Provider':
        return { text: 'Escalated to Service Provider', bg: '#FFE4E6', color: '#BE123C', border: '#FECDD3' };
      case 'Escalated to Technical Team':
        return { text: 'Escalated to Technical Team', bg: '#FDF4FF', color: '#A21CAF', border: '#F5D0FE' };
      case 'Pending Approval':
        return { text: 'Pending Approval', bg: '#FFF7ED', color: '#C2410C', border: '#FED7AA' };
      case 'Approved':
        return { text: '✓ Provider Approved', bg: '#F0FDF4', color: '#15803D', border: '#BBF7D0' };
      case 'Rejected':
        return { text: '✗ Provider Rejected', bg: '#FEF2F2', color: '#DC2626', border: '#FECACA' };
      case 'Resolution in Progress':
        return { text: 'Resolution in Progress', bg: '#EFF6FF', color: '#1E40AF', border: '#93C5FD' };
      case 'Resolved':
        return { text: '✓ Resolved', bg: '#DCFCE7', color: '#16A34A', border: '#86EFAC' };
      default:
        return { text: status, bg: '#F1F5F9', color: '#475569', border: '#CBD5E1' };
    }
  };

  const statusBadge = getStatusBadge(ticket.status);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card"
        style={{ maxWidth: '780px', maxHeight: '90vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          className="modal-header"
          style={{
            background: 'linear-gradient(135deg, #FAF5FF 0%, #F1F5F9 100%)',
            borderBottom: '1.5px solid #E2E8F0',
            padding: '18px 24px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span
              style={{
                fontFamily: 'monospace',
                fontWeight: 800,
                fontSize: '1rem',
                color: '#4338CA',
                background: '#EEF2FF',
                padding: '3px 8px',
                borderRadius: '6px',
                border: '1px solid #C7D2FE',
              }}
            >
              {ticket.id}
            </span>

            {/* Interactive Procedure Category Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 600 }}>Procedure:</span>
              <select
                value={categoryKey}
                onChange={(e) => handleCategoryChange(e.target.value)}
                style={{
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  padding: '3px 10px',
                  borderRadius: '20px',
                  background: categoryConfig.bgColor,
                  color: categoryConfig.color,
                  border: `1.5px solid ${categoryConfig.borderColor}`,
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                <option value="TECHNICAL">💻 Application Crash / Technical Issues</option>
                <option value="REFUND">🏦 Refund Not Credited</option>
                <option value="CANCELLATION">❌ Ticket Cancellation Request</option>
                <option value="PAYMENT">💳 Payment Failed / Amount Deducted</option>
                <option value="BOOKING">🎫 Booking Confirmation Issues</option>
                <option value="COMPLAINT">🚌 Service Quality &amp; Delay Complaints</option>
                <option value="OTHER">📋 General Inquiry / Account Support</option>
              </select>
            </div>

            <span
              style={{
                fontSize: '0.74rem',
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: '6px',
                background: statusBadge.bg,
                color: statusBadge.color,
                border: `1.5px solid ${statusBadge.border}`,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <span
                style={{
                  width: '5px',
                  height: '5px',
                  borderRadius: '50%',
                  background: statusBadge.color,
                  flexShrink: 0,
                }}
              />
              {statusBadge.text}
            </span>
          </div>

          <button
            className="btn btn-ghost btn-sm"
            onClick={onClose}
            style={{ padding: '6px', color: '#64748B' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body" style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Procedure Guidance Banner */}
          <div
            style={{
              background: categoryConfig.bgColor,
              border: `1.5px solid ${categoryConfig.borderColor}`,
              borderRadius: '10px',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
            }}
          >
            <ShieldAlert size={20} color={categoryConfig.color} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.84rem', color: categoryConfig.color }}>
                Standard Operating Procedure: {categoryConfig.label}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#475569', marginTop: '2px', lineHeight: 1.45 }}>
                {categoryConfig.description} Complete the required verification checklist below. The ticket cannot be
                marked as Resolved without full procedure verification and supervisor remarks.
              </div>
            </div>
          </div>

          {/* Validation Warning Alert (If user clicked Resolve prematurely) */}
          {validationError && (
            <div
              style={{
                background: '#FEF2F2',
                border: '1.5px solid #FCA5A5',
                borderRadius: '8px',
                padding: '12px 16px',
                color: '#991B1B',
                fontSize: '0.82rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                animation: 'shake 0.3s ease',
              }}
            >
              <AlertCircle size={18} color="#DC2626" style={{ flexShrink: 0 }} />
              <div>{validationError}</div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              CATEGORY-SPECIFIC PASSENGER & QUERY OVERVIEW BAR
              Different procedures show strictly appropriate fields.
              (e.g., App crashes have NO fare amount and NO bus operator!)
             ══════════════════════════════════════════════════════════ */}

          {/* A. APPLICATION CRASH / TECHNICAL ISSUES OVERVIEW */}
          {categoryKey === 'TECHNICAL' && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: '12px',
                background: '#FAF5FF',
                border: '1.5px solid #DDD6FE',
                borderRadius: '10px',
                padding: '14px',
              }}
            >
              <div>
                <div style={{ fontSize: '0.7rem', color: '#6B21A8', fontWeight: 700 }}>PASSENGER</div>
                <div style={{ fontWeight: 700, color: '#0F172A', marginTop: '2px' }}>{ticket.customer}</div>
                <div style={{ fontSize: '0.72rem', color: '#64748B' }}>ID: {ticket.customerId || 'CUST005'}</div>
              </div>

              <div>
                <div style={{ fontSize: '0.7rem', color: '#7C3AED', fontWeight: 700 }}>AFFECTED MODULE</div>
                <div style={{ fontWeight: 700, color: '#4C1D95', marginTop: '2px' }}>
                  {affectedModule || ticket.technicalDetails?.affectedModule || 'Payment Gateway / OTP Screen'}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#6D28D9', fontWeight: 600 }}>Internal App Defect</div>
              </div>

              <div>
                <div style={{ fontSize: '0.7rem', color: '#6B21A8', fontWeight: 700 }}>CLIENT ENVIRONMENT</div>
                <div style={{ fontWeight: 700, color: '#0F172A', marginTop: '2px' }}>
                  {ticket.technicalDetails?.customerDevice || 'Android 14 (Mobile App)'}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#DC2626', fontWeight: 700 }}>
                  Severity: {severity}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.7rem', color: '#6B21A8', fontWeight: 700 }}>ESCALATION LEVEL</div>
                <div style={{ fontWeight: 700, color: '#7C3AED', marginTop: '2px' }}>
                  {techLevel.split(':')[0]}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
                  {techLevel.split(':')[1] || 'Technical Support'}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.7rem', color: '#6B21A8', fontWeight: 700 }}>VERIFICATION PROGRESS</div>
                <div style={{ fontWeight: 800, color: allStepsCompleted ? '#16A34A' : '#7C3AED', marginTop: '2px' }}>
                  {completedSteps} of {totalSteps} Verified ({progressPct}%)
                </div>
                <div
                  style={{
                    width: '100%',
                    height: '5px',
                    background: '#E2E8F0',
                    borderRadius: '3px',
                    marginTop: '4px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${progressPct}%`,
                      height: '100%',
                      background: allStepsCompleted ? '#16A34A' : '#7C3AED',
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* B. REFUND NOT CREDITED OVERVIEW */}
          {categoryKey === 'REFUND' && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: '12px',
                background: '#FFFBEB',
                border: '1.5px solid #FDE68A',
                borderRadius: '10px',
                padding: '14px',
              }}
            >
              <div>
                <div style={{ fontSize: '0.7rem', color: '#78350F', fontWeight: 700 }}>PASSENGER</div>
                <div style={{ fontWeight: 700, color: '#0F172A', marginTop: '2px' }}>{ticket.customer}</div>
                <div style={{ fontSize: '0.72rem', color: '#64748B' }}>ID: {ticket.customerId || 'CUST002'}</div>
              </div>

              <div>
                <div style={{ fontSize: '0.7rem', color: '#78350F', fontWeight: 700 }}>BOOKING &amp; FARE</div>
                <div style={{ fontWeight: 700, color: '#0F172A', marginTop: '2px', fontFamily: 'monospace' }}>
                  {ticket.bookingId ? `PNR #${ticket.bookingId}` : 'Booking Ref'}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 700 }}>
                  Fare: {formatRupees(fare)}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.7rem', color: '#78350F', fontWeight: 700 }}>REFUND CLAIMED</div>
                <div style={{ fontWeight: 800, color: '#D97706', marginTop: '2px' }}>
                  {formatRupees(ticket.refundAmount || (fare - (ticket.cancellationCharges || 250)))}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#78350F' }}>ARN: {refundArn}</div>
              </div>

              <div>
                <div style={{ fontSize: '0.7rem', color: '#78350F', fontWeight: 700 }}>SERVICE OPERATOR</div>
                <div style={{ fontWeight: 700, color: '#0F172A', marginTop: '2px' }}>{provider?.name || 'Kiran Travels'}</div>
                <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Fleet ID: {provider?.id || 'P002'}</div>
              </div>

              <div>
                <div style={{ fontSize: '0.7rem', color: '#78350F', fontWeight: 700 }}>VERIFICATION PROGRESS</div>
                <div style={{ fontWeight: 800, color: allStepsCompleted ? '#16A34A' : '#D97706', marginTop: '2px' }}>
                  {completedSteps} of {totalSteps} Verified ({progressPct}%)
                </div>
                <div style={{ width: '100%', height: '5px', background: '#E2E8F0', borderRadius: '3px', marginTop: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${progressPct}%`, height: '100%', background: allStepsCompleted ? '#16A34A' : '#D97706', transition: 'width 0.3s ease' }} />
                </div>
              </div>
            </div>
          )}

          {/* C. TICKET CANCELLATION REQUEST OVERVIEW */}
          {categoryKey === 'CANCELLATION' && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: '12px',
                background: '#FEF2F2',
                border: '1.5px solid #FECACA',
                borderRadius: '10px',
                padding: '14px',
              }}
            >
              <div>
                <div style={{ fontSize: '0.7rem', color: '#991B1B', fontWeight: 700 }}>PASSENGER</div>
                <div style={{ fontWeight: 700, color: '#0F172A', marginTop: '2px' }}>{ticket.customer}</div>
                <div style={{ fontSize: '0.72rem', color: '#64748B' }}>ID: {ticket.customerId || 'CUST004'}</div>
              </div>

              <div>
                <div style={{ fontSize: '0.7rem', color: '#991B1B', fontWeight: 700 }}>BOOKING / PNR</div>
                <div style={{ fontWeight: 700, color: '#0F172A', marginTop: '2px', fontFamily: 'monospace' }}>
                  {ticket.bookingId ? `PNR #${ticket.bookingId}` : 'Active Booking'}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 700 }}>
                  Fare: {formatRupees(fare)}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.7rem', color: '#991B1B', fontWeight: 700 }}>CANCELLATION CHARGES</div>
                <div style={{ fontWeight: 800, color: '#DC2626', marginTop: '2px' }}>
                  {formatRupees(financialImpact?.cancellationCharges || 300)}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 600 }}>
                  Expected Refund: {formatRupees(financialImpact?.customerRefund || (fare - 300))}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.7rem', color: '#991B1B', fontWeight: 700 }}>SERVICE OPERATOR</div>
                <div style={{ fontWeight: 700, color: '#0F172A', marginTop: '2px' }}>{provider?.name || 'Operator Desk'}</div>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: ticket.status === 'Approved' ? '#16A34A' : '#DC2626' }}>
                  {ticket.status === 'Approved' ? 'Approved by Operator' : (ticket.status === 'Rejected' ? 'Rejected' : 'Approval Required')}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.7rem', color: '#991B1B', fontWeight: 700 }}>VERIFICATION PROGRESS</div>
                <div style={{ fontWeight: 800, color: allStepsCompleted ? '#16A34A' : '#D97706', marginTop: '2px' }}>
                  {completedSteps} of {totalSteps} Verified ({progressPct}%)
                </div>
                <div style={{ width: '100%', height: '5px', background: '#E2E8F0', borderRadius: '3px', marginTop: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${progressPct}%`, height: '100%', background: allStepsCompleted ? '#16A34A' : '#DC2626', transition: 'width 0.3s ease' }} />
                </div>
              </div>
            </div>
          )}

          {/* D. PAYMENT FAILED / AMOUNT DEDUCTED OVERVIEW */}
          {categoryKey === 'PAYMENT' && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: '12px',
                background: '#FFF7ED',
                border: '1.5px solid #FED7AA',
                borderRadius: '10px',
                padding: '14px',
              }}
            >
              <div>
                <div style={{ fontSize: '0.7rem', color: '#9A3412', fontWeight: 700 }}>PASSENGER</div>
                <div style={{ fontWeight: 700, color: '#0F172A', marginTop: '2px' }}>{ticket.customer}</div>
                <div style={{ fontSize: '0.72rem', color: '#64748B' }}>ID: {ticket.customerId || 'CUST006'}</div>
              </div>

              <div>
                <div style={{ fontSize: '0.7rem', color: '#9A3412', fontWeight: 700 }}>TRANSACTION / UPI REF</div>
                <div style={{ fontWeight: 700, color: '#0F172A', marginTop: '2px', fontFamily: 'monospace' }}>
                  {ticket.paymentDetails?.transactionId || ticket.referenceId || 'UPI-TXN-88492019'}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748B' }}>UTR: {ticket.paymentDetails?.utr || '9988776655'}</div>
              </div>

              <div>
                <div style={{ fontSize: '0.7rem', color: '#9A3412', fontWeight: 700 }}>AMOUNT DEDUCTED</div>
                <div style={{ fontWeight: 800, color: '#DC2626', marginTop: '2px' }}>
                  {formatRupees(ticket.paymentDetails?.amountDeducted || 950)}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Booking Generated: No</div>
              </div>

              <div>
                <div style={{ fontSize: '0.7rem', color: '#9A3412', fontWeight: 700 }}>GATEWAY RESPONSE</div>
                <div style={{ fontWeight: 700, color: '#C2410C', marginTop: '2px' }}>
                  {ticket.paymentDetails?.gatewayResponse || 'Captured (No Booking PNR)'}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Finance Review Required</div>
              </div>

              <div>
                <div style={{ fontSize: '0.7rem', color: '#9A3412', fontWeight: 700 }}>VERIFICATION PROGRESS</div>
                <div style={{ fontWeight: 800, color: allStepsCompleted ? '#16A34A' : '#D97706', marginTop: '2px' }}>
                  {completedSteps} of {totalSteps} Verified ({progressPct}%)
                </div>
                <div style={{ width: '100%', height: '5px', background: '#E2E8F0', borderRadius: '3px', marginTop: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${progressPct}%`, height: '100%', background: allStepsCompleted ? '#16A34A' : '#EA580C', transition: 'width 0.3s ease' }} />
                </div>
              </div>
            </div>
          )}

          {/* E. BOOKING CONFIRMATION ISSUES OVERVIEW */}
          {categoryKey === 'BOOKING' && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: '12px',
                background: '#EFF6FF',
                border: '1.5px solid #BFDBFE',
                borderRadius: '10px',
                padding: '14px',
              }}
            >
              <div>
                <div style={{ fontSize: '0.7rem', color: '#1E40AF', fontWeight: 700 }}>PASSENGER</div>
                <div style={{ fontWeight: 700, color: '#0F172A', marginTop: '2px' }}>{ticket.customer}</div>
                <div style={{ fontSize: '0.72rem', color: '#64748B' }}>ID: {ticket.customerId || 'CUST001'}</div>
              </div>

              <div>
                <div style={{ fontSize: '0.7rem', color: '#1E40AF', fontWeight: 700 }}>BOOKING / PNR</div>
                <div style={{ fontWeight: 700, color: '#0F172A', marginTop: '2px', fontFamily: 'monospace' }}>
                  {ticket.bookingId ? `PNR #${ticket.bookingId}` : 'Booking Under Dispatch'}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 700 }}>Fare: {formatRupees(fare)}</div>
              </div>

              <div>
                <div style={{ fontSize: '0.7rem', color: '#1E40AF', fontWeight: 700 }}>PAYMENT STATUS</div>
                <div style={{ fontWeight: 800, color: '#16A34A', marginTop: '2px' }}>Paid &amp; Captured</div>
                <div style={{ fontSize: '0.72rem', color: '#64748B' }}>PNR Dispatch: Pending</div>
              </div>

              <div>
                <div style={{ fontSize: '0.7rem', color: '#1E40AF', fontWeight: 700 }}>SERVICE OPERATOR</div>
                <div style={{ fontWeight: 700, color: '#0F172A', marginTop: '2px' }}>{provider?.name || 'Operator Desk'}</div>
                <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Fleet ID: {provider?.id || 'P001'}</div>
              </div>

              <div>
                <div style={{ fontSize: '0.7rem', color: '#1E40AF', fontWeight: 700 }}>VERIFICATION PROGRESS</div>
                <div style={{ fontWeight: 800, color: allStepsCompleted ? '#16A34A' : '#D97706', marginTop: '2px' }}>
                  {completedSteps} of {totalSteps} Verified ({progressPct}%)
                </div>
                <div style={{ width: '100%', height: '5px', background: '#E2E8F0', borderRadius: '3px', marginTop: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${progressPct}%`, height: '100%', background: allStepsCompleted ? '#16A34A' : '#2563EB', transition: 'width 0.3s ease' }} />
                </div>
              </div>
            </div>
          )}

          {/* F. SERVICE QUALITY & DELAYS OVERVIEW */}
          {categoryKey === 'COMPLAINT' && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: '12px',
                background: '#FFF1F2',
                border: '1.5px solid #FECDD3',
                borderRadius: '10px',
                padding: '14px',
              }}
            >
              <div>
                <div style={{ fontSize: '0.7rem', color: '#9F1239', fontWeight: 700 }}>PASSENGER</div>
                <div style={{ fontWeight: 700, color: '#0F172A', marginTop: '2px' }}>{ticket.customer}</div>
                <div style={{ fontSize: '0.72rem', color: '#64748B' }}>ID: {ticket.customerId || 'CUST003'}</div>
              </div>

              <div>
                <div style={{ fontSize: '0.7rem', color: '#9F1239', fontWeight: 700 }}>TRIP / PNR</div>
                <div style={{ fontWeight: 700, color: '#0F172A', marginTop: '2px', fontFamily: 'monospace' }}>
                  {ticket.bookingId ? `PNR #${ticket.bookingId}` : 'Trip Complaint'}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 700 }}>Fare: {formatRupees(fare)}</div>
              </div>

              <div>
                <div style={{ fontSize: '0.7rem', color: '#9F1239', fontWeight: 700 }}>SERVICE OPERATOR</div>
                <div style={{ fontWeight: 700, color: '#0F172A', marginTop: '2px' }}>{provider?.name || 'Bus Operator'}</div>
                <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Fleet ID: {provider?.id || 'P002'}</div>
              </div>

              <div>
                <div style={{ fontSize: '0.7rem', color: '#9F1239', fontWeight: 700 }}>ISSUE TYPE</div>
                <div style={{ fontWeight: 700, color: '#E11D48', marginTop: '2px' }}>Quality / Delay Discrepancy</div>
                <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Investigation Required</div>
              </div>

              <div>
                <div style={{ fontSize: '0.7rem', color: '#9F1239', fontWeight: 700 }}>VERIFICATION PROGRESS</div>
                <div style={{ fontWeight: 800, color: allStepsCompleted ? '#16A34A' : '#D97706', marginTop: '2px' }}>
                  {completedSteps} of {totalSteps} Verified ({progressPct}%)
                </div>
                <div style={{ width: '100%', height: '5px', background: '#E2E8F0', borderRadius: '3px', marginTop: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${progressPct}%`, height: '100%', background: allStepsCompleted ? '#16A34A' : '#E11D48', transition: 'width 0.3s ease' }} />
                </div>
              </div>
            </div>
          )}

          {/* G. GENERAL / OTHER OVERVIEW */}
          {categoryKey === 'OTHER' && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '12px',
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '10px',
                padding: '14px',
              }}
            >
              <div>
                <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700 }}>PASSENGER</div>
                <div style={{ fontWeight: 700, color: '#0F172A', marginTop: '2px' }}>{ticket.customer}</div>
                <div style={{ fontSize: '0.72rem', color: '#64748B' }}>ID: {ticket.customerId || 'CUST001'}</div>
              </div>

              <div>
                <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700 }}>INQUIRY TYPE</div>
                <div style={{ fontWeight: 700, color: '#0F172A', marginTop: '2px' }}>General Account &amp; Profile</div>
                <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Source: Passenger Web Portal</div>
              </div>

              <div>
                <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700 }}>VERIFICATION PROGRESS</div>
                <div style={{ fontWeight: 800, color: allStepsCompleted ? '#16A34A' : '#D97706', marginTop: '2px' }}>
                  {completedSteps} of {totalSteps} Verified ({progressPct}%)
                </div>
                <div style={{ width: '100%', height: '5px', background: '#E2E8F0', borderRadius: '3px', marginTop: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${progressPct}%`, height: '100%', background: allStepsCompleted ? '#16A34A' : '#64748B', transition: 'width 0.3s ease' }} />
                </div>
              </div>
            </div>
          )}

          {/* Passenger Issue Inquiry */}
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
              CUSTOMER COMPLAINT / ISSUE
            </div>
            <div
              style={{
                fontSize: '0.84rem',
                color: '#1E293B',
                lineHeight: 1.5,
                background: '#FAF5FF',
                padding: '12px 14px',
                borderRadius: '8px',
                border: '1px solid #E9D5FF',
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: '4px', color: '#4C1D95' }}>{ticket.subject}</div>
              <div>{ticket.description || 'Passenger contacted support regarding booking discrepancy.'}</div>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════
              CATEGORY 1: REFUND NOT CREDITED INTELLIGENCE PANEL
             ══════════════════════════════════════════════════════════ */}
          {categoryKey === 'REFUND' && (
            <div
              style={{
                background: '#FFFBEB',
                border: '1.5px solid #FDE68A',
                borderRadius: '10px',
                padding: '14px 16px',
              }}
            >
              <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#92400E', marginBottom: '10px' }}>
                🏦 Refund Audit &amp; Payment Gateway Settlement
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.8rem', marginBottom: '12px' }}>
                <div>
                  <span style={{ color: '#78350F', fontWeight: 600 }}>Refund Reference (ARN/UTR):</span>
                  <div style={{ fontFamily: 'monospace', fontWeight: 700, marginTop: '2px' }}>{refundArn}</div>
                </div>
                <div>
                  <span style={{ color: '#78350F', fontWeight: 600 }}>Refund Amount Claimed:</span>
                  <div style={{ fontWeight: 800, color: '#059669', marginTop: '2px' }}>
                    {formatRupees(ticket.refundAmount || 1450)} (Original Fare: {formatRupees(fare)})
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '0.78rem', color: '#92400E', fontWeight: 600, marginBottom: '6px' }}>
                Refund Gateway Outcome:
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className={`btn btn-sm ${refundGatewayState === 'COMPLETED' ? 'btn-primary' : 'btn-outline'}`}
                  style={refundGatewayState === 'COMPLETED' ? { background: '#16A34A', borderColor: '#16A34A' } : {}}
                  onClick={() => {
                    setRefundGatewayState('COMPLETED');
                    // auto check related checklist
                    setChecklist((c) => ({ ...c, ref_4: true, ref_5: true, ref_7: true }));
                  }}
                >
                  ✓ Refund Processed (Eligible for Resolution)
                </button>

                <button
                  type="button"
                  className={`btn btn-sm ${refundGatewayState === 'PENDING' ? 'btn-primary' : 'btn-outline'}`}
                  style={refundGatewayState === 'PENDING' ? { background: '#EA580C', borderColor: '#EA580C' } : {}}
                  onClick={() => {
                    setRefundGatewayState('PENDING');
                    setEscalateType('finance');
                    setEscalationRemarks(`Refund initiated with bank ARN ${refundArn} but pending clearance. Escalating to Finance.`);
                    setShowEscalatePanel(true);
                  }}
                >
                  ⏳ Initiated but Pending (Escalate to Finance)
                </button>

                <button
                  type="button"
                  className={`btn btn-sm ${refundGatewayState === 'DISCREPANCY' ? 'btn-primary' : 'btn-outline'}`}
                  style={refundGatewayState === 'DISCREPANCY' ? { background: '#DC2626', borderColor: '#DC2626' } : {}}
                  onClick={() => {
                    setRefundGatewayState('DISCREPANCY');
                    onSaveProgress(ticket.id, {
                      verificationChecklist: checklist,
                      notes: 'Booking / cancellation details mismatch flagged for investigation.',
                      status: 'Under Investigation',
                    });
                  }}
                >
                  ⚠️ Details Mismatch (Flag Investigation)
                </button>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              CATEGORY 2: CANCELLATION FINANCIAL IMPACT BREAKDOWN (NON-TECHNICAL ONLY)
             ══════════════════════════════════════════════════════════ */}
          {!isTech && financialImpact && provider && (categoryKey === 'CANCELLATION' || ticket.status === 'Escalated to Service Provider') && (
            <div
              style={{
                background: '#FFFFFF',
                border: '1.5px solid #CBD5E1',
                borderRadius: '10px',
                padding: '16px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ fontWeight: 800, fontSize: '0.86rem', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <DollarSign size={16} color="#F97316" />
                  Service Provider Financial Impact &amp; Loss Calculation (90/10 Rule)
                </div>
                <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>
                  Operator: {provider.name}
                </span>
              </div>

              {/* Financial Breakdown Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                  gap: '8px',
                  background: '#F8FAFC',
                  borderRadius: '8px',
                  padding: '12px',
                  border: '1px solid #E2E8F0',
                  marginBottom: '10px',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.68rem', color: '#64748B', fontWeight: 700 }}>ORIGINAL TICKET</div>
                  <div style={{ fontSize: '0.94rem', fontWeight: 800, color: '#0F172A', marginTop: '2px' }}>
                    {formatRupees(financialImpact.originalAmount)}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.68rem', color: '#EF4444', fontWeight: 700 }}>CANCEL CHARGES</div>
                  <div style={{ fontSize: '0.94rem', fontWeight: 800, color: '#EF4444', marginTop: '2px' }}>
                    −{formatRupees(financialImpact.cancellationCharges)}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.68rem', color: '#059669', fontWeight: 700 }}>CUSTOMER REFUND</div>
                  <div style={{ fontSize: '0.94rem', fontWeight: 800, color: '#059669', marginTop: '2px' }}>
                    {formatRupees(financialImpact.customerRefund)}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.68rem', color: '#4338CA', fontWeight: 700 }}>PROVIDER SHARE (90%)</div>
                  <div style={{ fontSize: '0.94rem', fontWeight: 800, color: '#4338CA', marginTop: '2px' }}>
                    {formatRupees(financialImpact.providerOriginalShare)}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.68rem', color: '#7C3AED', fontWeight: 700 }}>PLATFORM FEE (10%)</div>
                  <div style={{ fontSize: '0.94rem', fontWeight: 800, color: '#7C3AED', marginTop: '2px' }}>
                    {formatRupees(financialImpact.platformCommission)}
                  </div>
                </div>

                <div
                  style={{
                    background: '#FFF1F2',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: '1px solid #FECDD3',
                  }}
                >
                  <div style={{ fontSize: '0.68rem', color: '#BE123C', fontWeight: 800 }}>ESTIMATED LOSS TO OPERATOR</div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: '#BE123C', marginTop: '2px' }}>
                    {formatRupees(financialImpact.providerFinancialLoss)}
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '0.72rem', color: '#64748B', lineHeight: 1.4 }}>
                <strong>Calculation structure:</strong> {financialImpact.lossFormula}. The operator retains{' '}
                {formatRupees(financialImpact.providerCancellationShare)} (90% of cancellation charges), mitigating total loss
                from the original {formatRupees(financialImpact.providerOriginalShare)}.
              </div>

              {/* Service Provider Approval Controls */}
              <div
                style={{
                  marginTop: '12px',
                  paddingTop: '12px',
                  borderTop: '1px dashed #CBD5E1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '8px',
                }}
              >
                <div>
                  <span style={{ fontSize: '0.74rem', color: '#475569', fontWeight: 700 }}>
                    Provider Approval Status:{' '}
                  </span>
                  <span
                    style={{
                      fontSize: '0.74rem',
                      fontWeight: 800,
                      color:
                        ticket.status === 'Approved'
                          ? '#15803D'
                          : ticket.status === 'Rejected'
                          ? '#DC2626'
                          : '#C2410C',
                    }}
                  >
                    {ticket.status === 'Approved'
                      ? 'Approved by Operator'
                      : ticket.status === 'Rejected'
                      ? 'Rejected by Operator'
                      : 'Awaiting Operator Approval'}
                  </span>
                  {ticket.escalation?.providerRemarks && (
                    <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '2px' }}>
                      <em>Note: {ticket.escalation.providerRemarks}</em>
                    </div>
                  )}
                </div>

                {/* Operator Response Testing / Simulation Buttons */}
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline"
                    style={{ borderColor: '#16A34A', color: '#16A34A', background: '#F0FDF4' }}
                    onClick={() => {
                      onProviderDecision(ticket.id, 'Approved', 'Operator approved cancellation waiver after verification.');
                      setChecklist((c) => ({ ...c, can_7: true }));
                    }}
                  >
                    <Check size={13} /> Operator: Approve
                  </button>

                  <button
                    type="button"
                    className="btn btn-sm btn-outline"
                    style={{ borderColor: '#DC2626', color: '#DC2626', background: '#FEF2F2' }}
                    onClick={() => setShowRejectInput(!showRejectInput)}
                  >
                    <X size={13} /> Operator: Reject
                  </button>
                </div>
              </div>

              {/* Reject Reason input drawer */}
              {showRejectInput && (
                <div
                  style={{
                    marginTop: '10px',
                    padding: '10px 12px',
                    background: '#FFF1F2',
                    borderRadius: '8px',
                    border: '1px solid #FECDD3',
                    display: 'flex',
                    gap: '8px',
                  }}
                >
                  <input
                    type="text"
                    className="search-input"
                    style={{ flex: 1, padding: '6px 10px', fontSize: '0.78rem' }}
                    placeholder="Enter rejection reason (e.g. Departure within 2 hours)..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={() => {
                      onProviderDecision(
                        ticket.id,
                        'Rejected',
                        rejectionReason || 'Cancellation denied per policy threshold.'
                      );
                      setShowRejectInput(false);
                    }}
                  >
                    Confirm Rejection
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              CATEGORY 3: TECHNICAL ISSUES INTELLIGENCE PANEL
             ══════════════════════════════════════════════════════════ */}
          {categoryKey === 'TECHNICAL' && (
            <div
              style={{
                background: '#FAF5FF',
                border: '1.5px solid #DDD6FE',
                borderRadius: '10px',
                padding: '14px 16px',
              }}
            >
              <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#6B21A8', marginBottom: '10px' }}>
                💻 Technical Diagnostic &amp; Engineering Escalation Matrix
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#581C87', marginBottom: '4px' }}>
                    AFFECTED PLATFORM MODULE
                  </label>
                  <select
                    className="filter-select"
                    style={{ width: '100%', fontSize: '0.78rem' }}
                    value={affectedModule}
                    onChange={(e) => {
                      setAffectedModule(e.target.value);
                      setChecklist((c) => ({ ...c, tech_1: true }));
                    }}
                  >
                    <option value="Payment Gateway / OTP Screen">Payment Gateway / OTP Screen</option>
                    <option value="Booking Engine / Checkout">Booking Engine / Checkout</option>
                    <option value="Interactive Seat Cabin Map">Interactive Seat Cabin Map</option>
                    <option value="Passenger Login / Auth Gateway">Passenger Login / Auth Gateway</option>
                    <option value="Bus Search & Filter Engine">Bus Search & Filter Engine</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#581C87', marginBottom: '4px' }}>
                    ISSUE SEVERITY
                  </label>
                  <select
                    className="filter-select"
                    style={{ width: '100%', fontSize: '0.78rem' }}
                    value={severity}
                    onChange={(e) => {
                      setSeverity(e.target.value);
                      setChecklist((c) => ({ ...c, tech_5: true }));
                    }}
                  >
                    <option value="Critical">Critical (Complete Platform Outage / Revenue Block)</option>
                    <option value="Major">Major (Core feature failing, passenger unable to book)</option>
                    <option value="Minor">Minor (Non-blocking bug, workaround available)</option>
                    <option value="Low">Low (Cosmetic / UI glitch)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#581C87', marginBottom: '4px' }}>
                    ESCALATION LEVEL
                  </label>
                  <select
                    className="filter-select"
                    style={{ width: '100%', fontSize: '0.78rem' }}
                    value={techLevel}
                    onChange={(e) => {
                      setTechLevel(e.target.value);
                      setChecklist((c) => ({ ...c, tech_6: true }));
                    }}
                  >
                    <option value="Level 1: Customer Support Agent">Level 1: Customer Support Agent</option>
                    <option value="Level 2: Technical Support Team">Level 2: Technical Support Team</option>
                    <option value="Level 3: Technical Lead">Level 3: Technical Lead</option>
                    <option value="Level 4: Development/Admin Team">Level 4: Development/Admin Team</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#581C87', marginBottom: '4px' }}>
                    REPRODUCIBLE ON STAGING?
                  </label>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                    {['Yes', 'No', 'Intermittent'].map((val) => (
                      <button
                        key={val}
                        type="button"
                        className={`btn btn-sm ${isReproducible === val ? 'btn-primary' : 'btn-outline'}`}
                        style={isReproducible === val ? { background: '#7C3AED', borderColor: '#7C3AED' } : {}}
                        onClick={() => {
                          setIsReproducible(val);
                          setChecklist((c) => ({ ...c, tech_4: true }));
                        }}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  style={{ background: '#7C3AED' }}
                  onClick={() => {
                    onEscalateToTech(ticket.id, {
                      affectedModule,
                      severity,
                      escalationLevel: techLevel,
                      reproducible: isReproducible,
                      remarks: `Escalated to ${techLevel}. Severity: ${severity}. Module: ${affectedModule}.`,
                    });
                  }}
                >
                  <Send size={13} /> Escalate to {techLevel.split(':')[0]}
                </button>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              MANDATORY CATEGORY VERIFICATION CHECKLIST
             ══════════════════════════════════════════════════════════ */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={16} color={allStepsCompleted ? '#16A34A' : '#F97316'} />
                Mandatory Verification Checklist ({completedSteps}/{totalSteps} Completed)
              </label>

              <button
                type="button"
                className="btn btn-ghost btn-sm"
                style={{ fontSize: '0.72rem', padding: '2px 8px' }}
                onClick={() => {
                  const allDone = {};
                  checklistTemplate.forEach((s) => (allDone[s.id] = true));
                  setChecklist(allDone);
                  setValidationError('');
                }}
              >
                Mark All Verified
              </button>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '10px',
                padding: '12px 14px',
              }}
            >
              {checklistTemplate.map((step, idx) => {
                const isChecked = Boolean(checklist[step.id]);
                return (
                  <label
                    key={step.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      background: isChecked ? '#F0FDF4' : '#FFFFFF',
                      border: isChecked ? '1px solid #BBF7D0' : '1px solid #E2E8F0',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggleCheck(step.id)}
                      style={{
                        width: '16px',
                        height: '16px',
                        accentColor: '#16A34A',
                        cursor: 'pointer',
                      }}
                    />
                    <span
                      style={{
                        fontSize: '0.8rem',
                        fontWeight: isChecked ? 600 : 500,
                        color: isChecked ? '#15803D' : '#334155',
                        flex: 1,
                      }}
                    >
                      {idx + 1}. {step.label}
                    </span>
                    {isChecked ? (
                      <span style={{ fontSize: '0.7rem', color: '#16A34A', fontWeight: 700 }}>✓ Verified</span>
                    ) : (
                      <span style={{ fontSize: '0.7rem', color: '#94A3B8', fontWeight: 600 }}>Required</span>
                    )}
                  </label>
                );
              })}
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════
              ESCALATION ACTION DRAWER (TRIGGERED ON DEMAND)
             ══════════════════════════════════════════════════════════ */}
          {showEscalatePanel ? (
            <div
              style={{
                background: '#FFF1F2',
                border: '1.5px solid #FECDD3',
                borderRadius: '10px',
                padding: '16px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div style={{ fontWeight: 800, fontSize: '0.84rem', color: '#9F1239' }}>
                  Escalate Complaint to External Department / Operator
                </div>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  style={{ padding: '2px 6px' }}
                  onClick={() => setShowEscalatePanel(false)}
                >
                  <X size={15} />
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#881337', marginBottom: '4px' }}>
                    TARGET ENTITY
                  </label>
                  <select
                    className="filter-select"
                    style={{ width: '100%', fontSize: '0.78rem' }}
                    value={escalateType}
                    onChange={(e) => setEscalateType(e.target.value)}
                  >
                    {isTech ? (
                      <option value="tech">Technical Engineering Team ({techLevel.split(':')[0]})</option>
                    ) : (
                      <>
                        {provider && <option value="provider">Service Provider ({provider.name})</option>}
                        <option value="finance">Finance / Payment Gateway Team</option>
                        <option value="tech">Technical Engineering Team</option>
                      </>
                    )}
                  </select>
                </div>

                {!isTech && fare ? (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#881337', marginBottom: '4px' }}>
                      AMOUNT INVOLVED
                    </label>
                    <input
                      type="text"
                      disabled
                      className="search-input"
                      value={formatRupees(fare)}
                      style={{ width: '100%', fontSize: '0.78rem', background: '#FFF7ED', fontWeight: 700 }}
                    />
                  </div>
                ) : (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#881337', marginBottom: '4px' }}>
                      ESCALATION SEVERITY
                    </label>
                    <input
                      type="text"
                      disabled
                      className="search-input"
                      value={`${severity} (${techLevel.split(':')[0]})`}
                      style={{ width: '100%', fontSize: '0.78rem', background: '#FAF5FF', fontWeight: 700, color: '#6B21A8' }}
                    />
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#881337', marginBottom: '4px' }}>
                  ESCALATION REMARKS &amp; REQUIRED ACTION
                </label>
                <textarea
                  rows={2}
                  className="search-input"
                  style={{ width: '100%', padding: '8px 10px', fontSize: '0.8rem', resize: 'vertical' }}
                  placeholder="Detail why escalation is requested and specific resolution requested..."
                  value={escalationRemarks}
                  onChange={(e) => setEscalationRemarks(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setShowEscalatePanel(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={handleEscalateSubmit}
                >
                  <Send size={13} /> Confirm Escalation
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {isTech ? (
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  style={{ borderColor: '#7C3AED', color: '#7C3AED', background: '#FAF5FF', fontWeight: 700 }}
                  onClick={() => {
                    setEscalateType('tech');
                    setShowEscalatePanel(true);
                  }}
                >
                  <Smartphone size={14} /> Escalate to Technical Engineering Team ({techLevel.split(':')[0]})
                </button>
              ) : (
                <>
                  {provider && (
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      style={{ borderColor: '#E11D48', color: '#E11D48', background: '#FFF1F2' }}
                      onClick={() => {
                        setEscalateType('provider');
                        setShowEscalatePanel(true);
                      }}
                    >
                      <Building2 size={14} /> Escalate to Service Provider ({provider.name})
                    </button>
                  )}

                  {(categoryKey === 'PAYMENT' || categoryKey === 'REFUND') && (
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      style={{ borderColor: '#EA580C', color: '#EA580C', background: '#FFF7ED' }}
                      onClick={() => {
                        setEscalateType('finance');
                        setShowEscalatePanel(true);
                      }}
                    >
                      <DollarSign size={14} /> Escalate to Finance Team
                    </button>
                  )}
                </>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              INVESTIGATION NOTES & RESOLUTION REMARKS
             ══════════════════════════════════════════════════════════ */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#0F172A', marginBottom: '6px' }}>
              INVESTIGATION NOTES &amp; RESOLUTION REMARKS <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <textarea
              rows={3}
              className="search-input"
              style={{
                width: '100%',
                padding: '10px 12px',
                fontSize: '0.82rem',
                resize: 'vertical',
                borderColor: validationError && !remarks ? '#EF4444' : '#CBD5E1',
              }}
              placeholder="Record actions taken, findings, customer communication, and final settlement details..."
              value={remarks}
              onChange={(e) => {
                setRemarks(e.target.value);
                setValidationError('');
              }}
            />
          </div>

          {/* ══════════════════════════════════════════════════════════
              TICKET ACTIVITY & RESOLUTION HISTORY (AUDIT TRAIL)
             ══════════════════════════════════════════════════════════ */}
          <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '14px' }}>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              style={{ width: '100%', display: 'flex', justifyContent: 'space-between', padding: '6px 10px' }}
              onClick={() => setShowAuditTrail(!showAuditTrail)}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: '#475569' }}>
                <History size={15} /> Resolution Activity &amp; Audit Trail ({ticket.auditTrail?.length || 0} Events)
              </span>
              <span style={{ fontSize: '0.72rem', color: '#7C3AED' }}>
                {showAuditTrail ? 'Hide Log ▲' : 'View Full Audit Trail ▼'}
              </span>
            </button>

            {showAuditTrail && (
              <div
                style={{
                  marginTop: '10px',
                  background: '#F8FAFC',
                  borderRadius: '8px',
                  border: '1px solid #E2E8F0',
                  padding: '10px',
                  maxHeight: '180px',
                  overflowY: 'auto',
                }}
              >
                {(ticket.auditTrail || []).map((audit, i) => (
                  <div
                    key={audit.id || i}
                    style={{
                      padding: '8px 10px',
                      borderBottom: i < ticket.auditTrail.length - 1 ? '1px solid #E2E8F0' : 'none',
                      fontSize: '0.76rem',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: '#1E293B' }}>
                      <span>{audit.action}</span>
                      <span style={{ color: '#64748B', fontSize: '0.7rem' }}>
                        {audit.timestamp ? new Date(audit.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : ''}
                      </span>
                    </div>
                    <div style={{ color: '#64748B', fontSize: '0.72rem', marginTop: '2px' }}>
                      By: <strong>{audit.agentName}</strong> {audit.newStatus ? `→ Status: ${audit.newStatus}` : ''}
                    </div>
                    {audit.remarks && (
                      <div style={{ color: '#334155', fontStyle: 'italic', marginTop: '2px' }}>
                        "{audit.remarks}"
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer" style={{ padding: '16px 24px', background: '#F8FAFC', borderTop: '1px solid #E2E8F0' }}>
          <button className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>

          <button className="btn btn-outline" onClick={handleSaveDraft}>
            Save Progress
          </button>

          <button
            className="btn btn-primary"
            style={{
              background: allStepsCompleted ? '#16A34A' : '#64748B',
              cursor: allStepsCompleted ? 'pointer' : 'not-allowed',
            }}
            onClick={handleFinalResolution}
            title={allStepsCompleted ? 'Confirm structured resolution' : 'Complete all mandatory verification steps first'}
          >
            <CheckCircle2 size={15} /> Confirm Resolution
          </button>
        </div>
      </div>
    </div>
  );
}
