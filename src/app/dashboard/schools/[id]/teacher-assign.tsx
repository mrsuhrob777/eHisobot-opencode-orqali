"use client";

import { useState, useEffect } from "react";
import { t, type Lang } from "@/lib/i18n";
import {
  getSchoolClasses,
  getSchoolSubjects,
  getClassGroups,
  setTeacherClasses,
  setTeacherSubjects,
  setTeacherGroups,
  getTeacherClasses,
  getTeacherSubjects,
  getTeacherGroups,
} from "@/actions/school-management";
import { useRouter } from "next/navigation";

interface SchoolClass {
  id: string;
  name: string;
  _count: { students: number; groups: number };
}

interface Subject {
  id: string;
  name: string;
}

interface Group {
  id: string;
  name: string;
  _count: { students: number };
}

interface Props {
  teacherId: string;
  schoolId: string;
  lang: Lang;
  onClose: () => void;
}

export function TeacherAssign({ teacherId, schoolId, lang, onClose }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedClassIds, setSelectedClassIds] = useState<Set<string>>(new Set());
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<Set<string>>(new Set());
  const [selectedGroupIds, setSelectedGroupIds] = useState<Set<string>>(new Set());
  const [groupsByClass, setGroupsByClass] = useState<Record<string, Group[]>>({});

  useEffect(() => {
    async function load() {
      const [classesRes, subjectsRes, teacherClassesRes, teacherSubjectsRes, teacherGroupsRes] = await Promise.all([
        getSchoolClasses(schoolId),
        getSchoolSubjects(schoolId),
        getTeacherClasses(teacherId),
        getTeacherSubjects(teacherId),
        getTeacherGroups(teacherId),
      ]);
      if (classesRes.data) setClasses(classesRes.data as SchoolClass[]);
      if (subjectsRes.data) setSubjects(subjectsRes.data as Subject[]);
      if (teacherClassesRes.data)
        setSelectedClassIds(new Set((teacherClassesRes.data as { id: string }[]).map((c) => c.id)));
      if (teacherSubjectsRes.data)
        setSelectedSubjectIds(new Set((teacherSubjectsRes.data as { id: string }[]).map((s) => s.id)));
      if (teacherGroupsRes.data)
        setSelectedGroupIds(new Set((teacherGroupsRes.data as { id: string }[]).map((g) => g.id)));
      setLoading(false);
    }
    load();
  }, [schoolId, teacherId]);

  useEffect(() => {
    async function fetchGroups() {
      const groupMap = { ...groupsByClass };
      for (const classId of selectedClassIds) {
        if (!groupMap[classId]) {
          const res = await getClassGroups(classId);
          if (res.data) groupMap[classId] = res.data as Group[];
        }
      }
      setGroupsByClass(groupMap);
    }
    fetchGroups();
  }, [selectedClassIds]);

  function toggleClass(id: string) {
    setSelectedClassIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSubject(id: string) {
    setSelectedSubjectIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleGroup(id: string) {
    setSelectedGroupIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    await Promise.all([
      setTeacherClasses(teacherId, Array.from(selectedClassIds)),
      setTeacherSubjects(teacherId, Array.from(selectedSubjectIds)),
      setTeacherGroups(teacherId, Array.from(selectedGroupIds)),
    ]);
    router.refresh();
    onClose();
  }

  if (loading) {
    return (
      <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 p-4">
        <div className="w-full max-w-lg rounded-2xl border border-gray-100 bg-white p-6 text-center text-sm text-gray-500 shadow-2xl">
          {t("common.loading", lang)}
        </div>
      </div>
    );
  }

  const allGroups = Array.from(selectedClassIds).flatMap((classId) =>
    (groupsByClass[classId] || []).map((g) => ({
      ...g,
      className: classes.find((c) => c.id === classId)?.name || "",
    }))
  );

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-gray-100 bg-white p-6 shadow-2xl">
        <h2 className="mb-5 text-lg font-bold text-gray-900">O'qituvchi sozlamalari</h2>

        <div className="mb-6">
          <h3 className="mb-3 text-sm font-semibold text-gray-700">Sinfar</h3>
          <div className="space-y-1.5">
            {classes.map((cls) => (
              <label
                key={cls.id}
                className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  checked={selectedClassIds.has(cls.id)}
                  onChange={() => toggleClass(cls.id)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                {cls.name}
              </label>
            ))}
            {classes.length === 0 && <p className="text-xs text-gray-400">Sinfar mavjud emas</p>}
          </div>
        </div>

        <div className="mb-6">
          <h3 className="mb-3 text-sm font-semibold text-gray-700">Fanlar</h3>
          <div className="space-y-1.5">
            {subjects.map((subj) => (
              <label
                key={subj.id}
                className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  checked={selectedSubjectIds.has(subj.id)}
                  onChange={() => toggleSubject(subj.id)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                {subj.name}
              </label>
            ))}
            {subjects.length === 0 && <p className="text-xs text-gray-400">Fanlar mavjud emas</p>}
          </div>
        </div>

        {selectedClassIds.size > 0 && (
          <div className="mb-6">
            <h3 className="mb-3 text-sm font-semibold text-gray-700">Guruhlar</h3>
            <div className="space-y-1.5">
              {allGroups.map((g) => (
                <label
                  key={g.id}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={selectedGroupIds.has(g.id)}
                    onChange={() => toggleGroup(g.id)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  {g.className}: {g.name}
                </label>
              ))}
              {allGroups.length === 0 && <p className="text-xs text-gray-400">Guruhlar mavjud emas</p>}
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
          <button
            onClick={onClose}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700"
          >
            Bekor qilish
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg disabled:opacity-50"
          >
            {saving ? t("common.saving", lang) : "Saqlash"}
          </button>
        </div>
      </div>
    </div>
  );
}
