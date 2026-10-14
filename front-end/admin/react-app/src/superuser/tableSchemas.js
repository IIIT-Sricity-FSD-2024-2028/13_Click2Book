// Admin has full access to every table in the shared localStorage DB.
// `stats(rows)` receives the current rows of the table being viewed.

const count = (rows, field, value) => rows.filter((row) => row[field] === value).length;

export const TABLE_SCHEMAS = {
  bookings: {
    label: 'Bookings', subtitle: 'Manage BOOKING records',
    dbKey: 'bookings', pkField: 'booking_id',
    columns: ['booking_id', 'customer_id', 'trip_id', 'offer_id', 'booking_date', 'booking_status', 'irctc_id'],
    fields: [
      { key: 'booking_id', label: 'Booking ID', type: 'text', required: true },
      { key: 'customer_id', label: 'Customer ID', type: 'text', required: true },
      { key: 'trip_id', label: 'Trip ID', type: 'text', required: true },
      { key: 'offer_id', label: 'Offer ID', type: 'text', required: false },
      { key: 'booking_date', label: 'Booking Date', type: 'date', required: true },
      { key: 'booking_status', label: 'Status', type: 'select', required: true, options: ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'] },
      { key: 'irctc_id', label: 'IRCTC ID', type: 'text', required: false },
    ],
    stats: (rows) => [
      { label: 'Total', value: rows.length, cls: 'accent' },
      { label: 'Confirmed', value: count(rows, 'booking_status', 'CONFIRMED'), cls: 'success' },
      { label: 'Pending', value: count(rows, 'booking_status', 'PENDING'), cls: 'warning' },
      { label: 'Cancelled', value: count(rows, 'booking_status', 'CANCELLED'), cls: 'danger' },
    ],
  },

  customers: {
    label: 'Customers', subtitle: 'Manage CUSTOMER records',
    dbKey: 'customers', pkField: 'customer_id',
    columns: ['customer_id', 'name', 'email', 'age', 'gender', 'phone_number'],
    fields: [
      { key: 'customer_id', label: 'Customer ID', type: 'text', required: true },
      { key: 'name', label: 'Full Name', type: 'text', required: true },
      { key: 'email', label: 'Email', type: 'text', required: true },
      { key: 'password', label: 'Password', type: 'text', required: true },
      { key: 'age', label: 'Age', type: 'number', required: false },
      { key: 'gender', label: 'Gender', type: 'select', required: false, options: ['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'] },
      { key: 'phone_number', label: 'Phone Number', type: 'text', required: false },
    ],
    stats: (rows) => [
      { label: 'Total', value: rows.length, cls: 'accent' },
      { label: 'Male', value: count(rows, 'gender', 'MALE'), cls: 'info' },
      { label: 'Female', value: count(rows, 'gender', 'FEMALE'), cls: 'warning' },
    ],
  },

  admins: {
    label: 'Admins', subtitle: 'Manage ADMIN accounts',
    dbKey: 'admins', pkField: 'admin_id',
    columns: ['admin_id', 'name', 'email'],
    fields: [
      { key: 'admin_id', label: 'Admin ID', type: 'text', required: true },
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'email', label: 'Email', type: 'text', required: true },
      { key: 'password', label: 'Password', type: 'text', required: true },
    ],
    stats: (rows) => [{ label: 'Admins', value: rows.length, cls: 'accent' }],
  },

  serviceProviders: {
    label: 'Service Providers', subtitle: 'Manage SERVICE_PROVIDER records',
    dbKey: 'serviceProviders', pkField: 'provider_id',
    columns: ['provider_id', 'name', 'email'],
    fields: [
      { key: 'provider_id', label: 'Provider ID', type: 'text', required: true },
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'email', label: 'Email', type: 'text', required: true },
      { key: 'password', label: 'Password', type: 'text', required: true },
    ],
    stats: (rows) => [{ label: 'Providers', value: rows.length, cls: 'accent' }],
  },

  customerSupport: {
    label: 'Support Staff', subtitle: 'Manage CUSTOMER_SUPPORT accounts',
    dbKey: 'customerSupport', pkField: 'supporter_id',
    columns: ['supporter_id', 'name', 'email'],
    fields: [
      { key: 'supporter_id', label: 'Supporter ID', type: 'text', required: true },
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'email', label: 'Email', type: 'text', required: true },
      { key: 'password', label: 'Password', type: 'text', required: true },
    ],
    stats: (rows) => [{ label: 'Support Agents', value: rows.length, cls: 'accent' }],
  },

  vehicles: {
    label: 'Vehicles', subtitle: 'Manage VEHICLE records',
    dbKey: 'vehicles', pkField: 'vehicle_id',
    columns: ['vehicle_id', 'provider_id', 'vehicle_number', 'vehicle_type', 'total_seats', 'remaining_seats'],
    fields: [
      { key: 'vehicle_id', label: 'Vehicle ID', type: 'text', required: true },
      { key: 'provider_id', label: 'Provider ID', type: 'text', required: true },
      { key: 'vehicle_number', label: 'Reg. Number', type: 'text', required: true },
      { key: 'vehicle_type', label: 'Type', type: 'select', required: true, options: ['AC', 'Non-AC', 'No preference'] },
      { key: 'total_seats', label: 'Total Seats', type: 'number', required: true },
      { key: 'remaining_seats', label: 'Remaining', type: 'number', required: true },
    ],
    stats: (rows) => [
      { label: 'Total', value: rows.length, cls: 'accent' },
      { label: 'AC', value: count(rows, 'vehicle_type', 'AC'), cls: 'success' },
      { label: 'Non-AC', value: count(rows, 'vehicle_type', 'Non-AC'), cls: 'warning' },
    ],
  },

  routes: {
    label: 'Routes', subtitle: 'Manage ROUTE records',
    dbKey: 'routes', pkField: 'route_id',
    columns: ['route_id', 'source', 'destination', 'distance'],
    fields: [
      { key: 'route_id', label: 'Route ID', type: 'text', required: true },
      { key: 'source', label: 'Source', type: 'text', required: true },
      { key: 'destination', label: 'Destination', type: 'text', required: true },
      { key: 'distance', label: 'Distance (km)', type: 'number', required: true },
    ],
    stats: (rows) => [
      { label: 'Total Routes', value: rows.length, cls: 'accent' },
      { label: 'Longest (km)', value: rows.reduce((max, route) => (route.distance > max ? route.distance : max), 0), cls: 'info' },
    ],
  },

  schedules: {
    label: 'Schedules', subtitle: 'Manage SCHEDULE records',
    dbKey: 'schedules', pkField: 'schedule_id',
    columns: ['schedule_id', 'route_id', 'provider_id', 'departure_time', 'arrival_time', 'journey_date'],
    fields: [
      { key: 'schedule_id', label: 'Schedule ID', type: 'text', required: true },
      { key: 'route_id', label: 'Route ID', type: 'text', required: true },
      { key: 'provider_id', label: 'Provider ID', type: 'text', required: true },
      { key: 'departure_time', label: 'Departure', type: 'time', required: true },
      { key: 'arrival_time', label: 'Arrival', type: 'time', required: true },
      { key: 'journey_date', label: 'Journey Date', type: 'date', required: true },
      { key: 'arrival_time_to_destination', label: 'Dest. Arrival', type: 'time', required: true },
    ],
    stats: (rows) => [{ label: 'Schedules', value: rows.length, cls: 'accent' }],
  },

  trips: {
    label: 'Trips', subtitle: 'Manage TRIP records',
    dbKey: 'trips', pkField: 'trip_id',
    columns: ['trip_id', 'schedule_id', 'vehicle_id', 'trip_status'],
    fields: [
      { key: 'trip_id', label: 'Trip ID', type: 'text', required: true },
      { key: 'schedule_id', label: 'Schedule ID', type: 'text', required: true },
      { key: 'vehicle_id', label: 'Vehicle ID', type: 'text', required: true },
      { key: 'trip_status', label: 'Status', type: 'select', required: true, options: ['SCHEDULED', 'DELAYED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] },
    ],
    stats: (rows) => [
      { label: 'Total', value: rows.length, cls: 'accent' },
      { label: 'Scheduled', value: count(rows, 'trip_status', 'SCHEDULED'), cls: 'info' },
      { label: 'In Progress', value: count(rows, 'trip_status', 'IN_PROGRESS'), cls: 'warning' },
      { label: 'Completed', value: count(rows, 'trip_status', 'COMPLETED'), cls: 'success' },
    ],
  },

  offers: {
    label: 'Offers', subtitle: 'Manage OFFER records',
    dbKey: 'offers', pkField: 'offer_id',
    columns: ['offer_id', 'offer_code', 'discount_percentage', 'start_date', 'end_date', 'status'],
    fields: [
      { key: 'offer_id', label: 'Offer ID', type: 'text', required: true },
      { key: 'provider_id', label: 'Provider ID', type: 'text', required: true },
      { key: 'offer_code', label: 'Offer Code', type: 'text', required: true },
      { key: 'discount_percentage', label: 'Discount %', type: 'number', required: true },
      { key: 'start_date', label: 'Start Date', type: 'date', required: true },
      { key: 'end_date', label: 'End Date', type: 'date', required: true },
      { key: 'status', label: 'Status', type: 'select', required: true, options: ['ACTIVE', 'INACTIVE', 'EXPIRED', 'SUSPENDED'] },
    ],
    stats: (rows) => [
      { label: 'Total', value: rows.length, cls: 'accent' },
      { label: 'Active', value: count(rows, 'status', 'ACTIVE'), cls: 'success' },
      { label: 'Expired', value: count(rows, 'status', 'EXPIRED'), cls: 'danger' },
    ],
  },

  irctcRecords: {
    label: 'IRCTC Records', subtitle: 'Manage IRCTC verification records',
    dbKey: 'irctcRecords', pkField: 'irctc_id',
    columns: ['irctc_id', 'verification_status', 'irctc_username', 'linked_phone_number'],
    fields: [
      { key: 'irctc_id', label: 'IRCTC ID', type: 'text', required: true },
      { key: 'verification_status', label: 'Status', type: 'select', required: true, options: ['VERIFIED', 'IN_PROGRESS', 'FAILED'] },
      { key: 'irctc_username', label: 'IRCTC Username', type: 'text', required: true },
      { key: 'linked_phone_number', label: 'Phone Number', type: 'text', required: true },
    ],
    stats: (rows) => [
      { label: 'Total', value: rows.length, cls: 'accent' },
      { label: 'Verified', value: count(rows, 'verification_status', 'VERIFIED'), cls: 'success' },
      { label: 'In Progress', value: count(rows, 'verification_status', 'IN_PROGRESS'), cls: 'warning' },
      { label: 'Failed', value: count(rows, 'verification_status', 'FAILED'), cls: 'danger' },
    ],
  },

  payments: {
    label: 'Payments', subtitle: 'Manage PAYMENT records',
    dbKey: 'payments', pkField: 'payment_id',
    columns: ['payment_id', 'booking_id', 'amount', 'discount_amount', 'payment_method', 'payment_status', 'payment_date'],
    fields: [
      { key: 'payment_id', label: 'Payment ID', type: 'text', required: true },
      { key: 'booking_id', label: 'Booking ID', type: 'text', required: true },
      { key: 'amount', label: 'Amount (₹)', type: 'number', required: true },
      { key: 'discount_amount', label: 'Discount (₹)', type: 'number', required: false },
      { key: 'payment_method', label: 'Method', type: 'select', required: true, options: ['UPI', 'Net Banking', 'Credit Card', 'Debit Card', 'Cash'] },
      { key: 'payment_status', label: 'Status', type: 'select', required: true, options: ['PENDING', 'SUCCESS', 'FAILED', 'REFUNDED'] },
      { key: 'payment_date', label: 'Date', type: 'date', required: true },
    ],
    stats: (rows) => {
      const revenue = rows.filter((payment) => payment.payment_status === 'SUCCESS').reduce((sum, payment) => sum + payment.amount, 0);
      return [
        { label: 'Total', value: rows.length, cls: 'accent' },
        { label: 'Success', value: count(rows, 'payment_status', 'SUCCESS'), cls: 'success' },
        { label: 'Pending', value: count(rows, 'payment_status', 'PENDING'), cls: 'warning' },
        { label: 'Revenue', value: `₹${revenue.toFixed(0)}`, cls: 'info' },
      ];
    },
  },

  cancellations: {
    label: 'Cancellations', subtitle: 'Manage CANCELLATION records',
    dbKey: 'cancellations', pkField: 'booking_id',
    columns: ['booking_id', 'cancel_date'],
    fields: [
      { key: 'booking_id', label: 'Booking ID', type: 'text', required: true },
      { key: 'cancel_date', label: 'Cancel Date', type: 'date', required: true },
    ],
    stats: (rows) => [{ label: 'Cancellations', value: rows.length, cls: 'danger' }],
  },

  refunds: {
    label: 'Refunds', subtitle: 'Manage REFUND records',
    dbKey: 'refunds', pkField: 'booking_id',
    columns: ['booking_id', 'admin_id', 'refund_amount', 'refund_status', 'refund_date'],
    fields: [
      { key: 'booking_id', label: 'Booking ID', type: 'text', required: true },
      { key: 'admin_id', label: 'Admin ID', type: 'text', required: true },
      { key: 'refund_amount', label: 'Refund (₹)', type: 'number', required: true },
      { key: 'refund_status', label: 'Status', type: 'select', required: true, options: ['REQUESTED', 'PROCESSING', 'COMPLETED', 'REJECTED'] },
      { key: 'refund_date', label: 'Refund Date', type: 'date', required: true },
    ],
    stats: (rows) => [
      { label: 'Total', value: rows.length, cls: 'accent' },
      { label: 'Completed', value: count(rows, 'refund_status', 'COMPLETED'), cls: 'success' },
    ],
  },

  reviews: {
    label: 'Reviews', subtitle: 'Manage REVIEW records',
    dbKey: 'reviews', pkField: 'review_id',
    columns: ['review_id', 'customer_id', 'rating', 'comment', 'review_date'],
    fields: [
      { key: 'review_id', label: 'Review ID', type: 'text', required: true },
      { key: 'customer_id', label: 'Customer ID', type: 'text', required: true },
      { key: 'rating', label: 'Rating (1-5)', type: 'number', required: true },
      { key: 'comment', label: 'Comment', type: 'text', required: false },
      { key: 'review_date', label: 'Date', type: 'date', required: true },
    ],
    stats: (rows) => {
      const average = rows.length ? (rows.reduce((sum, review) => sum + review.rating, 0) / rows.length).toFixed(1) : '—';
      return [
        { label: 'Reviews', value: rows.length, cls: 'accent' },
        { label: 'Avg Rating', value: average, cls: 'success' },
      ];
    },
  },

  supportRequests: {
    label: 'Support Requests', subtitle: 'Manage SUPPORT_REQUEST records',
    dbKey: 'supportRequests', pkField: 'request_id',
    columns: ['request_id', 'customer_id', 'supporter_id', 'status', 'created_date'],
    fields: [
      { key: 'request_id', label: 'Request ID', type: 'text', required: true },
      { key: 'customer_id', label: 'Customer ID', type: 'text', required: true },
      { key: 'supporter_id', label: 'Supporter ID', type: 'text', required: false },
      { key: 'description', label: 'Description', type: 'text', required: false },
      { key: 'status', label: 'Status', type: 'select', required: true, options: ['OPEN', 'RESOLVED'] },
      { key: 'created_date', label: 'Created Date', type: 'date', required: true },
    ],
    stats: (rows) => [
      { label: 'Total', value: rows.length, cls: 'accent' },
      { label: 'Open', value: count(rows, 'status', 'OPEN'), cls: 'warning' },
      { label: 'Resolved', value: count(rows, 'status', 'RESOLVED'), cls: 'success' },
    ],
  },
};

export const DEFAULT_TABLE = 'bookings';
