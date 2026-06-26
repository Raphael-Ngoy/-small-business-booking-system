"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminTopBar from "@/components/admin/AdminTopBar";
import { TableSkeleton } from "@/components/admin/Skeleton";

export const dynamic = 'force-dynamic';

type Booking = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  notes: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  serviceName: string;
  serviceDuration: number;
  servicePrice: number;
  createdAt?: string;
  updatedAt?: string;
};

type BookingHistoryItem = {
  id: string;
  action: string;
  fromStatus: string | null;
  toStatus: string | null;
  performedBy: string | null;
  createdAt: string;
};

type FilterState = {
  status: string;
  dateFrom: string;
  dateTo: string;
  search: string;
};

type Stats = {
  pending: number;
  confirmed: number;
  completed: number;
  cancelled: number;
  today: number;
  thisMonth: number;
};

export default function AdminDashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [bookingHistory, setBookingHistory] = useState<BookingHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeStatFilter, setActiveStatFilter] = useState<string>("");
  const [stats, setStats] = useState<Stats>({
    pending: 0, confirmed: 0, completed: 0, cancelled: 0, today: 0, thisMonth: 0,
  });
  const [filters, setFilters] = useState<FilterState>({
    status: "",
    dateFrom: "",
    dateTo: "",
    search: "",
  });
  const [recentActivity, setRecentActivity] = useState<BookingHistoryItem[]>([]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/admin/login");
    }
  }, [status, router]);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append("status", filters.status);
      if (filters.dateFrom) params.append("dateFrom", filters.dateFrom);
      if (filters.dateTo) params.append("dateTo", filters.dateTo);
      if (filters.search) params.append("search", filters.search);

      const res = await fetch(`/api/admin/bookings?${params}`);
      if (res.ok) {
        const data = await res.json();
        setBookings(data);
      }
    } catch (error) {
      console.error("Failed to fetch bookings:", error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/bookings");
      if (res.ok) {
        const data = await res.json();
        const now = new Date();
        const todayStr = now.toISOString().split("T")[0];
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
        setStats({
          pending: data.filter((b: Booking) => b.status === "PENDING").length,
          confirmed: data.filter((b: Booking) => b.status === "CONFIRMED").length,
          completed: data.filter((b: Booking) => b.status === "COMPLETED").length,
          cancelled: data.filter((b: Booking) => b.status === "CANCELLED").length,
          today: data.filter((b: Booking) => b.date === todayStr).length,
          thisMonth: data.filter((b: Booking) => b.date >= monthStart).length,
        });
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  }, []);

  const fetchRecentActivity = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/activity");
      if (res.ok) {
        const data = await res.json();
        setRecentActivity(data.slice(0, 10));
      }
    } catch (error) {
      console.error("Failed to fetch activity:", error);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      fetchBookings();
      fetchStats();
      fetchRecentActivity();
    }
  }, [status, filters, fetchBookings, fetchStats, fetchRecentActivity]);

  useEffect(() => {
    if (selectedBooking) {
      fetchBookingHistory(selectedBooking.id);
    } else {
      setBookingHistory([]);
    }
  }, [selectedBooking]);

  const applyStatFilter = (statType: string) => {
    const newStatus = activeStatFilter === statType ? "" : statType;
    setActiveStatFilter(newStatus);
    setFilters((prev) => ({ ...prev, status: newStatus }));
  };

  const fetchBookingHistory = async (bookingId: string) => {
    setHistoryLoading(true);
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}/history`);
      if (res.ok) {
        const data = await res.json();
        setBookingHistory(data);
      } else {
        setBookingHistory([]);
      }
    } catch {
      setBookingHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    setActionLoading(bookingId);
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        const updated = await res.json();
        if (selectedBooking?.id === bookingId) {
          setSelectedBooking({ ...updated, createdAt: selectedBooking.createdAt, updatedAt: selectedBooking.updatedAt });
        }
        showToast("success", `Booking ${newStatus.toLowerCase()}`);
        fetchBookings();
        fetchBookingHistory(bookingId);
      } else {
        showToast("error", "Failed to update booking");
      }
    } catch (error) {
      console.error("Failed to update booking:", error);
      showToast("error", "Something went wrong");
    } finally {
      setActionLoading(null);
    }
  };

  const deleteBooking = async (bookingId: string) => {
    setActionLoading(bookingId);
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setDeleteConfirm(null);
        setSelectedBooking(null);
        setBookingHistory([]);
        showToast("success", "Booking deleted permanently");
        fetchBookings();
      } else {
        showToast("error", "Failed to delete booking");
      }
    } catch (error) {
      console.error("Failed to delete booking:", error);
      showToast("error", "Something went wrong");
    } finally {
      setActionLoading(null);
    }
  };

  if (status === "loading") {
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

  const statCards = [
    { label: "Pending", value: stats.pending, color: "yellow", filter: "PENDING" },
    { label: "Confirmed", value: stats.confirmed, color: "green", filter: "CONFIRMED" },
    { label: "Completed", value: stats.completed, color: "blue", filter: "COMPLETED" },
    { label: "Cancelled", value: stats.cancelled, color: "red", filter: "CANCELLED" },
    { label: "Today", value: stats.today, color: "cyan", filter: "__today__" },
    { label: "This Month", value: stats.thisMonth, color: "purple", filter: "__month__" },
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 animate-in fade-in slide-in-from-top-2">
          <div className={`px-6 py-3 border shadow-lg ${
            toast.type === "success"
              ? "bg-green-500/10 border-green-500/50 text-green-400"
              : "bg-red-500/10 border-red-500/50 text-red-400"
          }`}>
            {toast.message}
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 px-4">
          <div className="max-w-md w-full border border-white/10 bg-zinc-900 p-8">
            <h3 className="text-xl font-semibold mb-4">Delete this booking permanently?</h3>
            <p className="text-gray-400 mb-6">This action cannot be undone.</p>
            <div className="flex gap-4">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 border border-white/20 text-white font-semibold py-3 hover:bg-white/5 transition-colors"
                disabled={actionLoading === deleteConfirm}
              >
                Cancel
              </button>
              <button
                onClick={() => deleteBooking(deleteConfirm)}
                disabled={actionLoading === deleteConfirm}
                className="flex-1 bg-red-500/10 text-red-400 border border-red-500/50 font-semibold py-3 hover:bg-red-500/20 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {actionLoading === deleteConfirm ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Deleting...
                  </>
                ) : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      <AdminSidebar collapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)} />

      {/* Main content */}
      <main className={`transition-all ${sidebarCollapsed ? "ml-16" : "ml-64"}`}>
        <AdminTopBar title="Dashboard" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Business Overview Card */}
          <div className="border border-white/10 bg-white/5 p-6 mb-8">
            <h3 className="text-lg font-semibold mb-4">Business Overview</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              <div>
                <div className="text-sm text-gray-400 mb-1">Business Name</div>
                <div className="font-medium">BookingPro</div>
              </div>
              <div>
                <div className="text-sm text-gray-400 mb-1">Timezone</div>
                <div className="font-medium">UTC</div>
              </div>
              <div>
                <div className="text-sm text-gray-400 mb-1">Currency</div>
                <div className="font-medium">USD</div>
              </div>
              <div>
                <div className="text-sm text-gray-400 mb-1">Active Services</div>
                <div className="font-medium">—</div>
              </div>
              <div>
                <div className="text-sm text-gray-400 mb-1">Total Users</div>
                <div className="font-medium">—</div>
              </div>
              <div>
                <div className="text-sm text-gray-400 mb-1">Working Hours</div>
                <div className="font-medium">9-5</div>
              </div>
            </div>
          </div>

          {/* Stats Cards — clickable */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            {statCards.map((stat) => {
              const isActive = activeStatFilter === stat.filter;
              return (
                <button
                  key={stat.filter}
                  onClick={() => applyStatFilter(stat.filter)}
                  className={`border p-4 text-left transition-all ${
                    isActive
                      ? `border-${stat.color}-500 bg-${stat.color}-500/10 shadow-[0_0_10px_rgba(6,182,212,0.2)]`
                      : "border-white/10 bg-white/5 hover:border-white/20"
                  }`}
                >
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className={`text-${stat.color}-400 text-sm mt-1`}>{stat.label}</div>
                </button>
              );
            })}
          </div>

          {/* Filters */}
          <div className="border border-white/10 bg-white/5 p-6 mb-8">
            <h2 className="text-lg font-semibold mb-4">Filters</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => {
                    setFilters({ ...filters, status: e.target.value });
                    setActiveStatFilter("");
                  }}
                  className="w-full bg-black border border-white/10 text-white px-4 py-2 focus:outline-none focus:border-cyan-500"
                >
                  <option value="">All</option>
                  <option value="PENDING">Pending</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="CANCELLED">Cancelled</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">From Date</label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                  className="w-full bg-black border border-white/10 text-white px-4 py-2 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">To Date</label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                  className="w-full bg-black border border-white/10 text-white px-4 py-2 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Search</label>
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  placeholder="Name or email..."
                  className="w-full bg-black border border-white/10 text-white px-4 py-2 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </div>

          {/* Split layout: Table + Details */}
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Bookings Table */}
            <div className={`${selectedBooking ? "lg:w-2/3" : "lg:w-full"}`}>
              <div className="border border-white/10 bg-white/5 overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left px-6 py-3 text-sm font-medium text-gray-400">Customer</th>
                      <th className="text-left px-6 py-3 text-sm font-medium text-gray-400 hidden md:table-cell">Service</th>
                      <th className="text-left px-6 py-3 text-sm font-medium text-gray-400 hidden sm:table-cell">Date & Time</th>
                      <th className="text-left px-6 py-3 text-sm font-medium text-gray-400">Status</th>
                      <th className="text-left px-6 py-3 text-sm font-medium text-gray-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="px-0 py-0">
                          <TableSkeleton rows={4} />
                        </td>
                      </tr>
                    ) : bookings.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-gray-500">No bookings found</td>
                      </tr>
                    ) : (
                      bookings.map((booking) => (
                        <tr
                          key={booking.id}
                          className={`border-b border-white/5 transition-colors cursor-pointer ${
                            selectedBooking?.id === booking.id ? "bg-cyan-500/5" : "hover:bg-white/5"
                          }`}
                          onClick={() => setSelectedBooking(selectedBooking?.id === booking.id ? null : booking)}
                        >
                          <td className="px-6 py-4">
                            <div className="font-medium">{booking.customerName}</div>
                            <div className="text-sm text-gray-400">{booking.customerEmail}</div>
                          </td>
                          <td className="px-6 py-4 hidden md:table-cell">
                            <div className="font-medium">{booking.serviceName}</div>
                            <div className="text-sm text-gray-400">{booking.serviceDuration} min • ${booking.servicePrice}</div>
                          </td>
                          <td className="px-6 py-4 hidden sm:table-cell">
                            <div className="font-medium">{booking.date}</div>
                            <div className="text-sm text-gray-400">{booking.startTime} - {booking.endTime}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex px-3 py-1 text-sm font-medium ${
                              booking.status === "CONFIRMED" ? "bg-green-500/10 text-green-400 border border-green-500/50"
                              : booking.status === "CANCELLED" ? "bg-red-500/10 text-red-400 border border-red-500/50"
                              : booking.status === "COMPLETED" ? "bg-blue-500/10 text-blue-400 border border-blue-500/50"
                              : "bg-yellow-500/10 text-yellow-400 border border-yellow-500/50"
                            }`}>{booking.status}</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                              {booking.status === "PENDING" && (
                                <>
                                  <button onClick={() => updateBookingStatus(booking.id, "CONFIRMED")}
                                    disabled={actionLoading === booking.id}
                                    className="px-3 py-1 bg-green-500/10 text-green-400 border border-green-500/50 hover:bg-green-500/20 disabled:opacity-50 transition-colors text-sm"
                                  >{actionLoading === booking.id ? "..." : "Confirm"}</button>
                                  <button onClick={() => updateBookingStatus(booking.id, "CANCELLED")}
                                    disabled={actionLoading === booking.id}
                                    className="px-3 py-1 bg-red-500/10 text-red-400 border border-red-500/50 hover:bg-red-500/20 disabled:opacity-50 transition-colors text-sm"
                                  >Cancel</button>
                                </>
                              )}
                              {booking.status === "CONFIRMED" && (
                                <button onClick={() => updateBookingStatus(booking.id, "COMPLETED")}
                                  disabled={actionLoading === booking.id}
                                  className="px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/50 hover:bg-blue-500/20 disabled:opacity-50 transition-colors text-sm"
                                >{actionLoading === booking.id ? "..." : "Complete"}</button>
                              )}
                              <button onClick={() => setDeleteConfirm(booking.id)}
                                className="px-3 py-1 bg-red-500/10 text-red-400 border border-red-500/50 hover:bg-red-500/20 transition-colors text-sm"
                              >Delete</button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Details Panel */}
            {selectedBooking && (
              <div className="lg:w-1/3">
                <div className="border border-white/10 bg-white/5 p-6 sticky top-24">
                  <div className="flex justify-between items-start mb-6">
                    <h3 className="text-lg font-semibold">Booking Details</h3>
                    <button onClick={() => setSelectedBooking(null)} className="text-gray-500 hover:text-white">✕</button>
                  </div>

                  <div className="space-y-4 text-sm">
                    <div>
                      <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Customer</div>
                      <div className="font-medium">{selectedBooking.customerName}</div>
                    </div>
                    <div>
                      <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Email</div>
                      <div>{selectedBooking.customerEmail}</div>
                    </div>
                    {selectedBooking.customerPhone && (
                      <div>
                        <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Phone</div>
                        <div>{selectedBooking.customerPhone}</div>
                      </div>
                    )}
                    <div>
                      <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Service</div>
                      <div className="font-medium">{selectedBooking.serviceName}</div>
                      <div className="text-gray-400">{selectedBooking.serviceDuration} min • ${selectedBooking.servicePrice}</div>
                    </div>
                    <div>
                      <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Date & Time</div>
                      <div className="font-medium">{selectedBooking.date}</div>
                      <div className="text-gray-400">{selectedBooking.startTime} - {selectedBooking.endTime}</div>
                    </div>
                    <div>
                      <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Status</div>
                      <span className={`inline-flex px-3 py-1 text-sm font-medium ${
                        selectedBooking.status === "CONFIRMED" ? "bg-green-500/10 text-green-400 border border-green-500/50"
                        : selectedBooking.status === "CANCELLED" ? "bg-red-500/10 text-red-400 border border-red-500/50"
                        : selectedBooking.status === "COMPLETED" ? "bg-blue-500/10 text-blue-400 border border-blue-500/50"
                        : "bg-yellow-500/10 text-yellow-400 border border-yellow-500/50"
                      }`}>{selectedBooking.status}</span>
                    </div>
                    {selectedBooking.notes && (
                      <div>
                        <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Notes</div>
                        <div className="border border-white/10 bg-black/50 p-3 whitespace-pre-wrap text-sm">{selectedBooking.notes}</div>
                      </div>
                    )}
                    {selectedBooking.createdAt && (
                      <div>
                        <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Created</div>
                        <div className="text-gray-400 text-sm">{selectedBooking.createdAt}</div>
                      </div>
                    )}
                    {selectedBooking.updatedAt && (
                      <div>
                        <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Last Updated</div>
                        <div className="text-gray-400 text-sm">{selectedBooking.updatedAt}</div>
                      </div>
                    )}
                  </div>

                  {/* Booking History */}
                  <div className="mt-6 pt-4 border-t border-white/10">
                    <h4 className="text-sm font-semibold text-gray-300 mb-3">Booking History</h4>
                    {historyLoading ? (
                      <div className="text-gray-500 text-sm">Loading history...</div>
                    ) : bookingHistory.length === 0 ? (
                      <div className="text-gray-500 text-sm">No history yet</div>
                    ) : (
                      <div className="space-y-3">
                        {bookingHistory.map((item) => (
                          <div key={item.id} className="border border-white/5 bg-black/30 p-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium text-cyan-400">{item.action}</span>
                              <span className="text-xs text-gray-500">{new Date(item.createdAt).toLocaleString()}</span>
                            </div>
                            {item.fromStatus && item.toStatus && (
                              <div className="text-xs text-gray-400">
                                {item.fromStatus} → {item.toStatus}
                              </div>
                            )}
                            {item.performedBy && (
                              <div className="text-xs text-gray-500 mt-1">By {item.performedBy}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-6 pt-4 border-t border-white/10 space-y-2">
                    {selectedBooking.status === "PENDING" && (
                      <button
                        onClick={() => updateBookingStatus(selectedBooking.id, "CONFIRMED")}
                        disabled={actionLoading === selectedBooking.id}
                        className="w-full bg-cyan-500 text-black font-semibold py-3 hover:bg-cyan-400 disabled:opacity-50 transition-colors"
                      >{actionLoading === selectedBooking.id ? "Updating..." : "Confirm Booking"}</button>
                    )}
                    <button
                      onClick={() => setDeleteConfirm(selectedBooking.id)}
                      className="w-full bg-red-500/10 text-red-400 border border-red-500/50 font-semibold py-3 hover:bg-red-500/20 transition-colors"
                    >Delete Booking</button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Recent Activity (at the bottom) */}
          {recentActivity.length > 0 && (
            <div className="border border-white/10 bg-white/5 p-6 mt-8">
              <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-medium text-cyan-400 bg-cyan-500/10 px-2 py-1 rounded">
                        {activity.action}
                      </span>
                      <span className="text-sm text-gray-400">{activity.performedBy}</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(activity.createdAt).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
