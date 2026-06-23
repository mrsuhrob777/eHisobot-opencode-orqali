"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { type Lang } from "@/lib/i18n";
import { BookOpen, GraduationCap, Plus, Search, Trash2, Upload, Users } from "lucide-react";
import { createSchoolClass, deleteSchoolClass, getSchoolClasses, importSchoolBulkWithGender, createSchoolSubject, deleteSchoolSubject, getSchoolSubjects } from "@/actions/school-management";

type SchoolClass = {
  id: string;
  name: string;
  _count: { students: number; groups: number };
};

type SchoolSubject = {
  id: string;
  name: string;
};

const exampleText = `5-B : butun sinf (ALLAYAROV SUHROB , BOG'IBEKOV OTABEK , Faxriddinova Gulsum , G'affarov Muhammadali , IBRAXIMOV AMIRBEK , Jumaniyazov Jo'shqinbek , KADAMBOYEV MUHAMMADALI , KOMILJONOVA MAHLIYO , Komilova Madina , MASHARIPOVA SHODIYA , OTANAZAROV ULUG'BEK , Quranboyev Amrxon , RAVSHONBEKOV BAXTIBEK , RAXMATJONOV TEMURBEK , RO'ZIBOYEV FIRDAVS , Rozmetova Chinora , Rustamov Jo'shqinbek , Ro'ziboyeva Diana , Ro'ziboyeva Kumushoy , Sultonov Lazizbek , ULUG'BEKOVA MOHINUR , Umrbekov Hayotbek , Yusupov Samirbek , Yo'ldoshboyeva Diana , Shixnazarovna Gulrux , SHONAZAROV JO'SHQINBEK); 1-guruh (ALLAYAROV SUHROB , BOG'IBEKOV OTABEK , Faxriddinova Gulsum , G'affarov Muhammadali , IBRAXIMOV AMIRBEK , Jumaniyazov Jo'shqinbek , KADAMBOYEV MUHAMMADALI , KOMILJONOVA MAHLIYO , Komilova Madina , MASHARIPOVA SHODIYA , OTANAZAROV ULUG'BEK , Quranboyev Amrxon , RAVSHONBEKOV BAXTIBEK); 2-guruh (RAXMATJONOV TEMURBEK , RO'ZIBOYEV FIRDAVS , Rozmetova Chinora , Rustamov Jo'shqinbek , Ro'ziboyeva Diana , Ro'ziboyeva Kumushoy , Sultonov Lazizbek , ULUG'BEKOVA MOHINUR , Umrbekov Hayotbek , Yusupov Samirbek , Yo'ldoshboyeva Diana , Shixnazarovna Gulrux , SHONAZAROV JO'SHQINBEK); bolalar (ALLAYAROV SUHROB , BOG'IBEKOV OTABEK , G'affarov Muhammadali , IBRAXIMOV AMIRBEK , Jumaniyazov Jo'shqinbek , KADAMBOYEV MUHAMMADALI , OTANAZAROV ULUG'BEK , Quranboyev Amrxon , RAVSHONBEKOV BAXTIBEK , RAXMATJONOV TEMURBEK , RO'ZIBOYEV FIRDAVS , Rustamov Jo'shqinbek , Sultonov Lazizbek , Umrbekov Hayotbek , Yusupov Samirbek , SHONAZAROV JO'SHQINBEK); Qizlar (Faxriddinova Gulsum , KOMILJONOVA MAHLIYO , Komilova Madina , MASHARIPOVA SHODIYA , Rozmetova Chinora , Ro'ziboyeva Diana , Ro'ziboyeva Kumushoy , ULUG'BEKOVA MOHINUR , Yo'ldoshboyeva Diana , Shixnazarovna Gulrux)`;

export function SchoolBaseContent({
  schoolId, initialClasses, initialSubjects, lang,
}: {
  schoolId: string;
  initialClasses: SchoolClass[];
  initialSubjects: SchoolSubject[];
  lang: Lang;
}) {
  const router = useRouter();
  const [classes, setClasses] = useState<SchoolClass[]>(initialClasses);
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ classes: number; students: number } | null>(null);
  const [importError, setImportError] = useState("");
  const [newClassName, setNewClassName] = useState("");
  const [creating, setCreating] = useState(false);

  const [subjects, setSubjects] = useState<SchoolSubject[]>(initialSubjects);
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [showBulkSubject, setShowBulkSubject] = useState(false);
  const [bulkSubjectText, setBulkSubjectText] = useState("");
  const [newSubjectName, setNewSubjectName] = useState("");

  const totalStudents = classes.reduce((sum, c) => sum + c._count.students, 0);

  const filtered = search.trim()
    ? classes.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
    : classes;

  async function handleCreateClass() {
    if (!newClassName.trim()) return;
    setCreating(true);
    const res = await createSchoolClass(schoolId, newClassName.trim());
    if (res.data) {
      setClasses((prev) => [
        ...prev,
        { ...res.data!, _count: { students: 0, groups: 0 } },
      ]);
      setNewClassName("");
      setShowAddModal(false);
      router.refresh();
    }
    setCreating(false);
  }

  async function handleDeleteClass(id: string) {
    if (!confirm("Rostdan ham o'chirilsinmi?")) return;
    await deleteSchoolClass(id);
    setClasses((prev) => prev.filter((c) => c.id !== id));
    router.refresh();
  }

  async function handleBulkImport() {
    if (!bulkText.trim()) return;
    setImporting(true);
    setImportResult(null);
    setImportError("");
    console.log("bulkText length:", bulkText.length);
    console.log("First 100 chars:", bulkText.substring(0, 100));
    const res = await importSchoolBulkWithGender(schoolId, bulkText);
    console.log("import result:", JSON.stringify(res));
    if (res.error) {
      setImportError(res.error);
    } else if (res.data) {
      setImportResult(res.data);
      setBulkText("");
      setShowBulkImport(false);
      const fresh = await getSchoolClasses(schoolId);
      if (fresh.data) setClasses(fresh.data as SchoolClass[]);
      router.refresh();
    }
    setImporting(false);
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100">
              <BookOpen className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{classes.length}</p>
              <p className="text-sm text-gray-500">Sinflar soni</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100">
              <GraduationCap className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalStudents}</p>
              <p className="text-sm text-gray-500">O'quvchilar soni</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Sinf nomi bo'yicha qidirish..."
            className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
        <button
          onClick={() => { setShowBulkImport(true); setBulkText(""); setImportResult(null); setImportError(""); }}
          className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-5 py-2.5 text-sm font-semibold text-indigo-700 shadow-sm transition-all hover:bg-indigo-100 hover:shadow-md"
        >
          <Upload className="h-4 w-4" /> Hammasini bittada qo'shish
        </button>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:scale-[1.02]"
        >
          <Plus className="h-4 w-4" /> Sinf qo'shish
        </button>
      </div>

      {showBulkImport && (
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-800">
              <Upload className="mr-1.5 inline h-4 w-4 text-indigo-600" />
              Barcha sinflarni biriktirib qo'shish
            </h3>
            <button
              onClick={() => { setShowBulkImport(false); setBulkText(""); }}
              className="text-sm text-gray-400 hover:text-gray-600"
            >
              Yopish
            </button>
          </div>
          <p className="mb-3 text-xs text-gray-500">
            Format: <code className="rounded bg-gray-100 px-1 py-0.5">Sinf nomi : guruh nomi (o'quvchi1 , o'quvchi2); guruh nomi (o'quvchi)</code>
          </p>
          <textarea
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            placeholder={exampleText}
            rows={12}
            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-xs outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 font-mono"
          />
          <div className="mt-3 flex items-center gap-3">
            <button
              onClick={handleBulkImport}
              disabled={importing || !bulkText.trim()}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-lg transition-all hover:shadow-xl active:scale-[0.98] disabled:opacity-50"
            >
              {importing ? "Yuklanmoqda..." : "Import qilish"}
            </button>
            {importError && (
              <span className="text-xs text-red-600">
                ❌ {importError}
              </span>
            )}
            {importResult && (
              <span className="text-xs text-green-600">
                ✅ {importResult.classes} ta sinf, {importResult.students} ta o'quvchi qo'shildi
              </span>
            )}
          </div>
          <details className="mt-3">
            <summary className="cursor-pointer text-xs text-gray-400 hover:text-gray-600">Namuna formatni ko'rsatish</summary>
            <pre className="mt-2 rounded-lg bg-gray-50 p-3 text-xs text-gray-600 whitespace-pre-wrap">{exampleText}</pre>
          </details>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="mb-1 text-lg font-bold text-gray-900">Yangi sinf qo'shish</h3>
            <p className="mb-4 text-sm text-gray-500">Sinf nomini kiriting (masalan: 5A, 5B, 6A...)</p>
            <input
              value={newClassName}
              onChange={(e) => setNewClassName(e.target.value)}
              placeholder="5A"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              onKeyDown={(e) => e.key === "Enter" && handleCreateClass()}
              autoFocus
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => { setShowAddModal(false); setNewClassName(""); }}
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Bekor qilish
              </button>
              <button
                onClick={handleCreateClass}
                disabled={creating || !newClassName.trim()}
                className="rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl disabled:opacity-50"
              >
                {creating ? "Saqlanmoqda..." : "Saqlash"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((cls) => (
          <div
            key={cls.id}
            className="relative rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:border-indigo-200 hover:shadow-md group"
          >
            <div
              onClick={() => router.push(`/dashboard/schools/${schoolId}/school-base/${cls.id}`)}
              className="cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-blue-500 text-white shadow">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <span className="text-lg font-bold text-gray-900">{cls.name}</span>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" /> {cls._count.students} o'quvchi
                </span>
              </div>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); handleDeleteClass(cls.id); }}
              className="absolute right-3 top-3 rounded-lg p-1.5 text-gray-300 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
              title="O'chirish"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
            <Users className="mx-auto mb-3 h-10 w-10 text-gray-300" />
            <p className="text-sm text-gray-400">
              {search.trim() ? "Bunday sinf topilmadi" : "Hozircha sinflar mavjud emas"}
            </p>
            {!search.trim() && (
              <button
                onClick={() => setShowAddModal(true)}
                className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-800"
              >
                <Plus className="h-4 w-4" /> Birinchi sinfni qo'shish
              </button>
            )}
          </div>
        )}
      </div>

      {/* Subjects */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Fanlar ({subjects.length})</h2>
          <div className="flex items-center gap-2">
            {!showAddSubject ? (
              <>
                <button onClick={() => setShowBulkSubject(true)} className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 shadow-sm transition-all hover:bg-indigo-100">
                  <Upload className="h-4 w-4" /> Hammasini bittada qo'shish
                </button>
                <button onClick={() => setShowAddSubject(true)} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:scale-[1.02]">
                  <Plus className="h-4 w-4" /> Fan qo'shish
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  placeholder="Algebra"
                  className="rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  onKeyDown={async (e) => {
                    if (e.key === "Enter" && newSubjectName.trim()) {
                      const res = await createSchoolSubject(schoolId, newSubjectName.trim());
                      if (res.data) {
                        setSubjects((prev) => [...prev, res.data!]);
                        setNewSubjectName("");
                        setShowAddSubject(false);
                        router.refresh();
                      }
                    }
                  }}
                  autoFocus
                />
                <button
                  onClick={async () => {
                    if (!newSubjectName.trim()) return;
                    const res = await createSchoolSubject(schoolId, newSubjectName.trim());
                    if (res.data) {
                      setSubjects((prev) => [...prev, res.data!]);
                      setNewSubjectName("");
                      setShowAddSubject(false);
                      router.refresh();
                    }
                  }}
                  className="rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-lg"
                >
                  Saqlash
                </button>
                <button onClick={() => { setShowAddSubject(false); setNewSubjectName(""); }} className="rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
                  Bekor
                </button>
              </div>
            )}
          </div>
        </div>

        {showBulkSubject && (
          <div className="mb-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
            <p className="mb-2 text-xs text-gray-500">Fan nomlarini vergul bilan ajratib yozing: <code className="rounded bg-gray-200 px-1 py-0.5">Algebra, Adabiyot, Ona tili</code></p>
            <textarea
              value={bulkSubjectText}
              onChange={(e) => setBulkSubjectText(e.target.value)}
              placeholder="Algebra, Adabiyot, Ona tili, Geometriya..."
              rows={3}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
            <div className="mt-2 flex items-center gap-2">
              <button
                onClick={async () => {
                  if (!bulkSubjectText.trim()) return;
                  const names = bulkSubjectText.split(",").map((n) => n.trim()).filter(Boolean);
                  for (const name of names) {
                    const res = await createSchoolSubject(schoolId, name);
                    if (res.data) {
                      setSubjects((prev) => {
                        if (prev.find((s) => s.id === res.data!.id)) return prev;
                        return [...prev, res.data!];
                      });
                    }
                  }
                  setBulkSubjectText("");
                  setShowBulkSubject(false);
                  router.refresh();
                }}
                className="rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-lg"
              >
                Qo'shish
              </button>
              <button onClick={() => { setShowBulkSubject(false); setBulkSubjectText(""); }} className="rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
                Bekor qilish
              </button>
            </div>
          </div>
        )}

        {subjects.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-gray-200 p-8 text-center text-sm text-gray-400">
            Fanlar mavjud emas
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {subjects.map((subj) => (
              <div key={subj.id} className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
                <BookOpen className="h-4 w-4 text-indigo-500" />
                <span className="font-medium text-gray-800">{subj.name}</span>
                <button
                  onClick={async () => {
                    if (!confirm("Rostdan ham o'chirilsinmi?")) return;
                    await deleteSchoolSubject(subj.id);
                    setSubjects((prev) => prev.filter((s) => s.id !== subj.id));
                    router.refresh();
                  }}
                  className="ml-1 rounded-lg p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
