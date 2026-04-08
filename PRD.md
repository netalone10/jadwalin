# PRD — Jadwalin
**"Jadwalkan apa saja hanya dengan ketik."**

Version: 1.0
Owner: Akbar Muharrom
Status: MVP Live (localhost)
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
| 2 | **AI parsing (Gemini)** | Parse prompt jadi: judul, tanggal, jam mulai, jam selesai, deskripsi, perlu Meet atau tidak |
| 3 | **Google Calendar sync** | Event langsung dibuat di akun Google Calendar user yang login |
| 4 | **Google Meet auto-generate** | Kalau prompt menyebut "meet", "online", "video call" → Meet link dibuat otomatis |
| 5 | **Email konfirmasi** | Email dikirim ke user berisi detail event + Meet link (jika ada) via Resend |
| 6 | **Riwayat** | List event yang sudah dibuat, dengan link "Buka Calendar" dan "Join Meet" |

---

## 4. Cara Kerja (Flow)

```
User ketik prompt
       ↓
POST /api/schedule
       ↓
Gemini 2.5 Flash parse prompt
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
```

---

## 5. Tech Stack

| Layer | Tech | Versi | Catatan |
|---|---|---|---|
| Framework | Next.js | 16.2.2 | App Router, TypeScript |
| Auth | NextAuth.js | v4 | Google OAuth 2.0 |
| Database | Supabase (PostgreSQL) | — | Free tier |
| ORM | Prisma | 6.x | Harus v6, bukan v7 (v7 tidak kompatibel dengan NextAuth adapter) |
| AI | Google Gemini | 2.5 Flash | Via `@google/generative-ai` |
| Calendar | googleapis | npm | Google Calendar API v3 |
| Email | Resend | — | Free 3.000 email/bulan |
| Font | Geist | npm | Via package `geist`, bukan Google Fonts CDN |
| Styling | Tailwind CSS v4 + shadcn/ui v4 | — | shadcn v4 pakai `@base-ui/react`, tidak ada prop `asChild` di Button |
| Deployment | Vercel | — | — |

---

## 6. Struktur File

```
D:\Project\Jadwalin\
├── app/
│   ├── page.tsx                          # Landing page
│   ├── dashboard/
│   │   └── page.tsx                      # Dashboard utama: prompt input + riwayat
│   ├── book/[slug]/page.tsx              # (Legacy) Public booking page
│   ├── pages/
│   │   ├── new/page.tsx                  # (Legacy) Buat booking page
│   │   └── [id]/edit/page.tsx            # (Legacy) Edit booking page
│   └── api/
│       ├── auth/[...nextauth]/route.ts   # NextAuth handler
│       ├── schedule/route.ts             # ⭐ Core: Gemini → Calendar → Email
│       ├── booking-pages/route.ts        # (Legacy) CRUD booking pages
│       ├── booking-pages/[id]/route.ts   # (Legacy) Edit/delete/get booking page
│       ├── booking-pages/check-slug/     # (Legacy) Cek slug unik
│       ├── bookings/route.ts             # (Legacy) List bookings per page
│       ├── bookings/slots/route.ts       # (Legacy) Available slots
│       ├── bookings/confirm/route.ts     # (Legacy) Confirm booking
│       ├── bookings/[id]/cancel/route.ts # (Legacy) Cancel booking
│       ├── bookings/upcoming/route.ts    # (Legacy) Upcoming bookings
│       ├── public/booking-pages/[slug]/  # (Legacy) Public booking page config
│       └── user/route.ts                 # Get/update user profile
├── components/
│   ├── Navbar.tsx                        # Logo, lang toggle, avatar dropdown
│   ├── LangToggle.tsx + useLang hook     # ID/EN toggle, simpan ke localStorage
│   ├── Providers.tsx                     # SessionProvider wrapper
│   ├── BookingCalendar.tsx               # (Legacy) Date picker
│   ├── BookingForm.tsx                   # (Legacy) Form booking
│   ├── BookingPageCard.tsx               # (Legacy) Card booking page
│   ├── BookingPageForm.tsx               # (Legacy) Form buat/edit booking page
│   └── TimeSlotGrid.tsx                  # (Legacy) Grid slot waktu
├── utils/
│   ├── gemini.ts                         # ⭐ Parse prompt → ParsedEvent via Gemini
│   ├── calendar.ts                       # ⭐ Google Calendar: getBusy, createEvent, deleteEvent
│   ├── token.ts                          # ⭐ getValidToken + auto-refresh
│   ├── email.ts                          # Resend: send confirmation + cancellation
│   └── slots.ts                          # (Legacy) Hitung available slots
├── lib/
│   ├── auth.ts                           # NextAuth authOptions
│   ├── prisma.ts                         # Prisma singleton client
│   └── supabase.ts                       # Supabase client
├── constants/
│   └── lang.ts                           # i18n strings ID + EN
├── types/
│   └── next-auth.d.ts                    # Extend Session type (userId, accessToken)
├── prisma/
│   └── schema.prisma                     # 3 model: User, BookingPage, Booking
├── proxy.ts                              # Auth middleware (Next.js 16: bukan middleware.ts)
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
NEXTAUTH_URL=http://localhost:3000        # ganti ke Vercel URL saat deploy
NEXTAUTH_SECRET=xxxx                      # node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxx
SUPABASE_SERVICE_ROLE_KEY=xxxx
DATABASE_URL="postgresql://postgres.REF:PASS@aws-X-REGION.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.REF:PASS@aws-X-REGION.pooler.supabase.com:5432/postgres"

# Gemini AI
GEMINI_API_KEY=AIzaSy-xxxx               # dari aistudio.google.com

# Resend
RESEND_API_KEY=re_xxxx                   # dari resend.com

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000 # ganti ke Vercel URL saat deploy
```

---

## 9. Setup Lokal (dari Nol)

```bash
# 1. Install dependencies (sudah dilakukan, skip kalau clone fresh)
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
https://[app].vercel.app/api/auth/callback/google
```

**Gotcha — Unverified App:**
Karena app minta Calendar scope (sensitive), Google wajib verifikasi sebelum bisa publik. Untuk sementara:
- Mode **Testing**: tambahkan email user satu-satu sebagai test user (max 100)
- Mode **Published tanpa verifikasi**: user bisa login tapi ada warning screen "App not verified" → klik Advanced → Continue
- Untuk tambah test user via WhatsApp: tombol sudah ada di landing page (→ +1 628 281 2956)

---

## 11. AI Parsing — Gemini

**File:** `utils/gemini.ts`

**Model:** `gemini-2.5-flash` (stable per April 2026)

> ⚠️ Jangan pakai model lama: `gemini-2.0-flash` dan `gemini-1.5-flash` sudah dihapus Google untuk user baru. Kalau ada error 404, cek model yang tersedia:
> ```javascript
> node -e "fetch('https://generativelanguage.googleapis.com/v1beta/models?key=API_KEY').then(r=>r.json()).then(d=>d.models?.filter(m=>m.supportedGenerationMethods?.includes('generateContent')).forEach(m=>console.log(m.name)))"
> ```

**Output ParsedEvent:**
```typescript
interface ParsedEvent {
  title: string;      // judul event
  date: string;       // "YYYY-MM-DD"
  startTime: string;  // "HH:MM" (24h)
  endTime: string;    // "HH:MM" (24h)
  description: string;
  timezone: string;   // "Asia/Jakarta" (dari browser user)
  withMeet: boolean;  // true jika prompt menyebut: meet, online, video call, dll
}
```

---

## 12. Google Calendar — createCalendarEvent()

**File:** `utils/calendar.ts`

**Return:**
```typescript
interface CreateEventResult {
  eventId: string;
  meetLink?: string;  // ada jika withMeet = true
}
```

**Meet link:** Dibuat via `conferenceData.createRequest` dengan `conferenceSolutionKey.type = "hangoutsMeet"`. Butuh `conferenceDataVersion: 1` di request.

---

## 13. Fitur Berikutnya (Backlog)

| Prioritas | Fitur | Catatan |
|---|---|---|
| 🔴 High | Simpan riwayat ke DB | Sekarang di localStorage, hilang kalau clear browser |
| 🔴 High | Deploy ke Vercel | Belum production |
| 🟡 Medium | Recurring event | "Setiap Senin jam 9" → event berulang |
| 🟡 Medium | Edit / hapus event | Dari riwayat, bisa edit atau hapus event di Calendar |
| 🟡 Medium | Timezone otomatis | Auto-detect dari browser sudah ada, tapi belum bisa di-override manual |
| 🟢 Low | Notifikasi WhatsApp | Selain email, kirim reminder via WhatsApp |
| 🟢 Low | Voice input | Ketik suara → prompt teks |
| 🟢 Low | Integrasi Notion/Todoist | Sync task dari tools lain |

---

## 14. Known Issues & Quirks

| Issue | Status | Solusi |
|---|---|---|
| Next.js 16: `middleware.ts` deprecated | ✅ Fixed | Diganti `proxy.ts` |
| Next.js 16: `params` async | ✅ Fixed | `const { id } = await params` |
| shadcn/ui v4: tidak ada `asChild` di Button | ✅ Fixed | Pakai `Link` + `buttonVariants()` langsung |
| Prisma 7 tidak kompatibel dengan NextAuth adapter | ✅ Fixed | Downgrade ke Prisma 6 |
| Google Fonts gagal fetch saat build | ✅ Fixed | Pakai package `geist` (local) |
| Supabase connection string format baru | ✅ Fixed | `postgres.PROJECT_REF` sebagai username, port 6543 |
| Google Calendar "Lihat →" link 400 error | ✅ Fixed | Link ke `calendar.google.com/calendar/r` saja |
| Riwayat hilang saat clear browser | ⏳ Backlog | Perlu simpan ke DB |
