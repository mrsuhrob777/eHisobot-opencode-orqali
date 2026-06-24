"use client";

import { logout } from "@/actions/auth";
import { t, type Lang } from "@/lib/i18n";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FileText, BarChart3, LogOut, User } from "lucide-react";

export default function DirectorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [lang, setLang] = useState<Lang>("uz");
  const [langOpen, setLangOpen] = useState(false);

  useEffect(() => {
    const saved = document.cookie.match(/(?:^|;\s*)lang=([^;]*)/)?.[1] as Lang | undefined;
    if (saved) setLang(saved);
  }, []);

  useEffect(() => {
    if (!langOpen) return;
    const handler = (e: MouseEvent) => {
      if (!(e.target as Element).closest('[data-lang]')) {
        setLangOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [langOpen]);

  function switchLang(l: Lang) {
    document.cookie = `lang=${l};path=/;max-age=31536000`;
    setLang(l);
    window.dispatchEvent(new CustomEvent('langchange', { detail: l }));
  }

  const langBadge = (l: Lang) => {
    const map: Record<Lang, string> = { uz: "UZ", en: "EN", ru: "RU" };
    return <span className="inline-flex items-center justify-center w-[18px] h-[18px] rounded text-[9px] font-bold bg-slate-100 text-slate-500">{map[l]}</span>;
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-gray-200 bg-white">
        <div className="flex h-16 items-center gap-0.5 border-b border-gray-100 px-6">
          <img src="/logo.png?v=2" alt="eHisobot" className="h-14 w-14 object-contain flex-shrink-0" />
          <span className="text-2xl font-bold text-gray-900"><span className="text-blue-600">e</span>Hisobot</span>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          <a href="/director"
            className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
              pathname === "/director" ? "bg-violet-50 text-violet-700" : "text-gray-600 hover:bg-violet-50 hover:text-violet-700"
            }`}>
            <LayoutDashboard className="h-5 w-5" /> {t("sidebar.dashboard", lang)}
          </a>
          <a href="/director/reports"
            className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
              pathname.startsWith("/director/reports") ? "bg-violet-50 text-violet-700" : "text-gray-600 hover:bg-violet-50 hover:text-violet-700"
            }`}>
            <FileText className="h-5 w-5" /> BSB / CHSB
          </a>
          <a href="/director/annual-reports"
            className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
              pathname.startsWith("/director/annual-reports") ? "bg-violet-50 text-violet-700" : "text-gray-600 hover:bg-violet-50 hover:text-violet-700"
            }`}>
            <BarChart3 className="h-5 w-5" /> Yillik hisobotlar
          </a>
          <a href="/director/profile"
            className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
              pathname === "/director/profile" ? "bg-violet-50 text-violet-700" : "text-gray-600 hover:bg-violet-50 hover:text-violet-700"
            }`}>
            <User className="h-5 w-5" /> {t("sidebar.profile", lang)}
          </a>
        </nav>
        <div className="border-t border-gray-100 p-3">
          <div className="mb-2 px-4 py-2">
            <div className="relative" data-lang="true">
              <button onClick={() => setLangOpen(!langOpen)}
                className="w-full flex items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 shadow-sm outline-none transition-all cursor-pointer hover:border-violet-300">
                <span>{lang === "uz" ? "🇺🇿 O'zbek" : lang === "en" ? "🇬🇧 English" : "🇷🇺 Русский"}</span>
                <svg className="h-3 w-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {langOpen && (
                <div className="absolute bottom-full left-0 right-0 mb-1 rounded-lg border border-gray-200 bg-white shadow-lg z-50 overflow-hidden">
                  <button onClick={() => { switchLang("uz"); setLangOpen(false); }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-medium transition-colors ${lang === "uz" ? 'bg-violet-50 text-violet-700' : 'text-gray-700 hover:bg-gray-50'}`}>
                    🇺🇿 O'zbek
                  </button>
                  <button onClick={() => { switchLang("en"); setLangOpen(false); }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-medium transition-colors ${lang === "en" ? 'bg-violet-50 text-violet-700' : 'text-gray-700 hover:bg-gray-50'}`}>
                    🇬🇧 English
                  </button>
                  <button onClick={() => { switchLang("ru"); setLangOpen(false); }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-medium transition-colors ${lang === "ru" ? 'bg-violet-50 text-violet-700' : 'text-gray-700 hover:bg-gray-50'}`}>
                    🇷🇺 Русский
                  </button>
                </div>
              )}
            </div>
          </div>
          <form action={logout}>
            <button type="submit" className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-600 transition-all hover:bg-red-50 hover:text-red-600">
              <LogOut className="h-5 w-5" /> {t("sidebar.logout", lang)}
            </button>
          </form>
        </div>
      </aside>
      <div className="flex flex-1 flex-col overflow-hidden pb-16 lg:pb-0">
        <header className="flex h-14 lg:h-16 items-center justify-between border-b border-gray-200 bg-white px-4 lg:px-6">
          <div className="flex items-center gap-2 lg:hidden">
            <form action={logout}>
              <button type="submit"
                className="flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all touch-target px-3">
                <LogOut className="h-4 w-4" />
              </button>
            </form>
            <div className="relative" data-lang="true">
              <button onClick={() => setLangOpen(!langOpen)}
                className="flex items-center gap-0.5 rounded-lg border border-gray-200 bg-white px-3 text-xs font-medium text-gray-700 outline-none transition-all cursor-pointer hover:border-violet-300 touch-target">
                <span className="flex items-center gap-1">{lang === "uz" ? <>{langBadge("uz")}</> : lang === "en" ? <>{langBadge("en")}</> : <>{langBadge("ru")}</>}</span>
                <svg className="h-3 w-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {langOpen && (
                <div className="absolute top-full left-0 mt-1 min-w-[120px] rounded-lg border border-gray-200 bg-white shadow-lg z-50 overflow-hidden">
                  <button onClick={() => { switchLang("uz"); setLangOpen(false); }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-medium transition-colors ${lang === "uz" ? 'bg-violet-50 text-violet-700' : 'text-gray-700 hover:bg-gray-50'}`}>
                    🇺🇿 O'zbek
                  </button>
                  <button onClick={() => { switchLang("en"); setLangOpen(false); }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-medium transition-colors ${lang === "en" ? 'bg-violet-50 text-violet-700' : 'text-gray-700 hover:bg-gray-50'}`}>
                    🇬🇧 English
                  </button>
                  <button onClick={() => { switchLang("ru"); setLangOpen(false); }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-medium transition-colors ${lang === "ru" ? 'bg-violet-50 text-violet-700' : 'text-gray-700 hover:bg-gray-50'}`}>
                    🇷🇺 Русский
                  </button>
                </div>
              )}
            </div>
          </div>
          <h2 className="text-base lg:text-lg font-bold text-gray-900">{t("role.director", lang)}</h2>
          <div className="flex items-center gap-2 lg:gap-3">
            <div className="flex h-8 w-8 lg:h-9 lg:w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 text-sm font-bold text-white">D</div>
            <div className="hidden sm:block text-sm"><p className="font-medium text-gray-900">{t("role.director", lang)}</p><p className="text-xs text-gray-500">director</p></div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t border-gray-200 bg-white lg:hidden safe-area-bottom">
        <a href="/director"
          className={`mobile-nav-btn flex flex-col items-center justify-center gap-0.5 px-2 text-[10px] font-medium transition-colors ${
            pathname === "/director" ? 'text-violet-600' : 'text-gray-500'
          }`}>
          <LayoutDashboard className={`h-5 w-5 ${pathname === "/director" ? 'text-violet-600' : ''}`} />
          <span className="truncate max-w-[56px] text-center leading-tight">{t("sidebar.dashboard", lang)}</span>
        </a>
        <a href="/director/reports"
          className={`mobile-nav-btn flex flex-col items-center justify-center gap-0.5 px-2 text-[10px] font-medium transition-colors ${
            pathname.startsWith("/director/reports") ? 'text-violet-600' : 'text-gray-500'
          }`}>
          <FileText className={`h-5 w-5 ${pathname.startsWith("/director/reports") ? 'text-violet-600' : ''}`} />
          <span className="truncate max-w-[56px] text-center leading-tight">BSB/CHSB</span>
        </a>
        <a href="/director/annual-reports"
          className={`mobile-nav-btn flex flex-col items-center justify-center gap-0.5 px-2 text-[10px] font-medium transition-colors ${
            pathname.startsWith("/director/annual-reports") ? 'text-violet-600' : 'text-gray-500'
          }`}>
          <BarChart3 className={`h-5 w-5 ${pathname.startsWith("/director/annual-reports") ? 'text-violet-600' : ''}`} />
          <span className="truncate max-w-[56px] text-center leading-tight">Yillik</span>
        </a>
        <a href="/director/profile"
          className={`mobile-nav-btn flex flex-col items-center justify-center gap-0.5 px-2 text-[10px] font-medium transition-colors ${
            pathname === "/director/profile" ? 'text-violet-600' : 'text-gray-500'
          }`}>
          <User className={`h-5 w-5 ${pathname === "/director/profile" ? 'text-violet-600' : ''}`} />
          <span className="truncate max-w-[56px] text-center leading-tight">{t("sidebar.profile", lang)}</span>
        </a>
      </nav>
    </div>
  );
}
