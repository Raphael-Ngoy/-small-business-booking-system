"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

type AdminTopBarProps = {
  title: string;
};

export default function AdminTopBar({ title }: AdminTopBarProps) {
  const { data: session } = useSession();

  return (
    <header className="border-b border-white/10 bg-black/50 backdrop-blur-sm sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="text-2xl font-bold tracking-tight">{title}</div>
          <div className="flex items-center gap-4">
            {session?.user?.email && (
              <div className="hidden sm:flex items-center gap-3">
                <span className="text-sm text-gray-400">{session.user.email}</span>
                <span className="inline-flex px-2 py-1 text-xs font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/50">
                  {(session.user as any)?.role || "ADMIN"}
                </span>
              </div>
            )}
            <Link
              href="/admin/profile"
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Profile
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}