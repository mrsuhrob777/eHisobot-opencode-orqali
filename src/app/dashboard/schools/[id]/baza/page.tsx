import { getSchool } from "@/actions/schools";
import { cookies } from "next/headers";
import { getLangFromCookie, t } from "@/lib/i18n";
import Link from "next/link";
import { ArrowLeft, Building2, Database } from "lucide-react";
import { BazaContent } from "./baza-content";
import { redirect } from "next/navigation";

export default async function BazaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const school = await getSchool(id);
  const lang = getLangFromCookie((await cookies()).get("lang")?.value);

  if (!school) { redirect("/dashboard/schools"); }

  return (
    <div>
      <div className="mb-6">
        <Link href={`/dashboard/schools/${id}`} className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-600">
          <ArrowLeft className="h-4 w-4" /> {t("common.back", lang)}
        </Link>
        <div className="mt-4 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-600 text-white shadow-lg"><Database className="h-7 w-7" /></div>
          <div><h1 className="text-2xl font-bold text-gray-900">Bazani to'ldirish</h1><p className="mt-1 text-sm text-gray-500">{school.name}</p></div>
        </div>
      </div>

      <BazaContent schoolId={school.id} classes={school.classes} subjects={school.subjects} lang={lang} />
    </div>
  );
}