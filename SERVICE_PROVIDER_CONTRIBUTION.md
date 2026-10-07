# 🎫 Click2Book — React Implementation Lab Submission
## Individual Contribution Report: Service Provider Module

**Course:** Full Stack Development (FFSD) — Lab Evaluation  
**Project:** Click2Book — Multi-Modal Online Ticket Reservation System  
**Role / Module:** Service Provider Lead Developer  
**Technology Stack:** React 19, Vite, Vanilla CSS Design System, Lucide Icons, REST API / LocalStorage  

---

## 📌 Executive Summary & Contribution Statement

For today's lab session, I developed and delivered the **React implementation of the Service Provider Portal** for the Click2Book reservation platform. Previously, our project frontend was built using static HTML/CSS/JS files connected to a NestJS backend. 

My individual contribution converts the entire Service Provider operations workflow into a modern, component-driven, state-reactive single-page application (SPA) with **8 core operational modules**:
1. **Executive Fleet Dashboard**: Live KPI cards, today's schedule table with animated occupancy bars, and SOS emergency alert broadcasting.
2. **Trip & Schedule Management**: Full CRUD scheduling engine with multi-criteria search, status filters (Active, Scheduled, Full), and departure controls.
3. **Add Schedule Modal Engine**: Interactive trip creator with vehicle assignment, route hubs, timings, seat capacity, base fare, and onboard amenities selector.
4. **Interactive 2x2 Bus Cabin Seat Map**: Visual luxury coach layout (driver cabin, aisle, seat rows 1–10) with real-time seat states (*Available*, *Booked*, *Blocked*), seat blocking/unblocking, and a synchronized passenger manifest inspector.
5. **Trip Confirmation & Boarding Operations**: Mandatory 5-point pre-departure safety checklist and boarding desk with live passenger verification (*Confirmed* → *Boarded* → *No-Show*).
6. **Revenue & 90/10 Split Ledger**: Direct integration with the Click2Book NestJS financial rules (90% net operator earnings, 10% platform commission), payout withdrawal requests, and historical bank transfer logs.
7. **Lost & Found Registry**: Article recovery workflow (*Reported* → *In Custody* → *Claimed* → *Returned*) with item tagging and custody locker tracking.
8. **Operator Profile & Fleet Registry**: Company credentials for "Kiran Travels", vehicle registry (Volvo B12, Scania AC, Sleeper), and verified HDFC bank settlement configuration.

---

## 📂 Source Code Files Worked On

All files were created within the project directory `frontend-react/`:

| File | Purpose / Responsibility | Key Technologies |
|---|---|---|
| [`src/App.jsx`](frontend-react/src/App.jsx) | Main app orchestrator, tab router, modal/toast managers, centralized state | React Hooks (`useState`, `useEffect`) |
| [`src/components/Sidebar.jsx`](frontend-react/src/components/Sidebar.jsx) | Dark-themed collapsible sidebar navigation with role badge & status | React, Lucide Icons, Modern CSS |
| [`src/components/Header.jsx`](frontend-react/src/components/Header.jsx) | Top bar with real-time clock, notification bell counter, and quick CTA | React, Dynamic Timers, Lucide |
| [`src/components/Dashboard.jsx`](frontend-react/src/components/Dashboard.jsx) | Executive KPI metrics, occupancy progress bars, today's departures | Responsive Grid, CSS Meters |
| [`src/components/ManageSchedules.jsx`](frontend-react/src/components/ManageSchedules.jsx) | Search, filter, edit, delete schedules; direct link to seat maps | Filter pipelines, Array methods |
| [`src/components/AddScheduleModal.jsx`](frontend-react/src/components/AddScheduleModal.jsx) | Modal dialog for creating new trips with field validation & amenities | Controlled Forms, Checkboxes |
| [`src/components/SeatManagement.jsx`](frontend-react/src/components/SeatManagement.jsx) | Interactive 2x2 bus cabin map, seat inspector card, passenger manifest | Dynamic Cabin CSS, Seat State Engine |
| [`src/components/ConfirmTrips.jsx`](frontend-react/src/components/ConfirmTrips.jsx) | Pre-departure safety checklist and boarding verifier | State Checklists, Action Handlers |
| [`src/components/RevenueLedger.jsx`](frontend-react/src/components/RevenueLedger.jsx) | Financial ledger, 90/10 split computation, payout withdrawal modal | Financial calculations, Modals |
| [`src/components/LostFound.jsx`](frontend-react/src/components/LostFound.jsx) | Article recovery tracker with logging modal and status workflow | Form Handling, Status Dropdowns |
| [`src/components/Settings.jsx`](frontend-react/src/components/Settings.jsx) | Operator profile edit, fleet vehicle addition, bank payout credentials | Form State, Multi-row Tables |
| [`src/components/NotificationDrawer.jsx`](frontend-react/src/components/NotificationDrawer.jsx) | Slide-over notification panel with unread badges & clear all | Slide Animations, Badges |
| [`src/components/Toast.jsx`](frontend-react/src/components/Toast.jsx) | Global toast feedback system for CRUD operations | Auto-dismissing timer alerts |
| [`src/services/api.js`](frontend-react/src/services/api.js) | Resilient API layer connecting to NestJS with localStorage fallback | Async/Await, Web Storage API |
| [`src/services/mockData.js`](frontend-react/src/services/mockData.js) | Realistic seed dataset for Kiran Travels, 5 routes, 140+ passengers | Seed Data Schema |
| [`src/index.css`](frontend-react/src/index.css) | Complete custom design system with Plus Jakarta Sans and CSS variables | Vanilla CSS Design Tokens |
| [`vite.config.js`](frontend-react/vite.config.js) | Vite dev server config with `/api` reverse proxy to NestJS backend | Vite Configuration |

---

## 📸 Screenshots Gallery of Individual Contribution

The following screenshots were captured directly from the running React application (`http://localhost:5173`) and are saved in the project under `screenshots/`:

### 1. Executive Fleet Dashboard
*Shows real-time KPI stat cards (Active Fleet: 3, Passengers: 136, Scheduled: 5, Net Earnings: ₹1,17,360, Occupancy: 67%), welcome banner with quick actions, and Today's Fleet Occupancy table.*  
📁 File: `screenshots/01_dashboard_overview.png`

---

### 2. Real-Time Notification Center
*Shows slide-over notification drawer displaying unread bookings, seat capacity saturation alerts (100% full), and trip dispatch confirmations.*  
📁 File: `screenshots/02_notifications_drawer.png`

---

### 3. Trip & Schedule Management
*Shows the full schedules registry with multi-column filtering, search bar, base fare breakdown, seat occupancy bars, and direct Seat Map triggers.*  
📁 File: `screenshots/03_manage_schedules.png`

---

### 4. Publish New Trip Schedule (Modal Dialog)
*Shows the new trip modal with vehicle assignment, origin/destination hubs, timings, capacity, base fare, and interactive onboard amenities checklist.*  
📁 File: `screenshots/04_add_schedule_modal.png`

---

### 5. Visual 2x2 Bus Cabin Seat Map & Passenger Manifest
*Shows the visual bus cabin layout with driver cabin, entrance door, color-coded seats (Available, Booked, Hold), active seat inspector for Seat 1A (Arjun Swaminathan), and passenger manifest below.*  
📁 File: `screenshots/05_seat_management_cabin.png`

---

### 6. Trip Dispatch Desk & Passenger Boarding Verification
*Shows the pre-departure safety checklist (Vehicle Fitness, Driver Sobriety, First Aid, Luggage Tagging, GPS) alongside the live boarding desk with Boarded / No-Show controls.*  
📁 File: `screenshots/06_confirm_trips_dispatch.png`

---

### 7. Revenue Split & Operator Ledger
*Shows the 90/10 financial split computation conforming to Click2Book's NestJS backend specification, available withdrawable balance, payout requests, and transaction ledger.*  
📁 File: `screenshots/07_revenue_split_ledger.png`

---

### 8. Lost & Found Recovery Board
*Shows passenger articles recovered from operator buses, safe custody locker locations, notes, and the status transition workflow.*  
📁 File: `screenshots/08_lost_and_found.png`

---

### 9. Operator Credentials, Fleet Registry & Bank Details
*Shows Kiran Travels' certified commercial license, registered fleet buses (Volvo, Scania, BharatBenz), and verified HDFC Bank settlement configuration.*  
📁 File: `screenshots/09_fleet_and_settings.png`

---

## 🚀 How to Run and Evaluate the React App

To inspect and test this implementation locally:

```bash
# 1. Navigate to the React frontend directory
cd evaluation_1/FFSD_Final/frontend-react

# 2. Install dependencies (if not already installed)
npm install

# 3. Start the Vite development server
npm run dev

# 4. Open in browser
http://localhost:5173
```

All data persists in `localStorage`, allowing complete interactive testing (adding schedules, blocking seats, boarding passengers, requesting payouts) with zero configuration required.
