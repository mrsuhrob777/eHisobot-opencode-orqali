import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { cookies } from "next/headers";
import { getLangFromCookie, t } from "@/lib/i18n";
import { BookOpen, Users, FileText } from "lucide-react";

export default async function TeacherDashboard() {
  const session = await getSession();
  const lang = getLangFromCookie((await cookies()).get("lang")?.value);

  if (!session) return null;
  const teacher = await prisma.teacher.findUnique({
    where: { id: session.userId },
    include: { school: true },
  });
  if (!teacher) return null;

  const cards = [
    { title: "teacher.my_classes", value: "─", icon: BookOpen, gradient: "from-emerald-500 to-teal-600" },
    { title: "teacher.my_students", value: "─", icon: Users, gradient: "from-blue-600 to-indigo-600" },
    { title: "teacher.my_reports", value: "─", icon: FileText, gradient: "from-amber-500 to-orange-600" },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{t("teacher.dashboard", lang)}</h1>
        <p className="mt-1 text-sm text-gray-500">{teacher.school.schoolName} · {teacher.fullName}</p>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md">
              <div className={`inline-flex rounded-xl bg-gradient-to-br ${card.gradient} p-3 text-white shadow-lg`}>
                <Icon className="h-6 w-6" />
              </div>
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-500">{t(card.title, lang)}</p>
                <p className="mt-1 text-3xl font-bold text-gray-900">{card.value}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
