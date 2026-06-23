"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { t, type Lang } from "@/lib/i18n";
import { FileText, BarChart3 } from "lucide-react";
import { getReportCount } from "@/actions/reports";

export default function TeacherDashboard() {
  const [lang, setLang] = useState<Lang>("uz");
  const [count, setCount] = useState(0);

  useEffect(() => {
    const saved = document.cookie.match(/(?:^|;\s*)lang=([^;]*)/)?.[1] as Lang | undefined;
    if (saved) setLang(saved);
    const handler = (e: CustomEvent) => setLang(e.detail as Lang);
    window.addEventListener('langchange', handler as EventListener);
    getReportCount().then(setCount);
    return () => window.removeEventListener('langchange', handler as EventListener);
  }, []);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{t("bsb_chsb.teacher_panel", lang)}</h1>
        <p className="mt-1 text-sm text-gray-500">{t("bsb_chsb.teacher_panel", lang)}</p>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Link href="/teacher/reports"
          className="group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-indigo-200 hover:-translate-y-0.5 block">
          <div className="inline-flex rounded-xl bg-gradient-to-br from-indigo-600 to-blue-600 p-3 text-white shadow-lg group-hover:shadow-xl transition-all">
            <FileText className="h-6 w-6" />
          </div>
          <div className="mt-4">
            <div className="text-sm font-medium text-gray-500">{t("bsb_chsb.title", lang)}</div>
            <div className="mt-1 text-3xl font-bold text-gray-900">{count}</div>
            <div className="mt-1 text-xs text-gray-400">{t("common.reports", lang)}</div>
          </div>
        </Link>
        <Link href="/teacher/annual-report"
          className="group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-indigo-200 hover:-translate-y-0.5 block">
          <div className="inline-flex rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 p-3 text-white shadow-lg group-hover:shadow-xl transition-all">
            <BarChart3 className="h-6 w-6" />
          </div>
          <div className="mt-4">
            <div className="text-sm font-medium text-gray-500">{t("annual.title", lang)}</div>
            <div className="mt-1 text-3xl font-bold text-gray-900">0</div>
            <div className="mt-1 text-xs text-gray-400">{t("common.reports", lang)}</div>
          </div>
        </Link>
      </div>
    </div>
  );
}
