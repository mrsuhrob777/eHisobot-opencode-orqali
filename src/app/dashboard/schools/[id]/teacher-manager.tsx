"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createTeacher, deleteTeacher, resetTeacherPassword } from "@/actions/teachers";
import { t, type Lang } from "@/lib/i18n";
import { Plus, Trash2, KeyRound, X, Users } from "lucide-react";

interface Teacher {
  id: string;
  fullName: string;
  username: string;
  phone: string | null;
  status: string;
  createdAt: string;
}

export function TeacherManager({ schoolId, lang }: { schoolId: string; lang: Lang }) {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newPassword, setNewPassword] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetch(`/api/schools/${schoolId}/teachers`)
      .then((r) => r.json())
      .then((data) => { setTeachers(data); setLoading(false); });
  }, [schoolId]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    await createTeacher(schoolId, new FormData(e.currentTarget));
    setShowModal(false);
    router.refresh();
    setTeachers([]);
    setLoading(true);
    fetch(`/api/schools/${schoolId}/teachers`)
      .then((r) => r.json())
      .then((data) => { setTeachers(data); setLoading(false); });
  }

  async function handleDelete(id: string) {
    if (!confirm(t("common.delete_confirm", lang))) return;
    await deleteTeacher(id);
    router.refresh();
    setTeachers([]);
    setLoading(true);
    fetch(`/api/schools/${schoolId}/teachers`)
      .then((r) => r.json())
      .then((data) => { setTeachers(data); setLoading(false); });
  }

  async function handleReset(id: string) {
    const pw = await resetTeacherPassword(id);
    if (pw) setNewPassword(pw);
    setTimeout(() => setNewPassword(null), 5000);
  }

  if (loading) {
    return (
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">{t("teachers.title", lang)}</h2>
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl active:scale-[0.98]">
            <Plus className="h-4 w-4" /> {t("teachers.add", lang)}
          </button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gray-200" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-32 rounded bg-gray-200" />
                  <div className="h-3 w-24 rounded bg-gray-100" />
                </div>
              </div>
            </div>
          ))}
        </div>
        {showModal && <TeacherModal onSubmit={handleSubmit} onClose={() => setShowModal(false)} lang={lang} />}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">{t("teachers.title", lang)} ({teachers.length})</h2>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl active:scale-[0.98]">
          <Plus className="h-4 w-4" /> {t("teachers.add", lang)}
        </button>
      </div>

      {newPassword && (
        <div className="mb-4 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700">
          New password: <strong>{newPassword}</strong>
        </div>
      )}

      {teachers.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center">
          <Users className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-3 text-gray-500">{t("schools.no_teachers", lang)}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {teachers.map((teacher) => (
            <div key={teacher.id} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-sm font-bold text-white">
                    {teacher.fullName.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{teacher.fullName}</p>
                    <p className="text-xs text-gray-500">{teacher.username}</p>
                  </div>
                </div>
                <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                  teacher.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                }`}>
                  {teacher.status}
                </span>
              </div>
              <p className="mt-3 text-sm text-gray-500">{teacher.phone || "─"}</p>
              <div className="mt-3 flex gap-2">
                <button onClick={() => handleDelete(teacher.id)} className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700">
                  <Trash2 className="h-3.5 w-3.5" /> {t("teachers.delete", lang)}
                </button>
                <button onClick={() => handleReset(teacher.id)} className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:border-amber-200 hover:bg-amber-50 hover:text-amber-700">
                  <KeyRound className="h-3.5 w-3.5" /> {t("teachers.reset_password", lang)}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && <TeacherModal onSubmit={handleSubmit} onClose={() => setShowModal(false)} lang={lang} />}
    </div>
  );
}

function TeacherModal({ onSubmit, onClose, lang }: { onSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>; onClose: () => void; lang: Lang }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">{t("teachers.add", lang)}</h2>
          <button onClick={onClose} className="rounded-xl p-2 text-gray-400 transition hover:bg-gray-100"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">{t("teachers.full_name", lang)}</label>
            <input name="fullName" type="text" required className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">{t("teachers.username", lang)}</label>
            <input name="username" type="text" required className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">{t("teachers.password", lang)}</label>
            <input name="password" type="password" placeholder="Auto-generated if empty" className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">{t("teachers.phone", lang)}</label>
            <input name="phone" type="text" className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50">{t("schools.cancel", lang)}</button>
            <button type="submit" className="flex-1 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl">{t("schools.save", lang)}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
