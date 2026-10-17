import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

const ISSUE_CATEGORIES = [
  { id: 'booking', label: 'Booking Issue', icon: '📋' },
  { id: 'refund', label: 'Refund', icon: '↩️' },
  { id: 'complaint', label: 'Complaint', icon: '⚠️' },
  { id: 'other', label: 'Other', icon: '📄' },
];

export default function GetSupport({ user, showToast }) {
  const [activeTab, setActiveTab] = useState('create'); // 'create' | 'requests' | 'success'
  const [selectedIssue, setSelectedIssue] = useState('Booking Issue');
  const [bookingId, setBookingId] = useState('');
  const [description, setDescription] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [generatedTicketId, setGeneratedTicketId] = useState('');

  // Requests state
  const [requestsList, setRequestsList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const customerId = user?.id || localStorage.getItem('c2b_loggedInId') || sessionStorage.getItem('c2b_loggedInId') || localStorage.getItem('c2b_userId') || sessionStorage.getItem('c2b_userId') || 'C001';
  const customerName = user?.name || sessionStorage.getItem('c2b_userName') || localStorage.getItem('c2b_userName') || 'Customer';

  // Load existing requests
  const loadRequests = async () => {
    const map = new Map();

    // 1. Read from localStorage
    try {
      const local = JSON.parse(localStorage.getItem('c2b_support_requests') || '[]');
      if (Array.isArray(local)) {
        local.forEach((item) => {
          const id = item.requestId || item.request_id || item.id;
          if (id) map.set(id, item);
        });
      }
    } catch {
      // Ignore parse error
    }

    // 2. Try API (authoritative backend)
    try {
      const live = await api.supportRequests.getMine(customerId);
      if (Array.isArray(live) && live.length > 0) {
        live.forEach((item) => {
          const id = item.requestId || item.request_id || item.id;
          if (id) {
            const existing = map.get(id) || {};
            map.set(id, { ...existing, ...item });
          }
        });
      }
    } catch {
      // Backend offline fallback
    }

    // Default mock ticket if completely empty
    if (map.size === 0) {
      map.set('REQ-DEMO101', {
        requestId: 'REQ-DEMO101',
        category: 'Booking Issue',
        bookingId: 'BK1002',
        description: 'Seat assignment preference was modified unexpectedly during boarding.',
        status: 'RESOLVED',
        createdAt: '2026-03-28',
        resolution: 'Support Agent checked with the operator and restored your seat.',
        response: 'Support Agent checked with the operator and restored your seat.',
      });
    }

    setRequestsList(Array.from(map.values()));
  };

  useEffect(() => {
    loadRequests();

    const handleStorageChange = (e) => {
      if (!e.key || e.key.includes('support') || e.key.includes('ticket')) {
        loadRequests();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    const interval = setInterval(loadRequests, 8000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [customerId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const desc = description.trim();
    if (!desc) {
      setErrorMessage('Please describe your issue before submitting.');
      return;
    }
    if (desc.length < 20) {
      setErrorMessage('Please provide more detail (at least 20 characters) so our team can help you effectively.');
      return;
    }
    if (bookingId.trim() && !/^[a-zA-Z0-9\-_]+$/.test(bookingId.trim())) {
      setErrorMessage('Booking ID should contain only letters, numbers, or hyphens (e.g. BK001 or BUS1234567).');
      return;
    }

    setIsSubmitting(true);
    let ticketId = 'TKT-' + Math.floor(10000 + Math.random() * 90000);
    const today = new Date().toISOString().split('T')[0];

    let newTicket = {
      requestId: ticketId,
      customerId,
      supporterId: 'SUP001',
      category: selectedIssue,
      bookingId: bookingId.trim() || undefined,
      description: desc,
      status: 'OPEN',
      customerName,
      createdAt: today,
    };

    // 1. Call API first
    try {
      const liveRes = await api.supportRequests.create(newTicket);
      if (liveRes && (liveRes.requestId || liveRes.id)) {
        ticketId = liveRes.requestId || liveRes.id;
        newTicket = { ...newTicket, ...liveRes, requestId: ticketId };
      }
    } catch (err) {
      console.warn('[GetSupport] API submission fallback:', err.message);
    }

    // 2. Persist in localStorage
    try {
      const existing = JSON.parse(localStorage.getItem('c2b_support_requests') || '[]');
      const filtered = Array.isArray(existing) ? existing.filter((t) => (t.requestId || t.id) !== ticketId) : [];
      filtered.unshift(newTicket);
      localStorage.setItem('c2b_support_requests', JSON.stringify(filtered));
      window.dispatchEvent(new Event('storage'));
    } catch {}

    setIsSubmitting(false);
    setGeneratedTicketId(ticketId);
    setActiveTab('success');
    setDescription('');
    setBookingId('');
    await loadRequests();
    showToast('✅ Ticket submitted successfully!', 'success');
  };

  const filteredRequests = requestsList.filter((r) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const id = (r.requestId || r.request_id || r.id || '').toLowerCase();
    const cat = (r.category || '').toLowerCase();
    const desc = (r.description || '').toLowerCase();
    const bId = (r.bookingId || r.booking_id || '').toLowerCase();
    return id.includes(q) || cat.includes(q) || desc.includes(q) || bId.includes(q);
  });

  return (
    <div className="fade-up">
      {/* ── Support Navigation Tabs & Header Action ── */}
      <div className="page-body" style={{ paddingBottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div className="support-tabs" style={{ marginBottom: 0 }}>
          <button
            className={`support-tab-btn ${activeTab === 'create' || activeTab === 'success' ? 'active' : ''}`}
            onClick={() => setActiveTab('create')}
          >
            <span>✍️ Submit Request</span>
          </button>
          <button
            className={`support-tab-btn ${activeTab === 'requests' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('requests');
              loadRequests();
            }}
          >
            <span>📋 My Support Requests</span>
            <span className="support-tab-badge">{requestsList.length}</span>
          </button>
        </div>

        {activeTab !== 'requests' && (
          <button
            className="header-req-btn"
            onClick={() => {
              setActiveTab('requests');
              loadRequests();
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
            <span>View Request Status</span>
            <span className="support-tab-badge" style={{ background: '#ea580c', color: 'white' }}>{requestsList.length}</span>
          </button>
        )}
      </div>

      {/* ── VIEW 1: Support Form ── */}
      {activeTab === 'create' && (
        <div className="page-body" style={{ paddingTop: 0 }}>
          <h1 className="page-heading">Request Assistance</h1>
          <p className="page-subhead">Our team is here to help you 24/7</p>

          <div className="support-wrapper">
            <div className="issue-section">
              <p className="issue-label">Issue Category</p>
              <div className="issue-grid">
                {ISSUE_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    className={`issue-btn ${selectedIssue === cat.label ? 'active' : ''}`}
                    onClick={() => setSelectedIssue(cat.label)}
                  >
                    <span className="issue-icon">{cat.icon}</span> {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="support-form">
              <input
                type="text"
                className="support-input"
                placeholder="Booking ID (optional, e.g. BUS1234567)"
                value={bookingId}
                onChange={(e) => setBookingId(e.target.value)}
              />
              <textarea
                className="support-textarea"
                placeholder="Describe your issue in detail (at least 20 characters)…"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              {errorMessage && (
                <div style={{
                  background: '#fff1f2',
                  border: '1px solid #fecaca',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  fontSize: '.82rem',
                  color: '#ef4444',
                  fontWeight: 600
                }}>
                  ⚠️ {errorMessage}
                </div>
              )}
              <button
                type="submit"
                className="submit-btn"
                disabled={isSubmitting}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6" /><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z" /><path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" /></svg>
                {isSubmitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── VIEW 2: Success ── */}
      {activeTab === 'success' && (
        <div className="page-body" style={{ paddingTop: 0 }}>
          <h1 className="page-heading">Request Assistance</h1>
          <p className="page-subhead">Our team is here to help you 24/7</p>

          <div className="success-card">
            <div className="success-icon-wrap">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
                <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z" />
                <path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
              </svg>
            </div>
            <h2 className="success-title">Request Submitted!</h2>
            <p className="success-ticket-id">Ticket ID: <span>{generatedTicketId}</span></p>
            <p className="success-desc">Our support team will review your inquiry and update the status within 2–4 hours.</p>

            <div style={{ display: 'flex', gap: '12px', marginTop: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
              <button className="req-action-btn primary" onClick={() => setActiveTab('requests')}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
                View Request Status
              </button>
              <button className="req-action-btn" onClick={() => setActiveTab('create')}>
                Submit Another Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── VIEW 3: My Support Requests & Status ── */}
      {activeTab === 'requests' && (
        <div className="page-body" style={{ paddingTop: 0 }}>
          <h1 className="page-heading">My Support Requests</h1>
          <p className="page-subhead">Track real-time status and resolutions for your submitted tickets</p>

          <div className="requests-container">
            <div className="requests-toolbar">
              <input
                type="text"
                className="req-search-input"
                placeholder="🔍 Search tickets by ID, category, or issue..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="req-action-btn" onClick={loadRequests}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" /></svg>
                  Refresh
                </button>
                <button className="req-action-btn primary" onClick={() => setActiveTab('create')}>
                  ➕ New Request
                </button>
              </div>
            </div>

            {filteredRequests.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', background: 'white', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🎧</div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '6px' }}>No Support Requests Found</h3>
                <p style={{ fontSize: '.85rem', color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto 16px' }}>You haven't submitted any support requests yet. If you have questions about bookings or refunds, submit a request.</p>
                <button className="req-action-btn primary" onClick={() => setActiveTab('create')}>Submit a Support Request</button>
              </div>
            ) : (
              filteredRequests.map((req) => {
                const id = req.requestId || req.request_id || req.id;
                const status = (req.status || 'OPEN').toUpperCase();
                let statusClass = 'open';
                if (status === 'IN_PROGRESS') statusClass = 'in_progress';
                if (status === 'RESOLVED') statusClass = 'resolved';
                if (status === 'CLOSED') statusClass = 'closed';

                return (
                  <div key={id} className="req-card">
                    <div className="req-card-header">
                      <div className="req-title-wrap">
                        <div className="req-category-badge">
                          <span>🏷️ {req.category || 'Support Request'}</span>
                          {req.bookingId && <span style={{ color: 'var(--primary)' }}>({req.bookingId})</span>}
                        </div>
                        <span className="req-id">ID: {id}</span>
                      </div>

                      <span className={`status-badge ${statusClass}`}>
                        ● {status}
                      </span>
                    </div>

                    <div className="req-desc">
                      {req.description}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="req-date">Created on: {req.createdAt || req.created_date || 'Today'}</span>
                    </div>

                    {(req.resolution || req.response || req.reply || req.resolutionNote) && (
                      <div className="req-response">
                        <div className="req-response-title">
                          <span>💬 Support Agent Resolution / Response:</span>
                          {req.resolvedBy && (
                            <span style={{ fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-muted, #64748B)', marginLeft: '6px' }}>
                              (by {req.resolvedBy})
                            </span>
                          )}
                        </div>
                        <p style={{ margin: 0 }}>{req.resolution || req.response || req.reply || req.resolutionNote}</p>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
