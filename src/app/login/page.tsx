"use client";
export const dynamic = "force-dynamic";

import { useActionState, useState, useEffect } from "react";
import { login } from "@/actions/auth";
import { t, type Lang } from "@/lib/i18n";
import { User, Lock, LogIn, GraduationCap, Building2, UserCog, UserCheck } from "lucide-react";

const demoAccounts = [
  { login: "admin", password: "admin123", role: "admin", icon: UserCog },
  { login: "dilrabo", password: "dilrabo", role: "teacher", icon: GraduationCap },
  { login: "director37", password: "123456", role: "director", icon: Building2 },
  { login: "deputy37", password: "123456", role: "deputy_director", icon: UserCheck },
];

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, undefined);
  const [lang, setLang] = useState<Lang>("uz");

  useEffect(() => {
    const saved = document.cookie.match(/(?:^|;\s*)lang=([^;]*)/)?.[1] as Lang | undefined;
    if (saved) setLang(saved);
    const handler = (e: CustomEvent) => setLang(e.detail as Lang);
    window.addEventListener('langchange', handler as EventListener);
    return () => window.removeEventListener('langchange', handler as EventListener);
  }, []);

  function switchLang(l: Lang) {
    setLang(l);
    document.cookie = `lang=${l};path=/;max-age=31536000`;
    window.dispatchEvent(new CustomEvent('langchange', { detail: l }));
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-[#0a2647] via-[#144272] to-[#205295] px-4">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 -top-32 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-80 w-80 rounded-full bg-blue-600/20 blur-3xl" />
        <div className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-400/10 blur-3xl" />
      </div>
      <div className="relative w-full max-w-md">
        <div className="rounded-3xl bg-white p-8 shadow-2xl shadow-blue-900/30">
          <div className="mb-4 flex justify-between items-center">
            <div className="flex gap-1.5">
              {(["uz", "en", "ru"] as Lang[]).map((l) => (
                <button key={l} onClick={() => switchLang(l)}
                  className={`rounded-lg px-3 py-1 text-xs font-semibold tracking-wide transition-all duration-200 ${lang === l ? "bg-blue-600 text-white shadow-md shadow-blue-600/30" : "bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700"}`}>{l.toUpperCase()}</button>
              ))}
            </div>
          </div>
          <div className="mb-4 text-center">
            <div className="mx-auto -mb-3 flex h-32 w-32 items-center justify-center">
              <img src="/logo.png?v=2" alt="eHisobot" className="h-full w-full object-contain" />
            </div>
            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight"><span className="text-blue-600">e</span>Hisobot</h1>
            <p className="mt-4 text-sm text-gray-500">{t("login.title", lang)}</p>
          </div>
          <form action={action} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">{t("login.login", lang)}</label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input name="login" type="text" placeholder="login" className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-10 pr-4 text-sm outline-none transition-all duration-200 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
              </div>
              {state?.errors?.login && <p className="mt-1.5 text-xs font-medium text-red-500">{state.errors.login[0]}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">{t("login.password", lang)}</label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input name="password" type="password" placeholder="••••••" className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-10 pr-4 text-sm outline-none transition-all duration-200 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
              </div>
              {state?.errors?.password && <p className="mt-1.5 text-xs font-medium text-red-500">{state.errors.password[0]}</p>}
            </div>
            {state?.message && <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-center text-sm font-medium text-red-600">{t("login.error", lang)}</div>}
            <button type="submit" disabled={pending} className="group relative w-full overflow-hidden rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition-all duration-200 hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-600/40 disabled:opacity-50">
              <span className="relative z-10 flex items-center justify-center gap-2">
                {pending ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <LogIn className="h-4 w-4" />}
                {pending ? "..." : t("login.button", lang)}
              </span>
            </button>
          </form>
          <div className="mt-8 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100/80 border border-gray-200/80 p-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">{t("login.demo", lang)}</p>
            <div className="grid grid-cols-2 gap-2">
              {demoAccounts.map((acc) => {
                const Icon = acc.icon;
                return (
                  <button key={acc.login} onClick={() => {
                    const form = document.querySelector("form")!;
                    (form.elements.namedItem("login") as HTMLInputElement).value = acc.login;
                    (form.elements.namedItem("password") as HTMLInputElement).value = acc.password;
                  }} className="flex items-center gap-2.5 rounded-xl bg-white px-3.5 py-2.5 text-xs font-medium text-gray-700 shadow-sm transition-all duration-200 hover:bg-blue-50 hover:text-blue-700 hover:shadow-md hover:border-blue-200 border border-gray-100/80 group">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100 text-gray-500 transition-colors duration-200 group-hover:bg-blue-100 group-hover:text-blue-600">
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold">{t(`role.${acc.role}`, lang)}</p>
                      <p className="text-[10px] text-gray-400">{acc.login}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <p className="mt-6 text-center text-xs text-blue-200">© 2026 eHisobot. All rights reserved.</p>
      </div>
    </div>
  );
}
