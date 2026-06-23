"use client";

import { useState } from "react";
import { createSchoolUser, deleteUser } from "@/actions/users";
import { t, type Lang } from "@/lib/i18n";
import { Database, Settings, UserPlus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { TeacherAssign } from "./teacher-assign";

const roles = ["teacher", "director", "deputy_director"] as const;

export function UsersSection({ schoolId, users, lang }: { schoolId: string; users: any[]; lang: Lang }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [show, setShow] = useState(false);
  const [assignUserId, setAssignUserId] = useState<string | null>(null);

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">{t("schools.users", lang)} ({users.length})</h2>
        <div className="flex items-center gap-2">
          <Link href={`/dashboard/schools/${schoolId}/school-base`}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:scale-[1.02]">
            <Database className="h-4 w-4" /> Maktab bazasi
          </Link>
          <button onClick={() => setShow(!show)}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:shadow-md">
            <UserPlus className="h-4 w-4" /> {t("schools.add_user", lang)}
          </button>
        </div>
      </div>

      {show && (
        <form action={async (formData) => {
          setPending(true);
          await createSchoolUser(schoolId, formData);
          setShow(false);
          setPending(false);
          router.refresh();
        }} className="mb-6 rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div><label className="mb-1 block text-xs font-medium text-gray-600">{t("users.full_name", lang)}</label><input name="fullName" required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500" /></div>
            <div><label className="mb-1 block text-xs font-medium text-gray-600">{t("users.login", lang)}</label><input name="login" required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500" /></div>
            <div><label className="mb-1 block text-xs font-medium text-gray-600">{t("users.password", lang)}</label><input name="password" type="password" required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500" /></div>
            <div><label className="mb-1 block text-xs font-medium text-gray-600">{t("users.role", lang)}</label>
              <select name="role" required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500">
                {roles.map((r) => <option key={r} value={r}>{t(`role.${r}`, lang)}</option>)}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShow(false)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100">{t("users.cancel", lang)}</button>
            <button type="submit" disabled={pending} className="rounded-lg bg-indigo-600 px-3 py-2 text-sm text-white hover:bg-indigo-700 disabled:opacity-50">{t("users.save", lang)}</button>
          </div>
        </form>
      )}

      {users.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 p-8 text-center text-sm text-gray-400">{t("schools.no_schools", lang)}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left">
                <th className="pb-3 font-medium text-gray-500">{t("users.full_name", lang)}</th>
                <th className="pb-3 font-medium text-gray-500">{t("users.login", lang)}</th>
                <th className="pb-3 font-medium text-gray-500">{t("users.role", lang)}</th>
                <th className="pb-3 font-medium text-gray-500"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u: any) => (
                <tr key={u.id} className="border-b border-gray-50">
                  <td className="py-3 font-medium text-gray-900">{u.fullName}</td>
                  <td className="py-3 text-gray-500">{u.login}</td>
                  <td className="py-3"><span className="rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">{t(`role.${u.role}`, lang)}</span></td>
                  <td className="py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setAssignUserId(u.id)}
                        className="rounded-lg p-2 text-gray-400 hover:bg-indigo-50 hover:text-indigo-600"
                        title="Sozlash"
                      >
                        <Settings className="h-4 w-4" />
                      </button>
                      <form action={async () => {
                        await deleteUser(u.id);
                        router.refresh();
                      }}>
                        <button type="submit" className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {assignUserId && (
        <TeacherAssign
          teacherId={assignUserId}
          schoolId={schoolId}
          lang={lang}
          onClose={() => setAssignUserId(null)}
        />
      )}
    </div>
  );
}
