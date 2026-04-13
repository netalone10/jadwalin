# PRD — Jadwalin
**"Jadwalkan apa saja hanya dengan ketik."**

Version: 1.1
Owner: Akbar Muharrom
Status: MVP Live (Vercel + localhost)
Last Updated: April 2026

---

## 1. Apa Itu Jadwalin?

Jadwalin adalah web app yang memungkinkan user menjadwalkan event ke Google Calendar menggunakan **bahasa natural** — seperti chat biasa. Tidak perlu buka Google Calendar, tidak perlu isi form. Cukup ketik, Jadwalin proses sisanya.

**Contoh:**
```
"Meeting sama Budi besok jam 3 sore"
→ Event dibuat di Google Calendar + email konfirmasi dikirim

"Presentasi online sama klien Jumat jam 10 pagi"
→ Event + Google Meet link dibuat + email konfirmasi dikirim
```

---

## 2. Problem yang Diselesaikan

Buka Google Calendar, klik tanggal, isi form, pilih waktu, set reminder — terlalu banyak langkah untuk hal yang sederhana. Jadwalin compress semua itu jadi satu baris teks.

---

## 3. Core Feature (MVP)

| # | Fitur | Deskripsi |
|---|---|---|
| 1 | **Prompt input** | Textarea di dashboard, user ketik jadwal dalam bahasa natural (ID/EN) |
| 2 | **AI parsing (Groq)** | Parse prompt jadi: judul, tanggal, jam mulai, jam selesai, deskripsi, perlu Meet atau tidak |
| 3 | **Google Calendar sync** | Event langsung dibuat di akun Google Calendar user yang login |
| 4 | **Google Meet auto-generate** | Kalau prompt menyebut "meet", "online", "video call", "zoom" → Meet link dibuat otomatis |
| 5 | **Email konfirmasi** | Email dikirim ke user berisi detail event + Meet link (jika ada) via Resend |
| 6 | **Riwayat** | List event yang sudah dibuat, dengan link "Buka Calendar" dan "Join Meet" |
| 7 | **Edit event** | Edit judul, tanggal, waktu langsung dari riwayat → sync ke Google Calendar |
| 8 | **Hapus event** | Hapus event dari riwayat + Google Calendar sekaligus |

---

## 4. Cara Kerja (Flow)

```
User ketik prompt
       ↓
POST /api/schedule
       ↓
Groq LLaMA 3.1 8B parse prompt
→ { title, date, startTime, endTime, description, timezone, withMeet }
       ↓
getValidToken(userId)        ← refresh Google token kalau expired
       ↓
createCalendarEvent()        ← tulis ke Google Calendar API
  + conferenceDataVersion=1  ← kalau withMeet = true
       ↓
Dapat googleEventId + meetLink (optional)
       ↓
Simpan ke history (localStorage)
       ↓
Send email via Resend         ← fire and forget, tidak blocking
       ↓
Return response ke frontend
→ Tampilkan success card + Meet link

Edit: PATCH /api/schedule/[eventId]  ← update di Google Calendar
Hapus: DELETE /api/schedule/[eventId] ← hapus dari Google Calendar
```

---

## 5. Tech Stack

| Layer | Tech | Versi | Catatan |
|---|---|---|---|
| Framework | Next.js | 16.2.2 | App Router, TypeScript, React 19 |
| Auth | NextAuth.js | v4 | Google OAuth 2.0, JWT sessions |
| Database | Supabase (PostgreSQL) | — | Free tier, pgbouncer connection pooling |
| ORM | Prisma | 6.x | **Harus v6**, bukan v7 (v7 tidak kompatibel dengan NextAuth adapter) |
| AI | Groq SDK | 1.1.2 | Model: `llama-3.1-8b-instant` — via `groq-sdk` npm package |
| Calendar | googleapis | 171.4.0 | Google Calendar API v3 |
| Email | Resend | 6.10.0 | Free 3.000 email/bulan |
| Font | Geist | 1.7.0 | Via package `geist`, **bukan** Google Fonts CDN |
| Styling | Tailwind CSS v4 + shadcn/ui v4 | — | shadcn v4 pakai `@base-ui/react`, **tidak ada prop `asChild` di Button** |
| Date/Time | date-fns + date-fns-tz | 4.1.0 / 3.2.0 | Timezone-aware formatting |
| Icons | Lucide React | 1.7.0 | — |
| Deployment | Vercel | — | https://jadwalin-tau.vercel.app |

---

## 6. Struktur File

```
D:\Project\Jadwalin\
├── app/
│   ├── page.tsx                          # Landing page
│   ├── dashboard/
│   │   └── page.tsx                      # Dashboard utama: prompt input + riwayat + edit/hapus
│   ├── book/[slug]/page.tsx              # (Legacy) Public booking page
│   ├── pages/
│   │   ├── new/page.tsx                  # (Legacy) Buat booking page
│   │   └── [id]/edit/page.tsx            # (Legacy) Edit booking page
│   └── api/
│       ├── auth/[...nextauth]/route.ts   # NextAuth handler
│       ├── schedule/route.ts             # ⭐ Core: POST → Groq → Calendar → Email
│       ├── schedule/[eventId]/route.ts   # ⭐ PATCH (edit) + DELETE (hapus) event
│       ├── user/route.ts                 # GET/PUT user profile
│       ├── booking-pages/route.ts        # (Legacy) CRUD booking pages
│       ├── booking-pages/[id]/route.ts   # (Legacy) Edit/delete/get booking page
│       ├── booking-pages/check-slug/     # (Legacy) Cek slug unik
│       ├── bookings/route.ts             # (Legacy) List bookings per page
│       ├── bookings/slots/route.ts       # (Legacy) Available slots
│       ├── bookings/confirm/route.ts     # (Legacy) Confirm booking
│       ├── bookings/[id]/cancel/route.ts # (Legacy) Cancel booking
│       ├── bookings/upcoming/route.ts    # (Legacy) Upcoming bookings
│       └── public/booking-pages/[slug]/  # (Legacy) Public booking page config
├── components/
│   ├── Navbar.tsx                        # Logo, lang toggle, avatar dropdown
│   ├── LangToggle.tsx                    # ID/EN toggle + useLang hook (simpan ke localStorage)
│   ├── Providers.tsx                     # SessionProvider + LangProvider wrapper
│   ├── BookingCalendar.tsx               # (Legacy) Date picker
│   ├── BookingForm.tsx                   # (Legacy) Form booking
│   ├── BookingPageCard.tsx               # (Legacy) Card booking page
│   ├── BookingPageForm.tsx               # (Legacy) Form buat/edit booking page
│   ├── TimeSlotGrid.tsx                  # (Legacy) Grid slot waktu
│   └── ui/                               # shadcn/ui v4 components (button, card, input, dll)
├── utils/
│   ├── gemini.ts                         # ⭐ Parse prompt → ParsedEvent (NAMA FILE MENYESATKAN: pakai Groq, bukan Gemini)
│   ├── calendar.ts                       # ⭐ Google Calendar: getBusy, createEvent, updateEvent, deleteEvent
│   ├── token.ts                          # ⭐ getValidToken + auto-refresh OAuth token
│   ├── email.ts                          # Resend: send confirmation + cancellation
│   └── slots.ts                          # (Legacy) Hitung available slots
├── lib/
│   ├── auth.ts                           # NextAuth authOptions (signIn, JWT, session callbacks)
│   ├── prisma.ts                         # Prisma singleton client
│   ├── supabase.ts                       # Supabase client
│   └── utils.ts                          # cn() classname merger
├── constants/
│   └── lang.ts                           # i18n strings ID + EN (~100+ string)
├── types/
│   └── next-auth.d.ts                    # Extend Session type (userId, accessToken)
├── prisma/
│   └── schema.prisma                     # 3 model: User, BookingPage, Booking
├── proxy.ts                              # Auth middleware (Next.js 16: pakai proxy.ts, bukan middleware.ts)
└── .env.local                            # Credentials (di gitignore)
```

> **Catatan:** File berlabel *(Legacy)* adalah sisa dari fitur booking page (Calendly-clone) yang dibangun sebelum pivot. Masih berfungsi tapi bukan core product.

---

## 7. Database Schema

```prisma
model User {
  id           String        @id @default(uuid())
  googleId     String        @unique @map("google_id")
  email        String        @unique
  name         String
  image        String?
  accessToken  String?       @map("access_token")
  refreshToken String?       @map("refresh_token")
  tokenExpiry  DateTime?     @map("token_expiry")
  createdAt    DateTime      @default(now()) @map("created_at")
  bookingPages BookingPage[]
}

model BookingPage {
  // (Legacy) Untuk fitur booking page publik
  id              String    @id @default(uuid())
  userId          String    @map("user_id")
  slug            String    @unique
  // ... (lihat prisma/schema.prisma untuk full fields)
}

model Booking {
  // (Legacy) Untuk fitur booking page publik
  id            String      @id @default(uuid())
  bookingPageId String      @map("booking_page_id")
  // ... (lihat prisma/schema.prisma untuk full fields)
}
```

> **Catatan:** Riwayat event yang dijadwalkan via prompt **disimpan di localStorage browser**, bukan di database. Kalau butuh persistent history cross-device, perlu tambah tabel `ScheduledEvent` di DB.

---

## 8. Environment Variables

```bash
# Google OAuth
GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxx

# NextAuth
NEXTAUTH_URL=https://jadwalin-tau.vercel.app   # ganti ke localhost:3000 untuk dev
NEXTAUTH_SECRET=xxxx                            # node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxx
SUPABASE_SERVICE_ROLE_KEY=xxxx
DATABASE_URL="postgresql://postgres.REF:PASS@aws-X-REGION.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.REF:PASS@aws-X-REGION.pooler.supabase.com:5432/postgres"

# Groq AI (dari console.groq.com)
GROQ_API_KEY=gsk_xxxx

# Resend
RESEND_API_KEY=re_xxxx                          # dari resend.com

# App
NEXT_PUBLIC_APP_URL=https://jadwalin-tau.vercel.app  # ganti ke localhost:3000 untuk dev
```

---

## 9. Setup Lokal (dari Nol)

```bash
# 1. Install dependencies
npm install

# 2. Generate Prisma client
npx prisma generate

# 3. Push schema ke Supabase (butuh DATABASE_URL yang valid di .env.local)
$env:DATABASE_URL="..."; $env:DIRECT_URL="..."; npx prisma db push

# 4. Jalankan dev server
npm run dev
```

**Catatan penting:**
- Prisma tidak baca `.env.local` secara otomatis — harus set env variable manual di terminal (PowerShell syntax di atas)
- `NEXTAUTH_SECRET` di-generate via Node, bukan `openssl` (Windows tidak punya openssl by default)
- Supabase connection string format baru: `postgres.PROJECT_REF` sebagai username, bukan `postgres`
- Untuk dev lokal, set `NEXTAUTH_URL` dan `NEXT_PUBLIC_APP_URL` ke `http://localhost:3000`

---

## 10. Google OAuth — Setup & Gotcha

**Scopes yang dibutuhkan:**
```
openid, email, profile
https://www.googleapis.com/auth/calendar.readonly
https://www.googleapis.com/auth/calendar.events
```

**Redirect URI:**
```
# Development
http://localhost:3000/api/auth/callback/google

# Production
https://jadwalin-tau.vercel.app/api/auth/callback/google
```

**Gotcha — Unverified App:**
Karena app minta Calendar scope (sensitive), Google wajib verifikasi sebelum bisa publik. Untuk sementara:
- Mode **Testing**: tambahkan email user satu-satu sebagai test user (max 100)
- Mode **Published tanpa verifikasi**: user bisa login tapi ada warning screen "App not verified" → klik Advanced → Continue
- Untuk tambah test user via WhatsApp: tombol sudah ada di landing page (→ +1 628 281 2956)

---

## 11. AI Parsing — Groq LLaMA

**File:** `utils/gemini.ts` *(nama file lama, isinya sudah pakai Groq — jangan rename karena import tersebar)*

**Provider:** [Groq Cloud](https://console.groq.com)
**Model:** `llama-3.1-8b-instant`
**Temperature:** 0.1 (sangat deterministik)
**Response format:** JSON only (no markdown)

**Output ParsedEvent:**
```typescript
interface ParsedEvent {
  title: string;      // judul event
  date: string;       // "YYYY-MM-DD"
  startTime: string;  // "HH:MM" (24h)
  endTime: string;    // "HH:MM" (24h)
  description: string;
  timezone: string;   // "Asia/Jakarta" (dari browser user)
  withMeet: boolean;  // true jika prompt menyebut: meet/online/video/zoom/dll
}
```

**Logika system prompt:**
- Infer durasi (default 1 jam kalau tidak disebutkan)
- Resolve relative date (besok, minggu depan, dll)
- Output bahasa sama dengan input
- JSON only, tidak ada teks penjelasan

---

## 12. Google Calendar — createCalendarEvent()

**File:** `utils/calendar.ts`

**Fungsi utama:**
- `getBusySlots()` — query freebusy API (dipakai Legacy)
- `createCalendarEvent()` — insert event ke primary calendar
- `updateCalendarEvent()` — PATCH event (title, date, time, timezone)
- `deleteCalendarEvent()` — DELETE event

**Return createCalendarEvent:**
```typescript
interface CreateEventResult {
  eventId: string;
  meetLink?: string;  // ada jika withMeet = true
}
```

**Meet link:** Dibuat via `conferenceData.createRequest` dengan `conferenceSolutionKey.type = "hangoutsMeet"`. Butuh `conferenceDataVersion: 1` di request.

---

## 13. Token Refresh — getValidToken()

**File:** `utils/token.ts`

**Flow:**
```
getValidToken(userId)
  → baca accessToken + tokenExpiry dari DB
  → kalau expiry < 5 menit lagi: call refreshAccessToken()
    → POST ke oauth2.googleapis.com/token dengan refreshToken
    → simpan token baru ke DB
  → return accessToken yang valid
```

Dipanggil di setiap API route yang butuh akses Google Calendar sebelum panggil Calendar API.

---

## 14. Fitur Berikutnya (Backlog)

| Prioritas | Fitur | Catatan |
|---|---|---|
| 🔴 High | Simpan riwayat ke DB | Sekarang di localStorage, hilang kalau clear browser |
| 🟡 Medium | Setup production env Vercel | Sudah deploy, perlu verify semua env vars di Vercel dashboard |
| 🟡 Medium | Recurring event | "Setiap Senin jam 9" → event berulang |
| 🟡 Medium | Timezone manual override | Auto-detect dari browser sudah ada, tapi belum bisa di-override manual |
| 🟢 Low | Notifikasi WhatsApp | Selain email, kirim reminder via WhatsApp |
| 🟢 Low | Voice input | Ketik suara → prompt teks |
| 🟢 Low | Integrasi Notion/Todoist | Sync task dari tools lain |

---

## 15. Known Issues & Quirks

| Issue | Status | Solusi |
|---|---|---|
| Next.js 16: `middleware.ts` deprecated | ✅ Fixed | Diganti `proxy.ts` |
| Next.js 16: `params` async di dynamic routes | ✅ Fixed | `const { id } = await params` |
| shadcn/ui v4: tidak ada `asChild` di Button | ✅ Fixed | Pakai `Link` + `buttonVariants()` langsung |
| Prisma 7 tidak kompatibel dengan NextAuth adapter | ✅ Fixed | Downgrade ke Prisma 6 |
| Google Fonts gagal fetch saat build | ✅ Fixed | Pakai package `geist` (local) |
| Supabase connection string format baru | ✅ Fixed | `postgres.PROJECT_REF` sebagai username, port 6543 |
| Google Calendar "Lihat →" link 400 error | ✅ Fixed | Link ke `calendar.google.com/calendar/r` saja |
| `utils/gemini.ts` nama file menyesatkan | ⚠️ Known | File pakai Groq SDK, bukan Gemini — jangan rename, import tersebar |
| Riwayat hilang saat clear browser | ⏳ Backlog | Perlu simpan ke DB (tambah tabel `ScheduledEvent`) |
