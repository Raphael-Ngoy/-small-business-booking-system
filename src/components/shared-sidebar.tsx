"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

type SidebarProps = {
  brandName?: string;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
};

const NAV_ITEMS = [
  { label: "Dashboard", href: "/admin", icon: "📊" },
  { label: "Bookings", href: "/admin", icon: "📅" },
  { label: "Services", href: "/admin/settings", icon: "🛠️" },
  { label: "Settings", href: "/admin/settings", icon: "⚙️" },
  { label: "Profile", href: "/admin/profile", icon: "👤" },
];

export default function SharedSidebar({ brandName = "BookingPro", collapsed = false, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={`fixed top-0 left-0 h-full bg-zinc-900/50 border-r border-white/10 transition-all z-40 ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      <div className="p-4 border-b border-white/10">
        <div className="text-xl font-bold tracking-tight truncate">{collapsed ? "BP" : brandName}</div>
      </div>
      <nav className="p-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded transition-colors ${
                isActive ? "text-white bg-white/10" : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <span>{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>
      {onToggleCollapse && (
        <button
          onClick={onToggleCollapse}
          className="absolute bottom-4 left-4 text-gray-500 hover:text-white"
        >
          {collapsed ? "→" : "←"}
        </button>
      )}
    </aside>
  );
}