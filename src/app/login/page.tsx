"use client";

import { useActionState, useState, useEffect } from "react";
import { login } from "@/actions/auth";
import { t, type Lang } from "@/lib/i18n";

const demoAccounts = [
  { login: "admin", password: "admin123", role: "admin" },
  { login: "teacher37", password: "123456", role: "teacher" },
  { login: "director37", password: "123456", role: "director" },
  { login: "deputy37", password: "123456", role: "deputy_director" },
];

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, undefined);
  const [lang, setLang] = useState<Lang>("uz");

  useEffect(() => {
    const saved = document.cookie.match(/(?:^|;\s*)lang=([^;]*)/)?.[1] as Lang | undefined;
    if (saved) setLang(saved);
  }, []);

  function switchLang(l: Lang) {
    setLang(l);
    document.cookie = `lang=${l};path=/;max-age=31536000`;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-900 px-4">
      <div className="w-full max-w-sm">
        <div className="rounded-2xl bg-white/95 backdrop-blur-xl p-8 shadow-2xl">
          <div className="mb-2 flex justify-end gap-1">
            {(["uz", "en", "ru"] as Lang[]).map((l) => (
              <button key={l} onClick={() => switchLang(l)}
                className={`rounded-lg px-3 py-1 text-xs font-medium transition ${lang === l ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>{l.toUpperCase()}</button>
            ))}
          </div>
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-600 text-2xl font-bold text-white shadow-lg shadow-indigo-600/30">eH</div>
            <h1 className="text-2xl font-bold text-gray-900">{t("app.name", lang)}</h1>
            <p className="mt-1 text-sm text-gray-500">{t("login.title", lang)}</p>
          </div>
          <form action={action} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">{t("login.login", lang)}</label>
              <input name="login" type="text" placeholder="login" className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
              {state?.errors?.login && <p className="mt-1 text-xs text-red-500">{state.errors.login[0]}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">{t("login.password", lang)}</label>
              <input name="password" type="password" placeholder="••••••" className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
              {state?.errors?.password && <p className="mt-1 text-xs text-red-500">{state.errors.password[0]}</p>}
            </div>
            {state?.message && <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-center text-sm text-red-600">{t("login.error", lang)}</div>}
            <button type="submit" disabled={pending} className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:scale-[1.02] disabled:opacity-50">{pending ? "..." : t("login.button", lang)}</button>
          </form>
          <div className="mt-6 rounded-xl bg-gray-50 border border-gray-200 p-4">
            <p className="text-xs font-semibold text-gray-500 mb-2">{t("login.demo", lang)}:</p>
            <div className="space-y-1.5">
              {demoAccounts.map((acc) => (
                <button key={acc.login} onClick={() => {
                  const form = document.querySelector("form")!;
                  (form.elements.namedItem("login") as HTMLInputElement).value = acc.login;
                  (form.elements.namedItem("password") as HTMLInputElement).value = acc.password;
                }} className="flex w-full items-center justify-between rounded-lg bg-white px-3 py-2 text-xs transition hover:bg-indigo-50 border border-gray-100">
                  <span className="font-medium text-gray-700">{t(`role.${acc.role}`, lang)}</span>
                  <span className="text-gray-400">{acc.login}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
