"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { t, type Lang } from "@/lib/i18n";
import {
  getClassGroups,
  createSchoolClass,
  deleteSchoolClass,
  createSchoolGroup,
  deleteSchoolGroup,
  getClassStudents,
  createStudent,
  deleteStudent,
  importStudentsBulk,
  createDefaultGroups,
} from "@/actions/school-management";
import { Plus, Trash2, Upload, Users, BookOpen } from "lucide-react";

const btnPrimary =
  "inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-3 py-2 text-xs font-semibold text-white shadow-lg transition-all hover:shadow-xl active:scale-[0.98]";
const btnSecondary =
  "inline-flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:shadow-md";
const btnDanger =
  "inline-flex items-center justify-center gap-1.5 rounded-xl border border-red-200 px-3 py-2 text-xs font-medium text-red-600 transition-all hover:bg-red-50";

interface ClassGroup {
  id: string;
  name: string;
  _count: { students: number };
}

interface Student {
  id: string;
  name: string;
  groupId: string | null;
  group?: { id: string; name: string } | null;
}

interface SchoolClass {
  id: string;
  name: string;
  groups?: ClassGroup[];
  _count: { students: number; groups: number };
}

export function ClassManager({
  schoolId,
  classes,
  lang,
}: {
  schoolId: string;
  classes: SchoolClass[];
  lang: Lang;
}) {
  const router = useRouter();
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [showAddClass, setShowAddClass] = useState(false);
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [showImportStudents, setShowImportStudents] = useState(false);
  const [newName, setNewName] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [groups, setGroups] = useState<ClassGroup[]>([]);
  const [filterGroupId, setFilterGroupId] = useState<string>("");
  const [importText, setImportText] = useState("");

  async function handleSelectClass(classId: string) {
    setSelectedClassId(classId);
    setShowAddGroup(false);
    setShowAddStudent(false);
    setShowImportStudents(false);
    const [groupsRes, studentsRes] = await Promise.all([
      getClassGroups(classId),
      getClassStudents(classId),
    ]);
    if (groupsRes.data) setGroups(groupsRes.data as ClassGroup[]);
    if (studentsRes.data) setStudents(studentsRes.data as Student[]);
    setFilterGroupId("");
  }

  async function handleCreateClass() {
    if (!newName.trim()) return;
    await createSchoolClass(schoolId, newName.trim());
    setNewName("");
    setShowAddClass(false);
    router.refresh();
  }

  async function handleDeleteClass(id: string) {
    if (!confirm(t("common.delete_confirm", lang))) return;
    if (selectedClassId === id) {
      setSelectedClassId(null);
      setStudents([]);
      setGroups([]);
    }
    await deleteSchoolClass(id);
    router.refresh();
  }

  async function handleCreateGroup() {
    if (!newName.trim() || !selectedClassId) return;
    await createSchoolGroup(selectedClassId, newName.trim());
    setNewName("");
    setShowAddGroup(false);
    const res = await getClassGroups(selectedClassId);
    if (res.data) setGroups(res.data as ClassGroup[]);
    router.refresh();
  }

  async function handleDeleteGroup(id: string) {
    if (!confirm(t("common.delete_confirm", lang))) return;
    await deleteSchoolGroup(id);
    if (selectedClassId) {
      const res = await getClassGroups(selectedClassId);
      if (res.data) setGroups(res.data as ClassGroup[]);
      const studentsRes = await getClassStudents(selectedClassId);
      if (studentsRes.data) setStudents(studentsRes.data as Student[]);
    }
    router.refresh();
  }

  async function handleCreateStudent() {
    if (!newName.trim() || !selectedClassId) return;
    await createStudent(selectedClassId, newName.trim(), filterGroupId || undefined);
    setNewName("");
    setShowAddStudent(false);
    const res = await getClassStudents(selectedClassId, filterGroupId || undefined);
    if (res.data) setStudents(res.data as Student[]);
    router.refresh();
  }

  async function handleDeleteStudent(id: string) {
    if (!confirm(t("common.delete_confirm", lang))) return;
    await deleteStudent(id);
    if (selectedClassId) {
      const res = await getClassStudents(selectedClassId, filterGroupId || undefined);
      if (res.data) setStudents(res.data as Student[]);
    }
    router.refresh();
  }

  async function handleImportStudents() {
    if (!importText.trim() || !selectedClassId) return;
    const names = importText
      .split("\n")
      .map((n) => n.trim())
      .filter(Boolean);
    if (names.length === 0) return;
    await importStudentsBulk(selectedClassId, names, filterGroupId || undefined);
    setImportText("");
    setShowImportStudents(false);
    const res = await getClassStudents(selectedClassId, filterGroupId || undefined);
    if (res.data) setStudents(res.data as Student[]);
    router.refresh();
  }

  async function handleCreateDefaultGroups() {
    if (!selectedClassId) return;
    await createDefaultGroups(selectedClassId);
    const res = await getClassGroups(selectedClassId);
    if (res.data) setGroups(res.data as ClassGroup[]);
    router.refresh();
  }

  async function handleFilterChange(groupId: string) {
    setFilterGroupId(groupId);
    if (!selectedClassId) return;
    const res = await getClassStudents(selectedClassId, groupId || undefined);
    if (res.data) setStudents(res.data as Student[]);
  }

  const selectedClass = classes.find((c) => c.id === selectedClassId);

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">Sinfni boshqarish</h2>
        {!showAddClass ? (
          <button onClick={() => setShowAddClass(true)} className={btnPrimary}>
            <Plus className="h-4 w-4" /> Yangi sinf
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Sinf nomi..."
              className="w-40 rounded-xl border border-gray-300 px-3 py-2 text-xs outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              onKeyDown={(e) => e.key === "Enter" && handleCreateClass()}
            />
            <button onClick={handleCreateClass} className={btnPrimary}>
              Saqlash
            </button>
            <button
              onClick={() => {
                setShowAddClass(false);
                setNewName("");
              }}
              className={btnSecondary}
            >
              Bekor qilish
            </button>
          </div>
        )}
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {classes.map((cls) => (
          <div
            key={cls.id}
            onClick={() => handleSelectClass(cls.id)}
            className={`cursor-pointer rounded-xl border p-4 transition-all ${
              selectedClassId === cls.id
                ? "border-indigo-300 bg-indigo-50 shadow-sm"
                : "border-gray-100 bg-gray-50 hover:border-indigo-200 hover:shadow-sm"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-indigo-600" />
                <span className="font-semibold text-gray-900">{cls.name}</span>
              </div>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              {cls._count.students} o'quvchi, {cls._count.groups} guruh
            </p>
            <div
              className="mt-3 flex flex-wrap gap-1.5"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => {
                  handleSelectClass(cls.id);
                }}
                className={btnSecondary}
              >
                <Users className="h-3.5 w-3.5" /> Guruhlarni boshqarish
              </button>
              <button
                onClick={() => {
                  handleSelectClass(cls.id);
                }}
                className={btnSecondary}
              >
                <Users className="h-3.5 w-3.5" /> O'quvchilarni boshqarish
              </button>
              <button
                onClick={() => handleDeleteClass(cls.id)}
                className={btnDanger}
              >
                <Trash2 className="h-3.5 w-3.5" /> O'chirish
              </button>
            </div>
          </div>
        ))}
        {classes.length === 0 && (
          <div className="col-span-full rounded-xl border-2 border-dashed border-gray-200 p-8 text-center text-sm text-gray-400">
            Sinf mavjud emas
          </div>
        )}
      </div>

      {selectedClass && (
        <div className="space-y-6">
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">
                Guruhlar - {selectedClass.name}
              </h3>
              <div className="flex gap-2">
                {!showAddGroup ? (
                  <button
                    onClick={() => {
                      setShowAddGroup(true);
                      setNewName("");
                    }}
                    className={btnSecondary}
                  >
                    <Plus className="h-3.5 w-3.5" /> Guruh qo'shish
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <input
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="Guruh nomi..."
                      className="w-32 rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs outline-none focus:border-indigo-500"
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleCreateGroup()
                      }
                    />
                    <button onClick={handleCreateGroup} className={btnPrimary}>
                      Saqlash
                    </button>
                    <button
                      onClick={() => {
                        setShowAddGroup(false);
                        setNewName("");
                      }}
                      className={btnSecondary}
                    >
                      Bekor qilish
                    </button>
                  </div>
                )}
                <button
                  onClick={handleCreateDefaultGroups}
                  className={btnSecondary}
                >
                  <Upload className="h-3.5 w-3.5" /> Standart guruhlarni
                  yaratish
                </button>
              </div>
            </div>
            {groups.length === 0 ? (
              <p className="text-sm text-gray-400">Guruhlar mavjud emas</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {groups.map((g) => (
                  <div
                    key={g.id}
                    className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm"
                  >
                    <span className="font-medium text-gray-700">{g.name}</span>
                    <span className="text-xs text-gray-400">
                      ({g._count.students})
                    </span>
                    <button
                      onClick={() => handleDeleteGroup(g.id)}
                      className="ml-1 rounded p-0.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">
                O'quvchilar - {selectedClass.name}
              </h3>
              <div className="flex items-center gap-2">
                <select
                  value={filterGroupId}
                  onChange={(e) => handleFilterChange(e.target.value)}
                  className="rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs outline-none focus:border-indigo-500"
                >
                  <option value="">Barcha o'quvchilar</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
                {!showAddStudent ? (
                  <button
                    onClick={() => {
                      setShowAddStudent(true);
                      setNewName("");
                    }}
                    className={btnSecondary}
                  >
                    <Plus className="h-3.5 w-3.5" /> O'quvchi qo'shish
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <input
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="Ism familiya..."
                      className="w-36 rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs outline-none focus:border-indigo-500"
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleCreateStudent()
                      }
                    />
                    <button
                      onClick={handleCreateStudent}
                      className={btnPrimary}
                    >
                      Saqlash
                    </button>
                    <button
                      onClick={() => {
                        setShowAddStudent(false);
                        setNewName("");
                      }}
                      className={btnSecondary}
                    >
                      Bekor qilish
                    </button>
                  </div>
                )}
                {!showImportStudents ? (
                  <button
                    onClick={() => {
                      setShowImportStudents(true);
                      setImportText("");
                    }}
                    className={btnSecondary}
                  >
                    <Upload className="h-3.5 w-3.5" /> Bir nechta o'quvchini
                    import qilish
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={handleImportStudents}
                      className={btnPrimary}
                    >
                      Saqlash
                    </button>
                    <button
                      onClick={() => {
                        setShowImportStudents(false);
                        setImportText("");
                      }}
                      className={btnSecondary}
                    >
                      Bekor qilish
                    </button>
                  </div>
                )}
              </div>
            </div>

            {showImportStudents && (
              <div className="mb-3">
                <textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder="Har bir qatorga bitta ism..."
                  rows={5}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            )}

            {students.length === 0 ? (
              <p className="text-sm text-gray-400">
                O'quvchilar mavjud emas
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-left">
                      <th className="pb-2 pr-4 font-medium text-gray-500">
                        #
                      </th>
                      <th className="pb-2 pr-4 font-medium text-gray-500">
                        Ism
                      </th>
                      <th className="pb-2 pr-4 font-medium text-gray-500">
                        Guruh
                      </th>
                      <th className="pb-2 font-medium text-gray-500"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((s, i) => (
                      <tr key={s.id} className="border-b border-gray-100">
                        <td className="py-2 pr-4 text-gray-400">{i + 1}</td>
                        <td className="py-2 pr-4 font-medium text-gray-900">
                          {s.name}
                        </td>
                        <td className="py-2 pr-4 text-gray-500">
                          {s.group?.name ?? (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                        <td className="py-2 text-right">
                          <button
                            onClick={() => handleDeleteStudent(s.id)}
                            className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
