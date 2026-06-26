"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminTopBar from "@/components/admin/AdminTopBar";

export const dynamic = 'force-dynamic';

type User = {
  id: string;
  email: string;
  name: string | null;
  role: string;
};

type Service = {
  id: string;
  name: string;
  description: string | null;
  duration: number;
  price: number;
  active: boolean;
};

type BusinessSettings = Record<string, string>;

export default function SettingsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState("business");
  const [users, setUsers] = useState<User[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [settings, setSettings] = useState<BusinessSettings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [serviceSearch, setServiceSearch] = useState("");
  const [serviceFilter, setServiceFilter] = useState<"all" | "active" | "inactive">("all");

  const navItems = [
    { label: "Dashboard", href: "/admin", icon: "📊" },
    { label: "Bookings", href: "/admin", icon: "📅" },
    { label: "Users", href: "/admin/users", icon: "👥" },
    { label: "Settings", href: "/admin/settings", icon: "⚙️" },
    { label: "Profile", href: "/admin/profile", icon: "👤" },
  ];

  // Service form state
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [serviceForm, setServiceForm] = useState({ name: "", description: "", duration: "", price: "", active: true });

  // Business settings form
  const [businessForm, setBusinessForm] = useState<{
    businessName: string;
    businessPhone: string;
    businessEmail: string;
    businessAddress: string;
    timezone: string;
    currency: string;
    bookingWindowDays: string;
    slotInterval: string;
    hours?: Record<string, { openTime: string | null; closeTime: string | null; closed: boolean }>;
  }>({
    businessName: "",
    businessPhone: "",
    businessEmail: "",
    businessAddress: "",
    timezone: "",
    currency: "USD",
    bookingWindowDays: "30",
    slotInterval: "30",
  });

  // Appearance settings
  const [appearanceForm, setAppearanceForm] = useState({
    primaryColor: "#06b6d4",
    accentColor: "#3b82f6",
    darkMode: true,
    logoUrl: "",
  });

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/admin/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchUsers();
      fetchServices();
      fetchSettings();
    }
  }, [status]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchServices();
    }
  }, [serviceSearch, serviceFilter]);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchServices = async () => {
    try {
      const params = new URLSearchParams();
      if (serviceSearch) params.append("search", serviceSearch);
      if (serviceFilter !== "all") params.append("active", serviceFilter === "active" ? "true" : "false");

      const res = await fetch(`/api/admin/services?${params}`);
      if (res.ok) {
        const data = await res.json();
        setServices(data);
      }
    } catch (error) {
      console.error("Failed to fetch services:", error);
    }
  };

  const fetchSettings = async () => {
    try {
      const [settingsRes, hoursRes, appearanceRes] = await Promise.all([
        fetch("/api/admin/settings"),
        fetch("/api/admin/settings/hours"),
        fetch("/api/admin/settings/appearance"),
      ]);

      if (settingsRes.ok) {
        const data = await settingsRes.json();
        setSettings(data);
        setBusinessForm({
          businessName: data.businessName || "",
          businessPhone: data.businessPhone || "",
          businessEmail: data.businessEmail || "",
          businessAddress: data.businessAddress || "",
          timezone: data.timezone || "UTC",
          currency: data.currency || "USD",
          bookingWindowDays: data.bookingWindowDays || "30",
          slotInterval: data.slotInterval || "30",
        });
      }

      if (hoursRes.ok) {
        const hours = await hoursRes.json();
        setBusinessForm((prev) => ({ ...prev, hours }));
      }

      if (appearanceRes.ok) {
        const appearance = await appearanceRes.json();
        setAppearanceForm({
          primaryColor: appearance.primaryColor || "#06b6d4",
          accentColor: appearance.accentColor || "#3b82f6",
          darkMode: appearance.darkMode ?? true,
          logoUrl: appearance.logoUrl || "",
        });
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error);
    }
  };

  const saveBusinessSettings = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(businessForm),
      });
      if (res.ok) {
        showToast("success", "Business settings saved");
      } else {
        showToast("error", "Failed to save settings");
      }
    } catch {
      showToast("error", "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const saveAppearanceSettings = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(appearanceForm),
      });
      if (res.ok) {
        showToast("success", "Appearance settings saved");
      } else {
        showToast("error", "Failed to save settings");
      }
    } catch {
      showToast("error", "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      if (res.ok) {
        showToast("success", `User role updated to ${newRole}`);
        fetchUsers();
      } else {
        const data = await res.json();
        showToast("error", data.error || "Failed to update role");
      }
    } catch (error) {
      showToast("error", "Something went wrong");
    }
  };

  const openServiceModal = (service?: Service) => {
    if (service) {
      setEditingService(service);
      setServiceForm({
        name: service.name,
        description: service.description || "",
        duration: String(service.duration),
        price: String(service.price),
        active: service.active,
      });
    } else {
      setEditingService(null);
      setServiceForm({ name: "", description: "", duration: "", price: "", active: true });
    }
    setShowServiceModal(true);
  };

  const saveService = async () => {
    if (!serviceForm.name || !serviceForm.duration || !serviceForm.price) {
      showToast("error", "Name, duration, and price are required");
      return;
    }

    try {
      const url = editingService ? `/api/admin/services/${editingService.id}` : "/api/admin/services";
      const method = editingService ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: serviceForm.name,
          description: serviceForm.description,
          duration: Number(serviceForm.duration),
          price: Number(serviceForm.price),
          active: serviceForm.active,
        }),
      });

      if (res.ok) {
        showToast("success", editingService ? "Service updated" : "Service created");
        setShowServiceModal(false);
        fetchServices();
      } else {
        const data = await res.json();
        showToast("error", data.error || "Failed to save service");
      }
    } catch {
      showToast("error", "Something went wrong");
    }
  };

  const deleteService = async (serviceId: string) => {
    if (!confirm("Are you sure you want to delete this service?")) return;

    try {
      const res = await fetch(`/api/admin/services/${serviceId}`, { method: "DELETE" });
      if (res.ok) {
        showToast("success", "Service deleted");
        fetchServices();
      } else {
        showToast("error", "Failed to delete service");
      }
    } catch {
      showToast("error", "Something went wrong");
    }
  };

  const toggleServiceActive = async (serviceId: string, active: boolean) => {
    try {
      const res = await fetch(`/api/admin/services/${serviceId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !active }),
      });

      if (res.ok) {
        showToast("success", `Service ${!active ? "enabled" : "disabled"}`);
        fetchServices();
      } else {
        showToast("error", "Failed to update service");
      }
    } catch {
      showToast("error", "Something went wrong");
    }
  };

  if (status === "loading" || loading) {
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

  if (!session) return null;

  const filteredUsers = users.filter(
    (u) =>
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.name && u.name.toLowerCase().includes(userSearch.toLowerCase()))
  );

  const tabs = [
    { id: "business", label: "Business" },
    { id: "hours", label: "Working Hours" },
    { id: "services", label: "Services" },
    { id: "users", label: "Users" },
    { id: "appearance", label: "Appearance" },
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      {toast && (
        <div className="fixed top-4 right-4 z-50">
          <div className={`px-6 py-3 border shadow-lg ${
            toast.type === "success"
              ? "bg-green-500/10 border-green-500/50 text-green-400"
              : "bg-red-500/10 border-red-500/50 text-red-400"
          }`}>
            {toast.message}
          </div>
        </div>
      )}

      <AdminSidebar collapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)} />

      <main className={`transition-all ${sidebarCollapsed ? "ml-16" : "ml-64"}`}>
        <AdminTopBar title="Settings" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Tabs */}
          <div className="flex gap-1 border-b border-white/10 mb-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${
                  activeTab === tab.id
                    ? "border-cyan-500 text-cyan-500"
                    : "border-transparent text-gray-400 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Business Settings */}
          {activeTab === "business" && (
            <div className="space-y-6">
              <div className="border border-white/10 bg-white/5 p-6">
                <h3 className="text-lg font-semibold mb-4">Business Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Business Name</label>
                    <input
                      type="text"
                      value={businessForm.businessName}
                      onChange={(e) => setBusinessForm({ ...businessForm, businessName: e.target.value })}
                      className="w-full bg-black border border-white/10 text-white px-4 py-2 focus:outline-none focus:border-cyan-500"
                      placeholder="My Business"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Phone</label>
                    <input
                      type="text"
                      value={businessForm.businessPhone}
                      onChange={(e) => setBusinessForm({ ...businessForm, businessPhone: e.target.value })}
                      className="w-full bg-black border border-white/10 text-white px-4 py-2 focus:outline-none focus:border-cyan-500"
                      placeholder="+1 234 567 8900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Email</label>
                    <input
                      type="email"
                      value={businessForm.businessEmail}
                      onChange={(e) => setBusinessForm({ ...businessForm, businessEmail: e.target.value })}
                      className="w-full bg-black border border-white/10 text-white px-4 py-2 focus:outline-none focus:border-cyan-500"
                      placeholder="contact@business.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Address</label>
                    <input
                      type="text"
                      value={businessForm.businessAddress}
                      onChange={(e) => setBusinessForm({ ...businessForm, businessAddress: e.target.value })}
                      className="w-full bg-black border border-white/10 text-white px-4 py-2 focus:outline-none focus:border-cyan-500"
                      placeholder="123 Main St, City"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Timezone</label>
                    <select
                      value={businessForm.timezone}
                      onChange={(e) => setBusinessForm({ ...businessForm, timezone: e.target.value })}
                      className="w-full bg-black border border-white/10 text-white px-4 py-2 focus:outline-none focus:border-cyan-500"
                    >
                      <option value="UTC">UTC</option>
                      <option value="America/New_York">Eastern Time</option>
                      <option value="America/Chicago">Central Time</option>
                      <option value="America/Denver">Mountain Time</option>
                      <option value="America/Los_Angeles">Pacific Time</option>
                      <option value="Europe/London">London</option>
                      <option value="Europe/Paris">Paris</option>
                      <option value="Africa/Johannesburg">Johannesburg</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Currency</label>
                    <select
                      value={businessForm.currency}
                      onChange={(e) => setBusinessForm({ ...businessForm, currency: e.target.value })}
                      className="w-full bg-black border border-white/10 text-white px-4 py-2 focus:outline-none focus:border-cyan-500"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="ZAR">ZAR (R)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Booking Window (days)</label>
                    <input
                      type="number"
                      value={businessForm.bookingWindowDays}
                      onChange={(e) => setBusinessForm({ ...businessForm, bookingWindowDays: e.target.value })}
                      className="w-full bg-black border border-white/10 text-white px-4 py-2 focus:outline-none focus:border-cyan-500"
                      min="1"
                      max="365"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Slot Interval (minutes)</label>
                    <select
                      value={businessForm.slotInterval}
                      onChange={(e) => setBusinessForm({ ...businessForm, slotInterval: e.target.value })}
                      className="w-full bg-black border border-white/10 text-white px-4 py-2 focus:outline-none focus:border-cyan-500"
                    >
                      <option value="15">15 minutes</option>
                      <option value="30">30 minutes</option>
                      <option value="60">60 minutes</option>
                    </select>
                  </div>
                </div>
                <div className="mt-6">
                  <button
                    onClick={saveBusinessSettings}
                    disabled={saving}
                    className="px-6 py-2 bg-cyan-500 text-black font-medium hover:bg-cyan-400 transition-colors disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Save Business Settings"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Working Hours */}
          {activeTab === "hours" && (
            <div className="space-y-6">
              <div className="border border-white/10 bg-white/5 p-6">
                <h3 className="text-lg font-semibold mb-4">Working Hours</h3>
                <div className="space-y-4">
                  {["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].map((day) => {
                    const rawDayData = (businessForm.hours as Record<string, { openTime: string | null; closeTime: string | null; closed: boolean }> | undefined)?.[day];
                    const dayData = rawDayData || { openTime: "09:00", closeTime: "17:00", closed: false };
                    const displayOpenTime = dayData.closed ? "" : (dayData.openTime || "");
                    const displayCloseTime = dayData.closed ? "" : (dayData.closeTime || "");
                    return (
                      <div key={day} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
                        <div className="font-medium capitalize text-gray-300">{day}</div>
                        <div className="flex items-center gap-2">
                          <input
                            type="time"
                            value={displayOpenTime}
                            disabled={dayData.closed}
                            onChange={(e) => {
                              const hours = { ...(businessForm.hours as Record<string, { openTime: string | null; closeTime: string | null; closed: boolean }> || {}) };
                              hours[day] = { ...hours[day], openTime: e.target.value };
                              setBusinessForm({ ...businessForm, hours });
                            }}
                            className="bg-black border border-white/10 text-white px-3 py-2 focus:outline-none focus:border-cyan-500 disabled:opacity-30"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="time"
                            value={displayCloseTime}
                            disabled={dayData.closed}
                            onChange={(e) => {
                              const hours = { ...(businessForm.hours as Record<string, { openTime: string | null; closeTime: string | null; closed: boolean }> || {}) };
                              hours[day] = { ...hours[day], closeTime: e.target.value };
                              setBusinessForm({ ...businessForm, hours });
                            }}
                            className="bg-black border border-white/10 text-white px-3 py-2 focus:outline-none focus:border-cyan-500 disabled:opacity-30"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`closed-${day}`}
                            checked={dayData.closed}
                            onChange={(e) => {
                              const hours = { ...(businessForm.hours as Record<string, { openTime: string | null; closeTime: string | null; closed: boolean }> || {}) };
                              hours[day] = { 
                                ...hours[day], 
                                closed: e.target.checked,
                                openTime: e.target.checked ? null : (hours[day]?.openTime || '09:00'),
                                closeTime: e.target.checked ? null : (hours[day]?.closeTime || '17:00')
                              };
                              setBusinessForm({ ...businessForm, hours });
                            }}
                            className="w-4 h-4 bg-black border border-white/10 rounded"
                          />
                          <label htmlFor={`closed-${day}`} className="text-sm text-gray-400">Closed</label>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-6">
                  <button
                    onClick={async () => {
                      setSaving(true);
                      try {
                        const res = await fetch("/api/admin/settings/hours", {
                          method: "PUT",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify(businessForm.hours),
                        });
                        if (res.ok) {
                          showToast("success", "Working hours saved successfully");
                          // Refetch hours to confirm persistence
                          const hoursRes = await fetch("/api/admin/settings/hours");
                          if (hoursRes.ok) {
                            const hours = await hoursRes.json();
                            setBusinessForm((prev) => ({ ...prev, hours }));
                          }
                        } else {
                          showToast("error", "Failed to save hours");
                        }
                      } catch {
                        showToast("error", "Something went wrong");
                      } finally {
                        setSaving(false);
                      }
                    }}
                    disabled={saving}
                    className="px-6 py-2 bg-cyan-500 text-black font-medium hover:bg-cyan-400 transition-colors disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Save Working Hours"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Services Management */}
          {activeTab === "services" && (
            <div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h3 className="text-lg font-semibold">Services</h3>
                <button
                  onClick={() => openServiceModal()}
                  className="px-4 py-2 bg-cyan-500 text-black font-medium hover:bg-cyan-400 transition-colors"
                >
                  + Add Service
                </button>
              </div>

              {/* Search and Filter */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <input
                    type="text"
                    value={serviceSearch}
                    onChange={(e) => setServiceSearch(e.target.value)}
                    placeholder="Search services..."
                    className="w-full bg-black border border-white/10 text-white px-4 py-2 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <select
                    value={serviceFilter}
                    onChange={(e) => setServiceFilter(e.target.value as "all" | "active" | "inactive")}
                    className="w-full sm:w-auto bg-black border border-white/10 text-white px-4 py-2 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="all">All</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="border border-white/10 bg-white/5">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left px-6 py-3 text-sm font-medium text-gray-400">Name</th>
                        <th className="text-left px-6 py-3 text-sm font-medium text-gray-400">Description</th>
                        <th className="text-left px-6 py-3 text-sm font-medium text-gray-400">Duration</th>
                        <th className="text-left px-6 py-3 text-sm font-medium text-gray-400">Price</th>
                        <th className="text-left px-6 py-3 text-sm font-medium text-gray-400">Status</th>
                        <th className="text-left px-6 py-3 text-sm font-medium text-gray-400">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {services.map((service) => (
                        <tr key={service.id} className="border-b border-white/5 hover:bg-white/5">
                          <td className="px-6 py-4">
                            <div className="font-medium">{service.name}</div>
                            {service.description && (
                              <div className="text-sm text-gray-400">{service.description}</div>
                            )}
                          </td>
                          <td className="px-6 py-4">{service.duration} min</td>
                          <td className="px-6 py-4">${service.price}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex px-3 py-1 text-sm font-medium ${
                              service.active
                                ? "bg-green-500/10 text-green-400 border border-green-500/50"
                                : "bg-red-500/10 text-red-400 border border-red-500/50"
                            }`}>
                              {service.active ? "Active" : "Disabled"}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              <button
                                onClick={() => openServiceModal(service)}
                                className="px-3 py-1 bg-cyan-500/10 text-cyan-400 border border-cyan-500/50 hover:bg-cyan-500/20 transition-colors text-sm"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => toggleServiceActive(service.id, service.active)}
                                className={`px-3 py-1 text-sm transition-colors ${
                                  service.active
                                    ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/50 hover:bg-yellow-500/20"
                                    : "bg-green-500/10 text-green-400 border border-green-500/50 hover:bg-green-500/20"
                                }`}
                              >
                                {service.active ? "Disable" : "Enable"}
                              </button>
                              <button
                                onClick={() => deleteService(service.id)}
                                className="px-3 py-1 bg-red-500/10 text-red-400 border border-red-500/50 hover:bg-red-500/20 transition-colors text-sm"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {services.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                            No services yet. Click "+ Add Service" to create one.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* User Management */}
          {activeTab === "users" && (
            <div>
              <div className="mb-6">
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search users by name or email..."
                  className="w-full max-w-md bg-black border border-white/10 text-white px-4 py-2 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="border border-white/10 bg-white/5">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left px-6 py-3 text-sm font-medium text-gray-400">Name</th>
                        <th className="text-left px-6 py-3 text-sm font-medium text-gray-400">Email</th>
                        <th className="text-left px-6 py-3 text-sm font-medium text-gray-400">Role</th>
                        <th className="text-left px-6 py-3 text-sm font-medium text-gray-400">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user) => (
                        <tr key={user.id} className="border-b border-white/5 hover:bg-white/5">
                          <td className="px-6 py-4 font-medium">{user.name || "—"}</td>
                          <td className="px-6 py-4 text-gray-400">{user.email}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex px-3 py-1 text-sm font-medium ${
                              user.role === "ADMIN"
                                ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/50"
                                : "bg-gray-500/10 text-gray-400 border border-gray-500/50"
                            }`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {user.email === "user@gmail.com" ? (
                              <span className="text-sm text-gray-500">Super Admin</span>
                            ) : (
                              <div className="flex gap-2">
                                {user.role === "USER" ? (
                                  <button
                                    onClick={() => updateUserRole(user.id, "ADMIN")}
                                    className="px-3 py-1 bg-cyan-500/10 text-cyan-400 border border-cyan-500/50 hover:bg-cyan-500/20 transition-colors text-sm"
                                  >
                                    Promote to Admin
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => updateUserRole(user.id, "USER")}
                                    className="px-3 py-1 bg-yellow-500/10 text-yellow-400 border border-yellow-500/50 hover:bg-yellow-500/20 transition-colors text-sm"
                                  >
                                    Demote to User
                                  </button>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Appearance Settings */}
          {activeTab === "appearance" && (
            <div className="space-y-6">
              <div className="border border-white/10 bg-white/5 p-6">
                <h3 className="text-lg font-semibold mb-4">Theme Colors</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Primary Color</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={appearanceForm.primaryColor}
                        onChange={(e) => setAppearanceForm({ ...appearanceForm, primaryColor: e.target.value })}
                        className="h-10 w-16 bg-transparent border border-white/10 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={appearanceForm.primaryColor}
                        onChange={(e) => setAppearanceForm({ ...appearanceForm, primaryColor: e.target.value })}
                        className="flex-1 bg-black border border-white/10 text-white px-4 py-2 focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Accent Color</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={appearanceForm.accentColor}
                        onChange={(e) => setAppearanceForm({ ...appearanceForm, accentColor: e.target.value })}
                        className="h-10 w-16 bg-transparent border border-white/10 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={appearanceForm.accentColor}
                        onChange={(e) => setAppearanceForm({ ...appearanceForm, accentColor: e.target.value })}
                        className="flex-1 bg-black border border-white/10 text-white px-4 py-2 focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-white/10">
                  <h4 className="text-base font-semibold mb-4">Display Settings</h4>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="darkMode"
                      checked={appearanceForm.darkMode}
                      onChange={(e) => setAppearanceForm({ ...appearanceForm, darkMode: e.target.checked })}
                      className="w-5 h-5 bg-black border border-white/10 rounded"
                    />
                    <label htmlFor="darkMode" className="text-sm text-gray-300">Dark Mode</label>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-white/10">
                  <h4 className="text-base font-semibold mb-4">Business Logo</h4>
                  {appearanceForm.logoUrl && (
                    <div className="mb-4">
                      <img
                        src={appearanceForm.logoUrl}
                        alt="Business logo"
                        className="h-16 w-auto border border-white/10 bg-black/50 p-2"
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Logo URL</label>
                    <input
                      type="text"
                      value={appearanceForm.logoUrl}
                      onChange={(e) => setAppearanceForm({ ...appearanceForm, logoUrl: e.target.value })}
                      className="w-full bg-black border border-white/10 text-white px-4 py-2 focus:outline-none focus:border-cyan-500"
                      placeholder="https://example.com/logo.png"
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    onClick={saveAppearanceSettings}
                    disabled={saving}
                    className="px-6 py-2 bg-cyan-500 text-black font-medium hover:bg-cyan-400 transition-colors disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Save Appearance Settings"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Service Modal */}
      {showServiceModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-white/10 p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">{editingService ? "Edit Service" : "New Service"}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Name *</label>
                <input
                  type="text"
                  value={serviceForm.name}
                  onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                  className="w-full bg-black border border-white/10 text-white px-4 py-2 focus:outline-none focus:border-cyan-500"
                  placeholder="Haircut"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Description</label>
                <textarea
                  value={serviceForm.description}
                  onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                  className="w-full bg-black border border-white/10 text-white px-4 py-2 focus:outline-none focus:border-cyan-500"
                  rows={3}
                  placeholder="Service description..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Duration (min) *</label>
                  <input
                    type="number"
                    value={serviceForm.duration}
                    onChange={(e) => setServiceForm({ ...serviceForm, duration: e.target.value })}
                    className="w-full bg-black border border-white/10 text-white px-4 py-2 focus:outline-none focus:border-cyan-500"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Price ($) *</label>
                  <input
                    type="number"
                    value={serviceForm.price}
                    onChange={(e) => setServiceForm({ ...serviceForm, price: e.target.value })}
                    className="w-full bg-black border border-white/10 text-white px-4 py-2 focus:outline-none focus:border-cyan-500"
                    min="0"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="active"
                  checked={serviceForm.active}
                  onChange={(e) => setServiceForm({ ...serviceForm, active: e.target.checked })}
                  className="w-4 h-4 bg-black border border-white/10 rounded"
                />
                <label htmlFor="active" className="text-sm text-gray-400">Active</label>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={saveService}
                className="flex-1 px-4 py-2 bg-cyan-500 text-black font-medium hover:bg-cyan-400 transition-colors"
              >
                {editingService ? "Update" : "Create"}
              </button>
              <button
                onClick={() => setShowServiceModal(false)}
                className="flex-1 px-4 py-2 border border-white/10 text-gray-400 hover:text-white hover:border-white/20 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}