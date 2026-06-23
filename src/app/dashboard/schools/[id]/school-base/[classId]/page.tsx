import { prisma } from "@/lib/db";
import { cookies } from "next/headers";
import { getLangFromCookie, t } from "@/lib/i18n";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ClassStudents } from "./class-students";
import { redirect } from "next/navigation";

export default async function ClassDetailPage({ params }: { params: Promise<{ id: string; classId: string }> }) {
  const { id, classId } = await params;
  const lang = getLangFromCookie((await cookies()).get("lang")?.value);

  const cls = await prisma.schoolClass.findUnique({
    where: { id: classId },
    include: {
      students: {
        include: { group: { select: { id: true, name: true } } },
      },
      groups: { select: { id: true, name: true } },
    },
  });

  if (!cls) { redirect(`/dashboard/schools/${id}/school-base`); }

  return (
    <div>
      <div className="mb-6">
        <Link href={`/dashboard/schools/${id}/school-base`} className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-600">
          <ArrowLeft className="h-4 w-4" /> {t("common.back", lang)}
        </Link>
      </div>

      <ClassStudents
        classId={classId}
        className={cls.name}
        initialStudents={cls.students as any[]}
        groups={cls.groups as any[]}
      />
    </div>
  );
}
