"use client";

import { useActionState, useState, useEffect } from "react";
import { login } from "@/actions/auth";
import { t, type Lang } from "@/lib/i18n";
import { Languages } from "lucide-react";

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

  const demoAccounts = [
    { email: "admin@ehisobot.uz", password: "admin123", label: "super_admin", role: "super_admin" },
    { email: "teacher_37_001", password: "T37@2026#1", label: "teacher", role: "teacher" },
  ];

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 px-4">
      <div className="w-full max-w-sm">
        <div className="rounded-2xl bg-white p-8 shadow-2xl">
          {/* Language Switcher */}
          <div className="mb-6 flex justify-end gap-1">
            {(["uz", "en", "ru"] as Lang[]).map((l) => (
              <button
                key={l}
                onClick={() => switchLang(l)}
                className={`rounded-lg px-3 py-1 text-xs font-medium transition ${
                  lang === l ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-xl font-bold text-white shadow-lg">
              eH
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{t("app.name", lang)}</h1>
            <p className="mt-1 text-sm text-gray-500">{t("login.title", lang)}</p>
          </div>

          <form action={action} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">{t("login.email", lang)}</label>
              <input
                name="email"
                type="text"
                placeholder="admin@ehisobot.uz"
                className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
              {state?.errors?.email && <p className="mt-1.5 text-xs text-red-500">{state.errors.email[0]}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">{t("login.password", lang)}</label>
              <input
                name="password"
                type="password"
                placeholder="••••••••"
                className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
              {state?.errors?.password && <p className="mt-1.5 text-xs text-red-500">{state.errors.password[0]}</p>}
            </div>
            {state?.message && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3">
                <p className="text-center text-sm text-red-600">{t("login.error", lang)}</p>
              </div>
            )}
            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            >
              {pending ? "..." : t("login.button", lang)}
            </button>
          </form>

          <div className="mt-6 space-y-2 rounded-xl bg-gray-50 border border-gray-200 p-4">
            <p className="text-xs font-semibold text-gray-500 mb-2">{t("login.demo", lang)}:</p>
            {demoAccounts.map((acc) => (
              <button
                key={acc.role}
                onClick={() => {
                  const form = document.querySelector("form")!;
                  (form.elements.namedItem("email") as HTMLInputElement).value = acc.email;
                  (form.elements.namedItem("password") as HTMLInputElement).value = acc.password;
                }}
                className="flex w-full items-center justify-between rounded-lg bg-white px-3 py-2 text-xs transition hover:bg-blue-50 border border-gray-100"
              >
                <span className="font-medium text-gray-700">{t(`login.${acc.role}`, lang)}</span>
                <span className="text-gray-400">{acc.email}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
