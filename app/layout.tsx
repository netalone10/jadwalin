import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  title: "Jadwalin — Jadwalkan dengan Bahasa Natural",
  description:
    "Ketik jadwalmu seperti chat biasa. Jadwalin simpan langsung ke Google Calendar.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}>
      <body className="min-h-screen flex flex-col bg-white text-gray-900 font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
