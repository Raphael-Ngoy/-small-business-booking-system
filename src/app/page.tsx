"use client";

import { useState, useEffect } from "react";
import PublicServices from "@/components/public-services";

type BusinessSettings = {
  businessName: string;
  businessEmail: string;
  businessPhone: string;
  businessAddress: string;
  timezone: string;
  currency: string;
  slotInterval: string;
};

type DayHours = {
  openTime: string | null;
  closeTime: string | null;
  closed: boolean;
};

export default function HomePage() {
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [hours, setHours] = useState<Record<string, DayHours>>({});
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchData = async () => {
    try {
      const [settingsRes, hoursRes] = await Promise.all([
        fetch(`/api/admin/settings?t=${Date.now()}`, { cache: 'no-store' }),
        fetch(`/api/admin/settings/hours?t=${Date.now()}`, { cache: 'no-store' }),
      ]);

      if (settingsRes.ok) {
        const data = await settingsRes.json();
        setSettings({
          businessName: data.businessName || "BookingPro",
          businessEmail: data.businessEmail || "",
          businessPhone: data.businessPhone || "",
          businessAddress: data.businessAddress || "",
          timezone: data.timezone || "UTC",
          currency: data.currency || "USD",
          slotInterval: data.slotInterval || "30",
        });
      }

      if (hoursRes.ok) {
        const hoursData = await hoursRes.json();
        setHours(hoursData);
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [refreshKey]);

  // Refetch when page becomes visible (user returns from admin panel)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setRefreshKey(prev => prev + 1);
      }
    };
    window.addEventListener('visibilitychange', handleVisibilityChange);
    return () => window.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const businessName = settings?.businessName || "BookingPro";
  const businessEmail = settings?.businessEmail || "";
  const businessPhone = settings?.businessPhone || "";
  const businessAddress = settings?.businessAddress || "";
  const timezone = settings?.timezone || "UTC";
  const currency = settings?.currency || "USD";
  const bookingInterval = settings?.slotInterval || "30";

  const formatHours = (dayData: DayHours | undefined) => {
    if (!dayData || dayData.closed) return "Closed";
    return `${dayData.openTime || '09:00'} - ${dayData.closeTime || '17:00'}`;
  };

  const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="flex items-center gap-3">
          <svg className="animate-spin h-5 w-5 text-cyan-500" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-gray-400">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-sm border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="text-3xl font-bold tracking-tighter">
              {businessName}<span className="text-cyan-500">Pro</span>
            </div>

            {/* Desktop menu */}
            <div className="hidden sm:flex items-center gap-6">
              <a href="#services" className="text-gray-300 hover:text-white transition-colors text-sm">
                Services
              </a>
              <a href="#about" className="text-gray-300 hover:text-white transition-colors text-sm">
                About
              </a>
              <a
                href="/admin/login"
                className="text-gray-300 hover:text-white transition-colors text-sm"
              >
                Admin Login
              </a>
              <a
                href="/book"
                className="bg-cyan-500 text-black font-semibold px-6 py-3 hover:bg-cyan-400 transition-all hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] text-sm"
              >
                Book Now
              </a>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="sm:hidden text-gray-300 hover:text-white transition-colors"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-t border-white/10 bg-black/95 backdrop-blur-sm">
            <div className="px-4 py-4 space-y-3">
              <a
                href="#services"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-gray-300 hover:text-white transition-colors py-2"
              >
                Services
              </a>
              <a
                href="#about"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-gray-300 hover:text-white transition-colors py-2"
              >
                About
              </a>
              <a
                href="/admin/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-gray-300 hover:text-white transition-colors py-2"
              >
                Admin Login
              </a>
              <a
                href="/book"
                onClick={() => setMobileMenuOpen(false)}
                className="block bg-cyan-500 text-black font-semibold px-6 py-3 hover:bg-cyan-400 transition-all text-center"
              >
                Book Now
              </a>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-32 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 via-transparent to-transparent" />
        <div className="max-w-5xl mx-auto text-center relative">
          <h1 className="text-5xl sm:text-7xl font-bold tracking-tight mb-8 leading-tight">
            Book appointments
            <span className="block text-cyan-500 mt-2">without the hassle</span>
          </h1>
          <p className="text-xl sm:text-2xl text-gray-400 max-w-3xl mx-auto mb-12 leading-relaxed">
            The simplest way to manage your appointments. From barbers to clinics,
            tutors to salons — we make booking effortless.
          </p>
          <a
            href="/book"
            className="inline-block bg-cyan-500 text-black font-semibold text-lg px-10 py-4 hover:bg-cyan-400 transition-all hover:shadow-[0_0_30px_rgba(6,182,212,0.3)]"
          >
            Book an Appointment
          </a>
        </div>
      </section>

      {/* Services Section */}
      <PublicServices />

      {/* About Section */}
      <section id="about" className="py-32 px-4 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-8">
              About <span className="text-cyan-500">{businessName}</span>
            </h2>
            <p className="text-xl text-gray-400 leading-relaxed">
              Professional appointment booking for modern service businesses.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Business Info */}
            <div className="border border-white/10 bg-white/5 p-8">
              <h3 className="text-2xl font-semibold mb-6">Contact Information</h3>
              <div className="space-y-4">
                {businessEmail && (
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Email</div>
                    <div className="font-medium">{businessEmail}</div>
                  </div>
                )}
                {businessPhone && (
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Phone</div>
                    <div className="font-medium">{businessPhone}</div>
                  </div>
                )}
                {businessAddress && (
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Address</div>
                    <div className="font-medium">{businessAddress}</div>
                  </div>
                )}
                <div>
                  <div className="text-sm text-gray-400 mb-1">Timezone</div>
                  <div className="font-medium">{timezone}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400 mb-1">Currency</div>
                  <div className="font-medium">{currency}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400 mb-1">Booking Interval</div>
                  <div className="font-medium">{bookingInterval} minutes</div>
                </div>
              </div>
            </div>

            {/* Working Hours */}
            <div className="border border-white/10 bg-white/5 p-8">
              <h3 className="text-2xl font-semibold mb-6">Working Hours</h3>
              <div className="space-y-3">
                {days.map((day) => (
                  <div key={day} className="flex justify-between items-center">
                    <span className="text-gray-300 capitalize">{day}</span>
                    <span className="text-sm text-gray-400">{formatHours(hours[day])}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-16 text-center">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
              {["Barbers", "Salons", "Clinics", "Tutors"].map((business) => (
                <div key={business} className="text-center">
                  <div className="text-lg font-semibold text-white">{business}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-4 bg-gradient-to-t from-cyan-500/5 via-transparent to-transparent">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-8">
            Ready to get started?
          </h2>
          <p className="text-xl text-gray-400 mb-12">
            Book your appointment in seconds. No account required.
          </p>
          <a
            href="/book"
            className="inline-block bg-cyan-500 text-black font-semibold text-lg px-10 py-4 hover:bg-cyan-400 transition-all hover:shadow-[0_0_30px_rgba(6,182,212,0.3)]"
          >
            Book an Appointment
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* Branding */}
            <div>
              <h3 className="text-xl font-bold mb-2">Orbit Booking</h3>
              <p className="text-gray-400 text-sm mb-1">v1.0.0</p>
              <p className="text-gray-500 text-sm">
                Designed & Developed by <span className="text-cyan-500">Raphael Ngoy</span>
              </p>
              <p className="text-gray-500 text-sm">Full-Stack Developer</p>
            </div>

            {/* Links */}
            <div className="flex flex-col sm:flex-row gap-4 sm:justify-end">
              <a
                href="https://github.com/Raphael-Ngoy"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 border border-white/10 text-gray-300 hover:text-white hover:border-cyan-500/50 transition-colors text-sm"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                GitHub
              </a>
              <a
                href="https://www.linkedin.com/in/raphael-ngoy-a049a927b?utm_source=share_via&utm_content=profile&utm_medium=member_ios"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 border border-white/10 text-gray-300 hover:text-white hover:border-cyan-500/50 transition-colors text-sm"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                LinkedIn
              </a>
              <a
                href="https://www.upwork.com/freelancers/~0132b146e22ca640a4"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 border border-white/10 text-gray-300 hover:text-white hover:border-cyan-500/50 transition-colors text-sm"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                Upwork
              </a>
              <a
                href="mailto:neptunedeveloper@duck.com"
                className="inline-flex items-center gap-2 px-4 py-2 border border-white/10 text-gray-300 hover:text-white hover:border-cyan-500/50 transition-colors text-sm"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002 2v10a2 2 0 002 2z"/></svg>
                Email
              </a>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-white/5 text-center text-gray-600 text-xs">
            © 2026 Orbit Booking · v1.0.0
          </div>
        </div>
      </footer>
    </div>
  );
}