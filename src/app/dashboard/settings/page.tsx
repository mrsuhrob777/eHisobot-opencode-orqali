"use client";

import { useState, useEffect } from "react";
import { t, type Lang } from "@/lib/i18n";
import { Save, Upload, Eye, EyeOff } from "lucide-react";

export default function SettingsPage() {
  const [lang, setLang] = useState<Lang>("uz");
  const [showPassword, setShowPassword] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const saved = document.cookie.match(/(?:^|;\s*)lang=([^;]*)/)?.[1] as Lang | undefined;
    if (saved) setLang(saved);
    const handler = (e: CustomEvent) => setLang(e.detail as Lang);
    window.addEventListener('langchange', handler as EventListener);
    return () => window.removeEventListener('langchange', handler as EventListener);
  }, []);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function switchLang(l: Lang) {
    setLang(l);
    document.cookie = `lang=${l};path=/;max-age=31536000`;
    window.dispatchEvent(new CustomEvent('langchange', { detail: l }));
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{t("settings.title", lang)}</h1>
        <p className="mt-1 text-sm text-gray-500">eHisobot</p>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* Language */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-4">{t("settings.language", lang)}</h2>
          <div className="flex gap-3">
            {(["uz", "en", "ru"] as Lang[]).map((l) => (
              <button
                key={l}
                onClick={() => switchLang(l)}
                className={`rounded-xl px-6 py-3 text-sm font-medium transition ${
                  lang === l ? "bg-blue-600 text-white shadow-lg" : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {l === "uz" ? "O'zbekcha" : l === "en" ? "English" : "Русский"}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4">{t("settings.platform_name", lang)}</h2>
            <input type="text" defaultValue="eHisobot" className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4">{t("settings.logo", lang)}</h2>
            <div className="flex items-center gap-6">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-2xl font-bold text-white shadow-lg">eH</div>
              <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50">
                <Upload className="h-4 w-4" /> {t("settings.upload_logo", lang)}
                <input type="file" accept="image/*" className="hidden" />
              </label>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4">{t("settings.change_password", lang)}</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">{t("settings.current_password", lang)}</label>
                <input type="password" className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
              </div>
              <div className="relative">
                <label className="mb-1.5 block text-sm font-medium text-gray-700">{t("settings.new_password", lang)}</label>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-2.5 pr-10 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">{t("settings.confirm_password", lang)}</label>
                <input type="password" className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button type="submit" className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]">
              <Save className="h-4 w-4" /> {t("settings.save", lang)}
            </button>
            {saved && <span className="text-sm font-medium text-emerald-600 animate-pulse">{t("settings.saved", lang)}</span>}
          </div>
        </form>
      </div>
    </div>
  );
}
