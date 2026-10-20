# Smart Blood Bank Management Platform

A clinical-grade, responsive healthcare SaaS frontend and operations platform connecting hospitals, blood banks, clinicians, patients, and voluntary donors.

Built for university capstone & clinical healthcare management with **React, Vite, TypeScript, Tailwind CSS, Supabase, Lucide React, and Recharts**.

---

## 🎨 Visual Identity & Medical Design Tokens

- **Medical Red:** `#C62828` (Primary brand accent, blood highlights, critical alerts)
- **Dark Navy:** `#17243A` (Sidebar, primary typography, elevated containers)
- **Background Surface:** `#F6F8FB` (Subtle hospital dashboard background)
- **Cards & Tables:** `#FFFFFF` with subtle `#E2E8F0` borders
- **Typography:** Inter (`sans-serif`) with clear visual hierarchy

---

## 🛡️ The 5 User Roles & Permissions

The application includes a centralized role configuration (`src/routes/rolePermissions.ts`) and route guard (`src/routes/ProtectedRoute.tsx`):

1. **Admin (`admin`)**:
   - Oversees hospital network verification, physician approvals, and regional inventory audits.
   - Access to `/dashboard`, `/records`, `/requests`, `/analytics`, `/donors`, `/notifications`, `/settings`.

2. **Hospital Blood Bank (`hospital`)**:
   - Manages institutional cold-chain blood units, expiration rotation, requests, donor outreach, and inter-hospital emergency finding.
   - Access to `/dashboard`, `/inventory`, `/requests`, `/emergency`, `/analytics`, `/medical-reports`, `/donors`, `/centers`, `/notifications`, `/settings`.

3. **Doctor / Clinician (`doctor`)**:
   - Submits prioritized transfusion requests, reviews diagnostic lab reports, and tracks patient blood reservations.
   - Access to `/dashboard`, `/records`, `/requests`, `/medical-reports`, `/emergency`, `/notifications`, `/settings`.

4. **Patient (`patient`)**:
   - Tracks personal transfusion requests with an interactive audit timeline, views verified blood type records, and finds nearby centers.
   - Access to `/dashboard`, `/requests`, `/medical-reports`, `/centers`, `/notifications`, `/settings`.

5. **Voluntary Donor (`donor`)**:
   - Manages consent for emergency shortage SMS callouts, views donation intervals (56-day rule), tracks verified blood group, and schedules donations.
   - Access to `/dashboard`, `/donors`, `/centers`, `/notifications`, `/settings`.

> **Note on Verification:** Doctor and Hospital accounts undergo a **Pending Approval** verification state upon registration. Operational actions remain locked until authorized. Public registration for administrators is strictly prohibited.

---

## 📑 12 Primary Page Groups

| # | Page Group | Route | Primary Roles & Access |
|---|------------|-------|------------------------|
| 1 | **Public Landing Page** | `/` | All visitors (Hero, Features, Workflow, Safety) |
| 2 | **Donation Centers** | `/centers`, `/centers/:id` | All visitors & Donors (Facility profile, booking modal) |
| 3 | **Authentication** | `/login`, `/register`, `/forgot-password`, `/access-denied` | Public & Authenticated users |
| 4 | **Role-Based Dashboard** | `/dashboard` | Customized views for Admin, Hospital, Doctor, Patient, Donor |
| 5 | **Records Management** | `/records` | Admin, Hospital, Doctor (Patients, Donors, Hospitals, Approvals) |
| 6 | **Blood Inventory** | `/inventory` | Hospital only (Cold-chain units, shelf life, low-stock alerts) |
| 7 | **Blood Requests** | `/requests` | Admin, Hospital, Doctor, Patient (Priority triage & status timeline) |
| 8 | **Emergency Blood Finder** | `/emergency` | Hospital, Doctor (Cross-network sourcing, unknown blood group protocol) |
| 9 | **Analytics & AI** | `/analytics` | Admin, Hospital (Overview, Demand, Inventory, Donations, AI Forecast) |
| 10 | **Medical Reports** | `/medical-reports` | Doctor, Hospital, Patient (Manual entry, OCR file upload review) |
| 11 | **Donor Management** | `/donors` | Admin, Hospital, Donor (4-stage eligibility, dispatch callouts) |
| 12 | **Profile & Settings** | `/settings` | All authenticated users (Contact, security, donor consent) |

---

## ⚡ Interactive Role Switcher in Demo Mode

When Supabase environment variables are unconfigured or when `VITE_DEMO_MODE=true` is set:
- The top header provides an **instant role switcher bar** (`Admin`, `Hospital`, `Doctor`, `Patient`, `Donor`).
- Clicking any role immediately switches the dashboard view, navigation links, and permissions without requiring relogging, making academic evaluation and testing seamless.

---

## 🗄️ Supabase Integration Guide

To connect the application to a real Supabase database:

1. Copy `.env.example` to `.env`:
   ```bash
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-actual-anon-key
   VITE_DEMO_MODE=false
   ```
2. Enable Row-Level Security (RLS) on your tables:
   - `profiles`
   - `donor_profiles`
   - `hospitals`
   - `blood_units`
   - `blood_requests`
   - `donations`
   - `medical_reports`
   - `notifications`

---

## 🤖 AI Microservice Integration Boundary

The platform defines explicit typed interfaces in `src/services/aiService.ts`:
- `GET /api/ai/forecast` — Returns XGBoost 14-day demand predictions with MAE and RMSE metrics.
- `POST /api/ai/analyze-report` — Optical character recognition pipeline for extracting numerical lab parameters.
- `POST /api/ai/match-donors` — Transparent rule-based donor ranking.

When `VITE_AI_API_URL` is omitted, the app displays a clear notification that the AI Gateway is in demo fallback mode rather than fabricating real connections.

---

## 🚀 Running The Application

### Install Dependencies
```bash
npm install --legacy-peer-deps
```

### Start Development Server
```bash
npm run dev
```

### Production Build & Typecheck
```bash
npm run build
```
