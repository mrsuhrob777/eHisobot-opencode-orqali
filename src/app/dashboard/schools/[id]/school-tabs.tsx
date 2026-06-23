"use client";

import { t, type Lang } from "@/lib/i18n";
import { Users, Database } from "lucide-react";
import { UsersSection } from "./users-section";
import Link from "next/link";

type SchoolData = {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  region: string;
  users: any[];
  classes: any[];
  subjects: any[];
};

export function SchoolTabs({ school, lang }: { school: SchoolData; lang: Lang }) {

  return (
    <div className="space-y-6">

      <UsersSection schoolId={school.id} users={school.users} lang={lang} />

      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <Link href={`/dashboard/schools/${school.id}/baza`}
          className="flex w-full items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-800">
            <Database className="mr-1.5 inline h-4 w-4 text-indigo-600" />
            Bazani to'ldirish (sinflar, guruhlar, o'quvchilar, fanlar)
          </h3>
          <span className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-indigo-700 transition-all">Kirish</span>
        </Link>
      </div>
    </div>
  );
}
