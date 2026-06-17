"use client";

import { logout } from "@/actions/auth";
import { t, type Lang } from "@/lib/i18n";
import { useState, useEffect } from "react";
import { LayoutDashboard, LogOut } from "lucide-react";

export default function DirectorLayout({ children }: { children: React.ReactNode }) {
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
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-purple-600 text-sm font-bold text-white">eH</div>
          <span className="text-lg font-bold text-gray-900">{t("app.name", lang)}</span>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          <a href="/director"
            className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-violet-50 hover:text-violet-700 transition-all">
            <LayoutDashboard className="h-5 w-5" /> {t("sidebar.dashboard", lang)}
          </a>
        </nav>
        <div className="border-t border-gray-100 p-3">
          <div className="mb-2 px-4 py-2">
            <div className="flex gap-1">
              {(["uz", "en", "ru"] as Lang[]).map((l) => (
                <button key={l} onClick={() => switchLang(l)}
                  className={`flex-1 rounded-lg px-2 py-1 text-xs font-medium transition ${lang === l ? "bg-violet-600 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>{l.toUpperCase()}</button>
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
          <h2 className="text-lg font-bold text-gray-900">{t("role.director", lang)}</h2>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 text-sm font-bold text-white">D</div>
            <div className="text-sm"><p className="font-medium text-gray-900">{t("role.director", lang)}</p><p className="text-xs text-gray-500">director</p></div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
