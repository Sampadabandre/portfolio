# 🛡️ Owner-Only Visitor Analytics & Telemetry Setup Guide

Congratulations! Your portfolio now has an enterprise-grade, privacy-first **Visitor Analytics & Telemetry Engine** created specifically for you as the owner.

---

## 🌟 What Was Built

| File | Purpose |
| :--- | :--- |
| **[`admin.html`](file:///c:/Users/sampada/OneDrive/Desktop/portfolio/admin.html)** | Your dedicated, password-protected **Owner Analytics Console** (accessible via `/admin` or `admin.html`). |
| **[`admin.css`](file:///c:/Users/sampada/OneDrive/Desktop/portfolio/admin.css)** | Cyber glassmorphism styling, glowing metric cards, live status pulse, responsive tables. |
| **[`admin.js`](file:///c:/Users/sampada/OneDrive/Desktop/portfolio/admin.js)** | Real-time KPI animation, interactive table search, inspector modal with Google Maps coordinates, CSV export, and owner visit exclusion. |
| **[`tracker.js`](file:///c:/Users/sampada/OneDrive/Desktop/portfolio/tracker.js)** | Ultra-lightweight (~2KB) deferred tracking script added to [`index.html`](file:///c:/Users/sampada/OneDrive/Desktop/portfolio/index.html). Deduplicates reloads and respects owner exclusion. |
| **[`api/track.js`](file:///c:/Users/sampada/OneDrive/Desktop/portfolio/api/track.js)** | Vercel Serverless Function that automatically extracts client IP (`x-forwarded-for`) and native Vercel Edge Geolocation (`x-vercel-ip-country`, `x-vercel-ip-city`, `x-vercel-ip-country-region`, `latitude`, `longitude`). |
| **[`api/analytics.js`](file:///c:/Users/sampada/OneDrive/Desktop/portfolio/api/analytics.js)** | Protected Serverless API that blocks all public access and only serves visitor metrics to you when your master admin password matches. |
| **[`supabase_schema.sql`](file:///c:/Users/sampada/OneDrive/Desktop/portfolio/supabase_schema.sql)** | Complete SQL schema with Row-Level Security (RLS) ensuring **public users can only INSERT visits, but CANNOT read any visitor IPs or logs**. |

---

## 🚀 2-Minute Quick Setup with Supabase (100% Free Forever)

### Step 1: Create Your Free Database
1. Go to [https://supabase.com](https://supabase.com) and sign in (with GitHub or email).
2. Click **"New Project"**, name it `portfolio-analytics`, choose a secure database password, and select the region closest to you (e.g. *South Asia - Mumbai*).

### Step 2: Run the SQL Schema
1. In your Supabase project dashboard, click **"SQL Editor"** on the left navigation bar.
2. Click **"+ New Query"**.
3. Open [`supabase_schema.sql`](file:///c:/Users/sampada/OneDrive/Desktop/portfolio/supabase_schema.sql), copy its entire content, paste it into the editor, and click **"Run"**.
4. You will see `Success. No rows returned.` — your `portfolio_visits` table with Row-Level Security is ready!

### Step 3: Get Your API Credentials
1. In Supabase, click **Project Settings** (gear icon at the bottom left) -> **API**.
2. Copy two values:
   - **Project URL** (e.g. `https://xyzcompany.supabase.co`)
   - **`service_role` secret key** (revealed by clicking "Reveal")

---

## 🔒 Connect to Vercel (Production)

To connect your deployed portfolio on Vercel:
1. Go to your [Vercel Dashboard](https://vercel.com/dashboard) -> Select your portfolio project.
2. Go to **Settings** -> **Environment Variables**.
3. Add these 3 environment variables:

| Variable Name | Value | Description |
| :--- | :--- | :--- |
| `SUPABASE_URL` | `https://your-project.supabase.co` | Your Supabase Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1...` | Your Supabase `service_role` secret key |
| `ADMIN_PASSWORD` | *Your chosen strong password* | Your master password to unlock `/admin` |

4. Redeploy your project (or push a commit) so Vercel loads the environment variables.

---

## 🔑 How to Access Your Admin Console

You can access your analytics dashboard anytime in 3 easy ways:
1. **Direct URL**: Visit `https://your-portfolio.vercel.app/admin` (or `admin.html`).
2. **Keyboard Shortcut**: Open your portfolio and press **`Ctrl + Shift + A`** (or **`Cmd + Shift + A`** on Mac).
3. **Discreet Footer Link**: Scroll to the footer of your portfolio and click the subtle shield icon next to the copyright text.

### Master Password
- If `ADMIN_PASSWORD` is set in Vercel: use the password you configured.
- Default local preview password: `sampada@admin2026`

---

## 🛡️ Privacy & Security Highlights

1. **Owner-Only Protection**: The database table has strict **Row-Level Security (RLS)** enabled. Public visitors or anyone inspecting your code CANNOT fetch or read other visitors' IPs.
2. **"Exclude My Visits" Toggle**: An active toggle right inside your dashboard marks your current browser/device as the owner. When enabled, your own visits to your portfolio are **never logged**, keeping your view counts 100% accurate!
3. **Deep Telemetry Inspector**: Click **"Details"** on any visitor in the table to see their exact city, region, ISP, screen size, user agent, and a button to view their coordinates directly on Google Maps!
4. **CSV Export**: Click **"Export CSV"** in the top bar to download your visitor history anytime.
