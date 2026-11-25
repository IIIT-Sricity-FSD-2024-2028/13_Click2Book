import React, { useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Ticket,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  RotateCcw,
  Users,
  Search,
  Filter,
  Building2,
  AlertCircle,
  Layers,
  Sparkles,
} from 'lucide-react';
import { CATEGORY_DEFINITIONS, CATEGORY_CHECKLISTS, detectTicketCategory, formatRupees } from '../services/api';
import {
  setSelectedTicketId,
  setResolutionTicketId,
  navigateTabThunk,
} from '../store/actions';

export default function Dashboard() {
  const dispatch = useDispatch();
  const tickets = useSelector((state) => state.tickets.items);
  const onSelectTicket = (t) => dispatch(setSelectedTicketId(t?.id));
  const onNavigate = (tab) => dispatch(navigateTabThunk(tab));
  const onResolveTicket = (t) => {
    dispatch(setSelectedTicketId(null));
    dispatch(setResolutionTicketId(t?.id));
  };
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // 7 KPI Stat Metrics
  const totalCount = tickets.length;
  const openCount = tickets.filter((t) => t.status === 'Open').length;
  const underInvestigationCount = tickets.filter(
    (t) => t.status === 'Under Investigation' || t.status === 'In Progress'
  ).length;
  const pendingVerificationCount = tickets.filter(
    (t) => t.status === 'Pending Verification'
  ).length;
  const escalatedCount = tickets.filter(
    (t) =>
      t.status === 'Escalated' ||
      t.status === 'Escalated to Service Provider' ||
      t.status === 'Escalated to Technical Team'
  ).length;
  const pendingApprovalCount = tickets.filter(
    (t) =>
      t.status === 'Pending Approval' ||
      t.escalation?.escalationStatus === 'Pending Approval'
  ).length;
  const resolvedCount = tickets.filter((t) => t.status === 'Resolved').length;

  // Filtered tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      const q = searchQuery.toLowerCase().trim();
      const matchQ =
        !q ||
        t.id?.toLowerCase().includes(q) ||
        t.customer?.toLowerCase().includes(q) ||
        t.subject?.toLowerCase().includes(q) ||
        t.bookingId?.toLowerCase().includes(q);

      const matchCat = !filterCategory || (t.category || '').toUpperCase() === filterCategory.toUpperCase();
      const matchSt = !filterStatus || (t.status || '').toLowerCase() === filterStatus.toLowerCase();
      return matchQ && matchCat && matchSt;
    });
  }, [tickets, searchQuery, filterCategory, filterStatus]);

  const recentTickets = filteredTickets.slice(0, 8);

  const getPriorityBadgeClass = (priority) => {
    switch ((priority || '').toLowerCase()) {
      case 'high':
        return 'badge-high';
      case 'medium':
        return 'badge-medium';
      case 'low':
        return 'badge-low';
      default:
        return 'badge-low';
    }
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
        return { text: 'Escalated (Provider)', bg: '#FFE4E6', color: '#BE123C', border: '#FECDD3' };
      case 'Escalated to Technical Team':
        return { text: 'Escalated (Tech)', bg: '#FDF4FF', color: '#A21CAF', border: '#F5D0FE' };
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
        return { text: status || 'Open', bg: '#F1F5F9', color: '#475569', border: '#CBD5E1' };
    }
  };

  const getNextActionGuidance = (t) => {
    const cat = (t.category || 'OTHER').toUpperCase();
    const chkList = CATEGORY_CHECKLISTS[cat] || CATEGORY_CHECKLISTS.OTHER;
    const completed = chkList.filter((s) => t.verificationChecklist?.[s.id]).length;
    const total = chkList.length;

    if (t.status === 'Resolved') {
      return { text: 'Resolution closed & archived', color: '#16A34A', bg: '#F0FDF4' };
    }
    if (t.status === 'Escalated to Service Provider' || t.status === 'Pending Approval') {
      return { text: 'Awaiting Operator Approval', color: '#C2410C', bg: '#FFF7ED' };
    }
    if (t.status === 'Approved') {
      return { text: 'Operator approved. Ready to resolve', color: '#15803D', bg: '#DCFCE7' };
    }
    if (t.status === 'Rejected') {
      return { text: 'Operator rejected. Communicate outcome', color: '#DC2626', bg: '#FEF2F2' };
    }
    if (t.status === 'Escalated to Technical Team') {
      return { text: 'Engineering investigating code patch', color: '#7C3AED', bg: '#FAF5FF' };
    }
    if (completed < total) {
      return { text: `Complete checklist (${completed}/${total} done)`, color: '#D97706', bg: '#FFFBEB' };
    }
    return { text: 'Verification done. Enter remarks', color: '#2563EB', bg: '#EFF6FF' };
  };

  return (
    <div>
      {/* 7 KPI Stats Grid */}
      <div
        className="stats-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '12px',
          marginBottom: '20px',
        }}
      >
        {/* 1. Total Tickets */}
        <div className="stat-card" style={{ '--accent': '#6366F1', padding: '16px 14px' }}>
          <div className="stat-icon" style={{ background: '#EEF2FF', color: '#6366F1', width: '36px', height: '36px' }}>
            <Layers size={18} />
          </div>
          <div className="stat-value" style={{ fontSize: '1.5rem', marginTop: '8px' }}>{totalCount}</div>
          <div className="stat-label" style={{ fontSize: '0.72rem' }}>Total Tickets</div>
        </div>

        {/* 2. Open Tickets */}
        <div className="stat-card" style={{ '--accent': '#F97316', padding: '16px 14px' }}>
          <div className="stat-icon" style={{ background: '#FFF7ED', color: '#F97316', width: '36px', height: '36px' }}>
            <Ticket size={18} />
          </div>
          <div className="stat-value" style={{ fontSize: '1.5rem', marginTop: '8px' }}>{openCount}</div>
          <div className="stat-label" style={{ fontSize: '0.72rem' }}>Open Tickets</div>
        </div>

        {/* 3. Under Investigation */}
        <div className="stat-card" style={{ '--accent': '#3B82F6', padding: '16px 14px' }}>
          <div className="stat-icon" style={{ background: '#EFF6FF', color: '#3B82F6', width: '36px', height: '36px' }}>
            <Clock size={18} />
          </div>
          <div className="stat-value" style={{ fontSize: '1.5rem', marginTop: '8px' }}>{underInvestigationCount}</div>
          <div className="stat-label" style={{ fontSize: '0.72rem' }}>Under Investigation</div>
        </div>

        {/* 4. Pending Verification */}
        <div className="stat-card" style={{ '--accent': '#8B5CF6', padding: '16px 14px' }}>
          <div className="stat-icon" style={{ background: '#FAF5FF', color: '#8B5CF6', width: '36px', height: '36px' }}>
            <AlertCircle size={18} />
          </div>
          <div className="stat-value" style={{ fontSize: '1.5rem', marginTop: '8px' }}>{pendingVerificationCount}</div>
          <div className="stat-label" style={{ fontSize: '0.72rem' }}>Pending Verification</div>
        </div>

        {/* 5. Escalated Tickets */}
        <div className="stat-card" style={{ '--accent': '#EF4444', padding: '16px 14px' }}>
          <div className="stat-icon" style={{ background: '#FEE2E2', color: '#EF4444', width: '36px', height: '36px' }}>
            <AlertTriangle size={18} />
          </div>
          <div className="stat-value" style={{ fontSize: '1.5rem', marginTop: '8px' }}>{escalatedCount}</div>
          <div className="stat-label" style={{ fontSize: '0.72rem' }}>Escalated Tickets</div>
        </div>

        {/* 6. Pending Provider Approval */}
        <div className="stat-card" style={{ '--accent': '#D97706', padding: '16px 14px' }}>
          <div className="stat-icon" style={{ background: '#FEF3C7', color: '#D97706', width: '36px', height: '36px' }}>
            <Building2 size={18} />
          </div>
          <div className="stat-value" style={{ fontSize: '1.5rem', marginTop: '8px' }}>{pendingApprovalCount}</div>
          <div className="stat-label" style={{ fontSize: '0.72rem' }}>Pending Approval</div>
        </div>

        {/* 7. Resolved Tickets */}
        <div className="stat-card" style={{ '--accent': '#16A34A', padding: '16px 14px' }}>
          <div className="stat-icon" style={{ background: '#DCFCE7', color: '#16A34A', width: '36px', height: '36px' }}>
            <CheckCircle2 size={18} />
          </div>
          <div className="stat-value" style={{ fontSize: '1.5rem', marginTop: '8px' }}>{resolvedCount}</div>
          <div className="stat-label" style={{ fontSize: '0.72rem' }}>Resolved Tickets</div>
        </div>
      </div>

      {/* Operational Quick Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '14px',
          marginBottom: '22px',
        }}
      >
        <div
          className="card"
          style={{
            margin: 0,
            padding: '16px 18px',
            background: 'linear-gradient(135deg, #FAF5FF, #FFFFFF)',
            border: '1.5px solid #DDD6FE',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#7C3AED', fontWeight: 700, fontSize: '0.82rem', marginBottom: '6px' }}>
              <ShieldAlert size={16} /> Service Provider &amp; Tech Escalations
            </div>
            <p style={{ fontSize: '0.76rem', color: '#64748B', lineHeight: 1.4 }}>
              {escalatedCount} critical complaints escalated to operators or engineering requiring supervisor resolution.
            </p>
          </div>
          <button
            className="btn btn-outline btn-sm"
            style={{ marginTop: '12px', alignSelf: 'flex-start', borderColor: '#7C3AED', color: '#7C3AED' }}
            onClick={() => onNavigate('escalated')}
          >
            Review Escalations ({escalatedCount}) <ArrowRight size={13} />
          </button>
        </div>

        <div
          className="card"
          style={{
            margin: 0,
            padding: '16px 18px',
            background: 'linear-gradient(135deg, #FFF7ED, #FFFFFF)',
            border: '1.5px solid #FED7AA',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#EA580C', fontWeight: 700, fontSize: '0.82rem', marginBottom: '6px' }}>
              <RotateCcw size={16} /> Customer Refunds &amp; Banking
            </div>
            <p style={{ fontSize: '0.76rem', color: '#64748B', lineHeight: 1.4 }}>
              Verify gateway transaction IDs, calculate deductions, and disburse passenger cancellation refunds.
            </p>
          </div>
          <button
            className="btn btn-outline btn-sm"
            style={{ marginTop: '12px', alignSelf: 'flex-start', borderColor: '#EA580C', color: '#EA580C' }}
            onClick={() => onNavigate('refunds')}
          >
            Review Refunds Desk <ArrowRight size={13} />
          </button>
        </div>

        <div
          className="card"
          style={{
            margin: 0,
            padding: '16px 18px',
            background: 'linear-gradient(135deg, #F0FDF4, #FFFFFF)',
            border: '1.5px solid #BBF7D0',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#16A34A', fontWeight: 700, fontSize: '0.82rem', marginBottom: '6px' }}>
              <Users size={16} /> Passenger Directory
            </div>
            <p style={{ fontSize: '0.76rem', color: '#64748B', lineHeight: 1.4 }}>
              Instant passenger record lookup with demographic data, booking history, and active support claims.
            </p>
          </div>
          <button
            className="btn btn-outline btn-sm"
            style={{ marginTop: '12px', alignSelf: 'flex-start', borderColor: '#16A34A', color: '#16A34A' }}
            onClick={() => onNavigate('customers')}
          >
            Lookup Passengers <ArrowRight size={13} />
          </button>
        </div>
      </div>

      {/* Filter Bar for Dashboard Table */}
      <div className="filter-bar" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
        <div className="search-input-wrap" style={{ flex: '1 1 200px' }}>
          <Search size={16} />
          <input
            type="text"
            className="search-input"
            placeholder="Quick search recent queries..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <select
          className="filter-select"
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
        >
          <option value="">All Categories</option>
          <option value="REFUND">Refund Not Credited</option>
          <option value="CANCELLATION">Ticket Cancellation Request</option>
          <option value="TECHNICAL">Technical / App Crash</option>
          <option value="PAYMENT">Payment Failed</option>
          <option value="BOOKING">Booking Confirmation</option>
          <option value="COMPLAINT">Service Complaints</option>
        </select>

        <select
          className="filter-select"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="Open">Open</option>
          <option value="Under Investigation">Under Investigation</option>
          <option value="Pending Verification">Pending Verification</option>
          <option value="Escalated to Service Provider">Escalated to Service Provider</option>
          <option value="Escalated to Technical Team">Escalated to Technical Team</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
          <option value="Resolved">Resolved</option>
        </select>

        {(filterCategory || filterStatus || searchQuery) && (
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => {
              setFilterCategory('');
              setFilterStatus('');
              setSearchQuery('');
            }}
          >
            Reset
          </button>
        )}
      </div>

      {/* Recent Tickets Table Card */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Recent Customer Support Requests</div>
            <div className="card-sub">
              Procedure-based resolution desk • Showing {recentTickets.length} active queries
            </div>
          </div>
          <button className="btn btn-outline btn-sm" onClick={() => onNavigate('tickets')}>
            View All Tickets ({tickets.length}) <ArrowRight size={14} />
          </button>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Ticket ID</th>
                <th>Category</th>
                <th>Passenger &amp; Inquiry</th>
                <th>Status</th>
                <th>Next Action Guidance</th>
                <th>Resolve Action</th>
              </tr>
            </thead>
            <tbody>
              {recentTickets.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: '#94A3B8' }}>
                    No support tickets found matching the specified filters.
                  </td>
                </tr>
              ) : (
                recentTickets.map((t) => {
                  const catKey = detectTicketCategory(t);
                  const catCfg = CATEGORY_DEFINITIONS[catKey] || CATEGORY_DEFINITIONS.OTHER;
                  const badge = getStatusBadge(t.status);
                  const guidance = getNextActionGuidance(t);

                  return (
                    <tr key={t.id} onClick={() => onSelectTicket(t)} style={{ cursor: 'pointer', transition: 'background 0.15s ease' }}>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                          <span
                            style={{
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
                          {catKey !== 'TECHNICAL' && t.bookingId && (
                            <span
                              style={{
                                fontSize: '0.66rem',
                                color: '#64748B',
                                background: '#F1F5F9',
                                padding: '1px 5px',
                                borderRadius: '4px',
                                fontFamily: 'monospace',
                                fontWeight: 600,
                                border: '1px solid #E2E8F0',
                              }}
                            >
                              PNR #{t.bookingId}
                            </span>
                          )}
                          {catKey === 'TECHNICAL' && (
                            <span
                              style={{
                                fontSize: '0.64rem',
                                color: '#7C3AED',
                                background: '#FAF5FF',
                                padding: '1px 5px',
                                borderRadius: '4px',
                                fontWeight: 700,
                                border: '1px solid #DDD6FE',
                              }}
                            >
                              Platform App
                            </span>
                          )}
                        </div>
                      </td>

                      <td>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '0.73rem',
                            fontWeight: 700,
                            padding: '4px 10px',
                            borderRadius: '6px',
                            background: catCfg.bgColor,
                            color: catCfg.color,
                            border: `1.5px solid ${catCfg.borderColor}`,
                            boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          <span
                            style={{
                              width: '6px',
                              height: '6px',
                              borderRadius: '50%',
                              background: catCfg.color,
                              flexShrink: 0,
                            }}
                          />
                          {catCfg.label}
                        </span>
                      </td>

                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span className="customer-name" style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.84rem' }}>
                            {t.customer}
                          </span>
                          {t.customerId && (
                            <span style={{ fontSize: '0.64rem', color: '#64748B', background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '1px 5px', borderRadius: '4px', fontWeight: 600 }}>
                              {t.customerId}
                            </span>
                          )}
                        </div>
                        <div style={{ fontWeight: 500, color: '#334155', fontSize: '0.8rem', marginTop: '2px', lineHeight: 1.35 }}>
                          {t.subject}
                        </div>
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
                            border: `1px solid ${badge.border}`,
                            boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
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
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            padding: '4px 9px',
                            borderRadius: '6px',
                            background: guidance.bg,
                            color: guidance.color,
                            border: '1px solid rgba(0,0,0,0.05)',
                          }}
                        >
                          {guidance.text}
                        </span>
                      </td>

                      <td>
                        {t.status === 'Resolved' ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              color: '#16A34A',
                              fontSize: '0.74rem',
                              fontWeight: 700,
                              background: '#F0FDF4',
                              border: '1px solid #BBF7D0',
                              padding: '4px 10px',
                              borderRadius: '6px',
                            }}
                          >
                            ✓ Closed
                          </span>
                        ) : (
                          <button
                            className="btn btn-primary btn-sm"
                            style={{
                              background: 'linear-gradient(135deg, #4F46E5 0%, #4338CA 100%)',
                              border: 'none',
                              borderRadius: '6px',
                              padding: '5px 12px',
                              fontSize: '0.76rem',
                              fontWeight: 700,
                              boxShadow: '0 2px 5px rgba(79, 70, 229, 0.25)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              cursor: 'pointer',
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              onResolveTicket(t); // Opens structured resolution modal
                            }}
                            title="Open structured resolution procedure"
                          >
                            <CheckCircle2 size={13} /> Resolve
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
