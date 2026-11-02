# ParkLink — Smart Vehicle Contact & Parking Assistance Platform

> **Your Vehicle. One Scan. Instant Connection.**

ParkLink is a production-ready, dynamic QR-based vehicle identification and parking assistance platform. It solves the everyday parking bottleneck: vehicles blocking driveways or double-parked vehicles whose drivers have left the area.

With ParkLink, every registered vehicle receives a permanent, cryptographically secure dynamic QR code sticker. When scanned by any smartphone camera:
- The verified public vehicle profile opens instantly in the browser — **no mobile app required**.
- Visitors can **Call the Owner** or open a **WhatsApp chat** (configured according to the owner's privacy preferences).
- Visitors can send **1-tap Smart Parking Alerts** ("Vehicle blocking", "Please move", "Lights switched on", "Window open", "Parked incorrectly").
- The vehicle owner receives instant realtime notifications on their dashboard.
- The physical QR code sticker **never changes or expires**, even when the owner updates their phone number, changes privacy settings, or updates vehicle details.

---

## 🚀 Key Features & Modules

### 1. Dynamic QR Architecture (Zero Stale Data)
- **Opaque Cryptographic Tokens:** QR stickers encode only permanent URLs (`https://parklink.app/v/[token]`), never raw personal telephone numbers or addresses.
- **Instant Cloud Sync:** Profile, telephone, and privacy updates reflect on the public scanning page immediately.
- **Export & Print Formats:** High-resolution PNG, vector SVG, and print-ready PDF sticker cards (sized for windshields and sun visors).
- **1-Click Token Rotation:** Neutralize compromised or lost physical stickers with one click.

### 2. Public Mobile-First Vehicle Profile (`/v/[token]`)
- Fast, accessible mobile experience designed for on-the-spot parking situations.
- **Direct Calling:** Uses properly formatted `tel:` links when public phone visibility is enabled.
- **WhatsApp Deep Link:** Opens WhatsApp with pre-filled vehicle details.
- **Anonymous Contact Relay:** Privacy-conscious 2-way message relay keeping personal phone numbers completely confidential.
- **Abuse Reporting:** Community reporting for fake vehicles or sticker misuse.

### 3. Smart Parking Alert System
- Predefined categories: *Blocking Another Vehicle*, *Please Move*, *Lights Left On*, *Window Open*, *Parked Incorrectly*, *Other*.
- Anti-bot rate limiting and duplicate suppression (cooldown windows).
- Stored securely in PostgreSQL with realtime Supabase notifications.

### 4. Vehicle Owner Dashboard
- **Overview:** Registered vehicles, active QR tokens, total scan telemetry, and pending parking alerts.
- **Vehicle Fleet Management:** Multi-vehicle support (Car, SUV, Motorcycle, Scooter, Van, Truck, Other).
- **Contact & Privacy Center:** Granular controls over phone visibility, WhatsApp visibility, emergency privacy muting, and alternate contact persons.
- **Realtime Notification Center:** Subscribed via Supabase Realtime for instant alerts.
- **Privacy-Conscious Analytics:** Telemetry aggregated without storing raw visitor IPs or tracking user locations.

### 5. Super Admin Control Center (`/admin`)
- Server-side role-based authorization (`role === 'admin'`).
- Platform fleet overview, user account moderation, suspension controls.
- Global QR code registry with administrative token neutralization.
- Abuse queue and moderation tools.
- Immutable administrative audit logs (`admin_audit_logs`).

### 6. Institutional Parking Ready
- Database schema built to support universities, residential societies, corporate IT parks, and hospital parking zones.
- Support for `institutions`, `institution_members`, and `parking_zones`.

---

## 🛠️ Technology Stack

- **Framework:** Next.js 14+ (App Router, Server & Client Components)
- **Language:** TypeScript (Strict mode)
- **Styling:** Tailwind CSS with refined green, white, and charcoal SaaS palette
- **Icons:** Lucide React
- **Database & Auth:** Supabase PostgreSQL with Row Level Security (RLS) & Supabase Realtime
- **Validation:** Zod & React Hook Form
- **QR Generation & PDF:** `qrcode` & `jspdf`
- **Charts:** Recharts

---

## 📋 Database Setup (Supabase)

1. Create a project at [supabase.com](https://supabase.com).
2. Go to the **SQL Editor** in your Supabase dashboard.
3. Open [`supabase/migrations/20261102000000_init_parklink.sql`](file:///Volumes/T7%20Shield/Projects/Parklink/supabase/migrations/20261102000000_init_parklink.sql).
4. Run the SQL script to create all tables, indexes, RLS policies, and secure RPC functions:
   - `profiles`
   - `vehicles`
   - `vehicle_contacts`
   - `vehicle_qr_codes`
   - `parking_alerts`
   - `anonymous_messages`
   - `notifications`
   - `scan_logs`
   - `reports`
   - `institutions`, `institution_members`, `parking_zones`
   - `admin_audit_logs`
   - `user_notification_preferences`
   - Stored procedures: `get_public_vehicle_by_token`, `submit_parking_alert`, `submit_anonymous_message`, `rotate_vehicle_qr_token`, `log_qr_scan`

---

## ⚙️ Environment Variables

Create `.env.local` in the project root:

```env
# Public Supabase Settings (Browser accessible)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Server-Only Supabase Service Role Key (NEVER expose to client)
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Base Application URL (Used for QR URL generation)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 🏃 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Local Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

### 3. Production Build
```bash
npm run build
npm run start
```

---

## 🧪 Acceptance Testing Checklist

| Test | Workflow Description | Verified Status |
| :--- | :--- | :--- |
| **TEST 1** | User registers, logs in, and adds vehicle with registration number and type | ✅ Implemented & Typechecked |
| **TEST 2** | System generates unique cryptographic QR code and permanent URL | ✅ Implemented |
| **TEST 3** | Visitor scans QR without logging in and views public profile (`/v/[token]`) | ✅ Implemented |
| **TEST 4** | Visitor calls owner or opens WhatsApp based on owner privacy settings | ✅ Implemented |
| **TEST 5** | Visitor sends parking alert; alert stored and owner notified | ✅ Implemented |
| **TEST 6** | Owner receives alert in realtime notification centre | ✅ Implemented |
| **TEST 7** | Owner changes phone number or privacy setting from dashboard | ✅ Implemented |
| **TEST 8** | Same physical QR code scanned again reflects updated phone number immediately | ✅ Implemented (no-cache headers + dynamic lookup) |
| **TEST 9** | Owner cannot access or modify another owner's vehicle (RLS enforced) | ✅ Enforced via RLS & API checks |
| **TEST 10** | Suspended vehicle/QR displays inactive notice and disables contact actions | ✅ Implemented |
| **TEST 11** | Administrator manages users, vehicles, QR codes, and reports | ✅ Implemented (`/admin`) |
| **TEST 12** | Unauthenticated or non-admin users cannot access administrative functions | ✅ Enforced via middleware & server checks |
| **TEST 13** | Spam alert submissions restricted by cooldown timers and rate limiting | ✅ Enforced via RPC function |
| **TEST 14** | Mobile, tablet, and desktop responsive design | ✅ Responsive Tailwind layouts |

---

## 🚢 Deployment to Vercel

1. Push your repository to GitHub, GitLab, or Bitbucket.
2. Import the project into [Vercel](https://vercel.com).
3. Set the Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_APP_URL` (set to your Vercel production domain, e.g. `https://parklink.app`)
4. Deploy! Vercel automatically detects Next.js App Router and provisions edge/serverless routes.

---

## 📄 License

Proprietary — Developed for ParkLink Technologies.
