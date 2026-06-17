import Link from "next/link";
import { getSchools } from "@/actions/schools";
import { cookies } from "next/headers";
import { getLangFromCookie, t } from "@/lib/i18n";
import { Building2, Plus, Users, ExternalLink } from "lucide-react";
import { SchoolActions } from "./actions";

export default async function SchoolsPage() {
  const schools = await getSchools();
  const lang = getLangFromCookie((await cookies()).get("lang")?.value);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">{t("sidebar.schools", lang)}</h1><p className="mt-1 text-sm text-gray-500">{schools.length} ta</p></div>
        <label htmlFor="add-school-modal" className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:scale-[1.02]">
          <Plus className="h-4 w-4" /> {t("schools.add", lang)}
        </label>
      </div>

      <input type="checkbox" id="add-school-modal" className="modal-toggle hidden" />
      <div className="fixed inset-0 z-50 hidden items-center justify-center bg-black/40 peer-checked:flex">
        <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
          <h2 className="mb-4 text-lg font-bold text-gray-900">{t("schools.add", lang)}</h2>
          <form action={async (fd) => { "use server"; const { createSchool } = await import("@/actions/schools"); await createSchool(fd); }}>
            <div className="space-y-4">
              <div><label className="mb-1 block text-sm font-medium text-gray-700">{t("schools.name", lang)}</label><input name="name" required className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" /></div>
              <div><label className="mb-1 block text-sm font-medium text-gray-700">{t("schools.address", lang)}</label><input name="address" className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" /></div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <label htmlFor="add-school-modal" className="cursor-pointer rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">{t("schools.cancel", lang)}</label>
              <button type="submit" className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">{t("schools.save", lang)}</button>
            </div>
          </form>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {schools.map((school) => (
          <Link key={school.id} href={`/dashboard/schools/${school.id}`}
            className="group rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-indigo-100">
            <div className="flex items-start justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"><Building2 className="h-6 w-6" /></div>
              <ExternalLink className="h-4 w-4 text-gray-300 transition group-hover:text-indigo-500" />
            </div>
            <h3 className="mt-4 font-semibold text-gray-900">{school.name}</h3>
            {school.address && <p className="mt-1 text-sm text-gray-500">{school.address}</p>}
            <div className="mt-4 flex items-center gap-1.5 text-sm text-gray-400"><Users className="h-4 w-4" /> {school._count.users} {t("schools.users", lang).toLowerCase()}</div>
          </Link>
        ))}
        {schools.length === 0 && (
          <div className="col-span-full rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
            <Building2 className="mx-auto mb-3 h-10 w-10 text-gray-300" />
            <p className="text-sm text-gray-400">{t("schools.no_schools", lang)}</p>
          </div>
        )}
      </div>

      <SchoolActions />
    </div>
  );
}
