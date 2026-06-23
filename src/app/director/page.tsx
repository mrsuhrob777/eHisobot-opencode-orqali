"use client";

import { useState, useEffect } from "react";
import { getDirectorStats } from "@/actions/director";
import { GraduationCap, FileText, BarChart3, ScrollText } from "lucide-react";

interface Stats {
  students: number;
  bsbCount: number;
  chsbCount: number;
  annualCount: number;
  totalReports: number;
}

const cards = [
  { key: "students", label: "O'quvchilar", icon: GraduationCap, color: "from-emerald-500 to-teal-600" },
  { key: "totalReports", label: <>BSB / CHSB <span className="font-normal">hisobotlar</span></>, icon: FileText, color: "from-sky-500 to-cyan-600" },
  { key: "annualCount", label: "Yillik hisobotlar", icon: ScrollText, color: "from-teal-500 to-emerald-600" },
];

export default function DirectorDashboard() {
  const [stats, setStats] = useState<Stats>({
    students: 0, bsbCount: 0, chsbCount: 0, annualCount: 0, totalReports: 0,
  });

  useEffect(() => {
    getDirectorStats().then((data) => {
      setStats({ ...data, totalReports: data.bsbCount + data.chsbCount });
    });
  }, []);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Direktor paneli</h1>
        <p className="mt-1 text-sm text-gray-500">Maktab bo'yicha statistika</p>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.key}
              className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5">
              <div className={`inline-flex rounded-xl bg-gradient-to-br ${card.color} p-3 text-white shadow-lg`}>
                <Icon className="h-6 w-6" />
              </div>
              <div className="mt-4">
                <div className="text-sm font-medium text-gray-500">{card.label}</div>
                <div className="mt-1 text-3xl font-bold text-gray-900">{stats[card.key as keyof Stats]}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
