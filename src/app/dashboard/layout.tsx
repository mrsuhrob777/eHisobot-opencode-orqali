"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/actions/auth";
import { t, type Lang } from "@/lib/i18n";
import { useState, useEffect } from "react";
import { LayoutDashboard, Building2, LogOut, Search, Bell, Users } from "lucide-react";

const navItems = [
  { href: "/dashboard", labelKey: "sidebar.dashboard", icon: LayoutDashboard },
  { href: "/dashboard/schools", labelKey: "sidebar.schools", icon: Building2 },
];

const langLabels: Record<Lang, string> = { uz: "O'zb", en: "Eng", ru: "Рус" };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [lang, setLang] = useState<Lang>("uz");

  useEffect(() => {
    const saved = document.cookie.match(/(?:^|;\s*)lang=([^;]*)/)?.[1] as Lang | undefined;
    if (saved) setLang(saved);
  }, []);

  function switchLang(l: Lang) {
    document.cookie = `lang=${l};path=/;max-age=31536000`;
    window.location.reload();
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <aside className="flex w-64 flex-col border-r border-gray-200 bg-white">
        <div className="flex h-16 items-center gap-3 border-b border-gray-100 px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-blue-600 text-sm font-bold text-white">eH</div>
          <span className="text-lg font-bold text-gray-900">{t("app.name", lang)}</span>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}
                className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${isActive ? "bg-indigo-50 text-indigo-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}>
                <Icon className="h-5 w-5" /> {t(item.labelKey, lang)}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-gray-100 p-3">
          <div className="mb-2 px-4 py-2">
            <div className="flex gap-1">
              {(["uz", "en", "ru"] as Lang[]).map((l) => (
                <button key={l} onClick={() => switchLang(l)}
                  className={`flex-1 rounded-lg px-2 py-1 text-xs font-medium transition ${lang === l ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>{langLabels[l]}</button>
              ))}
            </div>
          </div>
          <form action={logout}>
            <button type="submit" className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-600 transition-all hover:bg-red-50 hover:text-red-600">
              <LogOut className="h-5 w-5" /> {t("sidebar.logout", lang)}
            </button>
          </form>
        </div>
      </aside>
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder={t("header.search", lang)} className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-blue-600 text-sm font-bold text-white">A</div>
            <div className="text-sm"><p className="font-medium text-gray-900">{t("role.admin", lang)}</p><p className="text-xs text-gray-500">admin</p></div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
