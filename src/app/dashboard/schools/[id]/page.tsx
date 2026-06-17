import { getSchool } from "@/actions/schools";
import { cookies } from "next/headers";
import { getLangFromCookie, t } from "@/lib/i18n";
import Link from "next/link";
import { ArrowLeft, Building2, Plus } from "lucide-react";
import { UsersSection } from "./users-section";
import { deleteSchool } from "@/actions/schools";
import { redirect } from "next/navigation";

export default async function SchoolDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const school = await getSchool(id);
  const lang = getLangFromCookie((await cookies()).get("lang")?.value);

  if (!school) { redirect("/dashboard/schools"); }

  return (
    <div>
      <div className="mb-6">
        <Link href="/dashboard/schools" className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-600">
          <ArrowLeft className="h-4 w-4" /> {t("common.back", lang)}
        </Link>
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-600 text-white shadow-lg"><Building2 className="h-7 w-7" /></div>
            <div><h1 className="text-2xl font-bold text-gray-900">{school.name}</h1>{school.address && <p className="mt-1 text-sm text-gray-500">{school.address}</p>}</div>
          </div>
          <div className="flex gap-2">
            <form action={async () => { "use server"; await deleteSchool(id); redirect("/dashboard/schools"); }}>
              <button type="submit" className="rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50">{t("schools.delete", lang)}</button>
            </form>
          </div>
        </div>
      </div>

      <UsersSection schoolId={id} users={school.users} lang={lang} />
    </div>
  );
}
