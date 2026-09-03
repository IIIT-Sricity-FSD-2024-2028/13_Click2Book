# 🎫 Click2Book — Online Ticket Booking Platform

**Click2Book** is a real-time online ticket reservation system for multi-modal travel (bus and train). It features live seat availability, instant booking, policy-based cancellations, and dedicated portals for customers, service providers, support agents, and administrators.

---

## 🚀 Key Features

- **Search & Booking**: Real-time trip search by source, destination, date, and seat class.
- **Live Seat Map**: Interactive seat selection and real-time availability tracking.
- **Cancellations & Refunds**: Policy-driven ticket cancellations with automated refund processing.
- **User Portals**: Dedicated interfaces for Customers, Service Providers, Support Agents, and Admins.
- **Security & Logging**: Token-based JWT authentication, rate limiting, and structured logging.

---

## 🛠️ Tech Stack

- **Backend**: NestJS (TypeScript), MongoDB with Mongoose ODM
- **Frontend**: Vanilla HTML5, CSS3, JavaScript
- **Security**: JWT Authentication, Helmet, Throttling (Rate Limiting), CORS
- **Testing & Docs**: Jest, Supertest, Swagger API Docs (`/api/docs`)

---

## 📁 Project Structure

```text
FDFED/
├── back-end/                  # NestJS backend REST API
├── front-end/                 # HTML/CSS/JS frontend portals
│   ├── landing-page/          # Public landing page
│   ├── customer/              # Customer portal
│   ├── serviceprovider/       # Service provider portal
│   ├── admin/                 # Admin dashboard
│   └── supportagent/          # Customer support portal
├── Database/                  # Schema definitions & ER diagrams
├── Figma Designs/             # UI/UX design files
├── reports/                   # Audit and evaluation reports
├── definitions.yml            # Domain entity definitions
└── SRS.pdf                    # Software Requirements Specification
```

---

## ⚙️ Getting Started

### Prerequisites
- Node.js ≥ 18.x
- MongoDB (Local or Atlas instance)

### 1. Backend Setup
```bash
cd back-end
npm install
```

Create a `.env` file in `back-end/`:
```env
MONGO_URI=mongodb://localhost:27017/click2book
JWT_SECRET=your_jwt_secret
PORT=3000
```

Start the development server:
```bash
npm run start:dev
```

### 2. Frontend Setup
Open any page directly from the `front-end/` directory in your web browser, or serve static files:
```bash
npx serve front-end
```
