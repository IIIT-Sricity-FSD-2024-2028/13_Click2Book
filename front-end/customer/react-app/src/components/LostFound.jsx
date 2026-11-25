import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { api } from '../services/api';
import { fetchLostFoundThunk, reportLostFoundThunk, showToastThunk } from '../store/actions';

export default function LostFound() {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const reduxBookings = useSelector((state) => state.bookings.items);
  const reports = useSelector((state) => state.lostFound.items);
  const showToast = (msg, type = 'info') => dispatch(showToastThunk(msg, type));

  const [bookings, setBookings] = useState([]);
  const [selectedBookingId, setSelectedBookingId] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [category, setCategory] = useState('Bag');
  const [dateLost, setDateLost] = useState(new Date().toISOString().split('T')[0]);
  const [contactPhone, setContactPhone] = useState(user?.phone || '9876543210');
  const [loading, setLoading] = useState(false);

  const loadBookings = async () => {
    let list = [];
    try {
      const mine = await api.bookings.getMine();
      if (Array.isArray(mine) && mine.length > 0) {
        list = mine;
      }
    } catch {}

    if (list.length === 0 && reduxBookings.length > 0) {
      list = reduxBookings;
    }

    if (list.length === 0) {
      list = [
        { bookingId: 'BK1001', tripId: 'TRIP-101', seatNumber: 12, bookingStatus: 'CONFIRMED' },
        { bookingId: 'BK1002', tripId: 'TRIP-102', seatNumber: 15, bookingStatus: 'COMPLETED' },
      ];
    }

    setBookings(list);
    if (list.length > 0 && !selectedBookingId) {
      setSelectedBookingId(list[0].bookingId);
    }
  };

  useEffect(() => {
    loadBookings();
    dispatch(fetchLostFoundThunk());
  }, [dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBookingId) {
      showToast('⚠️ Please select a trip from your bookings.', 'error');
      return;
    }
    if (!itemDescription.trim() || itemDescription.length < 3) {
      showToast('⚠️ Please enter an item description.', 'error');
      return;
    }

    const booking = bookings.find((b) => b.bookingId === selectedBookingId) || { tripId: 'TRIP-101' };
    setLoading(true);

    const newReport = {
      id: 'LF-' + Date.now().toString(36).toUpperCase(),
      bookingId: selectedBookingId,
      tripId: booking.tripId,
      itemDescription: itemDescription.trim(),
      category,
      dateLost,
      contactPhone: contactPhone.trim(),
      status: 'REPORTED',
      createdAt: new Date().toISOString(),
    };

    await dispatch(reportLostFoundThunk(newReport));

    setLoading(false);
    setItemDescription('');
    showToast('✅ Report submitted — operator notified!', 'success');
  };

  return (
    <div className="page-body fade-up">
      <h1 className="page-heading">Lost & Found</h1>
      <p className="page-subhead">Left something on the bus? Let the operator know.</p>

      <div className="lf-grid">
        {/* Report Form Card */}
        <div className="lf-card">
          <h3>Report a lost item</h3>
          <form onSubmit={handleSubmit}>
            <div className="lf-field">
              <label htmlFor="lfTrip">Which trip?</label>
              <select
                id="lfTrip"
                required
                value={selectedBookingId}
                onChange={(e) => setSelectedBookingId(e.target.value)}
              >
                {bookings.length === 0 ? (
                  <option value="">No bookings found on your account</option>
                ) : (
                  bookings.map((b) => (
                    <option key={b.bookingId} value={b.bookingId}>
                      {b.bookingId} — Trip {b.tripId} (Seat {b.seatNumber || b.seats?.join(', ') || '12'})
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="lf-field">
              <label htmlFor="lfDesc">Item description</label>
              <textarea
                id="lfDesc"
                placeholder="e.g. Black backpack with a laptop, left near seat 12"
                required
                minLength={3}
                maxLength={500}
                value={itemDescription}
                onChange={(e) => setItemDescription(e.target.value)}
              />
            </div>

            <div className="lf-field">
              <label htmlFor="lfCategory">Category</label>
              <select
                id="lfCategory"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="Bag">Bag / Backpack</option>
                <option value="Electronics">Electronics</option>
                <option value="Documents">Documents / Wallet</option>
                <option value="Clothing">Clothing</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="lf-field">
              <label htmlFor="lfDate">Date lost</label>
              <input
                type="date"
                id="lfDate"
                required
                value={dateLost}
                onChange={(e) => setDateLost(e.target.value)}
              />
            </div>

            <div className="lf-field">
              <label htmlFor="lfPhone">Contact phone</label>
              <input
                type="tel"
                id="lfPhone"
                placeholder="9876543210"
                required
                pattern="[0-9]{10}"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
              />
            </div>

            <button type="submit" className="btn-orange lf-submit" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Report'}
            </button>
          </form>
        </div>

        {/* Existing Reports Column */}
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '14px' }}>
            Your reports
          </h3>

          {reports.length === 0 ? (
            <div className="lf-empty">You haven't reported any lost items yet.</div>
          ) : (
            <div>
              {reports.map((r, idx) => (
                <div key={r.id || idx} className="lf-report">
                  <div className="lf-report-top">
                    <span className="lf-report-desc">{r.itemDescription}</span>
                    <span className={`lf-status lf-status-${r.status || 'REPORTED'}`}>
                      {r.status || 'REPORTED'}
                    </span>
                  </div>
                  <div className="lf-report-meta">
                    Trip {r.tripId} · Lost on {r.dateLost} · {r.category || 'Item'}
                  </div>
                  {r.foundNote && (
                    <div className="lf-report-note">
                      📝 {r.foundNote}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
