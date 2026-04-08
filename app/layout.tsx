import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  title: "ScheduleAI — Professional Booking Pages",
  description:
    "Create a professional booking page with Google Calendar sync. Free alternative to Calendly.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="antialiased">
      <body className="min-h-screen flex flex-col bg-white text-gray-900 font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
