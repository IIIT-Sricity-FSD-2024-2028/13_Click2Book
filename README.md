# 🎫 Click2Book — Your Seat is Just a Click Away

> A full-stack online ticket booking platform built for IIIT Sri City's Full Stack Development course (2024–2028).

![NestJS](https://img.shields.io/badge/Backend-NestJS-E0234E?logo=nestjs&logoColor=white)
![MongoDB](https://img.shields.io/badge/Database-MongoDB-47A248?logo=mongodb&logoColor=white)
![HTML5](https://img.shields.io/badge/Frontend-HTML5%20%2F%20CSS3%20%2F%20JS-E34F26?logo=html5&logoColor=white)
![License](https://img.shields.io/badge/License-Academic-blue)
![Status](https://img.shields.io/badge/Status-Evaluation%20Ready-brightgreen)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [System Architecture](#system-architecture)
- [Actors & Roles](#actors--roles)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [API Overview](#api-overview)
- [Security](#security)
- [Team](#team)

---

## Overview

**Click2Book** is a real-time online ticket reservation system that eliminates the need for physical ticket counters. It supports multi-modal booking (bus, train), live seat availability, cancellations, and a full administrative backend — all accessible through role-specific web portals.

---

## Features

| Feature | Description |
|---|---|
| 🔍 **Real-Time Search** | Search trips by source, destination, date, and seat class |
| 🪑 **Seat Management** | Live seat availability with visual seat map |
| 🎟️ **Instant Booking** | Immediate booking confirmation with reference ID |
| ❌ **Cancellations** | Policy-based cancellation with refund eligibility computation |
| 🛡️ **Secure Auth** | JWT-based authentication with session invalidation |
| 📊 **Revenue Splitting** | Configurable platform/provider fee distribution with ledger |
| 🚨 **Emergency Alerts** | In-trip emergency reporting and tracking |
| 🔍 **Lost & Found** | Passenger lost-item reporting tied to trip records |
| 🎧 **Support Tickets** | Categorized support ticketing with SLA tracking and escalation |
| 📸 **Profile Uploads** | Secure profile picture upload with file validation |
| 📈 **Admin Dashboard** | Revenue analytics, booking stats, and user management |
| 🪵 **Audit Logging** | Winston-based structured logging with request ID tracing |

---

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Browser Clients                       │
│  Landing Page │ Customer │ Provider │ Admin │ Support    │
└──────────────────────────┬──────────────────────────────┘
                           │ HTTPS / REST
┌──────────────────────────▼──────────────────────────────┐
│               NestJS Backend (REST API)                  │
│                                                          │
│  Auth │ Booking │ Trip │ Schedule │ Vehicle │ Seat       │
│  Cancellation │ Emergency │ LostFound │ Support          │
│  Ledger │ RevenueSplit │ Payouts │ Tracking │ Review     │
│                                                          │
│  Cross-cutting: Logging · Rate Limiting · CORS · Helmet  │
└──────────────────────────┬──────────────────────────────┘
                           │ Mongoose ODM
┌──────────────────────────▼──────────────────────────────┐
│                    MongoDB Atlas                         │
└─────────────────────────────────────────────────────────┘
```

---

## Actors & Roles

### 👤 Customer
Registers, logs in, and manages personal reservations. Can search available trips, view real-time seat availability, make bookings, download confirmations, cancel tickets, submit support requests, and report lost items.

### 🛠️ Administrator
Manages the entire platform through the admin dashboard. Controls users, services, pricing, schedules, and route configurations. Monitors booking and financial analytics, approves service providers, and handles system-level operations.

### 🎧 Customer Support Agent
Logs in to access customer profiles and booking histories. Handles support tickets, resolves complaints, tracks SLA adherence, escalates complex issues to admins, and maintains service logs.

### 🚌 Service Provider
Manages the transport services offered on the platform. Updates availability and schedules, monitors seat utilisation, views revenue split and payout information, and communicates with admins for approvals.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Backend Framework** | [NestJS](https://nestjs.com/) (TypeScript) |
| **Database** | MongoDB with Mongoose ODM |
| **Authentication** | JWT (JSON Web Tokens) |
| **Validation** | class-validator + class-transformer |
| **Security** | Helmet, @nestjs/throttler, CORS |
| **Logging** | Winston + custom HTTP middleware |
| **File Upload** | Multer with MIME-type validation |
| **Frontend** | Vanilla HTML5, CSS3, JavaScript |
| **API Docs** | Swagger / OpenAPI |
| **Testing** | Jest (unit) + Supertest (e2e) |

---

## Project Structure

```
13_Click2Book/
├── BACKEND/
│   ├── 01-front-end/          # Team-uploaded frontend pages
│   ├── 02-back-end/           # Team-uploaded backend source
│   └── 03-Videos/             # Demo and walkthrough videos
│
├── back-end/                  # Primary evaluated backend
│   └── src/
│       ├── common/            # Logging, middleware, filters, utils
│       └── modules/           # Feature modules
│           ├── auth/          # Authentication & session management
│           ├── booking/       # Booking lifecycle
│           ├── cancellation/  # Refund & cancellation logic
│           ├── emergency/     # In-trip emergency reporting
│           ├── ledger/        # Transaction ledger
│           ├── lost-found/    # Lost item reporting
│           ├── payouts/       # Provider payout scheduling
│           ├── provider/      # Service provider management
│           ├── revenue-split/ # Platform/provider fee config
│           ├── schedule/      # Trip schedule management
│           ├── support-ticket/# Categorized support ticketing
│           ├── trip/          # Trip management
│           ├── tracking/      # Real-time trip tracking
│           └── vehicle/       # Vehicle & seat management
│
├── front-end/                 # Primary evaluated frontend
│   ├── landing-page/          # Public-facing landing pages
│   ├── customer/              # Customer portal
│   ├── serviceprovider/       # Service provider portal
│   ├── admin/                 # Admin dashboard
│   ├── supportagent/          # Support agent portal
│   └── TrainInterface/        # Train-specific booking UI
│
├── Database/                  # Schema definitions & ER diagrams
├── Figma Designs/             # UI/UX design files
├── reports/                   # FFSD audit and evaluation reports
├── definitions.yml            # Domain entity definitions
├── SRS.pdf                    # Software Requirements Specification
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js ≥ 18.x
- npm ≥ 9.x
- MongoDB (local or Atlas URI)

### Backend Setup

```bash
cd back-end
npm install
```

Create a `.env` file in `back-end/`:

```env
MONGO_URI=mongodb://localhost:27017/click2book
JWT_SECRET=your_jwt_secret_here
PORT=3000
```

```bash
# Run in development mode
npm run start:dev

# Run unit tests
npm run test

# Run e2e tests
npm run test:e2e
```

### Frontend Setup

Open any HTML file directly in the browser, or serve with a static server:

```bash
npx serve front-end
```

Then navigate to `http://localhost:3000`.

---

## API Overview

The backend exposes RESTful endpoints grouped by module:

| Module | Base Route |
|---|---|
| Auth | `/api/auth` |
| Booking | `/api/bookings` |
| Trip | `/api/trips` |
| Schedule | `/api/schedules` |
| Vehicle | `/api/vehicles` |
| Cancellation | `/api/cancellations` |
| Provider | `/api/providers` |
| Support Ticket | `/api/support-tickets` |
| Revenue Split | `/api/revenue-split` |
| Payouts | `/api/payouts` |
| Ledger | `/api/ledger` |
| Emergency | `/api/emergency` |
| Lost & Found | `/api/lost-found` |
| Tracking | `/api/tracking` |

Full Swagger documentation is available at `/api/docs` when running the server.

---

## Security

- **Helmet** — Sets security-related HTTP headers
- **Rate Limiting** — 60 requests/minute per IP via `@nestjs/throttler`
- **CORS** — Configured origin whitelist for API access
- **JWT Auth** — Token-based auth with expiry and session invalidation
- **File Validation** — MIME-type and size checks on all uploads
- **Input Validation** — DTO-level validation on all incoming payloads

---

## Team

**Group 13 — IIIT Sri City Full Stack Development (2024–2028)**

| Name | Role |
|---|---|
| Sarath Chandra P | Backend & Security Lead |
| *(Team Members)* | Frontend & Integration |

> Course: Full Stack Development (FFSD)  
> Institution: IIIT Sri City  
> Academic Year: 2024–2028
