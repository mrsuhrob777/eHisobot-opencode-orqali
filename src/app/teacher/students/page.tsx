import { cookies } from "next/headers";
import { getLangFromCookie, t } from "@/lib/i18n";
import { Users } from "lucide-react";

export default async function TeacherStudents() {
  const lang = getLangFromCookie((await cookies()).get("lang")?.value);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{t("teacher.my_students", lang)}</h1>
      </div>
      <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center shadow-sm">
        <Users className="mx-auto h-12 w-12 text-gray-300" />
        <p className="mt-3 text-gray-500">No students assigned yet</p>
      </div>
    </div>
  );
}
