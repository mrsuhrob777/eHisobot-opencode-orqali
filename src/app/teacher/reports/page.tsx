"use client";

import { t, type Lang } from "@/lib/i18n";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { getReports, deleteReport } from "@/actions/reports";
import { getTeacherData } from "@/actions/school-management";
import { FileText, Trash2, Download, Eye, AlertTriangle, X, Copy, Plus, LayoutGrid, List, ChevronDown } from "lucide-react";

declare global {
  interface Window { ExcelJS?: any; }
}

type ReportItem = {
  id: string;
  type: string;
  title: string;
  data: string;
  createdAt: string;
};

async function exportReportExcel(report: ReportItem, lang: Lang) {
  try {
    let ExcelJS = window.ExcelJS;
    if (!ExcelJS) {
      const scriptId = "exceljs-sdk";
      if (document.getElementById(scriptId)) {
        await new Promise(resolve => {
          const check = setInterval(() => { if (window.ExcelJS) { clearInterval(check); resolve(true); } }, 100);
        });
        ExcelJS = window.ExcelJS;
      } else {
        const script = document.createElement("script");
        script.id = scriptId;
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.3.0/exceljs.min.js";
        document.head.appendChild(script);
        await new Promise((resolve, reject) => { script.onload = resolve; script.onerror = () => reject(new Error("ExcelJS yuklanmadi.")); });
        ExcelJS = window.ExcelJS;
      }
    }
    if (!ExcelJS) throw new Error("ExcelJS topilmadi.");

    const d = JSON.parse(report.data);
    const { config, students, signatures, maxScores } = d;

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet(t("excel.sheet_name", lang));

    const taskHeaders = (students[0]?.scores || []).map((_: number, i: number) => ({
      header: `${i+1}${t("excel.task", lang)} (${maxScores[i]||10} ${t("bsb_chsb.ball", lang)})`, key: `t${i}`, width: 15
    }));
    const columns = [
      { header: t("excel.no", lang), key: "no", width: 6 },
      { header: t("excel.student_name", lang), key: "name", width: 35 },
      ...taskHeaders,
      { header: t("excel.total", lang), key: "total", width: 12 },
      { header: t("excel.percent", lang), key: "percent", width: 12 }
    ];
    ws.columns = columns;
    const lastCol = String.fromCharCode(65 + columns.length - 1);
    const thinBorder = { top: {style:"thin"}, left: {style:"thin"}, bottom: {style:"thin"}, right: {style:"thin"} };
    const centerA = { vertical: "middle", horizontal: "center", wrapText: true };
    const leftA = { vertical: "middle", horizontal: "left", wrapText: true };
    const rightA = { vertical: "middle", horizontal: "right" };

    ws.mergeCells(`A1:${lastCol}1`);
    const c1 = ws.getCell("A1"); c1.value = `${t("excel.date", lang)} ${config.date || ""}`; c1.alignment = rightA;
    c1.font = { italic: true, size: 14, name: "Times New Roman" }; ws.getRow(1).height = 25;

    ws.mergeCells(`A2:${lastCol}2`);
    const c2 = ws.getCell("A2"); c2.value = config.school || ""; c2.alignment = centerA;
    c2.font = { bold: true, size: 14, name: "Times New Roman" }; ws.getRow(2).height = 25;

    const qLabel = t(`bsb_chsb.quarter_${["1-chorak","2-chorak","3-chorak","4-chorak"].indexOf(config.quarter)+1}` as any, lang) || config.quarter;
    ws.mergeCells(`A3:${lastCol}3`);
    const c3 = ws.getCell("A3"); c3.value = t("excel.in_class", lang).replace("{class}", config.classLevel).replace("{suffix}", t("bsb_chsb.class_suffix", lang)).replace("{subject}", t("subject." + config.subject as any, lang)); c3.alignment = centerA;
    c3.font = { size: 14, name: "Times New Roman" }; ws.getRow(3).height = 25;

    ws.mergeCells(`A4:${lastCol}4`);
    const c4 = ws.getCell("A4"); c4.value = `${qLabel} ${config.reportNumber}-${report.type} ${t("excel.report", lang)}`; c4.alignment = centerA;
    c4.font = { bold: true, size: 16, name: "Times New Roman" }; ws.getRow(4).height = 30;

    ws.addRow([]);
    const headerRow = ws.getRow(6);
    headerRow.values = columns.map(c => c.header);
    headerRow.height = 45;
    headerRow.eachCell((c: any) => {
      c.font = { bold: true, size: 14, name: "Times New Roman" };
      c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD9E1F2" } };
      c.border = thinBorder; c.alignment = centerA;
    });

    let rh = 30;
    if (students.length < 15) rh = 45; else if (students.length < 25) rh = 35;
    const maxTotal = maxScores.reduce((a: number, b: number) => a+b, 0);

    students.forEach((s: { name: string; scores: number[] }, i: number) => {
      const total = s.scores.reduce((a: number, b: number) => a+b, 0);
      const pct = maxTotal > 0 ? (total / maxTotal) * 100 : 0;
      const row = ws.addRow([i+1, s.name, ...s.scores, total, pct.toFixed(1) + "%"]);
      row.height = rh;
      row.eachCell((c: any, ci: number) => {
        c.border = thinBorder; c.alignment = ci === 2 ? leftA : centerA;
        c.font = { name: "Times New Roman", size: 14 };
      });
    });

    const n = students.length || 1;
    const totalSum = students.reduce((s: number, st: { scores: number[] }) => s + st.scores.reduce((a: number, b: number) => a+b, 0), 0);
    const maxSum = n * maxTotal;
    const overallPct = maxSum > 0 ? (totalSum / maxSum) * 100 : 0;
    const colPcts = maxScores.map((_: number, col: number) => {
      const sum = students.reduce((s: number, st: { scores: number[] }) => s + (st.scores[col]||0), 0);
      return n > 0 ? (sum / (n * (maxScores[col]||1))) * 100 : 0;
    });

    const footer1 = ["", t("excel.mastery", lang), ...colPcts.map((p: number) => p.toFixed(0) + "%"), overallPct.toFixed(0) + "%", overallPct.toFixed(0) + "%"];
    const fr1 = ws.addRow(footer1);
    fr1.height = rh;
    fr1.eachCell((c: any, ci: number) => {
      c.font = { bold: true, name: "Times New Roman", size: 14, color: { argb: "FF0000FF" } };
      c.border = thinBorder; c.alignment = ci === 2 ? leftA : centerA;
      c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF0F7FF" } };
    });

    const colAvgs = maxScores.map((_: number, col: number) => {
      const sum = students.reduce((s: number, st: { scores: number[] }) => s + (st.scores[col]||0), 0);
      return n > 0 ? (sum / n).toFixed(1) : "0";
    });
    const avgTotal = n > 0 ? (totalSum / n).toFixed(1) : "0";
    const footer2 = ["", t("excel.avg", lang), ...colAvgs, avgTotal, overallPct.toFixed(1) + "%"];
    const fr2 = ws.addRow(footer2);
    fr2.height = rh + 5;
    fr2.eachCell((c: any, ci: number) => {
      c.font = { bold: true, name: "Times New Roman", size: 14 };
      c.border = thinBorder; c.alignment = ci === 2 ? leftA : centerA;
      c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEBF9EB" } };
    });

    ws.addRow([]); ws.addRow([]);
    let sigRow = ws.rowCount + 1;
    const addSig = (label: string, val: string) => {
      ws.mergeCells(`A${sigRow}:C${sigRow}`);
      const c = ws.getCell(`A${sigRow}`); c.value = `${label} ${val || ""}`;
      c.alignment = leftA; c.font = { name: "Times New Roman", size: 14 };
      sigRow++;
    };
    addSig(t("excel.sig_oibdo", lang), signatures?.oibdo || "");
    addSig(t("excel.sig_methodist", lang), signatures?.metodist || "");
    addSig(t("excel.sig_teacher", lang), signatures?.teacher || "");

    ws.pageSetup = {
      orientation: "landscape", paperSize: 9, fitToPage: true,
      fitToWidth: 1, fitToHeight: 1,
      margins: { left: 0.3, right: 0.3, top: 0.4, bottom: 0.4, header: 0, footer: 0 },
      horizontalCentered: true, verticalCentered: false
    };

    const buf = await wb.xlsx.writeBuffer();
    const blob = new Blob([buf], { type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = `${config.classLevel}${t("bsb_chsb.class_suffix", lang)} - ${t("subject." + config.subject as any, lang)} - ${qLabel} ${config.reportNumber}-${report.type}.xlsx`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Excel export error:", err);
    alert(t("bsb_chsb.export_error", lang) || "Excel yuklashda xatolik yuz berdi.");
  }
}

export default function ReportsPage() {
  const router = useRouter();
  const [lang, setLang] = useState<Lang>("uz");
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"BSB" | "CHSB">("BSB");
  const [subjectFilter, setSubjectFilter] = useState<string>("all");
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [classFilter, setClassFilter] = useState<string>("all");
  const [teacherClasses, setTeacherClasses] = useState<{ id: string; name: string }[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [modalQuarter, setModalQuarter] = useState<string | null>(null);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"quarter" | "list">("quarter");
  const listRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startIdx: number; startY: number; select: boolean; initialSelection: Set<string> } | null>(null);
  const lastClickedRef = useRef<number | null>(null);
  const activeReportsRef = useRef<ReportItem[]>([]);

  const getSchoolYear = (dateStr: string): string => {
    try {
      const d = new Date(dateStr);
      const y = d.getFullYear();
      const m = d.getMonth() + 1;
      if (m >= 8) return `${y}-${y + 1}`;
      return `${y - 1}-${y}`;
    } catch { return ""; }
  };

  const getYearFromReport = (r: ReportItem): string => {
    try {
      const d = JSON.parse(r.data);
      if (d.config?.date) return getSchoolYear(d.config.date);
    } catch {}
    return getSchoolYear(r.createdAt);
  };

  const quarterLabel = (q: string) => {
    const map: Record<string, string> = {
      "1-chorak": t("bsb_chsb.quarter_1", lang), "2-chorak": t("bsb_chsb.quarter_2", lang),
      "3-chorak": t("bsb_chsb.quarter_3", lang), "4-chorak": t("bsb_chsb.quarter_4", lang)
    };
    return map[q] || q;
  };

  const quarterOrder = ["1-chorak", "2-chorak", "3-chorak", "4-chorak"];

  const filtered = reports.filter(r => {
    if (r.type !== filter) return false;
    if (subjectFilter !== "all") { try { if (JSON.parse(r.data).config?.subject !== subjectFilter) return false; } catch { return false; } }
    if (yearFilter !== "all") { if (getYearFromReport(r) !== yearFilter) return false; }
    if (classFilter !== "all") { try { if (JSON.parse(r.data).config?.classLevel !== classFilter) return false; } catch { return false; } }
    return true;
  });

  const grouped: Record<string, ReportItem[]> = {};
  filtered.forEach(r => {
    try {
      const q = JSON.parse(r.data).config?.quarter || "1-chorak";
      if (!grouped[q]) grouped[q] = [];
      grouped[q].push(r);
    } catch {
      if (!grouped["1-chorak"]) grouped["1-chorak"] = [];
      grouped["1-chorak"].push(r);
    }
  });

  const hasAnyReports = Object.values(grouped).some(g => g.length > 0);

  const sortedList = [...filtered].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  useEffect(() => {
    activeReportsRef.current = modalQuarter && grouped[modalQuarter] ? grouped[modalQuarter] : filtered;
  }, [filtered, modalQuarter, grouped]);

  useEffect(() => {
    const saved = document.cookie.match(/(?:^|;\s*)lang=([^;]*)/)?.[1] as Lang | undefined;
    if (saved) setLang(saved);
    const handler = (e: CustomEvent) => setLang(e.detail as Lang);
    window.addEventListener('langchange', handler as EventListener);
    return () => window.removeEventListener('langchange', handler as EventListener);
  }, []);

  useEffect(() => {
    getReports().then(r => {
      const list = Array.isArray(r) ? r : r.data;
      setReports(list as unknown as ReportItem[]);
      setLoading(false);
    });
    getTeacherData().then(res => {
      if (res.data) setTeacherClasses(res.data.classes);
    });
  }, []);

  useEffect(() => {
    const u = new URL(window.location.href);
    if (u.searchParams.get("type")) setFilter(u.searchParams.get("type") as "BSB" | "CHSB");
    if (u.searchParams.get("subject")) setSubjectFilter(u.searchParams.get("subject")!);
    if (u.searchParams.get("year")) setYearFilter(u.searchParams.get("year")!);
    if (u.searchParams.get("class")) setClassFilter(u.searchParams.get("class")!);
  }, []);

  useEffect(() => {
    const u = new URL(window.location.href);
    if (filter !== "BSB") u.searchParams.set("type", filter); else u.searchParams.delete("type");
    if (subjectFilter !== "all") u.searchParams.set("subject", subjectFilter); else u.searchParams.delete("subject");
    if (yearFilter !== "all") u.searchParams.set("year", yearFilter); else u.searchParams.delete("year");
    if (classFilter !== "all") u.searchParams.set("class", classFilter); else u.searchParams.delete("class");
    window.history.replaceState(null, "", u.toString());
  }, [filter, subjectFilter, yearFilter, classFilter]);

  const handleCheck = useCallback((id: string, idx: number, shiftKey: boolean) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      const active = activeReportsRef.current;
      if (shiftKey && lastClickedRef.current !== null) {
        const from = Math.min(lastClickedRef.current, idx);
        const to = Math.max(lastClickedRef.current, idx);
        for (let i = from; i <= to; i++) next.add(active[i].id);
      } else {
        next.has(id) ? next.delete(id) : next.add(id);
      }
      return next;
    });
    lastClickedRef.current = idx;
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent, idx: number) => {
    const active = activeReportsRef.current;
    const checked = selectedIds.has(active[idx]?.id);
    dragRef.current = { startIdx: idx, startY: e.clientY, select: !checked, initialSelection: new Set(selectedIds) };
  }, [selectedIds]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const onMove = (e: PointerEvent) => {
      const d = dragRef.current;
      if (!d) return;
      const target = document.elementFromPoint(e.clientX, e.clientY);
      const item = target?.closest?.('[data-report-idx]');
      if (!item) return;
      const i = parseInt(item.getAttribute('data-report-idx') || '');
      if (isNaN(i)) return;
      const from = Math.min(d.startIdx, i);
      const to = Math.max(d.startIdx, i);
      const { select, initialSelection } = d;
      const active = activeReportsRef.current;
      setSelectedIds(() => {
        const next = new Set(initialSelection);
        for (let j = from; j <= to; j++) {
          select ? next.add(active[j].id) : next.delete(active[j].id);
        }
        return next;
      });
    };
    const onUp = (e: PointerEvent) => {
      const d = dragRef.current;
      if (!d) return;
      const moved = Math.abs(e.clientY - d.startY) > 6;
      if (!moved) {
        const active = activeReportsRef.current;
        handleCheck(active[d.startIdx]?.id, d.startIdx, e.shiftKey);
      } else {
        lastClickedRef.current = d.startIdx;
      }
      dragRef.current = null;
    };
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
    };
  }, [reports, handleCheck]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "a") {
        const active = document.activeElement;
        if (listRef.current && listRef.current.contains(active)) {
          e.preventDefault();
          if (selectedIds.size === filtered.length) setSelectedIds(new Set());
          else setSelectedIds(new Set(filtered.map(r => r.id)));
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [filtered, selectedIds]);

  const handleDelete = async (id: string) => {
    await deleteReport(id);
    setReports(prev => prev.filter(r => r.id !== id));
    setSelectedIds(prev => { const n = new Set(prev); n.delete(id); return n; });
  };

  const handleBulkDelete = async () => {
    for (const id of selectedIds) {
      try { await deleteReport(id); } catch {}
    }
    setReports(prev => prev.filter(r => !selectedIds.has(r.id)));
    setSelectedIds(new Set());
    setConfirmBulkDelete(false);
  };

  const handleDownload = async (report: ReportItem) => {
    setDownloading(report.id);
    await exportReportExcel(report, lang);
    setDownloading(null);
  };

  const handleDuplicate = async (report: ReportItem) => {
    try {
      const { saveReport } = await import("@/actions/reports");
      const d = JSON.parse(report.data);
      const newData = JSON.stringify({
        ...d,
        config: { ...d.config, reportNumber: String(Number(d.config.reportNumber || 1) + 1) },
      });
      const title = `${d.config.classLevel} - ${d.config.subject} - ${Number(d.config.reportNumber || 1) + 1}-${report.type}`;
      const result = await saveReport(report.type, title, newData);
      if (result.id) {
        const newReport: ReportItem = {
          id: result.id,
          type: report.type,
          title,
          data: newData,
          createdAt: new Date().toISOString(),
        };
        setReports(prev => [newReport, ...prev]);
      }
    } catch (err) {
      console.error("Duplicate error:", err);
      alert("Nusxa olishda xatolik yuz berdi.");
    }
  };

  const getTypeColor = (type: string) => {
    return type === "BSB" ? "bg-indigo-100 text-indigo-700" : "bg-amber-100 text-amber-700";
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="animate-pulse text-gray-400">{t("common.search", lang)}</div>
      </div>
    );
  }

  return (
    <div ref={listRef}>
      {/* Header */}
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{t("reports.title", lang)}</h1>
          <p className="mt-1 text-sm text-gray-500">{t("reports.subtitle", lang)}</p>
        </div>
        {(() => {
          const years = [...new Set(reports.map(r => getYearFromReport(r)).filter(Boolean))].sort() as string[];
          if (years.length < 1) return null;
          return (
            <div className="flex items-center gap-2 shrink-0">
              <div className="relative">
                <select value={yearFilter} onChange={(e) => { setYearFilter(e.target.value); setSelectedIds(new Set()); }}
                  className="appearance-none rounded-lg border border-gray-200 bg-white pl-3 pr-8 py-2 min-h-[44px] text-sm font-medium text-gray-700 shadow-sm outline-none transition-all cursor-pointer hover:border-indigo-300 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200">
                   <option value="all">{t("common.all_years", lang)}</option>
                  {years.map(y => (
                    <option key={y} value={y}>{y}-{t("common.academic_year", lang)}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-gray-400">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg">
                <button onClick={() => setViewMode("quarter")}
                  className={`p-2 rounded-md transition-all ${viewMode === "quarter" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
                  title="Choraklar bo'yicha">
                  <LayoutGrid className="h-5 w-5" />
                </button>
                <button onClick={() => setViewMode("list")}
                  className={`p-2 rounded-md transition-all ${viewMode === "list" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
                  title="Ro'yxat ko'rinishi">
                  <List className="h-5 w-5" />
                </button>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Subject + BSB/ChSB: same row on desktop, stacked on mobile */}
      {(() => {
        const subjects = [...new Set(reports.map(r => { try { return JSON.parse(r.data).config?.subject; } catch { return null; } }).filter(Boolean))] as string[];
        const hasSubjects = subjects.length > 0;
        const bsbChips = (
          <div className="flex gap-1.5">
            <button
              onClick={() => setFilter("BSB")}
              className={`flex-1 sm:flex-none px-4 py-1.5 min-h-[40px] rounded-full text-xs font-semibold transition-all duration-200 select-none border ${
                filter === "BSB"
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
              }`}
            >
              BSB
            </button>
            <button
              onClick={() => setFilter("CHSB")}
              className={`flex-1 sm:flex-none px-4 py-1.5 min-h-[40px] rounded-full text-xs font-semibold transition-all duration-200 select-none border ${
                filter === "CHSB"
                  ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-amber-300 hover:text-amber-600'
              }`}
            >
              ChSB
            </button>
          </div>
        );
        if (!hasSubjects) return (
          <>
            <div className="mb-4">{bsbChips}</div>
            <div className="border-b border-gray-200 mb-4" />
          </>
        );
        const subjectTabs = (
          <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => { setSubjectFilter("all"); setSelectedIds(new Set()); }}
              className={`px-4 py-1.5 min-h-[40px] rounded-lg text-sm font-medium transition-all duration-200 select-none ${
                subjectFilter === "all"
                  ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/80'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
              }`}
            >
              {t("common.all_subjects", lang)}
            </button>
            {subjects.map(subj => (
              <button
                key={subj}
                onClick={() => { setSubjectFilter(subj); setSelectedIds(new Set()); }}
                className={`px-4 py-1.5 min-h-[40px] rounded-lg text-sm font-medium transition-all duration-200 select-none ${
                  subjectFilter === subj
                    ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/80'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
                }`}
              >
                {t("subject." + (subj.charAt(0).toUpperCase() + subj.slice(1)), lang)}
              </button>
            ))}
          </div>
        );
        return (
          <>
            {/* Mobile: subject only */}
            <div className="sm:hidden">
              <div className="mb-3">{subjectTabs}</div>
              <div className="border-b border-gray-200 mb-4" />
            </div>
            {/* Mobile: BSB/ChSB only */}
            <div className="sm:hidden mb-4">{bsbChips}</div>
            {/* Desktop: subject + BSB/ChSB in one row */}
            <div className="hidden sm:flex sm:items-center sm:justify-between sm:mb-4">
              <div className="sm:mr-4 sm:flex-1">{subjectTabs}</div>
              <div className="sm:flex-none">{bsbChips}</div>
            </div>
          </>
        );
      })()}

      <div className="border-b border-gray-200 mb-4" />

      {/* Class filter chips */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {viewMode === "list" ? (
            <div className="relative">
              <select value={classFilter} onChange={(e) => { setClassFilter(e.target.value); setSelectedIds(new Set()); }}
                className="appearance-none rounded-lg border border-gray-200 bg-white pl-3 pr-8 py-2 min-h-[40px] text-sm font-medium text-gray-700 shadow-sm outline-none transition-all cursor-pointer hover:border-indigo-300 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200">
                <option value="all">{t("common.all_classes", lang)}</option>
                {teacherClasses.map(c => (
                  <option key={c.id} value={c.name}>{c.name.toUpperCase()}{t("bsb_chsb.class_suffix", lang)}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-gray-400">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          ) : (
            <>
              <button
                onClick={() => { setClassFilter("all"); setSelectedIds(new Set()); }}
                className={`px-3 py-1.5 min-h-[40px] min-w-[80px] sm:min-w-0 rounded-full text-xs font-medium transition-all duration-200 select-none border ${
                  classFilter === "all"
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                    : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700'
                }`}
              >
                {t("common.all_classes", lang)}
              </button>
              {teacherClasses.map(c => (
                <button
                  key={c.id}
                  onClick={() => { setClassFilter(c.name); setSelectedIds(new Set()); }}
                  className={`px-3 py-1.5 min-h-[40px] min-w-[80px] sm:min-w-0 rounded-full text-xs font-medium transition-all duration-200 select-none border ${
                    classFilter === c.name
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                      : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700'
                  }`}
                >
                  {c.name.toUpperCase()}{t("bsb_chsb.class_suffix", lang)}
                </button>
              ))}
            </>
          )}
        </div>
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2 ml-auto">
            <button onClick={() => setConfirmBulkDelete(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-red-500 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-red-600">
              <Trash2 className="h-3.5 w-3.5" /> {t("reports.count", lang).replace("{n}", String(selectedIds.size))}
            </button>
            <button onClick={() => setSelectedIds(new Set())}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-500 shadow-sm transition-all hover:bg-gray-50">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {(() => {
        if (!hasAnyReports) return (
          <div className="rounded-2xl border border-gray-100 bg-white p-12 shadow-sm">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-50 text-gray-300">
                <FileText className="h-8 w-8" />
              </div>
              <h3 className="mb-1 text-lg font-semibold text-gray-900">{t("reports.no_reports", lang)}</h3>
              <p className="mb-6 text-sm text-gray-400">{t("bsb_chsb.teacher_panel", lang)}</p>
              <button onClick={() => router.push("/teacher/bsb-chsb")}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:scale-[1.02]">
                <Plus className="h-4 w-4" /> {t("common.create_report", lang)}
              </button>
            </div>
          </div>
        );
        if (viewMode === "list") return (
          <div className="space-y-2">
            {sortedList.map((report, idx) => {
              const data = JSON.parse(report.data);
              const config = data.config;
              const students = data.students || [];
              const maxScores = data.maxScores || [];
              const maxTotal = maxScores.reduce((a: number, b: number) => a + b, 0);
              const totalSum = students.reduce((s: number, st: any) => s + (st.scores || []).reduce((a: number, b: number) => a + b, 0), 0);
              const n = students.length;
              const overallPct = maxTotal > 0 && n > 0 ? (totalSum / (n * maxTotal)) * 100 : 0;
              const avgTotal = n > 0 ? totalSum / n : 0;
              const checked = selectedIds.has(report.id);
              return (
                <div key={report.id}
                  data-report-idx={idx}
                  onPointerDown={(e) => handlePointerDown(e, idx)}
                  style={{ touchAction: 'none' }}
                  className={`rounded-xl border p-3 sm:p-4 shadow-sm transition-all select-none ${
                    checked
                      ? "border-indigo-300 bg-indigo-50/50 shadow-md"
                      : "border-gray-100 bg-white hover:shadow-md hover:border-gray-200"
                  }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex items-start gap-2 flex-1 min-w-0 pointer-events-none">
                      <div className="flex items-center gap-2">
                        <div className={`flex h-[18px] w-[18px] items-center justify-center rounded-[5px] border-2 transition-all duration-150 ${
                          checked
                            ? "border-indigo-500 bg-indigo-500"
                            : "border-gray-300 bg-white"
                        }`}>
                          {checked && (
                            <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-[11px] font-bold ${getTypeColor(report.type)}`}>
                          {report.type}
                        </div>
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-gray-900 truncate">
                          {config?.classLevel} - {config?.subject ? t("subject." + (config.subject.charAt(0).toUpperCase() + config.subject.slice(1)), lang) : ""} - {config?.reportNumber}-{report.type}
                        </h3>
                        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                          <span>{config?.classLevel?.toUpperCase()}{t("bsb_chsb.class_suffix", lang)}</span>
                          <span className="h-1 w-1 rounded-full bg-gray-300" />
                          <span>{config?.subject ? t("subject." + (config.subject.charAt(0).toUpperCase() + config.subject.slice(1)), lang) : ""}</span>
                          <span className="h-1 w-1 rounded-full bg-gray-300" />
                          <span>{quarterLabel(config?.quarter || "1-chorak")}</span>
                          <span className="h-1 w-1 rounded-full bg-gray-300" />
                          <span>{config?.date ? new Date(config.date).toLocaleDateString() : new Date(report.createdAt).toLocaleDateString()}</span>
                          <span className="h-1 w-1 rounded-full bg-gray-300" />
                          <span className={`font-semibold ${overallPct >= 70 ? "text-emerald-600" : overallPct >= 40 ? "text-amber-600" : "text-red-500"}`}>
                            {avgTotal.toFixed(1)} {t("bsb_chsb.ball", lang)} &middot; {overallPct.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0"
                      onPointerDown={(e) => { e.stopPropagation(); dragRef.current = null; }}>
                      <button onClick={() => router.push(`/teacher/bsb-chsb?reportId=${report.id}`)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:border-indigo-300 hover:text-indigo-600">
                        <Eye className="h-3 w-3" /> {t("reports.view", lang)}
                      </button>
                      <button onClick={() => handleDownload(report)} disabled={downloading === report.id}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-sm transition-all hover:shadow-md hover:scale-[1.02] disabled:opacity-50">
                        <Download className="h-3 w-3" /> {downloading === report.id ? "..." : t("reports.download", lang)}
                      </button>
                      <button onClick={() => handleDuplicate(report)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:border-indigo-300 hover:text-indigo-600">
                        <Copy className="h-3 w-3" /> {t("common.duplicate", lang)}
                      </button>
                      <button onClick={() => handleDelete(report.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-2.5 py-1.5 text-[11px] font-medium text-red-500 transition-all hover:bg-red-50">
                        <Trash2 className="h-3 w-3" /> {t("reports.delete", lang)}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        );
        return (
          <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {quarterOrder.filter(q => grouped[q]?.length > 0).map(q => {
              const quarterReports = [...grouped[q]].sort((a, b) => {
                const aData = JSON.parse(a.data).config;
                const bData = JSON.parse(b.data).config;
                const typeOrder = a.type === "BSB" ? (b.type === "BSB" ? 0 : -1) : (b.type === "CHSB" ? 0 : 1);
                if (typeOrder !== 0) return typeOrder;
                return (parseInt(aData.reportNumber) || 0) - (parseInt(bData.reportNumber) || 0);
              });
              const previewReports = quarterReports.slice(0, 2);
              const hiddenCount = quarterReports.length - 2;
              return (
                <div key={q} className="group rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md hover:border-gray-300 transition-all duration-200 overflow-hidden">
                  <button onClick={() => setModalQuarter(q)}
                    className="w-full text-left">
                    <div className={`relative flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-gray-100 ${
                      filter === "BSB" ? "bg-gradient-to-r from-indigo-50/60 to-white" : "bg-gradient-to-r from-amber-50/60 to-white"
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                          filter === "BSB" ? "bg-[#EEEDFE] text-[#3C3489]" : "bg-[#FEF3C7] text-[#92400E]"
                        }`}>
                          <FileText className="h-4 w-4" />
                        </div>
                        <div>
                          <h2 className="text-sm font-bold text-gray-800">{quarterLabel(q)}</h2>
                          <span className="text-[11px] text-gray-400">{quarterReports.length} {t("common.count_suffix", lang)}</span>
                        </div>
                      </div>
                      <span className={`text-[11px] font-bold px-3 py-1 rounded-full ${
                        filter === "BSB"
                          ? "bg-[#EEEDFE] text-[#3C3489]"
                          : "bg-[#FEF3C7] text-[#92400E]"
                      }`}>
                        {filter}
                      </span>
                      <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-black/[0.02] pointer-events-none" />
                    </div>
                  </button>
                  <div className="divide-y divide-gray-50">
                    {previewReports.map((r, i) => {
                      const data = JSON.parse(r.data);
                      const config = data.config;
                      const label = `${config?.reportNumber || "?"}-${r.type}`;
                      const isBsb = r.type === "BSB";
                      return (
                        <div key={r.id} className="flex items-center gap-3 px-4 sm:px-5 py-3 transition-colors hover:bg-gray-50/50">
                          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg shrink-0 min-w-[48px] text-center ${
                            isBsb
                              ? "bg-indigo-100 text-indigo-700"
                              : "bg-amber-100 text-amber-700"
                          }`}>
                            {label}
                          </span>
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span className="text-sm text-gray-900 font-semibold truncate">
                              {config?.classLevel?.toUpperCase()}{t("bsb_chsb.class_suffix", lang)}
                            </span>
                            <span className="text-gray-300 shrink-0">·</span>
                            <span className="text-sm text-gray-600 truncate">
                              {config?.subject ? t("subject." + (config.subject.charAt(0).toUpperCase() + config.subject.slice(1)), lang) : ""}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    {quarterReports.length === 0 && (
                      <div className="text-center py-6">
                        <span className="text-sm text-gray-400">{t("reports.no_reports", lang)}</span>
                      </div>
                    )}
                  </div>
                  {hiddenCount > 0 && (
                    <button onClick={() => setModalQuarter(q)}
                      className="w-full flex items-center justify-center gap-1.5 border-t border-gray-100 px-4 py-3 text-xs font-medium text-gray-500 hover:text-indigo-600 hover:bg-indigo-50/40 transition-all">
                      {lang === "uz" ? "Barchasini ko'rish" : lang === "en" ? "View all" : "Смотреть все"}
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {modalQuarter && grouped[modalQuarter] && (
            <div className="fixed inset-0 z-[120] flex items-start justify-center p-4 pt-8 sm:p-8 bg-black/40 backdrop-blur-sm overflow-y-auto"
              onClick={(e) => { if (e.target === e.currentTarget) setModalQuarter(null); }}>
              <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between gap-4 p-5 border-b border-gray-200 bg-slate-50">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-gray-900">{quarterLabel(modalQuarter)}</h2>
                    <span className="text-xs text-gray-400 bg-gray-200 px-2.5 py-0.5 rounded-full font-medium">{grouped[modalQuarter].length} {t("common.count_suffix", lang)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedIds.size > 0 && (
                      <button onClick={() => setConfirmBulkDelete(true)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-red-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-red-600">
                        <Trash2 className="h-3.5 w-3.5" /> {t("reports.count", lang).replace("{n}", String(selectedIds.size))}
                      </button>
                    )}
                    {selectedIds.size > 0 && (
                      <button onClick={() => setSelectedIds(new Set())}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-2 py-1.5 text-xs font-medium text-gray-500 shadow-sm transition-all hover:bg-gray-50">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button onClick={() => setModalQuarter(null)}
                      className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-200 transition-colors">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="p-5 space-y-2 max-h-[70vh] overflow-y-auto">
                  {grouped[modalQuarter].map((report, idx) => {
                    const data = JSON.parse(report.data);
                    const config = data.config;
                    const students = data.students || [];
                    const maxScores = data.maxScores || [];
                    const maxTotal = maxScores.reduce((a: number, b: number) => a + b, 0);
                    const totalSum = students.reduce((s: number, st: any) => s + (st.scores || []).reduce((a: number, b: number) => a + b, 0), 0);
                    const n = students.length;
                    const overallPct = maxTotal > 0 && n > 0 ? (totalSum / (n * maxTotal)) * 100 : 0;
                    const avgTotal = n > 0 ? totalSum / n : 0;
                    const checked = selectedIds.has(report.id);
                    const label = `${config?.reportNumber || "?"}-${report.type}`;
                    return (
                      <div key={report.id}
                        data-report-idx={idx}
                        onPointerDown={(e) => handlePointerDown(e, idx)}
                        style={{ touchAction: 'none' }}
                        className={`rounded-xl border p-3 sm:p-4 shadow-sm transition-all select-none ${
                          checked
                            ? "border-indigo-300 bg-indigo-50/50 shadow-md"
                            : "border-gray-100 bg-white hover:shadow-md hover:border-gray-200"
                        }`}>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div className="flex items-start gap-2 flex-1 min-w-0 pointer-events-none">
                            <div className="flex items-center gap-2">
                              <div className={`flex h-[18px] w-[18px] items-center justify-center rounded-[5px] border-2 transition-all duration-150 ${
                                checked
                                  ? "border-indigo-500 bg-indigo-500"
                                  : "border-gray-300 bg-white"
                              }`}>
                                {checked && (
                                  <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </div>
                              <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-[11px] font-bold ${getTypeColor(report.type)}`}>
                                {report.type}
                              </div>
                            </div>
                            <div className="min-w-0">
                              <h3 className="text-sm font-bold text-gray-900 truncate">
                                {config?.classLevel} - {config?.subject ? t("subject." + (config.subject.charAt(0).toUpperCase() + config.subject.slice(1)), lang) : ""} - {label}
                              </h3>
                              <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                                <span>{config?.classLevel?.toUpperCase()}{t("bsb_chsb.class_suffix", lang)}</span>
                                <span className="h-1 w-1 rounded-full bg-gray-300" />
                                <span>{config?.subject ? t("subject." + (config.subject.charAt(0).toUpperCase() + config.subject.slice(1)), lang) : ""}</span>
                                <span className="h-1 w-1 rounded-full bg-gray-300" />
                                <span>{config?.date ? new Date(config.date).toLocaleDateString() : new Date(report.createdAt).toLocaleDateString()}</span>
                                <span className="h-1 w-1 rounded-full bg-gray-300" />
                                <span className={`font-semibold ${overallPct >= 70 ? "text-emerald-600" : overallPct >= 40 ? "text-amber-600" : "text-red-500"}`}>
                                  {avgTotal.toFixed(1)} {t("bsb_chsb.ball", lang)} &middot; {overallPct.toFixed(1)}%
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0"
                            onPointerDown={(e) => { e.stopPropagation(); dragRef.current = null; }}>
                            <button onClick={() => router.push(`/teacher/bsb-chsb?reportId=${report.id}`)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:border-indigo-300 hover:text-indigo-600">
                              <Eye className="h-3 w-3" /> {t("reports.view", lang)}
                            </button>
                            <button onClick={() => handleDownload(report)} disabled={downloading === report.id}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-sm transition-all hover:shadow-md hover:scale-[1.02] disabled:opacity-50">
                              <Download className="h-3 w-3" /> {downloading === report.id ? "..." : t("reports.download", lang)}
                            </button>
                            <button onClick={() => handleDuplicate(report)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:border-indigo-300 hover:text-indigo-600">
                              <Copy className="h-3 w-3" /> {t("common.duplicate", lang)}
                            </button>
                            <button onClick={() => handleDelete(report.id)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-2.5 py-1.5 text-[11px] font-medium text-red-500 transition-all hover:bg-red-50">
                              <Trash2 className="h-3 w-3" /> {t("reports.delete", lang)}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
          </>
        );
      })()}

      {confirmBulkDelete && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-6 shadow-2xl">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-500">
                <AlertTriangle className="h-8 w-8" />
              </div>
              <h3 className="mb-2 text-lg font-bold text-gray-900">{t("reports.delete_confirm", lang)}</h3>
              <p className="mb-6 text-sm text-gray-500">{t("reports.bulk_delete_confirm", lang).replace("{n}", String(selectedIds.size))}</p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmBulkDelete(false)} className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50">{t("bsb_chsb.cancel", lang)}</button>
                <button onClick={handleBulkDelete} className="flex-1 rounded-xl bg-red-500 px-4 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:bg-red-600">{t("bsb_chsb.confirm", lang)}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
