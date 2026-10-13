import React, { useState, useMemo } from 'react';
import { Search, Filter, CheckCircle2, Eye, Ticket as TicketIcon } from 'lucide-react';

export default function Tickets({
  tickets = [],
  onSelectTicket,
  onResolveTicket,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

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

      return matchQuery && matchPriority && matchStatus;
    });
  }, [tickets, searchQuery, priorityFilter, statusFilter]);

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
      {/* Search & Filter Controls */}
      <div className="filter-bar">
        <div className="search-input-wrap">
          <Search size={16} />
          <input
            type="text"
            className="search-input"
            placeholder="Search by Ticket ID, customer name, subject, or booking..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

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

        <select
          className="filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="Open">Open</option>
          <option value="In Progress">In Progress</option>
          <option value="Resolved">Resolved</option>
          <option value="Escalated">Escalated</option>
        </select>

        {(searchQuery || priorityFilter || statusFilter) && (
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => {
              setSearchQuery('');
              setPriorityFilter('');
              setStatusFilter('');
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
            <div className="card-title">All Support Tickets</div>
            <div className="card-sub">
              Showing {filteredTickets.length} of {tickets.length} total passenger queries
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>
              Live Queue Status: Active
            </span>
          </div>
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
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#94A3B8' }}>
                    No tickets found matching the specified search or filter criteria.
                  </td>
                </tr>
              ) : (
                filteredTickets.map((t) => (
                  <tr key={t.id} onClick={() => onSelectTicket(t)} style={{ cursor: 'pointer' }}>
                    <td>
                      <span className="ticket-id">{t.id}</span>
                    </td>
                    <td>
                      <span className="customer-name">{t.customer}</span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500, color: '#1E293B' }}>{t.subject}</div>
                      {t.bookingId && (
                        <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '2px' }}>
                          Booking: <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{t.bookingId}</span>
                        </div>
                      )}
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectTicket(t);
                          }}
                          title="Inspect Ticket Details"
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
                              onResolveTicket(t.id);
                            }}
                            title="Mark ticket as resolved"
                          >
                            <CheckCircle2 size={13} /> Resolve
                          </button>
                        )}
                      </div>
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
