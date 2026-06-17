import { getDashboardStats } from "@/actions/stats";
import { getLangFromCookie } from "@/lib/i18n";
import { cookies } from "next/headers";
import { t } from "@/lib/i18n";
import { Building2, Users, GraduationCap, Activity } from "lucide-react";

export default async function SuperAdminDashboard() {
  const stats = await getDashboardStats();
  const lang = getLangFromCookie((await cookies()).get("lang")?.value);

  const cards = [
    { title: "dashboard.total_schools", value: stats.schools, icon: Building2, gradient: "from-blue-600 to-indigo-600", shadow: "shadow-blue-600/25" },
    { title: "dashboard.total_teachers", value: stats.teachers, icon: Users, gradient: "from-emerald-500 to-teal-600", shadow: "shadow-emerald-500/25" },
    { title: "dashboard.total_students", value: stats.students, icon: GraduationCap, gradient: "from-amber-500 to-orange-600", shadow: "shadow-amber-500/25" },
    { title: "dashboard.active_subscriptions", value: "─", icon: Activity, gradient: "from-violet-500 to-purple-600", shadow: "shadow-violet-500/25" },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{t("dashboard.title", lang)}</h1>
        <p className="mt-1 text-sm text-gray-500">Super Admin</p>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className="group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md">
              <div className={`inline-flex rounded-xl bg-gradient-to-br ${card.gradient} p-3 text-white shadow-lg ${card.shadow}`}>
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
