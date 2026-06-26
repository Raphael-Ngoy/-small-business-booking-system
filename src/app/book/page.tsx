"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { bookingSchema } from "@/lib/validation";
import { z } from "zod";

type Service = {
  id: string;
  name: string;
  description: string | null;
  duration: number;
  price: number;
};

const TIME_SLOTS = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
  "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
];

function BookForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);

  const [formData, setFormData] = useState({
    serviceId: searchParams.get("service") || "",
    date: "",
    startTime: "",
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    notes: "",
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch("/api/services")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setServices(data);
      })
      .catch(() => {})
      .finally(() => setServicesLoading(false));
  }, []);

  const selectedService = services.find((s) => s.id === formData.serviceId);

  const validateForm = () => {
    try {
      bookingSchema.parse({
        serviceId: formData.serviceId,
        date: formData.date,
        startTime: formData.startTime,
        customerName: formData.customerName,
        customerEmail: formData.customerEmail,
        customerPhone: formData.customerPhone,
        notes: formData.notes || undefined,
      });
      setFieldErrors({});
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        err.issues.forEach((issue) => {
          const path = issue.path.join(".");
          if (!errors[path]) errors[path] = issue.message;
        });
        setFieldErrors(errors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) return;

    setLoading(true);

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create booking");
      }

      setSuccess(true);
      setTimeout(() => router.push("/"), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: string, value: string) => {
    const trimmed = field === "customerPhone" ? value.trim() : value;
    setFormData((prev) => ({ ...prev, [field]: trimmed }));
    // Clear field error when user types
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
        <div className="max-w-md w-full border border-white/10 bg-white/5 p-8 text-center">
          <div className="text-cyan-500 text-5xl mb-4">✓</div>
          <h1 className="text-3xl font-bold mb-2">Booking Confirmed!</h1>
          <p className="text-gray-400 mb-6">
            Your appointment has been scheduled. Redirecting to home...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link href="/" className="inline-block text-cyan-500 hover:text-cyan-400 mb-8 transition-colors">
          ← Back to Home
        </Link>

        <h1 className="text-4xl font-bold mb-8">Book an Appointment</h1>

        {/* Progress */}
        <div className="flex gap-2 mb-12">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1 flex-1 transition-colors ${
                s <= step ? "bg-cyan-500" : "bg-white/10"
              }`}
            />
          ))}
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 mb-6 animate-in fade-in">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Step 1: Service */}
          {step === 1 && (
            <div>
              <h2 className="text-2xl font-semibold mb-6">Select a Service</h2>
              {servicesLoading ? (
                <div className="text-gray-400 py-8 text-center">Loading services...</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {services.map((service) => (
                    <button
                      key={service.id}
                      type="button"
                      onClick={() => updateField("serviceId", service.id)}
                      className={`p-4 border text-left transition-all ${
                        formData.serviceId === service.id
                          ? "border-cyan-500 bg-cyan-500/10 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                          : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/[0.07]"
                      }`}
                    >
                      <div className="font-semibold">{service.name}</div>
                      {service.description && (
                        <div className="text-sm text-gray-400 mt-1">{service.description}</div>
                      )}
                      <div className="text-sm text-gray-400 mt-1">{service.duration} min</div>
                      <div className="text-cyan-500 font-bold mt-2">${service.price}</div>
                    </button>
                  ))}
                </div>
              )}
              {formData.serviceId && (
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="mt-6 w-full bg-cyan-500 text-black font-semibold py-3 hover:bg-cyan-400 transition-colors"
                >
                  Continue
                </button>
              )}
            </div>
          )}

          {/* Step 2: Date & Time */}
          {step === 2 && (
            <div>
              <h2 className="text-2xl font-semibold mb-6">Choose Date & Time</h2>

              <div className="space-y-6">
                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-gray-300 mb-2">
                    Date
                  </label>
                  <input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => updateField("date", e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    required
                    className="w-full bg-black border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Available Time Slots
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {TIME_SLOTS.map((time) => (
                      <button
                        key={time}
                        type="button"
                        onClick={() => updateField("startTime", time)}
                        className={`py-2 px-3 border text-sm transition-all ${
                          formData.startTime === time
                            ? "border-cyan-500 bg-cyan-500/10 text-cyan-500"
                            : "border-white/10 bg-white/5 hover:border-white/20"
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 border border-white/20 text-white font-semibold py-3 hover:bg-white/5 transition-colors"
                >
                  Back
                </button>
                {formData.date && formData.startTime && (
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="flex-1 bg-cyan-500 text-black font-semibold py-3 hover:bg-cyan-400 transition-colors"
                  >
                    Continue
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Contact Info */}
          {step === 3 && (
            <div>
              <h2 className="text-2xl font-semibold mb-6">Your Information</h2>

              {selectedService && (
                <div className="border border-white/10 bg-white/5 p-4 mb-6">
                  <div className="font-semibold">{selectedService.name}</div>
                  <div className="text-sm text-gray-400">
                    {selectedService.duration} min • ${selectedService.price}
                  </div>
                  <div className="text-sm text-gray-400 mt-1">
                    {formData.date} at {formData.startTime}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label htmlFor="customerName" className="block text-sm font-medium text-gray-300 mb-2">
                    Full Name
                  </label>
                  <input
                    id="customerName"
                    type="text"
                    value={formData.customerName}
                    onChange={(e) => updateField("customerName", e.target.value)}
                    className={`w-full bg-black border text-white px-4 py-3 focus:outline-none transition-colors ${
                      fieldErrors.customerName
                        ? "border-red-500/50 focus:border-red-500"
                        : "border-white/10 focus:border-cyan-500"
                    }`}
                    placeholder="John Doe"
                  />
                  {fieldErrors.customerName && (
                    <p className="text-red-400 text-sm mt-1">{fieldErrors.customerName}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="customerEmail" className="block text-sm font-medium text-gray-300 mb-2">
                    Email
                  </label>
                  <input
                    id="customerEmail"
                    type="email"
                    value={formData.customerEmail}
                    onChange={(e) => updateField("customerEmail", e.target.value)}
                    className={`w-full bg-black border text-white px-4 py-3 focus:outline-none transition-colors ${
                      fieldErrors.customerEmail
                        ? "border-red-500/50 focus:border-red-500"
                        : "border-white/10 focus:border-cyan-500"
                    }`}
                    placeholder="john@example.com"
                  />
                  {fieldErrors.customerEmail && (
                    <p className="text-red-400 text-sm mt-1">{fieldErrors.customerEmail}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="customerPhone" className="block text-sm font-medium text-gray-300 mb-2">
                    Phone
                  </label>
                  <input
                    id="customerPhone"
                    type="tel"
                    value={formData.customerPhone}
                    onChange={(e) => updateField("customerPhone", e.target.value)}
                    className={`w-full bg-black border text-white px-4 py-3 focus:outline-none transition-colors ${
                      fieldErrors.customerPhone
                        ? "border-red-500/50 focus:border-red-500"
                        : "border-white/10 focus:border-cyan-500"
                    }`}
                    placeholder="+1 234 567 8900"
                  />
                  {fieldErrors.customerPhone && (
                    <p className="text-red-400 text-sm mt-1">{fieldErrors.customerPhone}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-300 mb-2">
                    Notes (optional)
                  </label>
                  <textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => updateField("notes", e.target.value)}
                    rows={3}
                    className="w-full bg-black border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-cyan-500"
                    placeholder="Any special requests..."
                  />
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex-1 border border-white/20 text-white font-semibold py-3 hover:bg-white/5 transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-cyan-500 text-black font-semibold py-3 hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Booking...
                    </>
                  ) : (
                    "Confirm Booking"
                  )}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

export default function BookPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>}>
      <BookForm />
    </Suspense>
  );
}