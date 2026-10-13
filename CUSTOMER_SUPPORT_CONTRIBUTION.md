# 🎫 Click2Book — React Implementation Lab Submission
## Individual Contribution Report: Customer Support Module (Support Agent)

**Course:** Full Stack Development (FFSD) — Lab Evaluation  
**Project:** Click2Book — Multi-Modal Online Ticket Reservation System  
**Role / Module:** Customer Support Lead Developer  
**Technology Stack:** React 19, Vite, Vanilla CSS Design System, Lucide Icons, REST API / LocalStorage  

---

## 📌 Executive Summary & Contribution Statement

For this lab evaluation, I developed and delivered the complete **React conversion of the Customer Support Actor Portal (`supportagent`)** for the Click2Book reservation platform. Previously, our project frontend was built using static HTML/CSS/JS files connected to a NestJS backend.

My contribution converts the entire Customer Support operations workflow into a modern, component-driven, state-reactive single-page application (SPA) built with **React 19**, while **strictly preserving all existing backend integrations, business logic, financial ledger deductions, and portal functionality**:

1. **Agent Authentication & Session Guard**: Credential authentication for assigned support agents (`SUPPORT001`, `SUPPORT002`, `SUPPORT003`), show/hide password toggle, "remember me" persistence, session guard across routes, and smooth redirects.
2. **Executive Support Operations Dashboard**: Real-time KPI stat cards (*Open Tickets*, *In Progress*, *Resolved Today*, *Active Escalations*), 15-second background auto-refresh, live API connectivity indicator pill (🟢 Live API / 🟡 Offline DB), and today's query queue.
3. **Comprehensive Support Ticket Management Desk**: Multi-criteria search (by Ticket ID, Customer Name, Booking ID, or Subject), priority filters (*High*, *Medium*, *Low*), status filters (*Open*, *In Progress*, *Resolved*, *Escalated*), ticket detail inspection modal, and one-click "Resolve" action engine with toast alerts.
4. **Critical Escalations & Supervisor Desk**: Prominent escalation alert banner, supervisor intervention queue for service disruptions or wrong coach dispatches, "De-escalate & Resolve" workflow, and historical resolution audit log.
5. **Ticket Cost Impact & Booking Ledger Engine**: Direct integration with Click2Book's NestJS financial rules (`/api/support-ticket`), summary metrics (*Total Tickets*, *Open Liabilities*, *Total Deductions in ₹*, *Open Deductions in ₹*), category & status filters, and interactive form to raise manual ledger tickets against Booking IDs.
6. **Customer Directory & Profile Lookup**: Instant passenger record search (name, email, phone, age, gender, city hub, lifetime bookings count, and active ticket history) providing support agents with immediate context during calls.
7. **Refunds Processing Desk**: Policy-driven passenger ticket refund workflow (*Requested* → *Processing* → *Completed* → *Rejected*), total disbursed amount calculations, and dispute rejection notes.
8. **Slide-over Notification Drawer & Toast Engine**: Bell counter trigger, categorized alert drawer (*Urgent*, *Warning*, *Info*, *Success*), and auto-dismissing toast notifications for all CRUD operations.

---

## 📂 Source Code Files Developed

All React source files are located in `front-end/supportagent/`:

| File | Purpose / Responsibility | Key Technologies |
|---|---|---|
| [`src/App.jsx`](front-end/supportagent/src/App.jsx) | Root state orchestrator, tab router, modal & toast managers, session state | React Hooks (`useState`, `useEffect`, `useCallback`) |
| [`src/components/Sidebar.jsx`](front-end/supportagent/src/components/Sidebar.jsx) | Collapsible dark navy sidebar with agent profile, active tab indicator, badges | React, Lucide Icons, Modern CSS |
| [`src/components/Header.jsx`](front-end/supportagent/src/components/Header.jsx) | Top bar with dynamic view titles, real-time clock, notification counter, live sync badge | React, Dynamic Timers, Lucide |
| [`src/components/Dashboard.jsx`](front-end/supportagent/src/components/Dashboard.jsx) | Executive KPI stat cards, operational quick cards, recent tickets table | Responsive Grid, State Badges |
| [`src/components/Tickets.jsx`](front-end/supportagent/src/components/Tickets.jsx) | Real-time search, multi-criteria filtering, ticket inspection & resolve controls | Filter Pipelines, Controlled Inputs |
| [`src/components/EscalatedIssues.jsx`](front-end/supportagent/src/components/EscalatedIssues.jsx) | Escalation alert banner, critical issues queue, supervisor de-escalate action | State Handlers, Audit Tables |
| [`src/components/CostImpact.jsx`](front-end/supportagent/src/components/CostImpact.jsx) | Support cost ledger tracking, paise-to-rupees calculation, manual ticket creator | Financial Computations, Controlled Form |
| [`src/components/CustomerLookup.jsx`](front-end/supportagent/src/components/CustomerLookup.jsx) | Searchable passenger directory, demographics, lifetime bookings & active claims | Search Filters, Profile Cards |
| [`src/components/Refunds.jsx`](front-end/supportagent/src/components/Refunds.jsx) | Refund processing desk, status state transitions, total payout computation | State Workflow, Action Buttons |
| [`src/components/NotificationDrawer.jsx`](front-end/supportagent/src/components/NotificationDrawer.jsx) | Slide-over notification panel with categorized badges and mark-all-read | Slide Animations, Badges |
| [`src/components/Toast.jsx`](front-end/supportagent/src/components/Toast.jsx) | Global toast feedback alert system with auto-dismiss | CSS Keyframe Animations |
| [`src/components/Login.jsx`](front-end/supportagent/src/components/Login.jsx) | Dedicated agent login screen with validation, show/hide password, and demo logins | Form Validation, SessionStorage |
| [`src/components/TicketDetailModal.jsx`](front-end/supportagent/src/components/TicketDetailModal.jsx) | Modal dialog for inspecting customer ticket details and writing resolution remarks | Backdrop Filter, Controlled Modals |
| [`src/services/api.js`](front-end/supportagent/src/services/api.js) | Resilient API layer connecting to NestJS backend with localStorage fallback | Async/Await, Fetch API, LocalStorage |
| [`src/services/mockData.js`](front-end/supportagent/src/services/mockData.js) | Seed dataset for support agents, tickets, escalations, customers, and refunds | Schema Models |
| [`src/index.css`](front-end/supportagent/src/index.css) | Custom design system with modern tokens, glassmorphism, and responsive layouts | Vanilla CSS Design Tokens |
| [`vite.config.js`](front-end/supportagent/vite.config.js) | Vite development server config with `/api` reverse proxy to NestJS backend | Vite Configuration |
| [`package.json`](front-end/supportagent/package.json) | NPM configuration with React 19, Lucide, Vite, and build scripts | NPM Scripts |
| [`index.html`](front-end/supportagent/index.html) | Main HTML entry point mounting the React root (`<div id="root">`) | React 19 SPA Entry |

---

## 🛡️ Backwards Compatibility & Non-Disruption Guarantee

1. **Original Functionality Preserved 100%**:
   - All login accounts (`SUPPORT001`, `SUPPORT002`, `SUPPORT003`), password rules, and session keys (`c2b_loggedIn`, `c2b_userName`, `c2b_role`) remain identical.
   - All API endpoints (`/api/support-requests`, `/api/support-ticket`, `/api/support-ticket/:id/resolve`) remain integrated with the same headers and payloads.
   - The ticket resolution workflow and cost deduction calculations match the backend rules.
2. **All Existing URLs and Links Maintained**:
   - `login.html`, `tickets.html`, `escalated.html`, and `revenue-impact.html` seamlessly mount the React application on their respective views.
   - Links from `staff-access.html` and `landing-page/login.html` navigate smoothly into the React support portal without breaking.
3. **No Remaining Files Disturbed**:
   - The other actor portals (`customer`, `serviceprovider`, `admin`, `landing-page`, `TrainInterface`) and `back-end` were left untouched.
   - The legacy static files were safely backed up into `front-end/supportagent/legacy-static/`.

---

## 🚀 How to Run and Evaluate the React App

### Option A: Via Vite Development Server (Recommended for Evaluation)
```bash
# 1. Navigate to the supportagent directory
cd front-end/supportagent

# 2. Start the Vite development server
npm run dev

# 3. Open in browser:
http://localhost:5173
```

### Option B: Via Multi-Portal Server (Port 3005)
```bash
# From the project root:
node tools/start-portals.js

# Open the Customer Support Portal:
http://localhost:3005/login.html
# or
http://localhost:3005/index.html
```

### Option C: Via Static Browser or `npx serve`
```bash
# Serve static frontend:
npx serve front-end

# Open directly:
http://localhost:3000/supportagent/index.html
```
