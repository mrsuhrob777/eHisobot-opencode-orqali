import { getDashboardStats } from "@/actions/stats";
import { cookies } from "next/headers";
import { getLangFromCookie, t } from "@/lib/i18n";
import { Building2, Users } from "lucide-react";

export default async function AdminDashboard() {
  const stats = await getDashboardStats();
  const lang = getLangFromCookie((await cookies()).get("lang")?.value);

  const cards = [
    { title: "dashboard.total_schools", value: stats.schools, icon: Building2, gradient: "from-indigo-600 to-blue-600", desc: "schools" },
    { title: "dashboard.total_teachers", value: stats.users, icon: Users, gradient: "from-emerald-500 to-teal-600", desc: "users" },
  ];

  return (
    <div>
      <div className="mb-8"><h1 className="text-2xl font-bold text-gray-900">{t("sidebar.dashboard", lang)}</h1><p className="mt-1 text-sm text-gray-500">Admin</p></div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className={`inline-flex rounded-xl bg-gradient-to-br ${card.gradient} p-3 text-white shadow-lg`}><Icon className="h-6 w-6" /></div>
              <div className="mt-4"><p className="text-sm font-medium text-gray-500">{t("sidebar.schools", lang)} / {t("sidebar.dashboard", lang)}</p><p className="mt-1 text-3xl font-bold text-gray-900">{card.value}</p><p className="text-xs text-gray-400">{card.desc}</p></div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
