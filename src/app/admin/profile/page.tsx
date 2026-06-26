"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminTopBar from "@/components/admin/AdminTopBar";

export const dynamic = 'force-dynamic';

export default function ProfilePage() {
  const router = useRouter();
  const { data: session, status, update } = useSession();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [createdAt, setCreatedAt] = useState<string>("");
  const [updatedAt, setUpdatedAt] = useState<string>("");

  // Change password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

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
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/admin/profile");
        if (res.ok) {
          const data = await res.json();
          setCreatedAt(data.createdAt);
          setUpdatedAt(data.updatedAt);
        }
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      }
    };
    if (status === "authenticated") {
      fetchProfile();
    }
  }, [status]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast("error", "Passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      showToast("error", "Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/profile/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (res.ok) {
        showToast("success", "Password changed successfully");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        const data = await res.json();
        showToast("error", data.error || "Failed to change password");
      }
    } catch {
      showToast("error", "Something went wrong");
    } finally {
      setLoading(false);
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

  return (
    <div className="min-h-screen bg-black text-white">
      {toast && (
        <div className="fixed top-4 right-4 z-50">
          <div className={`px-6 py-3 border shadow-lg ${
            toast.type === "success"
              ? "bg-green-500/10 border-green-500/50 text-green-400"
              : "bg-red-500/10 border-red-500/50 text-red-400"
          }`}>{toast.message}</div>
        </div>
      )}

      <AdminSidebar collapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)} />

      <main className={`transition-all ${sidebarCollapsed ? "ml-16" : "ml-64"}`}>
        <AdminTopBar title="Profile" />

        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Account Info */}
          <div className="border border-white/10 bg-white/5 p-8 mb-8">
            <h2 className="text-xl font-semibold mb-6">Account Information</h2>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-400 mb-1">Email</div>
                <div className="font-medium">{session.user?.email}</div>
              </div>
              <div>
                <div className="text-sm text-gray-400 mb-1">Role</div>
                <span className="inline-flex px-3 py-1 text-sm font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/50">
                  {(session.user as any)?.role}
                </span>
              </div>
              <div>
                <div className="text-sm text-gray-400 mb-1">Account Created</div>
                <div className="font-medium">{createdAt ? new Date(createdAt).toLocaleString() : "—"}</div>
              </div>
              <div>
                <div className="text-sm text-gray-400 mb-1">Last Updated</div>
                <div className="font-medium">{updatedAt ? new Date(updatedAt).toLocaleString() : "—"}</div>
              </div>
            </div>
          </div>

          {/* Change Password */}
          <div className="border border-white/10 bg-white/5 p-8">
            <h2 className="text-xl font-semibold mb-6">Change Password</h2>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Current Password</label>
                <input type="password" value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full bg-black border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-cyan-500"
                  required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">New Password</label>
                <input type="password" value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-black border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-cyan-500"
                  required minLength={6} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Confirm New Password</label>
                <input type="password" value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-black border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-cyan-500"
                  required minLength={6} />
              </div>
              <button type="submit" disabled={loading}
                className="bg-cyan-500 text-black font-semibold px-6 py-3 hover:bg-cyan-400 disabled:opacity-50 transition-colors"
              >{loading ? "Updating..." : "Update Password"}</button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}