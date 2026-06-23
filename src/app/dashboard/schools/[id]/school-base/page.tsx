import { getSchool } from "@/actions/schools";
import { cookies } from "next/headers";
import { getLangFromCookie, t } from "@/lib/i18n";
import Link from "next/link";
import { ArrowLeft, Database } from "lucide-react";
import { SchoolBaseContent } from "./school-base-content";
import { redirect } from "next/navigation";
import { getSchoolClasses, getSchoolSubjects } from "@/actions/school-management";

export default async function SchoolBasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const school = await getSchool(id);
  const lang = getLangFromCookie((await cookies()).get("lang")?.value);

  if (!school) { redirect("/dashboard/schools"); }

  const [classes, subjects] = await Promise.all([
    getSchoolClasses(id),
    getSchoolSubjects(id),
  ]);

  return (
    <div>
      <div className="mb-6">
        <Link href={`/dashboard/schools/${id}`} className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-600">
          <ArrowLeft className="h-4 w-4" /> {t("common.back", lang)}
        </Link>
        <div className="mt-4 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-600 text-white shadow-lg"><Database className="h-7 w-7" /></div>
          <div><h1 className="text-2xl font-bold text-gray-900">Maktab bazasi</h1><p className="mt-1 text-sm text-gray-500">{school.name}</p></div>
        </div>
      </div>

      <SchoolBaseContent
        schoolId={id}
        initialClasses={(classes.data || []) as any[]}
        initialSubjects={(subjects.data || []) as any[]}
        lang={lang}
      />
    </div>
  );
}
