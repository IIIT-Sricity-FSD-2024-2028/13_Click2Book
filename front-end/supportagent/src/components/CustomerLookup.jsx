import React, { useState, useMemo } from 'react';
import { Search, User, Phone, Mail, MapPin, BookOpen, AlertCircle } from 'lucide-react';

export default function CustomerLookup({ customers = [], onSelectCustomer }) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.city.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q)
    );
  }, [customers, query]);

  return (
    <div>
      {/* Search Header */}
      <div className="filter-bar">
        <div className="search-input-wrap">
          <Search size={16} />
          <input
            type="text"
            className="search-input"
            placeholder="Search passenger by name, email, phone, or customer ID..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        {query && (
          <button className="btn btn-ghost btn-sm" onClick={() => setQuery('')}>
            Clear Search
          </button>
        )}
      </div>

      {/* Results Card */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Registered Travelers Directory</div>
            <div className="card-sub">
              Showing {filtered.length} of {customers.length} verified traveler profiles
            </div>
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Customer ID</th>
                <th>Passenger Name</th>
                <th>Contact Credentials</th>
                <th>Demographics</th>
                <th>City Hub</th>
                <th>Lifetime Trips</th>
                <th>Open Tickets</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: '#94A3B8' }}>
                    No passenger records found matching your query.
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <span className="ticket-id" style={{ background: '#EFF6FF', borderColor: '#BFDBFE', color: '#1D4ED8' }}>
                        {c.id}
                      </span>
                    </td>
                    <td>
                      <div className="customer-name" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            background: '#F1F5F9',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            color: '#475569',
                          }}
                        >
                          {c.name.charAt(0)}
                        </div>
                        {c.name}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.76rem', color: '#1E293B', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Mail size={12} color="#64748B" /> {c.email}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px' }}>
                        <Phone size={12} color="#64748B" /> {c.phone}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.78rem', color: '#475569' }}>
                        {c.age} yrs • {c.gender}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', color: '#334155' }}>
                        <MapPin size={12} color="#94A3B8" /> {c.city}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.82rem' }}>
                        {c.totalBookings} bookings
                      </span>
                    </td>
                    <td>
                      {c.openTickets > 0 ? (
                        <span className="badge badge-high">{c.openTickets} Open</span>
                      ) : (
                        <span className="badge badge-low">None</span>
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
