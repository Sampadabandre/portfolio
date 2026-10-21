# 🛡️ Sampada Bandre Portfolio — Visitor Tracking & Owner Dashboard Setup Guide

This guide explains how your production-grade, privacy-conscious **Visitor Tracking Engine and Owner Dashboard** works, how to configure your persistent database (Supabase), and how to deploy it to Vercel.

---

## 🌟 Architecture Overview

| Component | Location | Responsibility |
| :--- | :--- | :--- |
| **Owner Dashboard UI** | [`index.html#section-owner`](file:///c:/Users/sampada/OneDrive/Desktop/portfolio/index.html#section-owner) | Seamlessly embedded inside your existing portfolio folder dossier. Includes KPI cards, Top Pages, Geographic Distribution, Hardware/Referrers, and live Telemetry Log with search, filters, and pagination. |
| **Client Tracker** | [`tracker.js`](file:///c:/Users/sampada/OneDrive/Desktop/portfolio/tracker.js) | Non-blocking deferred tracker. Generates anonymous `visitor_id` (distinguishes New vs Returning), tab `session_id`, deduplicates page refreshes within 30 seconds, and respects Owner Mode exclusion. |
| **Server-Side Tracking API** | [`api/track.js`](file:///c:/Users/sampada/OneDrive/Desktop/portfolio/api/track.js) | Serverless function that securely extracts client public IP (`x-forwarded-for`), native Vercel Edge Geolocation headers, parses user-agent for OS/Browser/Device, and writes records directly to Supabase using server-side credentials. |
| **Protected Analytics API** | [`api/analytics.js`](file:///c:/Users/sampada/OneDrive/Desktop/portfolio/api/analytics.js) | Secure, timing-safe owner-only endpoint. Requires `ADMIN_PASSWORD` header. Computes metrics (total views, unique visitors, top pages, countries, devices, browsers) and returns recent visits. Blocks all unauthorized public access. |
| **Database Schema** | [`supabase_schema.sql`](file:///c:/Users/sampada/OneDrive/Desktop/portfolio/supabase_schema.sql) | PostgreSQL schema for `public.portfolio_visits` with Row-Level Security (RLS) policies: anonymous `INSERT` allowed; `SELECT` strictly restricted to `service_role`. |
| **Local Dev Server** | [`server.js`](file:///c:/Users/sampada/OneDrive/Desktop/portfolio/server.js) | Zero-dependency Node.js server to run and test the complete frontend and API routes locally (`npm start`). |

---

## 📋 Visitor Information Collected & Displayed

For every page view, the system securely collects and presents:
- **Unique Visit ID**: Auto-generated UUID stored in PostgreSQL
- **Public IP Address**: Obtained securely on the server from request metadata (`x-forwarded-for` / `x-real-ip`)
- **Approximate Geolocation**: Country, State/Region, and City via Vercel Edge Headers
- **Browser Name & Version**: e.g., Chrome 124, Safari 17.4, Edge 124, Firefox 125
- **Operating System**: Windows 11/10, macOS, iOS, Android, Linux, ChromeOS
- **Device Category**: Desktop, Mobile, Tablet
- **Device Model**: Displayed only when reliably detectable (e.g., iPhone, iPad, Mac); clearly shown as `Unknown` otherwise (no fabricated details)
- **Visit Timestamp**: Stored in standard UTC in the database, automatically formatted and displayed in your browser's local timezone
- **Page Visited**: Exact path visited (e.g. `/`, `/#projects`, `/#patent`)
- **Referrer Origin**: Source website (LinkedIn, GitHub, Google, Direct)
- **Session ID**: UUID grouping visits in a single browsing session
- **New vs Returning Visitor**: Detected via privacy-conscious anonymous client token
- **Screen Resolution**: e.g. `1920x1080`, `393x852`
- **Aggregated Metrics**: Total visits, Unique human visitors, Visits today, Top visited pages, Top countries

---

## 🚀 3-Step Setup for Live Deployment

### Step 1: Run the Database Schema in Supabase (Free)
1. Sign in to [Supabase](https://supabase.com) (free forever tier).
2. Open your project (or click **"New Project"**, name it `portfolio-analytics`, and select region *South Asia - Mumbai*).
3. In the left sidebar, click **"SQL Editor"**.
4. Click **"+ New Query"**.
5. Copy the contents of [`supabase_schema.sql`](file:///c:/Users/sampada/OneDrive/Desktop/portfolio/supabase_schema.sql), paste it into the editor, and click **"Run"**.
   *(Note: The script uses `IF NOT EXISTS` and `ALTER TABLE ADD COLUMN IF NOT EXISTS`, making it 100% safe to re-run on existing tables without losing data).*

### Step 2: Copy Your Supabase API Credentials
1. In Supabase, click **Project Settings** (gear icon in lower left sidebar) -> **API**.
2. Note down two values:
   - **Project URL** (e.g., `https://abcdefghijklm.supabase.co`)
   - **`service_role` Secret Key** (click "Reveal" to copy it; keep this secret, do not share)

### Step 3: Add Environment Variables in Vercel
1. Go to your [Vercel Dashboard](https://vercel.com/dashboard) and select your deployed portfolio project (`portfolio-five-sand-53`).
2. Go to **Settings** -> **Environment Variables**.
3. Add the following 3 variables:

| Variable Name | Value | Purpose |
| :--- | :--- | :--- |
| `SUPABASE_URL` | `https://your-project.supabase.co` | Supabase Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1Ni...` | Supabase Service Role Secret Key |
| `ADMIN_PASSWORD` | *(Your choice of strong password)* | Master password to unlock your Owner Dossier |

4. Check **Production**, **Preview**, and **Development** checkboxes when adding each variable.
5. Click **Save**.

### Step 4: Redeploy on Vercel
1. In your Vercel project, go to the **Deployments** tab.
2. Click the three dots `...` on the latest deployment and select **"Redeploy"** (or simply push your git commit to `main`, which triggers an automatic build).
3. Once the deployment finishes, your live tracking and Owner Dashboard are 100% operational!

---

## 🔑 How to Open Your Owner Section

1. Visit your live site: `https://portfolio-five-sand-53.vercel.app/`
2. Open the Owner Section using any of these methods:
   - **Keyboard Shortcut**: Press **`Ctrl + Shift + A`** (or **`Cmd + Shift + A`** on Mac) from anywhere on your portfolio.
   - **Navigation Tab**: Click the secret lock icon in the footer or navigate to `#section-owner`.
3. Enter your master password (the value you set for `ADMIN_PASSWORD` in Vercel) and click **"Unlock Private Dossier"**.
4. The confidential dossier will unlock with all real-time visitor statistics!

---

## 🔒 Security & Privacy Guarantees

1. **Zero Secret Leaks**: Neither your database password nor your Supabase `service_role` key is ever bundled into frontend JavaScript or exposed in HTTP responses.
2. **Owner Only Access**: Public visitors attempting to query `/api/analytics` receive an immediate `401 Unauthorized`.
3. **Owner Exclusion Mode**: Your own visits from your browser can be excluded at the flip of a switch (`Exclude My Visits` toggle), preserving authentic audience counts.
4. **Row-Level Security (RLS)**: Anonymous public requests can only insert visit logs; they are blocked from reading IP addresses or location history.
