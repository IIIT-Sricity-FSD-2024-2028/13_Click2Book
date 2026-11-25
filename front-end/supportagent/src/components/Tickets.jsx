import React, { useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Search,
  Filter,
  CheckCircle2,
  Eye,
  Ticket as TicketIcon,
  ShieldAlert,
  Building2,
  DollarSign,
  Clock,
  RotateCcw,
} from 'lucide-react';
import { CATEGORY_DEFINITIONS, CATEGORY_CHECKLISTS, detectTicketCategory, formatRupees } from '../services/api';
import { setSelectedTicketId, setResolutionTicketId } from '../store/actions';

export default function Tickets() {
  const dispatch = useDispatch();
  const tickets = useSelector((state) => state.tickets.items);
  const onSelectTicket = (t) => dispatch(setSelectedTicketId(t?.id));
  const onResolveTicket = (t) => {
    dispatch(setSelectedTicketId(null));
    dispatch(setResolutionTicketId(t?.id));
  };
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        t.id?.toLowerCase().includes(q) ||
        t.customer?.toLowerCase().includes(q) ||
        t.subject?.toLowerCase().includes(q) ||
        t.bookingId?.toLowerCase().includes(q);

      const matchPriority = !priorityFilter || (t.priority || '').toLowerCase() === priorityFilter.toLowerCase();
      const matchStatus = !statusFilter || (t.status || '').toLowerCase() === statusFilter.toLowerCase();
      const trueCat = detectTicketCategory(t);
      const matchCategory = !categoryFilter || trueCat.toUpperCase() === categoryFilter.toUpperCase();

      return matchQuery && matchPriority && matchStatus && matchCategory;
    });
  }, [tickets, searchQuery, priorityFilter, statusFilter, categoryFilter]);

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

  return (
    <div>
      {/* Search & Filter Controls */}
      <div className="filter-bar" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
        <div className="search-input-wrap" style={{ flex: '1 1 240px' }}>
          <Search size={16} />
          <input
            type="text"
            className="search-input"
            placeholder="Search by Ticket ID, customer name, subject, or booking..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Category Filter */}
        <select
          className="filter-select"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="">All Categories</option>
          <option value="REFUND">Refund Not Credited</option>
          <option value="CANCELLATION">Ticket Cancellation Request</option>
          <option value="TECHNICAL">Application Crash / Technical Issues</option>
          <option value="PAYMENT">Payment Failed / Amount Deducted</option>
          <option value="BOOKING">Booking Confirmation Issues</option>
          <option value="COMPLAINT">Service Complaints</option>
          <option value="OTHER">General Support</option>
        </select>

        {/* Priority Filter */}
        <select
          className="filter-select"
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
        >
          <option value="">All Priorities</option>
          <option value="High">High Priority</option>
          <option value="Medium">Medium Priority</option>
          <option value="Low">Low Priority</option>
        </select>

        {/* Status Filter covering all 11 statuses */}
        <select
          className="filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses ({tickets.length})</option>
          <option value="Open">Open</option>
          <option value="Under Investigation">Under Investigation</option>
          <option value="Pending Verification">Pending Verification</option>
          <option value="Escalated to Service Provider">Escalated to Service Provider</option>
          <option value="Escalated to Technical Team">Escalated to Technical Team</option>
          <option value="Pending Approval">Pending Approval</option>
          <option value="Approved">Approved by Provider</option>
          <option value="Rejected">Rejected by Provider</option>
          <option value="Resolution in Progress">Resolution in Progress</option>
          <option value="Resolved">Resolved</option>
        </select>

        {(searchQuery || priorityFilter || statusFilter || categoryFilter) && (
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => {
              setSearchQuery('');
              setPriorityFilter('');
              setStatusFilter('');
              setCategoryFilter('');
            }}
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Ticket List Card */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Customer Support Tickets Desk</div>
            <div className="card-sub">
              Showing {filteredTickets.length} of {tickets.length} total passenger queries • Structured Resolution Active
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: '#16A34A', fontWeight: 700 }}>
              ● Verification Enforcement Active
            </span>
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Ticket ID</th>
                <th>Category</th>
                <th>Passenger &amp; Inquiry</th>
                <th>Verification Progress</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Resolution Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#94A3B8' }}>
                    No tickets found matching the specified search or filter criteria.
                  </td>
                </tr>
              ) : (
                filteredTickets.map((t) => {
                  const catKey = detectTicketCategory(t);
                  const catCfg = CATEGORY_DEFINITIONS[catKey] || CATEGORY_DEFINITIONS.OTHER;
                  const chkList = CATEGORY_CHECKLISTS[catKey] || CATEGORY_CHECKLISTS.OTHER;
                  const totalSteps = chkList.length;
                  const completedSteps = chkList.filter((s) => t.verificationChecklist?.[s.id]).length;
                  const isFullyVerified = completedSteps === totalSteps;
                  const badge = getStatusBadge(t.status);

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
                        {catKey === 'TECHNICAL' ? (
                          <div style={{ fontSize: '0.7rem', color: '#7C3AED', marginTop: '2px', fontWeight: 600 }}>
                            Module: {t.technicalDetails?.affectedModule || 'Platform Defect'} • {t.technicalDetails?.customerDevice || 'Client App'}
                          </div>
                        ) : (
                          t.serviceProvider && (
                            <div style={{ fontSize: '0.7rem', color: '#7C3AED', marginTop: '2px' }}>
                              Operator: {t.serviceProvider} {t.fare ? `(₹${t.fare})` : ''}
                            </div>
                          )
                        )}
                      </td>

                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span
                            style={{
                              fontSize: '0.74rem',
                              fontWeight: 700,
                              color: isFullyVerified ? '#15803D' : (completedSteps > 0 ? '#B45309' : '#64748B'),
                            }}
                          >
                            {isFullyVerified ? '✓ Verified' : `${completedSteps}/${totalSteps} Steps`}
                          </span>
                        </div>
                        <div
                          style={{
                            width: '80px',
                            height: '5px',
                            background: '#E2E8F0',
                            borderRadius: '3px',
                            marginTop: '4px',
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              width: `${Math.round((completedSteps / totalSteps) * 100)}%`,
                              height: '100%',
                              background: isFullyVerified ? '#16A34A' : (completedSteps > 0 ? '#F97316' : '#CBD5E1'),
                              transition: 'width 0.3s ease',
                            }}
                          />
                        </div>
                      </td>

                      <td>
                        <span
                          className={`badge ${getPriorityBadgeClass(t.priority)}`}
                          style={{ borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700, padding: '3px 8px' }}
                        >
                          {t.priority}
                        </span>
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectTicket(t);
                            }}
                            title="Inspect ticket details"
                            style={{ fontSize: '0.75rem', padding: '5px 9px', borderRadius: '6px' }}
                          >
                            <Eye size={13} /> View
                          </button>

                          {t.status === 'Resolved' ? (
                            <span style={{ color: '#16A34A', fontSize: '0.74rem', fontWeight: 700, padding: '4px 8px' }}>
                              ✓ Resolved
                            </span>
                          ) : (
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                onResolveTicket(t); // Opens structured resolution modal
                              }}
                              title="Start structured verification and resolution"
                              style={{
                                fontSize: '0.75rem',
                                padding: '5px 12px',
                                borderRadius: '6px',
                                background: 'linear-gradient(135deg, #4F46E5 0%, #4338CA 100%)',
                                color: '#FFFFFF',
                                fontWeight: 700,
                                border: 'none',
                                boxShadow: '0 2px 4px rgba(79, 70, 229, 0.25)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                cursor: 'pointer',
                              }}
                            >
                              <CheckCircle2 size={13} /> Resolve
                            </button>
                          )}
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
    </div>
  );
}
