"use client";

import { useSession, signIn } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { useLang } from "@/components/LangToggle";
import { LANG } from "@/constants/lang";

export default function LandingPage() {
  const { status } = useSession();
  const router = useRouter();
  const [lang] = useLang();
  const t = LANG[lang];

  useEffect(() => {
    if (status === "authenticated") router.push("/dashboard");
  }, [status, router]);

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Navbar />
      <main className="flex-1 flex flex-col items-center justify-center px-4 text-center">

        {/* Hero */}
        <div className="max-w-xl mx-auto">
          <div className="text-5xl mb-6">🗓</div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight mb-4">
            {t.heroHeadline}{" "}
            <span className="text-blue-600">{t.heroHighlight}</span>
          </h1>
          <p className="text-lg text-gray-500 mb-8">{t.heroSubtitle}</p>

          {/* Demo prompt */}
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 mb-8 text-left">
            <p className="text-sm text-gray-400 mb-2 font-medium">Contoh:</p>
            {[
              "Meeting sama Budi besok jam 3 sore",
              "Deadline laporan 20 April jam 23:59",
              "Presentasi klien Jumat depan jam 10 pagi",
            ].map((ex) => (
              <div key={ex} className="flex items-center gap-2 py-1.5">
                <span className="text-blue-400">→</span>
                <span className="text-sm text-gray-700">{ex}</span>
              </div>
            ))}
          </div>

          <button
            onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
            className="inline-flex items-center gap-3 px-6 py-3.5 bg-blue-600 text-white rounded-xl font-semibold text-base hover:bg-blue-700 transition-colors shadow-sm"
          >
            <GoogleIcon />
            {t.startWithGoogle}
          </button>

          <div className="mt-4 flex flex-col items-center gap-2">
            <p className="text-sm text-gray-400">{t.requestAccessNote}</p>
            <a
              href={`https://wa.me/16282812956?text=${encodeURIComponent("test user: [your email]")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-500 text-white rounded-xl font-medium text-sm hover:bg-green-600 transition-colors"
            >
              <WhatsAppIcon />
              {t.requestAccess}
            </a>
          </div>
        </div>
      </main>

      <footer className="py-6 text-center text-xs text-gray-300">
        Jadwalin · Powered by Gemini AI + Google Calendar
      </footer>
    </div>
  );
}

function WhatsAppIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4" />
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853" />
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05" />
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335" />
    </svg>
  );
}
