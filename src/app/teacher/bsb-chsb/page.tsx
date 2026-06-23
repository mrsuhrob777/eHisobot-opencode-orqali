"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  Plus, Trash2, Download, RotateCcw, X, Check,
  Maximize2, Minimize2, ChevronDown, Clock, Save
} from "lucide-react";
import { t, type Lang } from "@/lib/i18n";

const SCHOOL_NAME = "Yangiariq tumani 37-maktab";
const DEFAULT_TASK_COUNT = 5;

const CHSB_LABELS = ["B","Q","M"] as const;
const CHSB_VALUES: Record<string,number> = { B:5, Q:3, M:1 };
const CHSB_COLORS: Record<string,{primary:string;border:string;bg:string;text:string}> = {
  B:{primary:"#EF4444",border:"#EF4444",bg:"#FEE2E2",text:"#B91C1C"},
  Q:{primary:"#F59E0B",border:"#F59E0B",bg:"#FEF3C7",text:"#B45309"},
  M:{primary:"#10B981",border:"#10B981",bg:"#DCFCE7",text:"#047857"},
};
const QUARTERS = ["1-chorak","2-chorak","3-chorak","4-chorak"];
const DB_STORAGE_KEY = "STUDENT_DATABASE_V2";

function cloneDB() {
  return {};
}

function loadDB(): Record<string,Record<string,string[]>> {
  try { const raw = localStorage.getItem(DB_STORAGE_KEY); if (raw) return JSON.parse(raw); } catch {}
  return {};
}

function saveDB(db: Record<string,Record<string,string[]>>) {
  localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(db));
}

function uzbekSort(a:string,b:string) {
  return a.localeCompare(b,"uz-Latn-UZ",{sensitivity:"base"});
}

function getGroups(db: Record<string,Record<string,string[]>>, cls: string): string[] {
  return db[cls] ? Object.keys(db[cls]) : ["Butun sinf"];
}

function createReport(type:"BSB"|"CHSB", db: Record<string,Record<string,string[]>>, assignedSubjects?: string[]) {
  const cls = Object.keys(db)[0] || "";
  const grp = cls ? (getGroups(db,cls)[0] || "Butun sinf") : "Butun sinf";
  const students = cls ? (db[cls]?.[grp] || []).sort(uzbekSort) : [];
  const subject = (assignedSubjects && assignedSubjects.length > 0) ? assignedSubjects[0] : "";
  return {
    config: {
      date: new Date().toISOString().split("T")[0], school: SCHOOL_NAME,
      classLevel: cls, group: grp, subject: subject,
      quarter: "1-chorak", reportNumber: "1", taskCount: DEFAULT_TASK_COUNT,
    },
    maxScores: Array(DEFAULT_TASK_COUNT).fill(10),
    students: students.map((n:string,i:number) => ({ id:`s-${Date.now()}-${i}`, name:n, scores:Array(DEFAULT_TASK_COUNT).fill(0) })),
    signatures: { oibdo:"", metodist:"", teacher:"" },
  };
}

function distributeTotal(total:number, maxScores:number[]): number[] {
  const n = maxScores.length; if (n===0) return [];
  const result = new Array(n).fill(0);
  let remaining = total;
  const indices = Array.from({length:n},(_,i)=>i);
  while (remaining >= 2) {
    const minVal = Math.min(...result);
    const candidates = indices.filter(i => result[i]+2 <= maxScores[i] && result[i] <= minVal+4);
    const pool = candidates.length > 0 ? candidates : indices.filter(i => result[i]+2 <= maxScores[i]);
    if (pool.length === 0) break;
    result[pool[Math.floor(Math.random()*pool.length)]] += 2;
    remaining -= 2;
  }
  while (remaining > 0) {
    const available = indices.filter(i => result[i]+1 <= maxScores[i]);
    if (available.length === 0) break;
    result[available[Math.floor(Math.random()*available.length)]] += 1;
    remaining -= 1;
  }
  return result;
}

async function exportReportExcel(students:{name:string;scores:number[]}[], cls:string, grp:string, subject:string, quarter:string, rptNum:string, date:string) {
  try {
    const ExcelJS = (await import("exceljs")).default;
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("BSB/CHSB Hisobot");
    ws.mergeCells("A1:F1");
    const title = ws.getCell("A1");
    title.value = `${SCHOOL_NAME} | ${subject} | ${quarter} | ${rptNum}-son | ${date}`;
    title.font = { bold: true, size: 13 };
    title.alignment = { horizontal: "center" };

    const headers = ["#","O'quvchi F.I.SH",...students[0]?.scores.map((_,i)=>`T-${i+1}`)||[],"Jami","Foiz"];
    const headerRow = ws.addRow(headers);
    headerRow.font = { bold: true, size: 11 };
    headerRow.alignment = { horizontal: "center" };
    headerRow.eachCell(c => { c.border = { top:{style:"thin"},left:{style:"thin"},bottom:{style:"thin"},right:{style:"thin"} }; });

    students.forEach((s,i) => {
      const total = s.scores.reduce((a,b)=>a+b,0);
      const maxTotal = s.scores.length * 10;
      const row = ws.addRow([i+1, s.name, ...s.scores, total, maxTotal>0 ? `${((total/maxTotal)*100).toFixed(0)}%` : "0%"]);
      row.eachCell(c => { c.border = { top:{style:"thin"},left:{style:"thin"},bottom:{style:"thin"},right:{style:"thin"} }; });
    });

    ws.columns = [
      { width:5 }, { width:40 },
      ...students[0]?.scores.map(()=>({width:8}))||[],
      { width:10 }, { width:10 },
    ];

    const buf = await wb.xlsx.writeBuffer();
    const blob = new Blob([buf], { type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `BSB_CHSB_${cls}_${grp}_${new Date().toLocaleDateString()}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Excel export error:", err);
    alert("Excel yuklashda xatolik yuz berdi.");
  }
}

async function exportDbExcel(db: Record<string,Record<string,string[]>>) {
  try {
    const ExcelJS = (await import("exceljs")).default;
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Barcha O'quvchilar");
    ws.columns = [
      { header:"O'quvchi F.I.SH", key:"name", width:40 },
      { header:"Sinfi", key:"class", width:15 },
      { header:"Guruh / Toifa", key:"group", width:25 },
    ];
    ws.getRow(1).font = { bold: true, size: 12 };
    ws.getRow(1).alignment = { horizontal:"center" };
    Object.entries(db).forEach(([cls,groups]) => {
      Object.entries(groups).forEach(([group,students]) => {
        students.forEach(name => {
          const row = ws.addRow({ name, class: cls.toUpperCase(), group });
          row.eachCell(c => { c.border = { top:{style:"thin"},left:{style:"thin"},bottom:{style:"thin"},right:{style:"thin"} }; });
        });
      });
    });
    const buf = await wb.xlsx.writeBuffer();
    const blob = new Blob([buf], { type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Barcha_Oquvchilar_Bazasi_${new Date().toLocaleDateString()}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Excel export error:", err);
    alert("Bazani yuklashda xatolik yuz berdi.");
  }
}

function getTeacherAssignedClasses(data: any): string[] {
  return (data?.classes || []).map((c: any) => c.name);
}

function getTeacherAssignedSubjects(data: any): string[] {
  return (data?.subjects || []).map((s: any) => s.name);
}

function getTeacherAssignedGroupsForClass(data: any, className: string): string[] {
  const classes = (data?.classes || []) as { id: string; name: string }[];
  const cls = classes.find((c) => c.name === className);
  if (!cls) return [];
  return (data?.groups || [])
    .filter((g: any) => g.classId === cls.id)
    .map((g: any) => g.name);
}

export default function BsbChsbPage() {
  const [lang, setLang] = useState<Lang>("uz");
  useEffect(() => {
    const saved = document.cookie.match(/(?:^|;\s*)lang=([^;]*)/)?.[1] as Lang | undefined;
    if (saved) setLang(saved);
    const handler = (e: CustomEvent) => setLang(e.detail as Lang);
    window.addEventListener('langchange', handler as EventListener);
    return () => window.removeEventListener('langchange', handler as EventListener);
  }, []);
  const [db, setDb] = useState<Record<string,Record<string,string[]>>>(() => typeof window!=="undefined" ? loadDB() : {});
  useEffect(() => { saveDB(db); }, [db]);

  const [teacherData, setTeacherData] = useState<any>(null);
  useEffect(() => {
    (async () => {
      try {
        const { getTeacherData } = await import("@/actions/school-management");
        const res = await getTeacherData();
        if (res.data) setTeacherData(res.data);
      } catch {}
    })();
  }, []);

  const assignedClasses = useMemo(() => getTeacherAssignedClasses(teacherData), [teacherData]);
  const assignedSubjects = useMemo(() => getTeacherAssignedSubjects(teacherData), [teacherData]);

  const assignedGroupsForClass = useCallback((className: string) => {
    return getTeacherAssignedGroupsForClass(teacherData, className);
  }, [teacherData]);

  const [reportType, setReportType] = useState<"BSB"|"CHSB">("BSB");
  const [report, setReport] = useState(() => ({
    config: {
      date: new Date().toISOString().split("T")[0], school: SCHOOL_NAME,
      classLevel: "", group: "Butun sinf", subject: "",
      quarter: "1-chorak", reportNumber: "1", taskCount: DEFAULT_TASK_COUNT,
    },
    maxScores: Array(DEFAULT_TASK_COUNT).fill(10),
    students: [] as { id: string; name: string; scores: number[] }[],
    signatures: { oibdo: "", metodist: "", teacher: "" },
  }));

  useEffect(() => {
    if (!teacherData) return;
    if (assignedClasses.length === 0 || assignedSubjects.length === 0) return;
    const cls = assignedClasses[0];
    const grps = assignedGroupsForClass(cls);
    const grp = grps.length > 0 ? grps[0] : "Butun sinf";
    const dbStudents = teacherData?.studentsByClass?.[cls]?.[grp] || [];
    const names = dbStudents.length > 0 ? dbStudents.sort(uzbekSort) : [];
    setReport({
      config: {
        date: new Date().toISOString().split("T")[0], school: SCHOOL_NAME,
        classLevel: cls, group: grp, subject: assignedSubjects[0] || "",
        quarter: "1-chorak", reportNumber: "1", taskCount: DEFAULT_TASK_COUNT,
      },
      maxScores: Array(DEFAULT_TASK_COUNT).fill(10),
      students: names.map((n:string,i:number) => ({ id:`s-${Date.now()}-${i}`, name:n, scores:Array(DEFAULT_TASK_COUNT).fill(0) })),
      signatures: { oibdo:"", metodist:"", teacher:"" },
    });
  }, [teacherData]);
  const [fullscreen, setFullscreen] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string|null>(null);
  const [saving, setSaving] = useState(false);
  const [savedToast, setSavedToast] = useState(false);
  const [reportId, setReportId] = useState<string | null>(null);
  const [chsbTypes, setChsbTypes] = useState<string[]>(Array(DEFAULT_TASK_COUNT).fill("B"));
  const [chsbValues, setChsbValues] = useState<Record<string,number>>({ B:5, Q:3, M:1 });
  const [distributingIds, setDistributingIds] = useState<Set<string>>(new Set());
  const inputRefs = useRef<Record<string,HTMLInputElement|HTMLButtonElement|null>>({});

  const config = report.config;

  const syncStudents = useCallback((cls:string, grp:string, tc:number) => {
    const dbStudents = teacherData?.studentsByClass?.[cls]?.[grp] || [];
    const names = (dbStudents.length > 0 ? dbStudents : (db[cls]?.[grp] || [])).sort(uzbekSort);
    return names.map((n:string,i:number) => ({ id:`s-${Date.now()}-${i}`, name:n, scores:Array(tc).fill(0) }));
  }, [db, teacherData]);

  const updateConfig = useCallback((key:string, value:string|number) => {
    setReport(prev => {
      const next:any = { ...prev, config:{ ...prev.config, [key]:value } };
      if (key === "classLevel") {
        const groupsForClass = assignedGroupsForClass(value as string);
        const groups = groupsForClass.length > 0 ? groupsForClass : getGroups(db, value as string);
        next.config.group = groups[0] || "Butun sinf";
        next.students = syncStudents(value as string, next.config.group, next.config.taskCount);
        setDistributingIds(new Set());
      }
      if (key === "group") {
        next.students = syncStudents(next.config.classLevel, value as string, next.config.taskCount);
        setDistributingIds(new Set());
      }
      if (key === "taskCount") {
        const tc = Math.min(Math.max(Number(value),1),15);
        next.config.taskCount = tc;
        if (reportType === "CHSB") {
          setChsbTypes(p => tc > p.length ? [...p, ...Array(tc-p.length).fill("B")] : p.slice(0,tc));
        }
        next.maxScores = tc > next.maxScores.length ? [...next.maxScores, ...Array(tc-next.maxScores.length).fill(10)] : next.maxScores.slice(0,tc);
        next.students = next.students.map((s:any) => ({
          ...s,
          scores: tc > s.scores.length ? [...s.scores, ...Array(tc-s.scores.length).fill(0)] : s.scores.slice(0,tc),
        }));
      }
      return next;
    });
  }, [db, reportType, syncStudents, assignedGroupsForClass]);

  useEffect(() => {
    if (reportType === "CHSB") {
      const vals = chsbTypes.map(t => chsbValues[t] || 0);
      setReport(prev => ({
        ...prev, maxScores: vals,
        students: prev.students.map(s => ({ ...s, scores: s.scores.map((v,i) => v>0 ? chsbValues[chsbTypes[i]]||0 : 0) })),
      }));
    }
  }, [chsbValues, chsbTypes, reportType]);

  const updateStudentScore = useCallback((row:number, col:number, val:number) => {
    setReport(prev => {
      const students = [...prev.students];
      if (students[row]) {
        const scores = [...students[row].scores];
        scores[col] = Math.max(0, Math.min(val, prev.maxScores[col]));
        students[row] = { ...students[row], scores };
      }
      return { ...prev, students };
    });
  }, []);

  const toggleChsbScore = useCallback((row:number, col:number) => {
    if (reportType !== "CHSB") return;
    setReport(prev => {
      const students = [...prev.students];
      if (!students[row]) return prev;
      const scores = [...students[row].scores];
      scores[col] = scores[col] > 0 ? 0 : (chsbValues[chsbTypes[col]] || 0);
      students[row] = { ...students[row], scores };
      return { ...prev, students };
    });
  }, [reportType, chsbValues, chsbTypes]);

  const toggleFullScore = useCallback((row:number) => {
    setReport(prev => {
      const students = [...prev.students];
      if (!students[row]) return prev;
      const allMax = students[row].scores.every((v,i) => v === prev.maxScores[i] && prev.maxScores[i] > 0);
      students[row] = { ...students[row], scores: allMax ? Array(prev.config.taskCount).fill(0) : [...prev.maxScores] };
      return { ...prev, students };
    });
  }, []);

  const handleTotalChange = useCallback((row:number, val:string) => {
    const total = Math.min(parseFloat(String(val).replace(',','.'))||0, report.maxScores.reduce((a,b)=>a+b,0));
    setReport(prev => {
      const students = [...prev.students];
      if (students[row]) students[row] = { ...students[row], scores: distributeTotal(total, prev.maxScores) };
      return { ...prev, students };
    });
  }, [report.maxScores]);

  const toggleDistribution = useCallback((id:string) => {
    setDistributingIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }, []);

  const toggleAllDistribution = useCallback(() => {
    const ids = report.students.map(s => s.id);
    setDistributingIds(ids.length > 0 && ids.every(id => distributingIds.has(id)) ? new Set() : new Set(ids));
  }, [report.students, distributingIds]);

  useEffect(() => {
    const params = new URL(window.location.href).searchParams;
    const rid = params.get("reportId");
    setReportId(rid);
    if (!rid) return;
    (async () => {
      try {
        const { getReportById } = await import("@/actions/reports");
        const loaded = await getReportById(rid);
        if (!loaded) return;
        const d = JSON.parse(loaded.data);
        setReport(prev => ({
          ...prev,
          config: { ...prev.config, ...d.config },
          maxScores: d.maxScores || prev.maxScores,
          students: d.students || prev.students,
          signatures: d.signatures || prev.signatures,
        }));
        setReportType(loaded.type as "BSB" | "CHSB");
        if (d.chsbTypes) setChsbTypes(d.chsbTypes);
        if (d.chsbValues) setChsbValues(d.chsbValues);
      } catch {}
    })();
  }, []);

  const handleKeyDown = useCallback((e:React.KeyboardEvent, row:number, col:number, field:string) => {
    let r=row, c=col;
    if (e.key==="ArrowUp") r--; else if (e.key==="ArrowDown") r++; else if (e.key==="ArrowLeft") c--; else if (e.key==="ArrowRight") c++; else return;
    const target = inputRefs.current[`${field}-${r}-${c}`];
    if (target) { e.preventDefault(); target.focus(); if (target instanceof HTMLInputElement) target.select(); }
  }, []);

  const sortStudents = useCallback(() => {
    setReport(prev => ({ ...prev, students: [...prev.students].sort((a,b) => uzbekSort(a.name,b.name)) }));
  }, []);

  const addStudentRow = useCallback(() => {
    setReport(prev => ({
      ...prev,
      students: [{ id:`s-${Date.now()}`, name:"", scores:Array(prev.config.taskCount).fill(0) }, ...prev.students],
    }));
  }, []);

  const deleteStudent = useCallback((id:string) => {
    setReport(prev => ({ ...prev, students: prev.students.filter(s => s.id !== id) }));
    setDeleteTarget(null);
  }, []);

  const resetReport = useCallback(() => { setReport(createReport(reportType,db,assignedSubjects)); setShowResetConfirm(false); }, [reportType,db,assignedSubjects]);

  const changeReportType = useCallback((t:"BSB"|"CHSB") => { setReportType(t); }, []);

  useEffect(() => {
    const handler = (e:KeyboardEvent) => { if (e.key==="Escape") { setShowResetConfirm(false); setDeleteTarget(null); }};
    window.addEventListener("keydown",handler);
    return () => window.removeEventListener("keydown",handler);
  }, []);

  const handleSaveReport = useCallback(async () => {
    setSaving(true);
    try {
      const { saveReport, updateReport } = await import("@/actions/reports");
      const data = JSON.stringify({
        config: report.config,
        maxScores: report.maxScores,
        students: report.students,
        signatures: report.signatures,
        chsbTypes: reportType === "CHSB" ? chsbTypes : undefined,
        chsbValues: reportType === "CHSB" ? chsbValues : undefined,
      });
      const title = `${report.config.classLevel} - ${report.config.subject} - ${report.config.reportNumber}-${reportType}`;
      if (reportId) {
        await updateReport(reportId, reportType, title, data);
      } else {
        await saveReport(reportType, title, data);
      }
      setSavedToast(true);
      setTimeout(() => setSavedToast(false), 2000);
    } catch (err) {
      console.error("Save error:", err);
      alert(t("bsb_chsb.error_msg", lang));
    } finally {
      setSaving(false);
    }
  }, [report, reportType, chsbTypes, chsbValues, reportId]);

  const students = report.students;
  const maxScores = report.maxScores;
  const maxTotal = maxScores.reduce((a,b)=>a+b,0);
  const studentCount = students.length;
  const totalScore = students.reduce((s,st)=>s+st.scores.reduce((a,b)=>a+b,0),0);
  const overallPercent = studentCount>0 && maxTotal>0 ? ((totalScore/(studentCount*maxTotal))*100).toFixed(1) : "0";

  const colStats = maxScores.map((max,col) => {
    const sum = students.reduce((acc,s)=>acc+(s.scores[col]||0),0);
    return { sum, avg: studentCount>0 ? sum/studentCount : 0, pct: studentCount>0 && max>0 ? (sum/(studentCount*max))*100 : 0 };
  });

  const btnPrimary = "inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-5 py-2.5 min-h-[44px] text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]";
  const btnSecondary = "inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 min-h-[44px] text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:shadow-md";
  const btnDanger = "inline-flex items-center gap-2 rounded-xl border border-red-200 px-5 py-2.5 min-h-[44px] text-sm font-medium text-red-600 transition-all hover:bg-red-50";
  const inputStyle = "h-11 lg:h-11 min-h-[44px] w-full rounded-xl border border-gray-300 bg-gray-50 px-4 text-sm font-medium outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20";
  const selectStyle = "h-11 lg:h-11 min-h-[44px] w-full rounded-xl border border-gray-300 bg-gray-50 px-4 text-sm font-medium outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20";

  return (
    <div className={`transition-all duration-300 ${fullscreen ? "fixed inset-0 z-50 overflow-auto bg-gray-50" : ""}`}>
      {!fullscreen && (
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{t("bsb_chsb.title", lang)}</h1>
          <p className="mt-1 text-sm text-gray-500">{t("bsb_chsb.teacher_panel", lang)}</p>
        </div>
      )}

      <div className="space-y-5">
        {/* Header card */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-blue-600 text-sm font-bold text-white shadow-md">BS</div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{reportType} {t("bsb_chsb.system", lang)}</h2>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                    <span>{SCHOOL_NAME}</span>
                    <span className="h-1 w-1 rounded-full bg-gray-300" />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <button onClick={()=>setShowResetConfirm(true)} className={btnDanger}><RotateCcw className="h-4 w-4" /> {t("bsb_chsb.reset", lang)}</button>
              <div className="flex rounded-xl border border-gray-200 bg-gray-100 p-0.5">
                <button onClick={()=>changeReportType("BSB")}
                  className={`rounded-lg px-4 py-2 text-xs font-bold tracking-wider transition-all ${reportType==="BSB" ? "bg-white text-indigo-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>BSB</button>
                <button onClick={()=>changeReportType("CHSB")}
                  className={`rounded-lg px-4 py-2 text-xs font-bold tracking-wider transition-all ${reportType==="CHSB" ? "bg-white text-indigo-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>CHSB</button>
              </div>
              <button onClick={()=>setFullscreen(!fullscreen)} className={btnSecondary}>
                {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="mb-4 grid gap-4 sm:grid-cols-3">
            <div><label className="mb-1 block text-xs font-semibold text-gray-500 uppercase tracking-wider">{t("bsb_chsb.date", lang)}</label><input type="date" value={config.date} onChange={e=>updateConfig("date",e.target.value)} className={inputStyle} /></div>
            <div><label className="mb-1 block text-xs font-semibold text-gray-500 uppercase tracking-wider">{t("bsb_chsb.class", lang)}</label>
              <select value={config.classLevel} onChange={e=>updateConfig("classLevel",e.target.value)} className={selectStyle}>
                {assignedClasses.length > 0 ? assignedClasses.map(c=><option key={c} value={c}>{c.toUpperCase()}{t("bsb_chsb.class_suffix", lang)}</option>) : <option value="">{t("bsb_chsb.class", lang)}</option>}
              </select>
            </div>
            <div><label className="mb-1 block text-xs font-semibold text-gray-500 uppercase tracking-wider">{t("bsb_chsb.subject", lang)}</label>
              <select value={config.subject} onChange={e=>updateConfig("subject",e.target.value)} className={selectStyle}>
                {assignedSubjects.length > 0 ? assignedSubjects.map(s=><option key={s} value={s}>{s}</option>) : <option value="">{t("bsb_chsb.subject", lang)}</option>}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-4">
            <div><label className="mb-1 block text-xs font-semibold text-gray-500 uppercase tracking-wider">{t("bsb_chsb.quarter", lang)}</label>
              <select value={config.quarter} onChange={e=>updateConfig("quarter",e.target.value)} className={selectStyle}>
                {QUARTERS.map((q,i)=><option key={q} value={q}>{t(`bsb_chsb.quarter_${i+1}`, lang)}</option>)}
              </select>
            </div>
            <div><label className="mb-1 block text-xs font-semibold text-gray-500 uppercase tracking-wider">{reportType} {t("bsb_chsb.number", lang)}</label>
              <input type="text" value={config.reportNumber} onChange={e=>updateConfig("reportNumber",e.target.value)} className={inputStyle} />
            </div>
            <div><label className="mb-1 block text-xs font-semibold text-gray-500 uppercase tracking-wider">{t("bsb_chsb.group", lang)}</label>
              <select value={config.group} onChange={e=>updateConfig("group",e.target.value)} className={selectStyle}>
                {(() => {
                  const g = assignedGroupsForClass(config.classLevel);
                  return (g.length > 0 ? g : getGroups(db,config.classLevel)).map(g2 => <option key={g2} value={g2}>{g2}</option>);
                })()}
              </select>
            </div>
            <div><label className="mb-1 block text-xs font-semibold text-gray-500 uppercase tracking-wider">{t("bsb_chsb.tasks", lang)}</label>
              <input type="number" min={1} max={15} value={config.taskCount} onChange={e=>updateConfig("taskCount",parseInt(String(e.target.value).replace(',','.'))||1)} className={inputStyle} />
            </div>
          </div>
        </div>

        {/* CHSB marker values */}
        {reportType === "CHSB" && (
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-center gap-6">
              {CHSB_LABELS.map(l => (
                <div key={l} className="flex flex-col items-center gap-1.5 rounded-xl border-2 p-3" style={{ borderColor: CHSB_COLORS[l].border, backgroundColor: `${CHSB_COLORS[l].bg}44` }}>
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: CHSB_COLORS[l].primary }}>{t(`bsb_chsb.${l.toLowerCase()}_ball`, lang)}</span>
                  <input type="text" inputMode="decimal" value={chsbValues[l]||""}
                    onChange={e=>setChsbValues(p=>({...p,[l]:parseFloat(String(e.target.value).replace(',','.'))||0}))}
                    className="h-9 w-20 rounded-lg border-2 text-center text-sm font-bold outline-none transition-all focus:border-indigo-500"
                    style={{ borderColor: CHSB_COLORS[l].border, color: CHSB_COLORS[l].text }} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Max scores */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-center text-xs font-bold uppercase tracking-wider text-gray-500">{t("bsb_chsb.max_scores", lang)}</h3>
          <div className="flex flex-wrap justify-center gap-3">
            {reportType === "BSB" ? maxScores.map((ms,i) => (
              <div key={i} className="flex flex-col items-center gap-1 rounded-xl border border-gray-200 bg-gray-50 p-3">
                <span className="text-xs font-semibold text-gray-400">{i+1}{t("bsb_chsb.task_short", lang)}</span>
                <input type="text" inputMode="decimal" value={ms||""} onChange={e=>{const v=parseFloat(String(e.target.value).replace(',','.'))||0; setReport(p=>{const m=[...p.maxScores]; m[i]=v; return {...p,maxScores:m}; });}}
                  className="h-8 w-16 rounded-lg border border-gray-200 bg-white text-center text-sm font-bold text-indigo-700 outline-none focus:border-indigo-500" />
              </div>
            )) : chsbTypes.map((ch,i) => (
              <button key={i} onClick={()=>{const o=["B","Q","M"]; const n=o[(o.indexOf(ch)+1)%3]; setChsbTypes(p=>{const a=[...p]; a[i]=n; return a; });}}
                className="flex flex-col items-center gap-1 rounded-xl border-2 p-3 transition-all active:scale-95" style={{ borderColor: CHSB_COLORS[ch].border }}>
                <span className="text-xs font-semibold text-gray-400">{i+1}{t("bsb_chsb.task_short", lang)}</span>
                <span className="text-lg font-black leading-none" style={{ color: CHSB_COLORS[ch].primary }}>{ch}</span>
                <span className="text-xs font-bold" style={{ color: CHSB_COLORS[ch].text }}>{chsbValues[ch]} {t("bsb_chsb.ball", lang)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button onClick={addStudentRow} className={btnPrimary}><Plus className="h-4 w-4" /> {t("bsb_chsb.add_student", lang)}</button>
          <button onClick={handleSaveReport} disabled={saving} className={btnPrimary}>
            {saving ? (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
            ) : <Save className="h-4 w-4" />}
            {saving ? t("bsb_chsb.saving", lang) : (reportId ? t("bsb_chsb.update", lang) : t("bsb_chsb.save", lang))}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className={`mt-5 rounded-2xl border border-gray-100 bg-white shadow-sm ${fullscreen ? "" : "mb-8"}`}>
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="h-6 w-1 rounded-full bg-gradient-to-b from-indigo-600 to-blue-600" />
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">{reportType} {t("bsb_chsb.list_title", lang)}</h3>
            <span className="rounded-lg bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">{students.length} {t("common.count_suffix", lang)}</span>
          </div>
          <button onClick={()=>setFullscreen(!fullscreen)} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-indigo-600 transition-all">
            {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                <th className="w-10 px-4 py-3 text-center">#</th>
                <th className="min-w-[220px] px-4 py-3">{t("bsb_chsb.student_name", lang)}</th>
                {maxScores.map((_,i) => (
                  <th key={i} className="px-3 py-3 text-center border-l border-gray-100">
                    <div className="flex flex-col items-center">
                      <span>{t("bsb_chsb.top_prefix", lang)}{i+1}</span>
                      {reportType==="CHSB" && <span className="text-xs mt-0.5" style={{ color: CHSB_COLORS[chsbTypes[i]]?.primary }}>{chsbTypes[i]}</span>}
                    </div>
                  </th>
                ))}
                <th className="w-28 px-3 py-3 text-center border-l border-gray-100">
                  <div className="flex flex-col items-center gap-0.5">
                    <span>{t("bsb_chsb.total", lang)}</span>
                    <button onClick={toggleAllDistribution} className={`rounded p-0.5 transition-all ${distributingIds.size===students.length&&students.length>0 ? "text-amber-500" : "text-gray-400 hover:text-indigo-500"}`}>
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </th>
                <th className="w-20 px-3 py-3 text-center border-l border-gray-100">{t("bsb_chsb.percent", lang)}</th>
                <th className="w-16 px-3 py-3 text-center">{t("bsb_chsb.delete", lang)}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {students.map((student,row) => {
                const total = student.scores.reduce((a,b)=>a+b,0);
                const pct = maxTotal>0 ? (total/maxTotal)*100 : 0;
                const isDist = distributingIds.has(student.id);
                return (
                  <tr key={student.id} className="transition-colors hover:bg-indigo-50/30">
                    <td className="px-4 py-2 text-center text-sm font-bold text-gray-400">{row+1}</td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <button onClick={()=>toggleFullScore(row)} title="Maksimal ball" className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg border border-gray-300 text-gray-400 transition-all hover:border-amber-400 hover:text-amber-500">
                          <ChevronDown className="h-3 w-3" />
                        </button>
                        <input ref={el=>{inputRefs.current[`name-${row}-0`]=el;}} type="text" value={student.name}
                          onChange={e=>{const a=[...students]; a[row]={...a[row],name:e.target.value}; setReport(p=>({...p,students:a}));}}
                          onBlur={sortStudents} onKeyDown={e=>handleKeyDown(e,row,0,"name")}
                          placeholder={t("bsb_chsb.name_placeholder", lang)} className="w-full min-h-[44px] lg:min-h-0 bg-transparent px-2 lg:px-0 text-sm font-medium text-gray-900 outline-none" />
                      </div>
                    </td>
                    {student.scores.map((score,col) => (
                      <td key={col} className="border-l border-gray-100 px-2 py-2 text-center">
                        {reportType==="BSB" ? (
                          <input ref={el=>{inputRefs.current[`score-${row}-${col}`]=el;}} type="text" inputMode="decimal"
                            value={score===0?"":score} readOnly={isDist}
                            onChange={e=>updateStudentScore(row,col,parseFloat(String(e.target.value).replace(',','.'))||0)}
                            onKeyDown={e=>handleKeyDown(e,row,col,"score")}
                            className={`min-h-[44px] lg:h-9 w-12 rounded-lg border border-gray-200 text-center text-sm font-bold outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 ${isDist ? "bg-gray-100 text-gray-400" : "bg-white text-gray-900"}`} />
                        ) : (
                          <button ref={el=>{(inputRefs as any).current[`score-${row}-${col}`]=el;}} onClick={()=>toggleChsbScore(row,col)}
                            onKeyDown={e=>handleKeyDown(e,row,col,"score")}
                            className={`flex min-h-[44px] lg:h-9 w-12 items-center justify-center rounded-lg border-2 transition-all ${score>0 ? "border-blue-200 bg-blue-50 text-blue-600" : "border-gray-200 text-gray-300 hover:border-gray-300"}`}>
                            {score>0 ? <Check className="h-4 w-4" strokeWidth={3}/> : <X className="h-4 w-4" />}
                          </button>
                        )}
                      </td>
                    ))}
                    <td className="border-l border-gray-100 px-2 py-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {isDist ? (
                          <button onClick={()=>toggleDistribution(student.id)} className="absolute left-1 top-1/2 -translate-y-1/2 rounded-md border border-blue-200 bg-white p-1 shadow-sm text-blue-600"><ChevronDown className="h-3 w-3" /></button>
                        ) : null}
                        {isDist ? (
                          <input ref={el=>{inputRefs.current[`total-${row}-0`]=el;}} type="text" inputMode="decimal" value={total||""}
                            onChange={e=>handleTotalChange(row,e.target.value)} onKeyDown={e=>handleKeyDown(e,row,0,"total")}
                            className="h-9 w-20 rounded-lg border border-amber-300 bg-amber-50 text-center text-sm font-bold text-amber-800 outline-none" placeholder="..." />
                        ) : (
                          <button onClick={()=>toggleDistribution(student.id)} className="h-9 w-20 rounded-lg bg-gray-50 text-sm font-bold text-gray-900 transition-all hover:bg-indigo-50 hover:text-indigo-700">
                            {total%1===0 ? total : total.toFixed(1)}
                          </button>
                        )}
                      </div>
                    </td>
                    <td className={`border-l border-gray-100 px-3 py-2 text-center text-sm font-bold ${pct<60 ? "text-red-500" : "text-emerald-600"}`}>{pct.toFixed(0)}%</td>
                    <td className="px-3 py-2 text-center">
                      <button onClick={()=>setDeleteTarget(student.id)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-400 transition-all hover:bg-red-500 hover:text-white">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="border-t-2 border-gray-200 bg-gray-50 text-xs font-semibold">
              <tr className="text-indigo-700">
                <td colSpan={2} className="px-4 py-3 text-right uppercase tracking-wider">{t("bsb_chsb.percent_footer", lang)}</td>
                {maxScores.map((_,i) => <td key={i} className="border-l border-gray-100 px-3 py-3 text-center">{colStats[i].pct.toFixed(0)}%</td>)}
                <td className="border-l border-gray-100 px-3 py-3 text-center font-bold">{overallPercent}%</td>
                <td className="border-l border-gray-100 px-3 py-3 text-center">{overallPercent}%</td>
                <td></td>
              </tr>
              <tr className="text-emerald-700">
                <td colSpan={2} className="px-4 py-3 text-right uppercase tracking-wider">{t("bsb_chsb.avg_score", lang)}</td>
                {maxScores.map((_,i) => <td key={i} className="border-l border-gray-100 px-3 py-3 text-center">{colStats[i].avg.toFixed(1)}</td>)}
                <td className="border-l border-gray-100 px-3 py-3 text-center font-bold">{(students.reduce((s,st)=>s+st.scores.reduce((a,b)=>a+b,0),0)/(studentCount||1)).toFixed(1)}</td>
                <td className="border-l border-gray-100 px-3 py-3 text-center">{overallPercent}%</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Signatures */}
      {!fullscreen && (
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h3 className="mb-6 text-center text-xs font-bold uppercase tracking-wider text-gray-500">{t("bsb_chsb.signatures", lang)}</h3>
          <div className="grid gap-6 md:grid-cols-3">
            {(["oibdo","metodist","teacher"] as const).map(key => (
              <div key={key} className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  {key==="oibdo" ? t("bsb_chsb.sig_oibdo", lang) : key==="metodist" ? t("bsb_chsb.sig_methodist", lang) : t("bsb_chsb.sig_teacher", lang)}
                </label>
                <input type="text" value={report.signatures[key]}
                  onChange={e=>setReport(p=>({...p,signatures:{...p.signatures,[key]:e.target.value}}))}
                  className={inputStyle} placeholder={t("bsb_chsb.name_placeholder", lang)} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reset confirm modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-6 shadow-2xl">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-500"><RotateCcw className="h-8 w-8" /></div>
              <h3 className="mb-2 text-lg font-bold text-gray-900">{t("bsb_chsb.reset_title", lang)}</h3>
              <p className="mb-6 text-sm text-gray-500">{t("bsb_chsb.reset_text", lang)}</p>
              <div className="flex gap-3">
                <button onClick={()=>setShowResetConfirm(false)} className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50">{t("bsb_chsb.cancel", lang)}</button>
                <button onClick={resetReport} className="flex-1 rounded-xl bg-amber-500 px-4 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:bg-amber-600">{t("bsb_chsb.confirm", lang)}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-6 shadow-2xl">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-500"><Trash2 className="h-8 w-8" /></div>
              <h3 className="mb-2 text-lg font-bold text-gray-900">{t("bsb_chsb.delete_title", lang)}</h3>
              <p className="mb-6 text-sm text-gray-500">"<span className="font-bold text-gray-800">{students.find(s=>s.id===deleteTarget)?.name}</span>" {t("bsb_chsb.delete_text", lang)}</p>
              <div className="flex gap-3">
                <button onClick={()=>setDeleteTarget(null)} className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50">{t("bsb_chsb.cancel", lang)}</button>
                <button onClick={()=>deleteStudent(deleteTarget)} className="flex-1 rounded-xl bg-red-500 px-4 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:bg-red-600">{t("bsb_chsb.confirm", lang)}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Saved toast notification */}
      {savedToast && (
        <div className="fixed bottom-6 right-6 z-[200] animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center gap-3 rounded-2xl bg-emerald-600 px-5 py-3.5 text-white shadow-2xl">
            <Check className="h-5 w-5" />
            <span className="text-sm font-semibold">{t("bsb_chsb.saved_msg", lang)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
