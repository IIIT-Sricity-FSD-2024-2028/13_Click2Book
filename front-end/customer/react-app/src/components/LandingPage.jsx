import React, { useState } from 'react';
import {
  Search,
  ArrowLeftRight,
  Shield,
  Zap,
  Lock,
  RotateCcw,
  Headphones,
  Award,
  Star,
  Bus,
  CheckCircle,
  Phone,
  Mail,
  ArrowRight
} from 'lucide-react';
import './LandingPage.css';

const POPULAR_ROUTES = [
  { from: 'Mumbai', to: 'Pune' },
  { from: 'Hyderabad', to: 'Chennai' },
  { from: 'Bangalore', to: 'Mysore' },
  { from: 'Delhi', to: 'Jaipur' },
  { from: 'Hyderabad', to: 'Vijayawada' },
  { from: 'Vijayawada', to: 'Tirupati' },
  { from: 'Hyderabad', to: 'Bangalore' },
  { from: 'Bangalore', to: 'Mumbai' },
];

const DESTINATION_CARDS = [
  {
    from: 'Mumbai',
    to: 'Pune',
    price: 'From ₹299 · 3½ hrs',
    tag: 'Bus',
    badge: 'HOT',
    img: 'https://images.unsplash.com/photo-1529253355930-ddbe423a2ac7?w=500&q=75',
    bg: 'linear-gradient(135deg,#1a365d,#0f1f3d)',
  },
  {
    from: 'Hyderabad',
    to: 'Chennai',
    price: 'From ₹600 · 9½ hrs',
    tag: 'Bus',
    badge: 'POPULAR',
    img: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=500&q=75',
    bg: 'linear-gradient(135deg,#7c2d12,#1e3a5f)',
  },
  {
    from: 'Bangalore',
    to: 'Mysore',
    price: 'From ₹150 · 3 hrs',
    tag: 'Bus',
    badge: null,
    img: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=500&q=75',
    bg: 'linear-gradient(135deg,#064e3b,#0f1f3d)',
  },
  {
    from: 'Delhi',
    to: 'Jaipur',
    price: 'From ₹350 · 4½ hrs',
    tag: 'Bus',
    badge: 'POPULAR',
    img: 'https://images.unsplash.com/photo-1477587458883-47145ed6736c?w=500&q=75',
    bg: 'linear-gradient(135deg,#1e3a5f,#2d1b69)',
  },
  {
    from: 'Hyderabad',
    to: 'Vijayawada',
    price: 'From ₹320 · 5 hrs',
    tag: 'Bus',
    badge: 'EXPRESS',
    img: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=500&q=75',
    bg: 'linear-gradient(135deg,#1a365d,#0f1f3d)',
  },
  {
    from: 'Vijayawada',
    to: 'Tirupati',
    price: 'From ₹450 · 6 hrs',
    tag: 'Bus',
    badge: null,
    img: 'https://images.unsplash.com/photo-1560448075-cbc16bb4af8e?w=500&q=75',
    bg: 'linear-gradient(135deg,#7c2d12,#0f1f3d)',
  },
  {
    from: 'Hyderabad',
    to: 'Bangalore',
    price: 'From ₹500 · 9 hrs',
    tag: 'Bus',
    badge: null,
    img: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=500&q=75',
    bg: 'linear-gradient(135deg,#064e3b,#0a1628)',
  },
  {
    from: 'Bangalore',
    to: 'Mumbai',
    price: 'From ₹1200 · 14 hrs',
    tag: 'Bus',
    badge: null,
    img: 'https://images.unsplash.com/photo-1529253355930-ddbe423a2ac7?w=500&q=75',
    bg: 'linear-gradient(135deg,#1e3a5f,#0f1f3d)',
  },
];

export default function LandingPage({
  user,
  onSearchBuses,
  onOpenLogin,
  onOpenSignup,
  onNavigate,
  onLogout,
}) {
  const [fromCity, setFromCity] = useState('Mumbai');
  const [toCity, setToCity] = useState('Pune');

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const maxD = new Date(now);
  maxD.setMonth(maxD.getMonth() + 2);
  const maxStr = maxD.toISOString().split('T')[0];

  const [travelDate, setTravelDate] = useState(todayStr);
  const [validationError, setValidationError] = useState('');

  const handleSwap = () => {
    const tmp = fromCity;
    setFromCity(toCity);
    setToCity(tmp);
  };

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    setValidationError('');

    const from = fromCity.trim();
    const to = toCity.trim();

    if (!from || !to) {
      setValidationError('Please enter departure and destination.');
      return;
    }
    if (from.toLowerCase() === to.toLowerCase()) {
      setValidationError('Departure and destination cannot be the same.');
      return;
    }
    if (!travelDate) {
      setValidationError('Please select a travel date.');
      return;
    }
    if (travelDate < todayStr) {
      setValidationError('Travel date cannot be in the past.');
      return;
    }
    if (travelDate > maxStr) {
      setValidationError('Travel date cannot exceed 2 months in advance.');
      return;
    }

    sessionStorage.setItem('searchFrom', from);
    sessionStorage.setItem('searchTo', to);
    sessionStorage.setItem('searchDate', travelDate);

    onSearchBuses({ from, to, date: travelDate });
  };

  const handleQuickRoute = (from, to) => {
    setFromCity(from);
    setToCity(to);
    sessionStorage.setItem('searchFrom', from);
    sessionStorage.setItem('searchTo', to);
    sessionStorage.setItem('searchDate', travelDate);
    onSearchBuses({ from, to, date: travelDate });
  };

  return (
    <div className="lp-root">
      {/* ── TOP NAVIGATION ── */}
      <nav className="lp-nav">
        <div className="lp-logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div className="lp-logo-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <rect x="2" y="8" width="20" height="12" rx="3" fill="white" opacity=".9" />
              <rect x="5" y="5" width="14" height="5" rx="2" fill="white" opacity=".6" />
              <circle cx="6.5" cy="20" r="1.5" fill="#f97316" />
              <circle cx="17.5" cy="20" r="1.5" fill="#f97316" />
            </svg>
          </div>
          <span className="lp-logo-txt">
            CLICK<span>2</span>BOOK
          </span>
        </div>

        <ul className="lp-nav-links">
          <li>
            <button className="on" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              Home
            </button>
          </li>
          <li>
            <button onClick={() => onNavigate('search-trips')}>
              Search Buses
            </button>
          </li>
          <li>
            <button onClick={() => onNavigate('offers')}>
              Offers
            </button>
          </li>
          <li>
            <button onClick={() => onNavigate('get-support')}>
              Support
            </button>
          </li>
        </ul>

        <div className="lp-nav-actions">
          {user && user.isLoggedIn ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                className="lp-btn-ghost"
                onClick={() => onNavigate('my-bookings')}
              >
                👤 {user.name.split(' ')[0]}
              </button>
              <button
                className="lp-btn-nav"
                onClick={onLogout}
                style={{ background: 'rgba(239, 68, 68, 0.85)' }}
              >
                Logout
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                className="lp-btn-ghost"
                onClick={onOpenSignup}
              >
                Sign Up
              </button>
              <button
                className="lp-btn-nav"
                id="signInBtn"
                onClick={onOpenLogin}
              >
                Sign In →
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* ── HERO SECTION ── */}
      <section className="lp-hero">
        <div className="lp-hdot" style={{ width: '8px', height: '8px', left: '10%', animationDuration: '18s', animationDelay: '0s' }} />
        <div className="lp-hdot" style={{ width: '5px', height: '5px', left: '25%', animationDuration: '22s', animationDelay: '3s' }} />
        <div className="lp-hdot" style={{ width: '10px', height: '10px', left: '70%', animationDuration: '16s', animationDelay: '1s' }} />
        <div className="lp-hdot" style={{ width: '6px', height: '6px', left: '85%', animationDuration: '20s', animationDelay: '5s' }} />
        <div className="lp-hdot" style={{ width: '4px', height: '4px', left: '50%', animationDuration: '25s', animationDelay: '2s' }} />

        <div className="lp-hc">
          <h1 className="lp-hero-h">
            Book Your Journey<br />with <span>CLICK2BOOK</span>
          </h1>
          <p className="lp-hero-sub">
            Your ticket to go far ahead — fast, safe and affordable
          </p>

          {/* Search Card */}
          <div className="lp-sc">
            <div className="lp-tabs">
              <button
                className="lp-tab on"
                type="button"
              >
                🚌 &nbsp;Bus
              </button>
            </div>

            {validationError && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                borderRadius: '8px',
                padding: '8px 14px',
                marginBottom: '12px',
                color: '#fca5a5',
                fontSize: '0.82rem',
                textAlign: 'left'
              }}>
                ⚠️ {validationError}
              </div>
            )}

            <form onSubmit={handleSearch} className="lp-srow">
              <div className="lp-sf">
                <label>From</label>
                <input
                  type="text"
                  id="fromCityInput"
                  placeholder="Departure city"
                  value={fromCity}
                  onChange={(e) => setFromCity(e.target.value)}
                  required
                />
              </div>

              <div className="lp-swp">
                <button
                  type="button"
                  className="lp-swp-btn"
                  onClick={handleSwap}
                  aria-label="Swap cities"
                  title="Swap departure & destination"
                >
                  <ArrowLeftRight size={16} />
                </button>
              </div>

              <div className="lp-sf">
                <label>To</label>
                <input
                  type="text"
                  id="toCityInput"
                  placeholder="Destination city"
                  value={toCity}
                  onChange={(e) => setToCity(e.target.value)}
                  required
                />
              </div>

              <div className="lp-sf">
                <label>Travel Date</label>
                <input
                  type="date"
                  id="travelDateInput"
                  value={travelDate}
                  min={todayStr}
                  max={maxStr}
                  onChange={(e) => setTravelDate(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="lp-find-btn"
                id="landingFindBtn"
              >
                <Search size={18} />
                <span>Find Buses</span>
              </button>
            </form>
          </div>

          {/* Perks Bar */}
          <div className="lp-perks">
            <div className="lp-perk"><span className="lp-pdot" /> No Hidden Fees</div>
            <div className="lp-perk"><span className="lp-pdot" /> Easy Cancellation</div>
            <div className="lp-perk"><span className="lp-pdot" /> 24/7 Help</div>
            <div className="lp-perk"><span className="lp-pdot" /> Instant E-Ticket</div>
          </div>
        </div>
      </section>

      {/* ── POPULAR ROUTES QUICK PILLS ── */}
      <div className="lp-pills-bar">
        <p className="lp-pills-label">Popular Routes</p>
        <div className="lp-pills-list">
          {POPULAR_ROUTES.map((r, i) => (
            <button
              key={i}
              className="lp-pill-btn"
              onClick={() => handleQuickRoute(r.from, r.to)}
            >
              🚌 {r.from} → {r.to}
            </button>
          ))}
        </div>
      </div>

      {/* ── TOP DESTINATIONS SECTION ── */}
      <section className="lp-section lp-dest-sec">
        <div className="lp-sh">
          <div className="lp-stag">✈ Popular Routes</div>
          <h2 className="lp-st">Top Travel Destinations</h2>
          <p className="lp-ss">Discover the most popular bus routes across India — powered by live backend data</p>
        </div>

        <div className="lp-dgrid">
          {DESTINATION_CARDS.map((d, i) => (
            <div
              key={i}
              className="lp-dcard"
              onClick={() => handleQuickRoute(d.from, d.to)}
            >
              <img
                className="lp-dimg"
                src={d.img}
                alt={`${d.from} to ${d.to}`}
                loading="lazy"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
              <div className="lp-dov" />
              {d.badge && <span className="lp-dbadge">{d.badge}</span>}
              <div className="lp-dinfo">
                <span className="lp-dtag">{d.tag}</span>
                <span className="lp-droute">{d.from} → {d.to}</span>
                <span className="lp-dprice">{d.price}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="lp-explore">
          <button
            className="lp-btn-ol"
            onClick={() => onNavigate('search-trips')}
          >
            Search All Routes →
          </button>
        </div>
      </section>

      {/* ── STATS SECTION ── */}
      <div className="lp-stats-s">
        <div className="lp-sgrid">
          <div><span className="lp-sv">250+</span><span className="lp-sl">Routes Available</span></div>
          <div><span className="lp-sv">30+</span><span className="lp-sl">Bus Partners</span></div>
          <div><span className="lp-sv">15+</span><span className="lp-sl">Cities Covered</span></div>
          <div><span className="lp-sv">4.7</span><span className="lp-sl">⭐ Average Rating</span></div>
        </div>
      </div>

      {/* ── FEATURES SECTION ── */}
      <section className="lp-section lp-feat-sec">
        <div className="lp-sh">
          <div className="lp-stag">Why Choose Us</div>
          <h2 className="lp-st">Travel Smarter with Click2Book</h2>
          <p className="lp-ss">Everything you need for a seamless journey experience</p>
        </div>

        <div className="lp-fgrid">
          <div className="lp-fc">
            <div className="lp-ficon">🛡️</div>
            <div className="lp-fn">100% Safe Travel</div>
            <p className="lp-fd">All buses are verified, sanitized and meet safety standards. Travel with peace of mind.</p>
          </div>
          <div className="lp-fc">
            <div className="lp-ficon">⚡</div>
            <div className="lp-fn">Instant Booking</div>
            <p className="lp-fd">Book your ticket in under 60 seconds. Instant confirmation sent to your phone and email.</p>
          </div>
          <div className="lp-fc">
            <div className="lp-ficon">🔒</div>
            <div className="lp-fn">Secure Payments</div>
            <p className="lp-fd">All transactions are 256-bit encrypted. Pay via UPI, card, net banking or wallet safely.</p>
          </div>
          <div className="lp-fc">
            <div className="lp-ficon">↩️</div>
            <div className="lp-fn">Easy Refunds</div>
            <p className="lp-fd">Cancel anytime and get your refund processed within 5–7 business days. No hassle.</p>
          </div>
          <div className="lp-fc">
            <div className="lp-ficon">🎧</div>
            <div className="lp-fn">24/7 Support</div>
            <p className="lp-fd">Our dedicated team is available around the clock via chat, email and phone.</p>
          </div>
          <div className="lp-fc">
            <div className="lp-ficon">🏆</div>
            <div className="lp-fn">No. 1 on Board</div>
            <p className="lp-fd">Rated India's most trusted bus booking platform with over 10 lakh happy travelers.</p>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="lp-section lp-how-sec">
        <div className="lp-sh">
          <div className="lp-stag">Simple Steps</div>
          <h2 className="lp-st">How It Works</h2>
          <p className="lp-ss">Book your perfect bus ticket in just 4 easy steps</p>
        </div>

        <div className="lp-steps">
          <div className="lp-scard">
            <div className="lp-snum">🔍</div>
            <div className="lp-stitle">Search Buses</div>
            <p className="lp-sdesc">Enter origin, destination and date to find available buses on your route</p>
          </div>
          <div className="lp-scard">
            <div className="lp-snum">💺</div>
            <div className="lp-stitle">Choose Your Seat</div>
            <p className="lp-sdesc">Pick your preferred seat from the live interactive seat map</p>
          </div>
          <div className="lp-scard">
            <div className="lp-snum">📝</div>
            <div className="lp-stitle">Fill Details</div>
            <p className="lp-sdesc">Enter passenger info and apply promo codes to get the best deal</p>
          </div>
          <div className="lp-scard">
            <div className="lp-snum">✅</div>
            <div className="lp-stitle">Confirm & Pay</div>
            <p className="lp-sdesc">Pay securely and receive your e-ticket instantly on your phone</p>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="lp-section lp-testi-sec">
        <div className="lp-sh">
          <div className="lp-stag">Reviews</div>
          <h2 className="lp-st">What Travelers Say</h2>
        </div>

        <div className="lp-tc">
          <div className="lp-tstars">★★★★★</div>
          <p className="lp-tquote">
            "I've been using Click2Book for over a year and it has completely transformed how I travel. The booking process is lightning-fast, seat selection is smooth, and I've never had any issue with refunds. Highly recommended to every traveler!"
          </p>
          <div className="lp-tauth">
            <div className="lp-tav">RK</div>
            <div>
              <div className="lp-tname">Rahul Kumar</div>
              <div className="lp-trole">Frequent Traveler · Mumbai</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CALL TO ACTION ── */}
      <section className="lp-cta-sec">
        <h2 className="lp-cta-t">Ready to Start Your Journey?</h2>
        <p className="lp-cta-s">Join 10 lakh+ happy travelers booking smarter with Click2Book</p>
        <button
          className="lp-btn-wh"
          onClick={() => (user?.isLoggedIn ? onNavigate('search-trips') : onOpenSignup())}
        >
          {user?.isLoggedIn ? 'Search Buses Now →' : 'Create Your Account →'}
        </button>
      </section>

      {/* ── FOOTER ── */}
      <footer className="lp-footer">
        <div className="lp-fg">
          <div>
            <div className="lp-logo" style={{ marginBottom: '14px', display: 'inline-flex' }}>
              <div className="lp-logo-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <rect x="2" y="8" width="20" height="12" rx="3" fill="white" opacity=".9" />
                  <rect x="5" y="5" width="14" height="5" rx="2" fill="white" opacity=".6" />
                  <circle cx="6.5" cy="20" r="1.5" fill="#f97316" />
                  <circle cx="17.5" cy="20" r="1.5" fill="#f97316" />
                </svg>
              </div>
              <span className="lp-logo-txt">
                CLICK<span>2</span>BOOK
              </span>
            </div>
            <p className="lp-fdesc">
              India's most trusted online bus booking platform. Book fast, travel safe, and enjoy every journey.
            </p>
            <div className="lp-fci">
              <Phone size={14} /> +91 1800-123-4567
            </div>
            <div className="lp-fci">
              <Mail size={14} /> support@click2book.in
            </div>
            <div className="lp-fsoc">
              <button className="lp-sbtn" title="Facebook"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg></button>
              <button className="lp-sbtn" title="Twitter"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/></svg></button>
              <button className="lp-sbtn" title="Instagram"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg></button>
              <button className="lp-sbtn" title="YouTube"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.6.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19.08C5.12 19.5 12 19.5 12 19.5s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.95-1.96 29 29 0 0 0 .45-5.29 29 29 0 0 0-.46-5.37z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/></svg></button>
            </div>
          </div>

          <div className="lp-fcol">
            <h4>Company</h4>
            <ul className="lp-flinks">
              <li><button onClick={() => onNavigate('landing')}>About Us</button></li>
              <li><button onClick={() => onNavigate('landing')}>Careers</button></li>
              <li><button onClick={() => onNavigate('landing')}>Press</button></li>
              <li><button onClick={() => onNavigate('landing')}>Blog</button></li>
            </ul>
          </div>

          <div className="lp-fcol">
            <h4>Services</h4>
            <ul className="lp-flinks">
              <li><button onClick={() => onNavigate('search-trips')}>Bus Booking</button></li>
              <li><button onClick={() => onNavigate('offers')}>Special Offers</button></li>
              <li><button onClick={() => onNavigate('cancel-ticket')}>Cancel Ticket</button></li>
              <li><button onClick={() => onNavigate('landing')}>Customer Review</button></li>
            </ul>
          </div>

          <div className="lp-fcol">
            <h4>Support</h4>
            <ul className="lp-flinks">
              <li><button onClick={() => onNavigate('get-support')}>Help Centre</button></li>
              <li><button onClick={() => onNavigate('get-support')}>Contact Support</button></li>
              <li><button onClick={() => onNavigate('landing')}>Terms of Service</button></li>
              <li><button onClick={() => onNavigate('landing')}>Privacy Policy</button></li>
            </ul>
          </div>
        </div>

        <div className="lp-fbot">
          <span>© 2026 Click2Book. All rights reserved.</span>
          <div className="lp-fbot-l">
            <button onClick={() => onNavigate('landing')}>Privacy</button>
            <button onClick={() => onNavigate('landing')}>Terms</button>
            <button onClick={() => onNavigate('get-support')}>Contact</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
