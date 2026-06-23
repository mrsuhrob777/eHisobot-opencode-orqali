"use client";

import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { Plus, Trash2, Users, FolderPlus } from "lucide-react";
import { createStudent, deleteStudent, updateStudent, createSchoolGroup, deleteSchoolGroup } from "@/actions/school-management";

type Student = {
  id: string;
  name: string;
  gender: string;
  groupId: string | null;
  group?: { id: string; name: string } | null;
};

type ClassGroup = {
  id: string;
  name: string;
};

const GENDER_OPTIONS = [
  { value: "o'g'il", label: "O'g'il" },
  { value: "qiz", label: "Qiz" },
];

const btnPrimary =
  "inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:scale-[1.02]";
const btnSecondary =
  "inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:shadow-md";
const btnDanger =
  "rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500";

export function ClassStudents({
  classId,
  className,
  initialStudents,
  groups,
}: {
  classId: string;
  className: string;
  initialStudents: Student[];
  groups: ClassGroup[];
}) {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>(initialStudents);
  const [allGroups, setAllGroups] = useState<ClassGroup[]>(groups);
  const [activeTab, setActiveTab] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [form, setForm] = useState({ name: "", gender: "" });
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const editRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId && editRef.current) editRef.current.focus();
  }, [editingId]);

  const tabs = allGroups.map((g) => ({ key: g.id, label: g.name }));

  useEffect(() => {
    if (tabs.length > 0 && !tabs.find((t) => t.key === activeTab)) setActiveTab(tabs[0].key);
  }, [tabs, activeTab]);

  function getFilteredStudents() {
    const group = allGroups.find((g) => g.id === activeTab);
    if (!group) return students;
    if (group.name === "Butun sinf") return students;
    if (group.name === "O'g'il bolalar") return students.filter((s) => s.gender === "o'g'il");
    if (group.name === "Qiz bolalar") return students.filter((s) => s.gender === "qiz");
    return students.filter((s) => s.groupId === activeTab);
  }

  const filtered = getFilteredStudents();

  function resetForm() {
    setForm({ name: "", gender: "" });
  }

  async function handleAddGroup() {
    if (!newGroupName.trim()) return;
    setSaving(true);
    const res = await createSchoolGroup(classId, newGroupName.trim());
    if (res.data) {
      setAllGroups((prev) => [...prev, res.data!]);
    }
    setNewGroupName("");
    setShowAddGroup(false);
    setSaving(false);
    router.refresh();
  }

  async function handleAddStudent() {
    if (!form.name.trim()) return;
    setSaving(true);

    const gender = form.gender || undefined;
    const groupId = activeTab;

    const res = await createStudent(classId, form.name.trim(), groupId, gender);
    if (res.data) {
      const group = groupId ? allGroups.find((g) => g.id === groupId) : null;
      const s = { ...res.data!, group: group ? { id: group.id, name: group.name } : null };
      setStudents((prev) => [...prev, s]);
      setShowAddModal(false);
      resetForm();
      router.refresh();
    }
    setSaving(false);
  }

  async function handleDeleteGroup(id: string) {
    if (!confirm("Guruh va undagi barcha o'quvchilar o'chirilsinmi?")) return;
    await deleteSchoolGroup(id);
    setAllGroups((prev) => prev.filter((g) => g.id !== id));
    setStudents((prev) => prev.filter((s) => s.groupId !== id));
    if (activeTab === id) setActiveTab(allGroups.find((g) => g.id !== id)?.id || "");
    router.refresh();
  }

  async function handleDeleteStudent(id: string) {
    if (!confirm("Rostdan ham o'chirilsinmi?")) return;
    await deleteStudent(id);
    setStudents((prev) => prev.filter((s) => s.id !== id));
    router.refresh();
  }

  async function handleRename(id: string) {
    if (!editName.trim() || editName === students.find((s) => s.id === id)?.name) {
      setEditingId(null);
      return;
    }
    await updateStudent(id, editName.trim());
    setStudents((prev) => prev.map((s) => (s.id === id ? { ...s, name: editName.trim() } : s)));
    setEditingId(null);
    router.refresh();
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{className} sinfi</h2>
          <p className="mt-1 text-sm text-gray-500">
            <Users className="mr-1 inline h-4 w-4" />
            {students.length} o'quvchi, {allGroups.length} guruh
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!showAddGroup ? (
            <button onClick={() => setShowAddGroup(true)} className={btnSecondary}>
              <FolderPlus className="h-4 w-4" /> Guruh qo'shish
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              <input
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="Guruh nomi..."
                className="w-32 rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs outline-none focus:border-indigo-500"
                onKeyDown={(e) => e.key === "Enter" && handleAddGroup()}
                autoFocus
              />
              <button onClick={handleAddGroup} disabled={saving} className={btnPrimary}>
                Qo'shish
              </button>
              <button onClick={() => { setShowAddGroup(false); setNewGroupName(""); }} className={btnSecondary}>
                Bekor
              </button>
            </div>
          )}
          <button onClick={() => { resetForm(); setShowAddModal(true); }} disabled={allGroups.length === 0} className={btnPrimary}>
            <Plus className="h-4 w-4" /> O'quvchi qo'shish
          </button>
        </div>
      </div>

      {allGroups.length > 0 ? (
        <div className="mb-6 flex flex-wrap gap-1 rounded-xl bg-gray-100 p-1">
          {tabs.map((tab) => (
            <div key={tab.key} className={`flex items-center rounded-lg ${
              activeTab === tab.key ? "bg-white shadow-sm" : ""
            }`}>
              <button
                onClick={() => setActiveTab(tab.key)}
                className={`whitespace-nowrap rounded-l-lg px-3 py-2 text-sm font-medium transition-all ${
                  activeTab === tab.key
                    ? "text-indigo-700"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.label}
              </button>
              <button
                onClick={() => handleDeleteGroup(tab.key)}
                className={`rounded-r-lg px-1.5 py-2 text-xs transition-all hover:text-red-500 ${
                  activeTab === tab.key ? "text-gray-400" : "text-gray-400"
                }`}
                title="Guruhni o'chirish"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="mb-6 rounded-xl border-2 border-dashed border-gray-200 p-6 text-center text-sm text-gray-400">
          Guruhlar mavjud emas. Avval guruh qo'shing yoki import qiling.
        </div>
      )}

      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-400">
            Bu bo'limda o'quvchilar mavjud emas
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left">
                  <th className="px-5 pb-3 pt-4 font-medium text-gray-500 w-12">#</th>
                  <th className="px-5 pb-3 pt-4 font-medium text-gray-500">F.I.Sh</th>
                  <th className="px-5 pb-3 pt-4 font-medium text-gray-500">Jinsi</th>
                  <th className="px-5 pb-3 pt-4 font-medium text-gray-500 w-16"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, i) => (
                  <tr key={s.id} className="border-b border-gray-50 group">
                    <td className="px-5 py-3 text-gray-400">{i + 1}</td>
                    <td className="px-5 py-3 font-medium text-gray-900">
                      {editingId === s.id ? (
                        <input
                          ref={editRef}
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onBlur={() => handleRename(s.id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleRename(s.id);
                            if (e.key === "Escape") setEditingId(null);
                          }}
                          className="w-full rounded-lg border border-indigo-300 px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                      ) : (
                        <span
                          onClick={() => { setEditingId(s.id); setEditName(s.name); }}
                          className="cursor-pointer rounded px-1 py-0.5 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                        >
                          {s.name}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      {s.gender === "o'g'il" ? (
                        <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">O'g'il</span>
                      ) : s.gender === "qiz" ? (
                        <span className="rounded-lg bg-pink-50 px-2.5 py-1 text-xs font-medium text-pink-700">Qiz</span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button onClick={() => handleDeleteStudent(s.id)} className={btnDanger}>
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="mb-4 text-lg font-bold text-gray-900">Yangi o'quvchi qo'shish</h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-600">Familiya Ism Sharif</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Aliyev Vali"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  onKeyDown={(e) => e.key === "Enter" && handleAddStudent()}
                  autoFocus
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-600">Jinsi</label>
                <div className="flex gap-3">
                  {GENDER_OPTIONS.map((opt) => (
                    <label
                      key={opt.value}
                      className={`flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-all ${
                        form.gender === opt.value
                          ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                          : "border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="gender"
                        value={opt.value}
                        checked={form.gender === opt.value}
                        onChange={() => setForm({ ...form, gender: opt.value })}
                        className="hidden"
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </div>
              <p className="text-xs text-gray-400">
                O'quvchi "{allGroups.find((g) => g.id === activeTab)?.name}" guruhiga qo'shiladi
              </p>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => { setShowAddModal(false); resetForm(); }} className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
                Bekor qilish
              </button>
              <button
                onClick={handleAddStudent}
                disabled={saving || !form.name.trim()}
                className="rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl disabled:opacity-50"
              >
                {saving ? "Saqlanmoqda..." : "Saqlash"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
