import React from 'react';
import {
  Ticket,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  RotateCcw,
  Users,
} from 'lucide-react';

export default function Dashboard({
  tickets = [],
  onSelectTicket,
  onNavigate,
  onResolveTicket,
}) {
  const openCount = tickets.filter((t) => t.status === 'Open').length;
  const inProgressCount = tickets.filter((t) => t.status === 'In Progress').length;
  const resolvedCount = tickets.filter((t) => t.status === 'Resolved').length;
  const escalatedCount = tickets.filter((t) => t.status === 'Escalated').length;

  const recentTickets = tickets.slice(0, 7);

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

  const getStatusBadgeClass = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'open':
        return 'badge-open';
      case 'in progress':
        return 'badge-inprogress';
      case 'resolved':
        return 'badge-resolved';
      case 'escalated':
        return 'badge-escalated';
      default:
        return 'badge-open';
    }
  };

  return (
    <div>
      {/* KPI Stats Row */}
      <div className="stats-grid">
        <div className="stat-card" style={{ '--accent': '#F97316' }}>
          <div className="stat-trend" style={{ color: '#F97316' }}>
            ↑ Active
          </div>
          <div className="stat-icon" style={{ background: '#FFF7ED', color: '#F97316' }}>
            <Ticket size={20} />
          </div>
          <div className="stat-value">{openCount}</div>
          <div className="stat-label">Open Tickets</div>
        </div>

        <div className="stat-card" style={{ '--accent': '#3B82F6' }}>
          <div className="stat-trend" style={{ color: '#3B82F6' }}>
            ● In Desk
          </div>
          <div className="stat-icon" style={{ background: '#EFF6FF', color: '#3B82F6' }}>
            <Clock size={20} />
          </div>
          <div className="stat-value">{inProgressCount}</div>
          <div className="stat-label">In Progress</div>
        </div>

        <div className="stat-card" style={{ '--accent': '#16A34A' }}>
          <div className="stat-trend" style={{ color: '#16A34A' }}>
            ✓ Verified
          </div>
          <div className="stat-icon" style={{ background: '#DCFCE7', color: '#16A34A' }}>
            <CheckCircle2 size={20} />
          </div>
          <div className="stat-value">{resolvedCount}</div>
          <div className="stat-label">Resolved Tickets</div>
        </div>

        <div className="stat-card" style={{ '--accent': '#EF4444' }}>
          <div className="stat-trend" style={{ color: '#EF4444' }}>
            ⚠ Attention
          </div>
          <div className="stat-icon" style={{ background: '#FEE2E2', color: '#EF4444' }}>
            <AlertTriangle size={20} />
          </div>
          <div className="stat-value">{escalatedCount}</div>
          <div className="stat-label">Active Escalations</div>
        </div>
      </div>

      {/* Operational Quick Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div
          className="card"
          style={{
            margin: 0,
            padding: '18px 20px',
            background: 'linear-gradient(135deg, #FAF5FF, #FFFFFF)',
            border: '1.5px solid #DDD6FE',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#7C3AED', fontWeight: 700, fontSize: '0.82rem', marginBottom: '6px' }}>
              <ShieldAlert size={16} /> Supervisor Escalations
            </div>
            <p style={{ fontSize: '0.78rem', color: '#64748B', lineHeight: 1.4 }}>
              {escalatedCount} passenger complaints require priority de-escalation review.
            </p>
          </div>
          <button
            className="btn btn-outline btn-sm"
            style={{ marginTop: '14px', alignSelf: 'flex-start' }}
            onClick={() => onNavigate('escalated')}
          >
            Review Escalations <ArrowRight size={13} />
          </button>
        </div>

        <div
          className="card"
          style={{
            margin: 0,
            padding: '18px 20px',
            background: 'linear-gradient(135deg, #FFF7ED, #FFFFFF)',
            border: '1.5px solid #FED7AA',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#EA580C', fontWeight: 700, fontSize: '0.82rem', marginBottom: '6px' }}>
              <RotateCcw size={16} /> Customer Refunds Desk
            </div>
            <p style={{ fontSize: '0.78rem', color: '#64748B', lineHeight: 1.4 }}>
              Process passenger cancellation claims, verify calculations, and complete disbursements.
            </p>
          </div>
          <button
            className="btn btn-outline btn-sm"
            style={{ marginTop: '14px', alignSelf: 'flex-start', borderColor: '#EA580C', color: '#EA580C' }}
            onClick={() => onNavigate('refunds')}
          >
            Review Refunds <ArrowRight size={13} />
          </button>
        </div>

        <div
          className="card"
          style={{
            margin: 0,
            padding: '18px 20px',
            background: 'linear-gradient(135deg, #F0FDF4, #FFFFFF)',
            border: '1.5px solid #BBF7D0',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#16A34A', fontWeight: 700, fontSize: '0.82rem', marginBottom: '6px' }}>
              <Users size={16} /> Customer Profiles
            </div>
            <p style={{ fontSize: '0.78rem', color: '#64748B', lineHeight: 1.4 }}>
              Instantly look up passenger contact details, past trips and previous claims.
            </p>
          </div>
          <button
            className="btn btn-outline btn-sm"
            style={{ marginTop: '14px', alignSelf: 'flex-start', borderColor: '#16A34A', color: '#16A34A' }}
            onClick={() => onNavigate('customers')}
          >
            Lookup Customer <ArrowRight size={13} />
          </button>
        </div>
      </div>

      {/* Recent Tickets Table Card */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Recent Customer Tickets</div>
            <div className="card-sub">Real-time incoming support requests and inquiries</div>
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
                <th>Customer</th>
                <th>Subject &amp; Issue</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {recentTickets.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: '#94A3B8' }}>
                    No support tickets found. Queries from travelers will appear here.
                  </td>
                </tr>
              ) : (
                recentTickets.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <span className="ticket-id" onClick={() => onSelectTicket(t)}>
                        {t.id}
                      </span>
                    </td>
                    <td>
                      <span className="customer-name">{t.customer}</span>
                    </td>
                    <td>
                      <span
                        style={{ cursor: 'pointer', fontWeight: 500 }}
                        onClick={() => onSelectTicket(t)}
                      >
                        {t.subject}
                      </span>
                      {t.bookingId && <span className="booking-chip">[{t.bookingId}]</span>}
                    </td>
                    <td>
                      <span className={`badge ${getPriorityBadgeClass(t.priority)}`}>
                        {t.priority}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${getStatusBadgeClass(t.status)}`}>
                        {t.status}
                      </span>
                    </td>
                    <td>
                      {t.status === 'Resolved' ? (
                        <span style={{ color: '#16A34A', fontSize: '0.75rem', fontWeight: 600 }}>
                          ✓ Closed
                        </span>
                      ) : (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onResolveTicket(t.id);
                          }}
                        >
                          Resolve
                        </button>
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
