"use client";

import { useState, useEffect, useMemo } from "react";
import { getSchoolReports } from "@/actions/director";
import { Search, Eye, Filter, X, FileText, Users, ChevronDown, Clock, LayoutGrid, List } from "lucide-react";

interface ReportItem {
  id: string;
  type: string;
  title: string;
  createdAt: string;
  teacherName: string;
  teacherId: string;
  config: {
    date: string;
    subject: string;
    classLevel: string;
    quarter: string;
    reportNumber: string;
  } | null;
}

const QUARTERS = ["1-chorak", "2-chorak", "3-chorak", "4-chorak"];

const quarterColors: Record<string, string> = {
  "1-chorak": "text-emerald-600 bg-emerald-50",
  "2-chorak": "text-sky-600 bg-sky-50",
  "3-chorak": "text-amber-600 bg-amber-50",
  "4-chorak": "text-rose-600 bg-rose-50",
};

export default function DirectorReports() {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [total, setTotal] = useState(0);
  const [teachers, setTeachers] = useState<{ id: string; fullName: string }[]>([]);
  const [classes, setClasses] = useState<string[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "cards">("list");

  const [filterType, setFilterType] = useState("");
  const [filterTeacher, setFilterTeacher] = useState("");
  const [filterClass, setFilterClass] = useState("");
  const [filterSubject, setFilterSubject] = useState("");
  const [filterQuarter, setFilterQuarter] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [search, setSearch] = useState("");

  function buildFilters() {
    const f: any = {};
    if (filterType) f.type = filterType;
    if (filterTeacher) f.teacherId = filterTeacher;
    if (filterClass) f.classLevel = filterClass;
    if (filterSubject) f.subject = filterSubject;
    if (filterQuarter) f.quarter = filterQuarter;
    if (filterDateFrom) f.dateFrom = filterDateFrom;
    if (filterDateTo) f.dateTo = filterDateTo;
    return f;
  }

  async function load() {
    setLoading(true);
    const result = await getSchoolReports(buildFilters());
    setReports(result.data);
    setTotal(result.total);
    if (result.teachers.length > 0) setTeachers(result.teachers);
    if (result.classes.length > 0) setClasses(result.classes);
    if (result.subjects.length > 0) setSubjects(result.subjects);
    setLoading(false);
  }

  useEffect(() => { load(); }, [filterType, filterTeacher, filterClass, filterSubject, filterQuarter, filterDateFrom, filterDateTo]);

  function clearFilters() {
    setFilterType("");
    setFilterTeacher("");
    setFilterClass("");
    setFilterSubject("");
    setFilterQuarter("");
    setFilterDateFrom("");
    setFilterDateTo("");
    setSearch("");
    load();
  }

  const hasFilters = filterType || filterTeacher || filterClass || filterSubject || filterQuarter || filterDateFrom || filterDateTo;
  const filterCount = [filterType, filterTeacher, filterClass, filterSubject, filterQuarter, filterDateFrom, filterDateTo].filter(Boolean).length;

  const filtered = useMemo(() => {
    if (!search) return reports;
    const q = search.toLowerCase();
    return reports.filter((r) =>
      r.teacherName.toLowerCase().includes(q) ||
      r.title.toLowerCase().includes(q) ||
      (r.config?.classLevel || "").toLowerCase().includes(q) ||
      (r.config?.subject || "").toLowerCase().includes(q)
    );
  }, [reports, search]);

  const grouped = useMemo(() => {
    const map = new Map<string, ReportItem[]>();
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
        bsbCount: items.filter(i => i.type === "BSB").length,
        chsbCount: items.filter(i => i.type === "CHSB").length,
      }))
      .sort((a, b) => a.teacherName.localeCompare(b.teacherName));
  }, [filtered]);

  const bsbTotal = filtered.filter(r => r.type === "BSB").length;
  const chsbTotal = filtered.filter(r => r.type === "CHSB").length;

  function handleView(report: ReportItem) {
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<html><head><title>${report.title}</title>
    <style>
      body { font-family: 'Times New Roman', serif; padding: 40px; background: #f9fafb; }
      .card { max-width: 800px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
      h2 { text-align: center; color: #1f2937; margin-bottom: 24px; }
      .info { display: flex; flex-wrap: wrap; gap: 16px; margin-bottom: 24px; padding: 16px; background: #f3f4f6; border-radius: 8px; }
      .info-item { font-size: 14px; color: #4b5563; }
      .info-item b { color: #1f2937; }
      table { border-collapse: collapse; width: 100%; margin-top: 16px; }
      th, td { border: 1px solid #d1d5db; padding: 8px 12px; text-align: center; font-size: 14px; }
      th { background: #D9E1F2; font-weight: 600; color: #1f2937; }
      .signatures { display: flex; justify-content: space-between; margin-top: 40px; }
      .sign-line { width: 200px; border-top: 1px solid #333; padding-top: 4px; font-size: 13px; text-align: center; }
    </style></head><body>
    <div class="card">`);
    w.document.write(`<h2>${report.title}</h2>`);
    if (report.config) {
      w.document.write(`<div class="info">
        <div class="info-item"><b>O'qituvchi:</b> ${report.teacherName}</div>
        <div class="info-item"><b>Sinf:</b> ${report.config.classLevel}</div>
        <div class="info-item"><b>Fan:</b> ${report.config.subject}</div>
        <div class="info-item"><b>Chorak:</b> ${report.config.quarter}</div>
        <div class="info-item"><b>Hisobot:</b> ${report.config.reportNumber}-${report.type}</div>
        <div class="info-item"><b>Sana:</b> ${report.config.date}</div>
      </div>`);

      try {
        const d = JSON.parse(localStorage.getItem("report-" + report.id) || "null");
        if (d) {
          const { students, maxScores } = d;
          if (students?.length > 0) {
            w.document.write(`<table><thead><tr><th>#</th><th>O'quvchi</th>`);
            for (let i = 0; i < (students[0]?.scores?.length || 0); i++) {
              w.document.write(`<th>${i+1}-topshiriq (${maxScores?.[i] || 10} ball)</th>`);
            }
            w.document.write(`<th>Jami</th><th>%</th></tr></thead><tbody>`);
            const maxTotal = maxScores?.reduce((a: number, b: number) => a + b, 0) || 0;
            students.forEach((s: any, i: number) => {
              const total = s.scores?.reduce((a: number, b: number) => a + b, 0) || 0;
              const pct = maxTotal > 0 ? (total / maxTotal * 100).toFixed(1) : "0";
              w.document.write(`<tr><td>${i+1}</td><td style="text-align:left">${s.name}</td>`);
              (s.scores || []).forEach((sc: number) => w.document.write(`<td>${sc}</td>`));
              w.document.write(`<td><b>${total}</b></td><td>${pct}%</td></tr>`);
            });
            w.document.write(`</tbody></table>`);
          }
        }
      } catch {}

      w.document.write(`<div class="signatures">
        <div class="sign-line">O'IBDO'</div>
        <div class="sign-line">Metodist</div>
        <div class="sign-line">O'qituvchi</div>
      </div>`);
    }
    w.document.write(`</div></body></html>`);
    w.document.close();
  }

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Barcha hisobotlar</h1>
          <p className="mt-1 text-sm text-gray-500">Maktab bo'yicha BSB / CHSB hisobotlari</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-0.5">
            <button onClick={() => setViewMode("list")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                viewMode === "list" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
              }`} title="Ro'yxat ko'rinishi">
              <List className="h-4 w-4" /> List
            </button>
            <button onClick={() => setViewMode("cards")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                viewMode === "cards" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
              }`} title="Kartochkalar ko'rinishi">
              <LayoutGrid className="h-4 w-4" /> Kartalar
            </button>
          </div>
          <button onClick={() => setFilterOpen(!filterOpen)}
            className="flex items-center gap-2.5 rounded-xl border border-blue-200 bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700">
            <Filter className="h-5 w-5" />
            Filtrlar
            {filterCount > 0 && (
              <span className="inline-flex items-center justify-center h-5 min-w-[22px] rounded-full bg-white px-1.5 text-[10px] font-bold text-blue-600">
                {filterCount}
              </span>
            )}
            <ChevronDown className={`h-4 w-4 transition-transform ${filterOpen ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <FileText className="h-4 w-4 text-sky-500" />
            BSB
          </div>
          <div className="mt-1 text-2xl font-bold text-gray-900">{bsbTotal}</div>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <FileText className="h-4 w-4 text-rose-500" />
            CHSB
          </div>
          <div className="mt-1 text-2xl font-bold text-gray-900">{chsbTotal}</div>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Users className="h-4 w-4 text-violet-500" />
            O'qituvchilar
          </div>
          <div className="mt-1 text-2xl font-bold text-gray-900">{grouped.length}</div>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="O'qituvchi, sarlavha, sinf yoki fan bo'yicha qidirish..."
            className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition-all focus:border-indigo-300 focus:shadow-sm" />
        </div>
      </div>

      {/* Filter panel */}
      <div className={`mb-6 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-300 ${
        filterOpen ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0 border-transparent"
      }`}>
        <div className="p-5">
          <div className="mb-4 flex items-center gap-2 border-b border-gray-100 pb-3">
            <Filter className="h-4 w-4 text-indigo-500" />
            <span className="text-sm font-semibold text-gray-900">Kengaytirilgan filtrlash</span>
            {hasFilters && (
              <span className="ml-auto text-xs text-gray-400">
                {filterCount} ta filtr faol
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-gray-500">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-sky-400" />
                Tur
              </label>
              <select value={filterType} onChange={e => setFilterType(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none transition-all focus:border-indigo-300 focus:bg-white focus:shadow-sm">
                <option value="">Barcha turlar</option>
                <option value="BSB">BSB</option>
                <option value="CHSB">CHSB</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-gray-500">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-violet-400" />
                O'qituvchi
              </label>
              <select value={filterTeacher} onChange={e => setFilterTeacher(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none transition-all focus:border-indigo-300 focus:bg-white focus:shadow-sm">
                <option value="">Barcha o'qituvchilar</option>
                {teachers.map(t => (
                  <option key={t.id} value={t.id}>{t.fullName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-gray-500">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Sinf
              </label>
              <select value={filterClass} onChange={e => setFilterClass(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none transition-all focus:border-indigo-300 focus:bg-white focus:shadow-sm">
                <option value="">Barcha sinflar</option>
                {classes.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-gray-500">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400" />
                Fan
              </label>
              <select value={filterSubject} onChange={e => setFilterSubject(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none transition-all focus:border-indigo-300 focus:bg-white focus:shadow-sm">
                <option value="">Barcha fanlar</option>
                {subjects.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-gray-500">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-cyan-400" />
                Chorak
              </label>
              <select value={filterQuarter} onChange={e => setFilterQuarter(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none transition-all focus:border-indigo-300 focus:bg-white focus:shadow-sm">
                <option value="">Barcha choraklar</option>
                {QUARTERS.map(q => (
                  <option key={q} value={q}>{q}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-gray-500">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-rose-400" />
                Sanadan
              </label>
              <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none transition-all focus:border-indigo-300 focus:bg-white focus:shadow-sm" />
            </div>
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-gray-500">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-rose-400" />
                Sanagacha
              </label>
              <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none transition-all focus:border-indigo-300 focus:bg-white focus:shadow-sm" />
            </div>
          </div>
          <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4">
            <div className="text-xs text-gray-400">
              Filtrlar avtomatik qo'llaniladi
            </div>
            <div className="flex items-center gap-2">
              {hasFilters && (
                <button onClick={clearFilters}
                  className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 transition-all hover:bg-gray-100 hover:text-gray-800">
                  <X className="h-4 w-4" /> Tozalash
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-16 text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          <div className="text-sm text-gray-400">Yuklanmoqda...</div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-16 text-center">
          <FileText className="mx-auto mb-3 h-10 w-10 text-gray-300" />
          <div className="text-sm font-medium text-gray-500">Hisobotlar topilmadi</div>
          <div className="mt-1 text-xs text-gray-400">Filtrni o'zgartiring yoki yangi hisobot qo'shing</div>
        </div>
      ) : viewMode === "list" ? (
        /* ─── LIST VIEW ─── */
        <div className="space-y-4">
          {grouped.map((group) => (
            <div key={group.teacherId} className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
              <div className="flex items-center justify-between border-b border-gray-50 bg-gradient-to-r from-violet-50 to-white px-5 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-sm font-bold text-white">
                    {group.teacherName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">{group.teacherName}</div>
                    <div className="text-xs text-gray-400">
                      {group.bsbCount > 0 && <span className="text-sky-600">{group.bsbCount} BSB</span>}
                      {group.bsbCount > 0 && group.chsbCount > 0 && <span> · </span>}
                      {group.chsbCount > 0 && <span className="text-rose-600">{group.chsbCount} CHSB</span>}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-gray-400">
                  <Clock className="inline-block h-3 w-3 align-middle" />{" "}
                  Oxirgi: {new Date(group.items[0].createdAt).toLocaleDateString("uz-UZ")}
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-50 bg-gray-50/50">
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">#</th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Sarlavha</th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Tur</th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Sinf</th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Fan</th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Chorak</th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Sana</th>
                      <th className="px-4 py-2.5 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">Amal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.items.map((r, i) => (
                      <tr key={r.id} className="border-b border-gray-50 transition-all hover:bg-indigo-50/30">
                        <td className="px-4 py-2.5 text-xs text-gray-400">{i + 1}</td>
                        <td className="px-4 py-2.5">
                          <div className="font-medium text-gray-900">{r.title}</div>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${r.type === "BSB" ? "bg-sky-100 text-sky-700" : "bg-rose-100 text-rose-700"}`}>{r.type}</span>
                        </td>
                        <td className="px-4 py-2.5 text-sm text-gray-700">{r.config?.classLevel || "-"}</td>
                        <td className="px-4 py-2.5 text-sm text-gray-700">{r.config?.subject || "-"}</td>
                        <td className="px-4 py-2.5">
                          <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${quarterColors[r.config?.quarter || ""] || "text-gray-600 bg-gray-50"}`}>{r.config?.quarter || "-"}</span>
                        </td>
                        <td className="px-4 py-2.5 text-xs text-gray-500 whitespace-nowrap">
                          {r.config?.date ? new Date(r.config.date + "T00:00:00").toLocaleDateString("uz-UZ", { day: "numeric", month: "short", year: "numeric" }) : new Date(r.createdAt).toLocaleDateString("uz-UZ", { day: "numeric", month: "short" })}
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <button onClick={() => handleView(r)} className="rounded-lg p-1.5 text-gray-400 transition-all hover:bg-indigo-100 hover:text-indigo-600" title="Ko'rish"><Eye className="h-4 w-4" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
          <div className="rounded-xl border border-gray-100 bg-white px-5 py-3 text-center text-sm text-gray-500 shadow-sm">
            Jami: <span className="font-semibold text-gray-900">{total}</span> ta hisobot
            {hasFilters && <span> (filtrlangan: <span className="font-semibold text-gray-900">{filtered.length}</span>)</span>}
          </div>
        </div>
      ) : (
        /* ─── CARDS VIEW ─── */
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {grouped.map((group) => {
            const subjects = [...new Set(group.items.map(r => r.config?.subject).filter(Boolean))] as string[];
            return (
              <button key={group.teacherId} onClick={() => { setFilterTeacher(group.teacherId); setViewMode("list"); }}
                className="group rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden transition-all hover:shadow-md hover:border-violet-200 text-left cursor-pointer">
                <div className="border-b border-gray-50 bg-gradient-to-r from-violet-50 to-white px-5 py-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-lg font-bold text-white shadow-sm">
                      {group.teacherName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-base font-semibold text-gray-900 truncate group-hover:text-violet-700 transition-colors">{group.teacherName}</div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-medium text-sky-700">
                          <span className="inline-block h-1.5 w-1.5 rounded-full bg-sky-500" />
                          {group.bsbCount} BSB
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-medium text-rose-700">
                          <span className="inline-block h-1.5 w-1.5 rounded-full bg-rose-500" />
                          {group.chsbCount} CHSB
                        </span>
                        <span className="text-xs text-gray-400">· {group.items.length} ta</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="px-5 py-3">
                  <div className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-1.5">Fanlari</div>
                  <div className="flex flex-wrap gap-1.5">
                    {subjects.length > 0 ? subjects.map(s => (
                      <span key={s} className="inline-flex rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-600">{s}</span>
                    )) : (
                      <span className="text-xs text-gray-300">Fan biriktirilmagan</span>
                    )}
                  </div>
                </div>
                <div className="border-t border-gray-50 bg-gray-50/50 px-5 py-2 text-[10px] text-gray-400 flex items-center gap-1">
                  <Clock className="inline-block h-3 w-3" />
                  Oxirgi: {new Date(group.items[0].createdAt).toLocaleDateString("uz-UZ", { day: "numeric", month: "short", year: "numeric" })}
                  <span className="ml-auto text-violet-500 opacity-0 group-hover:opacity-100 transition-opacity text-xs font-medium">Hisobotlarni ko'rish →</span>
                </div>
              </button>
            );
          })}
        </div>
      )}
      {!loading && filtered.length > 0 && viewMode === "cards" && (
        <div className="mt-5 rounded-xl border border-gray-100 bg-white px-5 py-3 text-center text-sm text-gray-500 shadow-sm">
          Jami: <span className="font-semibold text-gray-900">{total}</span> ta hisobot · <span className="font-semibold text-gray-900">{grouped.length}</span> ta o'qituvchi
          {hasFilters && <span> (filtrlangan)</span>}
        </div>
      )}
    </div>
  );
}
