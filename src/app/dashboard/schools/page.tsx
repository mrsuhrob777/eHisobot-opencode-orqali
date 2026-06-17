"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createSchool, updateSchool, deleteSchool, toggleSchoolStatus } from "@/actions/schools";
import { t, type Lang } from "@/lib/i18n";
import { Plus, Pencil, Trash2, X, School, ToggleRight, ToggleLeft, Users, MapPin, Phone } from "lucide-react";
import Link from "next/link";

export default function SchoolsPage() {
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState<Lang>("uz");
  const [showModal, setShowModal] = useState(false);
  const [editingSchool, setEditingSchool] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const router = useRouter();

  const loadSchools = useCallback(async () => {
    const res = await fetch("/api/schools");
    const data = await res.json();
    setSchools(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    const saved = document.cookie.match(/(?:^|;\s*)lang=([^;]*)/)?.[1] as Lang | undefined;
    if (saved) setLang(saved);
    loadSchools();
  }, [loadSchools]);

  async function handleCreateOrUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMsg(null);
    const fd = new FormData(e.currentTarget);
    if (editingSchool) {
      await updateSchool(editingSchool.id, fd);
    } else {
      const res = await createSchool(fd);
      if (!res.success) {
        setErrorMsg(res.error || "Error");
        return;
      }
    }
    setShowModal(false);
    setEditingSchool(null);
    await loadSchools();
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm(t("common.delete_confirm", lang))) return;
    await deleteSchool(id);
    await loadSchools();
    router.refresh();
  }

  async function handleToggle(id: string, status: string) {
    await toggleSchoolStatus(id, status);
    await loadSchools();
    router.refresh();
  }

  function openEdit(school: any) {
    setEditingSchool(school);
    setShowModal(true);
  }

  function openAdd() {
    setEditingSchool(null);
    setShowModal(true);
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("schools.title", lang)}</h1>
          <p className="mt-1 text-sm text-gray-500">{schools.length} schools</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" /> {t("schools.add", lang)}
        </button>
      </div>

      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="animate-pulse rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gray-200" />
                <div className="space-y-2 flex-1">
                  <div className="h-5 w-32 rounded bg-gray-200" />
                  <div className="h-3 w-24 rounded bg-gray-100" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {schools.map((school) => (
            <div key={school.id} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:shadow-md">
              <Link href={`/dashboard/schools/${school.id}`} className="block">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-sm font-bold text-white">
                      {school.schoolNumber}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{school.schoolName}</h3>
                      <p className="text-xs text-gray-500">{school.region} / {school.district}</p>
                    </div>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    school.subscriptionStatus === "active" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                  }`}>
                    {school.subscriptionStatus === "active" ? t("schools.active", lang) : t("schools.inactive", lang)}
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1"><Phone className="h-4 w-4" /> {school.phone}</span>
                </div>
              </Link>
              <div className="mt-3 flex gap-2 border-t border-gray-100 pt-3">
                <button onClick={() => openEdit(school)} className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700">
                  <Pencil className="h-3.5 w-3.5" /> {t("schools.edit", lang)}
                </button>
                <button onClick={() => handleDelete(school.id)} className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700">
                  <Trash2 className="h-3.5 w-3.5" /> {t("schools.delete", lang)}
                </button>
                <button onClick={() => handleToggle(school.id, school.subscriptionStatus)} className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:border-gray-300 hover:bg-gray-50">
                  {school.subscriptionStatus === "active" ? <ToggleRight className="h-3.5 w-3.5 text-emerald-500" /> : <ToggleLeft className="h-3.5 w-3.5 text-red-500" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <SchoolModal
          school={editingSchool}
          onClose={() => { setShowModal(false); setEditingSchool(null); setErrorMsg(null); }}
          onSubmit={handleCreateOrUpdate}
          lang={lang}
          errorMsg={errorMsg}
        />
      )}
    </div>
  );
}

function SchoolModal({
  school, onClose, onSubmit, lang, errorMsg,
}: {
  school?: any; onClose: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
  lang: Lang; errorMsg?: string | null;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">{school ? t("schools.edit", lang) : t("schools.add", lang)}</h2>
          <button onClick={onClose} className="rounded-xl p-2 text-gray-400 transition hover:bg-gray-100"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          {errorMsg && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-2">
              <p className="text-sm text-red-600">{errorMsg}</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">{t("schools.school_number", lang)}</label>
              <input name="schoolNumber" type="number" defaultValue={school?.schoolNumber} required className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">{t("schools.school_name", lang)}</label>
              <input name="schoolName" type="text" defaultValue={school?.schoolName} required className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">{t("schools.region", lang)}</label>
              <input name="region" type="text" defaultValue={school?.region} required className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">{t("schools.district", lang)}</label>
              <input name="district" type="text" defaultValue={school?.district} required className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">{t("schools.phone", lang)}</label>
              <input name="phone" type="text" defaultValue={school?.phone} required className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">{t("schools.subscription", lang)}</label>
              <select name="subscriptionStatus" defaultValue={school?.subscriptionStatus || "active"} className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20">
                <option value="active">{t("schools.active", lang)}</option>
                <option value="inactive">{t("schools.inactive", lang)}</option>
              </select>
            </div>
          </div>
          <input type="hidden" name="id" value={school?.id || ""} />
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50">{t("schools.cancel", lang)}</button>
            <button type="submit" className="flex-1 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl">{t("schools.save", lang)}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
