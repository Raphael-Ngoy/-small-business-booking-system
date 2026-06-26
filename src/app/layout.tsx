import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Providers from "@/components/providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "BookingPro | Smart Business Booking System",
    template: "%s | BookingPro",
  },
  description:
    "Professional booking management for barbers, salons, clinics, tutors, and service businesses. Streamline your appointments with BookingPro.",
  keywords: [
    "booking system",
    "appointment scheduling",
    "business management",
    "barber booking",
    "salon booking",
    "clinic scheduler",
    "tutor scheduling",
    "service business",
  ],
  openGraph: {
    title: "BookingPro | Smart Business Booking System",
    description:
      "Professional booking management for barbers, salons, clinics, tutors, and service businesses.",
    type: "website",
    locale: "en_US",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
