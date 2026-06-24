"use client";

import { useState, useEffect, useMemo } from "react";
import { getSchoolAnnualReports } from "@/actions/director";
import { Search, Eye, X, FileText, Users, BarChart3, BookOpen, Calendar } from "lucide-react";

interface AnnualItem {
  id: string;
  title: string;
  subject: string;
  year: string;
  teacherName: string;
  teacherId: string;
  createdAt: string;
}

export default function DirectorAnnualReports() {
  const [reports, setReports] = useState<AnnualItem[]>([]);
  const [total, setTotal] = useState(0);
  const [teachers, setTeachers] = useState<{ id: string; fullName: string }[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [years, setYears] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [filterTeacher, setFilterTeacher] = useState("");
  const [filterSubject, setFilterSubject] = useState("");
  const [filterYear, setFilterYear] = useState("");

  async function load() {
    setLoading(true);
    const result = await getSchoolAnnualReports({
      teacherId: filterTeacher || undefined,
      subject: filterSubject || undefined,
      year: filterYear || undefined,
    });
    setReports(result.data);
    setTotal(result.total);
    if (result.teachers.length > 0) setTeachers(result.teachers);
    if (result.subjects.length > 0) setSubjects(result.subjects);
    if (result.years.length > 0) setYears(result.years);
    setLoading(false);
  }

  useEffect(() => { load(); }, [filterTeacher, filterSubject, filterYear]);

  function clearFilters() {
    setFilterTeacher("");
    setFilterSubject("");
    setFilterYear("");
    setSearch("");
  }

  const hasFilters = filterTeacher || filterSubject || filterYear;

  const filtered = useMemo(() => {
    if (!search) return reports;
    const q = search.toLowerCase();
    return reports.filter(r =>
      r.teacherName.toLowerCase().includes(q) ||
      r.title.toLowerCase().includes(q) ||
      r.subject.toLowerCase().includes(q)
    );
  }, [reports, search]);

  const grouped = useMemo(() => {
    const map = new Map<string, AnnualItem[]>();
    for (const r of filtered) {
      const key = r.teacherId;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    }
    return Array.from(map.entries())
      .map(([teacherId, items]) => ({
        teacherId,
        teacherName: items[0].teacherName,
        items,
      }))
      .sort((a, b) => a.teacherName.localeCompare(b.teacherName));
  }, [filtered]);

  function handleView(report: AnnualItem) {
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<html><head><title>${report.title}</title>
    <style>
      body { font-family: 'Times New Roman', serif; padding: 40px; background: #f9fafb; }
      .card { max-width: 900px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
      h2 { text-align: center; color: #1f2937; margin-bottom: 24px; }
      .info { display: flex; flex-wrap: wrap; gap: 16px; margin-bottom: 24px; padding: 16px; background: #f3f4f6; border-radius: 8px; font-size: 14px; }
      .info b { color: #1f2937; }
    </style></head><body><div class="card">`);
    w.document.write(`<h2>${report.title}</h2>`);
    w.document.write(`<div class="info">
      <div><b>O'qituvchi:</b> ${report.teacherName}</div>
      <div><b>Fan:</b> ${report.subject}</div>
      <div><b>O'quv yili:</b> ${report.year}</div>
      <div><b>Sana:</b> ${new Date(report.createdAt).toLocaleDateString("uz-UZ")}</div>
    </div>`);
    w.document.write(`<p style="text-align:center;color:#9ca3af;margin-top:40px">To'liq ma'lumot Excel faylida</p>`);
    w.document.write(`</div></body></html>`);
    w.document.close();
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Yillik hisobotlar</h1>
        <p className="mt-1 text-sm text-gray-500">Maktab bo'yicha yillik hisobotlar</p>
      </div>

      {/* Stats bar */}
      <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <BarChart3 className="h-4 w-4 text-emerald-500" />
            Yillik hisobotlar
          </div>
          <div className="mt-1 text-2xl font-bold text-gray-900">{total}</div>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Users className="h-4 w-4 text-violet-500" />
            O'qituvchilar
          </div>
          <div className="mt-1 text-2xl font-bold text-gray-900">{grouped.length}</div>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <BookOpen className="h-4 w-4 text-amber-500" />
            Fanlar
          </div>
          <div className="mt-1 text-2xl font-bold text-gray-900">{subjects.length}</div>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="mb-6 space-y-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="O'qituvchi, fan yoki sarlavha bo'yicha qidirish..."
            className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition-all focus:border-emerald-300 focus:shadow-sm" />
        </div>
        <div className="flex flex-wrap gap-3">
          <select value={filterTeacher} onChange={e => setFilterTeacher(e.target.value)}
            className="min-w-[160px] rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none transition-all focus:border-emerald-300">
            <option value="">Barcha o'qituvchilar</option>
            {teachers.map(t => (
              <option key={t.id} value={t.id}>{t.fullName}</option>
            ))}
          </select>
          <select value={filterSubject} onChange={e => setFilterSubject(e.target.value)}
            className="min-w-[140px] rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none transition-all focus:border-emerald-300">
            <option value="">Barcha fanlar</option>
            {subjects.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select value={filterYear} onChange={e => setFilterYear(e.target.value)}
            className="min-w-[140px] rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none transition-all focus:border-emerald-300">
            <option value="">Barcha yillar</option>
            {years.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          {hasFilters && (
            <button onClick={clearFilters}
              className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 transition-all hover:bg-gray-100">
              <X className="h-4 w-4" /> Tozalash
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-16 text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
          <div className="text-sm text-gray-400">Yuklanmoqda...</div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-16 text-center">
          <BarChart3 className="mx-auto mb-3 h-10 w-10 text-gray-300" />
          <div className="text-sm font-medium text-gray-500">Yillik hisobotlar topilmadi</div>
          <div className="mt-1 text-xs text-gray-400">O'qituvchilar hali yillik hisobot yaratmagan</div>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {grouped.map((group) => {
            const uniqueSubjects = [...new Set(group.items.map(r => r.subject))];
            return (
              <div key={group.teacherId}
                className="group rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden transition-all hover:shadow-lg hover:border-emerald-200 hover:-translate-y-0.5">
                {/* Header */}
                <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-600 px-5 py-5">
                  <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10" />
                  <div className="absolute -bottom-4 -left-4 h-16 w-16 rounded-full bg-white/5" />
                  <div className="relative flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur text-lg font-bold text-white shadow-inner">
                      {group.teacherName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-base font-bold text-white truncate drop-shadow-sm">{group.teacherName}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-medium text-white">
                          {group.items.length} hisobot
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-medium text-white">
                          {uniqueSubjects.length} fan
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Body */}
                <div className="divide-y divide-gray-50">
                  {group.items.map((r, idx) => (
                    <div key={r.id}
                      className="flex items-center gap-3 px-5 py-3.5 transition-all hover:bg-emerald-50/50">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100 text-[11px] font-bold text-gray-400 group-hover/item:bg-emerald-100 group-hover/item:text-emerald-600">
                        {idx + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center rounded-md bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-semibold text-amber-700">{r.subject}</span>
                          <span className="text-sm font-medium text-gray-900 truncate">{r.title}</span>
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-xs text-gray-400">
                          <Calendar className="h-3 w-3" />
                          <span>{r.year}</span>
                          <span className="text-gray-200">|</span>
                          <span>{new Date(r.createdAt).toLocaleDateString("uz-UZ", { day: "numeric", month: "short" })}</span>
                        </div>
                      </div>
                      <button onClick={() => handleView(r)}
                        className="flex-shrink-0 rounded-lg border border-gray-200 bg-white p-2 text-gray-300 shadow-sm transition-all hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-600" title="Ko'rish">
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                {/* Footer */}
                <div className="border-t border-gray-50 bg-gray-50/50 px-5 py-2.5">
                  <div className="flex items-center gap-3 text-[10px] text-gray-400">
                    {uniqueSubjects.slice(0, 3).map(s => (
                      <span key={s} className="inline-flex items-center gap-1">
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        {s}
                      </span>
                    ))}
                    {uniqueSubjects.length > 3 && (
                      <span className="text-gray-300">+{uniqueSubjects.length - 3} ta</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {!loading && filtered.length > 0 && (
        <div className="mt-5 rounded-xl border border-gray-100 bg-white px-5 py-3 text-center text-sm text-gray-500 shadow-sm">
          Jami: <span className="font-semibold text-gray-900">{total}</span> ta yillik hisobot
        </div>
      )}
    </div>
  );
}
