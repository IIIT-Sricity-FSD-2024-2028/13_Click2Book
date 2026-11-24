/**
 * Click2Book Customer Portal — Datasets
 * Mock buses purged: only real buses from backend and provider fleet are displayed.
 */

export const MOCK_BUSES = [];

export const OFFERS_CATALOG = [
  { code: 'FIRSTBUS100', title: 'First Ride Bonus',     desc: '₹100 off on your first booking',               discount: 100, type: 'flat',    badge: 'NEW',       badgeColor: '#f97316', minFare: 0,   category: 'festive' },
  { code: 'WEEKEND150',  title: 'Weekend Flash Sale',   desc: '₹150 off on weekend travel bookings',           discount: 150, type: 'flat',    badge: 'HOT',       badgeColor: '#ef4444', minFare: 300, category: 'festive' },
  { code: 'PREMIUM200',  title: 'Premium Member Offer', desc: '₹200 cashback for Premium members above ₹800',  discount: 200, type: 'flat',    badge: 'EXCLUSIVE', badgeColor: '#8b5cf6', minFare: 800, category: 'exclusive' },
  { code: 'REFER75',     title: 'Refer a Friend',       desc: '₹75 off for you and your friend',               discount: 75,  type: 'flat',    badge: 'HOT',       badgeColor: '#ef4444', minFare: 0,   category: 'exclusive' },
  { code: 'NIGHTBUS25',  title: 'Night Rider Offer',    desc: '25% off on overnight sleeper bookings',         discount: 25,  type: 'percent', badge: 'LIMITED',   badgeColor: '#3b82f6', minFare: 0,   category: 'seasonal' },
  { code: 'STUDENT150',  title: 'Student Special',      desc: '₹150 off for verified students',                discount: 150, type: 'flat',    badge: 'EXCLUSIVE', badgeColor: '#8b5cf6', minFare: 0,   category: 'exclusive' },
  { code: 'MONSOON50',   title: 'Monsoon Saver',        desc: '₹50 off on all routes during monsoon season',   discount: 50,  type: 'flat',    badge: 'SEASONAL',  badgeColor: '#0891b2', minFare: 0,   category: 'seasonal' },
  { code: 'SUPERFAST10', title: 'Superfast 10% Off',    desc: '10% discount on express / premium buses',       discount: 10,  type: 'percent', badge: '',          badgeColor: '#f97316', minFare: 0,   category: 'festive' },
];

export const DEMO_USERS = [
  { id: 'C001', name: 'Rahul Sharma', email: 'rahul@gmail.com', password: 'Rahul@123', role: 'CUSTOMER', phone: '9876543210' },
  { id: 'C002', name: 'Priya Sharma', email: 'priya@gmail.com', password: 'Priya@123', role: 'CUSTOMER', phone: '9876543211' },
  { id: 'C003', name: 'Ravi Kumar',   email: 'ravi@gmail.com',  password: 'Ravi@123',  role: 'CUSTOMER', phone: '9876543212' },
  { id: 'C004', name: 'Arjun Singh',  email: 'arjun@gmail.com', password: 'Arjun@123', role: 'CUSTOMER', phone: '9876543213' },
];

export const INITIAL_NOTIFICATIONS = [
  {
    id: 1,
    title: 'Booking Confirmed!',
    desc: 'Your journey from Hyderabad to Chennai is scheduled for tomorrow.',
    time: '10m ago',
    type: 'success',
    read: false,
  },
  {
    id: 2,
    title: 'New Promo Code Available',
    desc: 'Use WEEKEND150 to get ₹150 discount on your weekend trips.',
    time: '2h ago',
    type: 'info',
    read: false,
  },
  {
    id: 3,
    title: 'Refund Processed',
    desc: 'Your refund of ₹500 for BK001 has been initiated to your source account.',
    time: '1d ago',
    type: 'warn',
    read: true,
  },
];
