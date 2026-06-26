"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminTopBar from "@/components/admin/AdminTopBar";

export const dynamic = 'force-dynamic';

type ActivityItem = {
  id: string;
  action: string;
  performedBy: string;
  createdAt: string;
  details?: string;
};

export default function ActivityPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/admin/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchActivities();
    }
  }, [status]);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/activity");
      if (res.ok) {
        const data = await res.json();
        setActivities(data);
      }
    } catch (error) {
      console.error("Failed to fetch activities:", error);
    } finally {
      setLoading(false);
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

  return (
    <div className="min-h-screen bg-black text-white">
      <AdminSidebar collapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)} />

      <main className={`transition-all ${sidebarCollapsed ? "ml-16" : "ml-64"}`}>
        <AdminTopBar title="Activity Log" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="border border-white/10 bg-white/5">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-400">Date & Time</th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-400">Action</th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-400">Performed By</th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-400">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {activities.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-gray-500">No activity recorded yet</td>
                    </tr>
                  ) : (
                    activities.map((activity) => (
                      <tr key={activity.id} className="border-b border-white/5 hover:bg-white/5">
                        <td className="px-6 py-4 text-sm text-gray-300">
                          {new Date(activity.createdAt).toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex px-3 py-1 text-sm font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/50">
                            {activity.action}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-400">{activity.performedBy}</td>
                        <td className="px-6 py-4 text-sm text-gray-400">{activity.details || "—"}</td>
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