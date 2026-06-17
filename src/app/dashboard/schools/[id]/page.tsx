import { getSchool } from "@/actions/schools";
import { getTeachers, createTeacher } from "@/actions/teachers";
import { cookies } from "next/headers";
import { getLangFromCookie, t } from "@/lib/i18n";
import { TeacherManager } from "./teacher-manager";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function SchoolDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const school = await getSchool(id);
  const lang = getLangFromCookie((await cookies()).get("lang")?.value);
  if (!school) return <div>School not found</div>;

  return (
    <div>
      <Link href="/dashboard/schools" className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition">
        <ArrowLeft className="h-4 w-4" />
        {t("teachers.back", lang)}
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{school.schoolName}</h1>
        <p className="text-sm text-gray-500">{school.region} / {school.district} · {school.phone}</p>
      </div>

      <div className="mb-6 flex gap-3 text-sm">
        <div className="rounded-xl bg-blue-50 px-4 py-2 text-blue-700 font-medium">{school._count.students} students</div>
        <div className="rounded-xl bg-emerald-50 px-4 py-2 text-emerald-700 font-medium">{school._count.classes} classes</div>
        <div className={`rounded-xl px-4 py-2 font-medium ${school.subscriptionStatus === "active" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
          {school.subscriptionStatus === "active" ? t("schools.active", lang) : t("schools.inactive", lang)}
        </div>
      </div>

      <TeacherManager schoolId={school.id} lang={lang} />
    </div>
  );
}
