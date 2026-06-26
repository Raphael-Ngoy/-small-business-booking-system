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
  createdAt?: string;
};

export default function UsersPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const navItems = [
    { label: "Dashboard", href: "/admin", icon: "📊" },
    { label: "Bookings", href: "/admin", icon: "📅" },
    { label: "Users", href: "/admin/users", icon: "👥" },
    { label: "Settings", href: "/admin/settings", icon: "⚙️" },
    { label: "Profile", href: "/admin/profile", icon: "👤" },
  ];

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
    }
  }, [status]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (roleFilter) params.append("role", roleFilter);

      const res = await fetch(`/api/admin/users?${params}`);
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

  useEffect(() => {
    if (status === "authenticated") {
      fetchUsers();
    }
  }, [search, roleFilter]);

  const updateUserRole = async (userId: string, newRole: string) => {
    setActionLoading(userId);
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
    } catch {
      showToast("error", "Something went wrong");
    } finally {
      setActionLoading(null);
    }
  };

  const deleteUser = async (userId: string) => {
    setActionLoading(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
      if (res.ok) {
        showToast("success", "User deleted");
        setDeleteConfirm(null);
        fetchUsers();
      } else {
        const data = await res.json();
        showToast("error", data.error || "Failed to delete user");
      }
    } catch {
      showToast("error", "Something went wrong");
    } finally {
      setActionLoading(null);
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

  const currentUserEmail = session.user?.email;
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.name && u.name.toLowerCase().includes(search.toLowerCase()));
    const matchesRole = !roleFilter || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

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

      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 px-4">
          <div className="max-w-md w-full border border-white/10 bg-zinc-900 p-8">
            <h3 className="text-xl font-semibold mb-4">Delete this user permanently?</h3>
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
                onClick={() => deleteUser(deleteConfirm)}
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

      <main className={`transition-all ${sidebarCollapsed ? "ml-16" : "ml-64"}`}>
        <AdminTopBar title="User Management" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Filters */}
          <div className="border border-white/10 bg-white/5 p-6 mb-8">
            <h2 className="text-lg font-semibold mb-4">Filters</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Search</label>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Name or email..."
                  className="w-full bg-black border border-white/10 text-white px-4 py-2 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Role</label>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="w-full bg-black border border-white/10 text-white px-4 py-2 focus:outline-none focus:border-cyan-500"
                >
                  <option value="">All</option>
                  <option value="ADMIN">Admin</option>
                  <option value="USER">User</option>
                </select>
              </div>
            </div>
          </div>

          {/* Users Table */}
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
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-gray-500">No users found</td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
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
                          {user.email === "user@gmail.com" || user.email === currentUserEmail ? (
                            <span className="text-sm text-gray-500">Protected</span>
                          ) : (
                            <div className="flex gap-2">
                              {user.role === "USER" ? (
                                <button
                                  onClick={() => updateUserRole(user.id, "ADMIN")}
                                  disabled={actionLoading === user.id}
                                  className="px-3 py-1 bg-cyan-500/10 text-cyan-400 border border-cyan-500/50 hover:bg-cyan-500/20 disabled:opacity-50 transition-colors text-sm"
                                >
                                  Promote
                                </button>
                              ) : (
                                <button
                                  onClick={() => updateUserRole(user.id, "USER")}
                                  disabled={actionLoading === user.id}
                                  className="px-3 py-1 bg-yellow-500/10 text-yellow-400 border border-yellow-500/50 hover:bg-yellow-500/20 disabled:opacity-50 transition-colors text-sm"
                                >
                                  Demote
                                </button>
                              )}
                              <button
                                onClick={() => setDeleteConfirm(user.id)}
                                className="px-3 py-1 bg-red-500/10 text-red-400 border border-red-500/50 hover:bg-red-500/20 transition-colors text-sm"
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}