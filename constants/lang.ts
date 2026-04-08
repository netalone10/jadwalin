export type Lang = "id" | "en";

export const LANG = {
  id: {
    // Landing
    headline: "Booking page profesional,\ntanpa bayar Calendly.",
    tagline: "Login Google, setup dalam 5 menit, share linknya.",
    cta: "Mulai Gratis dengan Google",
    featureTitle1: "Tanpa biaya langganan",
    featureDesc1: "Gratis selamanya. Tidak perlu kartu kredit.",
    featureTitle2: "Google Calendar sync",
    featureDesc2: "Slot otomatis menyesuaikan jadwal kalender kamu.",
    featureTitle3: "Email otomatis",
    featureDesc3: "Booker dan host dapat konfirmasi email langsung.",

    // Dashboard
    dashboardTitle: "Booking Pages Saya",
    newPage: "Buat Booking Page Baru",
    upcomingBookings: "Upcoming Bookings",
    noPages: "Belum ada booking page. Buat sekarang!",
    noBookings: "Belum ada booking.",
    viewBookings: "Lihat Bookings",
    editPage: "Edit",
    viewPage: "Lihat",
    deletePage: "Hapus",
    active: "Aktif",
    inactive: "Nonaktif",
    minutes: "menit",

    // Setup form
    pageTitle: "Judul Agenda",
    pageTitlePlaceholder: "misal: Konsultasi 30 Menit",
    pageSlug: "URL Booking",
    pageDesc: "Deskripsi (opsional)",
    pageDescPlaceholder: "Ceritakan sedikit tentang meeting ini...",
    duration: "Durasi Meeting",
    buffer: "Jeda Antar Meeting",
    bufferNone: "Tanpa jeda",
    workingDays: "Hari Kerja",
    workingHours: "Jam Kerja",
    workingStart: "Mulai",
    workingEnd: "Selesai",
    timezone: "Timezone",
    accentColor: "Warna Aksen",
    saveBtn: "Simpan",
    createBtn: "Buat Booking Page",
    slugHint: "Link kamu: ",
    slugChecking: "Mengecek...",
    slugAvailable: "Tersedia",
    slugTaken: "Sudah dipakai",
    editTitle: "Edit Booking Page",
    createTitle: "Buat Booking Page Baru",

    // Public booking page
    pickDate: "Pilih Tanggal",
    pickSlot: "Pilih Waktu",
    noSlots: "Tidak ada slot tersedia di tanggal ini.",
    yourName: "Nama Kamu",
    yourEmail: "Email Kamu",
    notes: "Catatan (opsional)",
    notesPlaceholder: "Ada hal yang perlu disampaikan?",
    confirmBtn: "Konfirmasi Booking",
    successTitle: "Booking Dikonfirmasi!",
    successMsg: "Cek email kamu untuk detail booking.",
    backToCalendar: "Pilih waktu lain",
    hostedBy: "Dijadwalkan oleh",
    duration_label: "Durasi",

    // Cancel
    cancelBtn: "Batalkan",
    cancelConfirm: "Yakin mau batalkan booking ini?",
    cancelSuccess: "Booking dibatalkan.",
    cancelNo: "Tidak",
    cancelYes: "Ya, batalkan",

    // Bookings list
    bookingsTitle: "Daftar Booking",
    bookerName: "Nama",
    bookerEmail: "Email",
    bookingTime: "Waktu",
    bookingStatus: "Status",
    statusConfirmed: "Dikonfirmasi",
    statusCancelled: "Dibatalkan",
    upcoming: "Mendatang",
    past: "Lewat",

    // Errors
    slotTaken: "Slot ini sudah diambil. Silakan pilih waktu lain.",
    genericError: "Terjadi kesalahan. Coba lagi.",
    tokenError: "Sesi berakhir. Silakan login kembali.",

    // Toggle days
    days: ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"],
    months: [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember",
    ],

    // Nav
    dashboard: "Dashboard",
    logout: "Keluar",
    login: "Masuk dengan Google",
  },
  en: {
    // Landing
    headline: "Professional booking page,\nwithout paying for Calendly.",
    tagline: "Login with Google, set up in 5 minutes, share your link.",
    cta: "Get Started Free with Google",
    featureTitle1: "No subscription fee",
    featureDesc1: "Free forever. No credit card required.",
    featureTitle2: "Google Calendar sync",
    featureDesc2: "Slots automatically adjust to your calendar schedule.",
    featureTitle3: "Automatic emails",
    featureDesc3: "Booker and host get confirmation emails instantly.",

    // Dashboard
    dashboardTitle: "My Booking Pages",
    newPage: "Create New Booking Page",
    upcomingBookings: "Upcoming Bookings",
    noPages: "No booking pages yet. Create one!",
    noBookings: "No bookings yet.",
    viewBookings: "View Bookings",
    editPage: "Edit",
    viewPage: "View",
    deletePage: "Delete",
    active: "Active",
    inactive: "Inactive",
    minutes: "min",

    // Setup form
    pageTitle: "Event Title",
    pageTitlePlaceholder: "e.g.: 30-Minute Consultation",
    pageSlug: "Booking URL",
    pageDesc: "Description (optional)",
    pageDescPlaceholder: "Tell a bit about this meeting...",
    duration: "Meeting Duration",
    buffer: "Buffer Between Meetings",
    bufferNone: "No buffer",
    workingDays: "Working Days",
    workingHours: "Working Hours",
    workingStart: "Start",
    workingEnd: "End",
    timezone: "Timezone",
    accentColor: "Accent Color",
    saveBtn: "Save",
    createBtn: "Create Booking Page",
    slugHint: "Your link: ",
    slugChecking: "Checking...",
    slugAvailable: "Available",
    slugTaken: "Already taken",
    editTitle: "Edit Booking Page",
    createTitle: "Create New Booking Page",

    // Public booking page
    pickDate: "Pick a Date",
    pickSlot: "Pick a Time",
    noSlots: "No available slots on this date.",
    yourName: "Your Name",
    yourEmail: "Your Email",
    notes: "Notes (optional)",
    notesPlaceholder: "Anything you'd like to share?",
    confirmBtn: "Confirm Booking",
    successTitle: "Booking Confirmed!",
    successMsg: "Check your email for booking details.",
    backToCalendar: "Pick a different time",
    hostedBy: "Hosted by",
    duration_label: "Duration",

    // Cancel
    cancelBtn: "Cancel",
    cancelConfirm: "Are you sure you want to cancel this booking?",
    cancelSuccess: "Booking cancelled.",
    cancelNo: "No",
    cancelYes: "Yes, cancel",

    // Bookings list
    bookingsTitle: "Bookings",
    bookerName: "Name",
    bookerEmail: "Email",
    bookingTime: "Time",
    bookingStatus: "Status",
    statusConfirmed: "Confirmed",
    statusCancelled: "Cancelled",
    upcoming: "Upcoming",
    past: "Past",

    // Errors
    slotTaken: "This slot is already taken. Please pick another time.",
    genericError: "Something went wrong. Please try again.",
    tokenError: "Session expired. Please log in again.",

    // Toggle days
    days: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    months: [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December",
    ],

    // Nav
    dashboard: "Dashboard",
    logout: "Sign out",
    login: "Sign in with Google",
  },
} as const;

export type LangStrings = typeof LANG.id;
