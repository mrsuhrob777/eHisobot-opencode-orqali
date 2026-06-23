"use client";

import { useState } from "react";
import { type Lang, t } from "@/lib/i18n";
import { BookOpen, ExternalLink, Plus, Upload } from "lucide-react";
import { ClassManager } from "../class-manager";
import {
  createSchoolSubject, deleteSchoolSubject, importSchoolBulk, deleteAllSchoolClasses,
} from "@/actions/school-management";
import { useRouter } from "next/navigation";

type SchoolClass = {
  id: string;
  name: string;
  groups?: any[];
  _count: { students: number; groups: number };
};

type Subject = { id: string; name: string };

const btnPrimary =
  "inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-3 py-2 text-xs font-semibold text-white shadow-lg transition-all hover:shadow-xl active:scale-[0.98]";
const btnSecondary =
  "inline-flex items-center justify-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 shadow-sm transition-all hover:bg-emerald-100 active:scale-[0.98]";

const exampleText = `5a-sinf : butun sinf (Aliyev Vali , Karimov Anvar); 1-gurux (Rahimov Aziz , Quronboyev Suhrob)
:
6a-sinf : butun sinf (Hasanov Husan , Saidov Said); 1-gurux (Komilov Komil , Ergashev Elbek); O'g'il bolalar (Botirov Botir); Qiz bolalar (Aliyeva Zilola)`;

export function BazaContent({
  schoolId, classes, subjects, lang,
}: {
  schoolId: string;
  classes: SchoolClass[];
  subjects: Subject[];
  lang: Lang;
}) {
  const router = useRouter();
  const [subjectName, setSubjectName] = useState("");
  const [bulkText, setBulkText] = useState("");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ classes: number; students: number } | null>(null);
  const [deletingAll, setDeletingAll] = useState(false);

  async function handleAddSubject() {
    if (!subjectName.trim()) return;
    await createSchoolSubject(schoolId, subjectName.trim());
    setSubjectName("");
    router.refresh();
  }

  async function handleDeleteSubject(id: string) {
    await deleteSchoolSubject(id);
    router.refresh();
  }

  async function handleBulkImport() {
    if (!bulkText.trim()) return;
    setImporting(true);
    setResult(null);
    const res = await importSchoolBulk(schoolId, bulkText);
    if (res.data) {
      setResult(res.data);
      setBulkText("");
      router.refresh();
    }
    setImporting(false);
  }

  async function handleDeleteAllClasses() {
    if (!confirm("Barcha sinflar, guruhlar va o'quvchilar o'chiriladi. Davom etilsinmi?")) return;
    setDeletingAll(true);
    await deleteAllSchoolClasses(schoolId);
    setDeletingAll(false);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-800">
            <Upload className="mr-1.5 inline h-4 w-4 text-indigo-600" />
            O'quvchilarni ommaviy yuklash
          </h3>
        </div>
        <p className="mb-3 text-xs text-gray-500">
          Format: <code className="rounded bg-gray-100 px-1 py-0.5">Sinf nomi : guruh nomi (o'quvchi1 , o'quvchi2); guruh nomi (o'quvchi1)</code>
        </p>
        <textarea
          value={bulkText}
          onChange={(e) => setBulkText(e.target.value)}
          placeholder={exampleText}
          rows={10}
          className="w-full rounded-xl border border-gray-300 px-4 py-3 text-xs outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 font-mono"
        />
        <div className="mt-3 flex items-center gap-3">
          <button onClick={handleBulkImport} disabled={importing} className={btnPrimary}>
            {importing ? "Yuklanmoqda..." : "Import qilish"}
          </button>
          <a href="https://oquvchilarbazasi.netlify.app/" target="_blank" rel="noopener noreferrer" className={btnSecondary}>
            <ExternalLink className="h-3.5 w-3.5" /> Bazani oson yaratish
          </a>
          {result && (
            <span className="text-xs text-green-600">
              ✅ {result.classes} ta sinf, {result.students} ta o'quvchi qo'shildi
            </span>
          )}
        </div>
        <details className="mt-3">
          <summary className="cursor-pointer text-xs text-gray-400 hover:text-gray-600">Namuna formatni ko'rsatish</summary>
          <pre className="mt-2 rounded-lg bg-gray-50 p-3 text-xs text-gray-600 whitespace-pre-wrap">{exampleText}</pre>
        </details>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-800">
            <BookOpen className="mr-1.5 inline h-4 w-4 text-indigo-600" />
            Fanlar ({subjects.length})
          </h3>
        </div>
        <div className="mb-3 flex flex-wrap gap-2">
          {subjects.map((s) => (
            <span key={s.id} className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700">
              {s.name}
              <button onClick={() => handleDeleteSubject(s.id)} className="inline-flex items-center justify-center rounded-full text-red-400 hover:bg-red-100 hover:text-red-600">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}
          {subjects.length === 0 && <span className="text-xs text-gray-400">Fan mavjud emas</span>}
        </div>
        <div className="flex items-center gap-2">
          <input value={subjectName} onChange={(e) => setSubjectName(e.target.value)}
            placeholder="Fan nomi..."
            className="w-44 rounded-xl border border-gray-200 px-3 py-2 text-xs outline-none focus:border-indigo-400"
            onKeyDown={(e) => e.key === "Enter" && handleAddSubject()} />
          <button onClick={handleAddSubject} className={btnPrimary}>
            <Plus className="h-3.5 w-3.5" /> Qo'shish
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-800">Sinflar ({classes.length})</h3>
        {classes.length > 0 && (
          <button onClick={handleDeleteAllClasses} disabled={deletingAll}
            className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-all">
            {deletingAll ? "O'chirilmoqda..." : "Hamma sinflarni o'chirish"}
          </button>
        )}
      </div>
      <ClassManager schoolId={schoolId} classes={classes} lang={lang} />
    </div>
  );
}