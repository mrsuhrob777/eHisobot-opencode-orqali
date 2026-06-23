"use client";

import { useRouter } from "next/navigation";
import { type Lang } from "@/lib/i18n";
import { createSchoolSubject, deleteSchoolSubject } from "@/actions/school-management";

const btnPrimary =
  "inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-3 py-2 text-xs font-semibold text-white shadow-lg transition-all hover:shadow-xl active:scale-[0.98]";
const btnSecondary =
  "inline-flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:shadow-md";

export function SubjectManager({
  schoolId,
  subjects,
  lang,
}: {
  schoolId: string;
  subjects: Array<{ id: string; name: string }>;
  lang: Lang;
}) {
  const router = useRouter();

  async function handleDelete(subjectId: string) {
    await deleteSchoolSubject(subjectId);
    router.refresh();
  }

  async function handleCreate(formData: FormData) {
    const name = formData.get("name") as string;
    if (!name?.trim()) return;
    await createSchoolSubject(schoolId, name.trim());
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-800">{"Fanlarni boshqarish"}</h3>

      <div className="flex flex-wrap gap-2">
        {subjects.map((subject) => (
          <span
            key={subject.id}
            className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700"
          >
            {subject.name}
            <button
              onClick={() => handleDelete(subject.id)}
              className="inline-flex items-center justify-center rounded-full text-red-500 transition-colors hover:bg-red-100 hover:text-red-700"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </span>
        ))}
      </div>

      <details className="group">
        <summary className={btnPrimary + " cursor-pointer list-none"}>
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          {"+ Fan qo'shish"}
        </summary>

        <form action={handleCreate} className="mt-3 flex items-end gap-2">
          <div className="flex-1">
            <input
              name="name"
              type="text"
              placeholder={"Fan nomi"}
              className="block w-full rounded-xl border border-gray-200 px-3 py-2 text-xs shadow-sm outline-none transition-colors focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
              required
            />
          </div>
          <button type="submit" className={btnPrimary}>
            {"Saqlash"}
          </button>
          <button
            type="reset"
            onClick={(e) => {
              const details = (e.target as HTMLButtonElement).closest("details");
              if (details) details.open = false;
            }}
            className={btnSecondary}
          >
            {"Bekor qilish"}
          </button>
        </form>
      </details>
    </div>
  );
}
