"use client";

import { updateUserProfile, uploadAvatar, deleteAvatar, createTeacher, resetTeacherPassword } from "@/actions/profile";
import { t, type Lang } from "@/lib/i18n";
import { useState, useEffect, useRef } from "react";
import { User, Save, Camera, Plus, Eye, EyeOff, KeyRound, Trash2 } from "lucide-react";

const roleColors: Record<string, string> = {
  admin: "from-indigo-600 to-blue-600",
  teacher: "from-indigo-500 to-blue-600",
  director: "from-violet-600 to-purple-600",
  deputy_director: "from-amber-600 to-orange-600",
};

type Profile = {
  id: string;
  fullName: string;
  login: string;
  role: string;
  avatar: string | null;
  school: { name: string } | null;
};

type TeacherInfo = {
  id: string;
  fullName: string;
  login: string;
  plainPassword: string | null;
  avatar: string | null;
  school: { name: string } | null;
};

type SchoolInfo = {
  id: string;
  name: string;
};

export default function ProfileDisplay({
  profile,
  teachers = [],
  schools = [],
}: {
  profile: Profile;
  teachers?: TeacherInfo[];
  schools?: SchoolInfo[];
}) {
  const [lang, setLang] = useState<Lang>("uz");
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(profile.fullName);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [avatar, setAvatar] = useState(profile.avatar);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

  const [showAddForm, setShowAddForm] = useState(false);
  const [newFullName, setNewFullName] = useState("");
  const [newLogin, setNewLogin] = useState("");
  const [newPw, setNewPw] = useState("");
  const [newSchoolId, setNewSchoolId] = useState(schools[0]?.id || "");
  const [addMsg, setAddMsg] = useState("");
  const [addErr, setAddErr] = useState("");

  const [passwordReset, setPasswordReset] = useState<Record<string, string>>({});
  const [resetMsg, setResetMsg] = useState<Record<string, string>>({});

  useEffect(() => {
    const saved = document.cookie.match(/(?:^|;\s*)lang=([^;]*)/)?.[1] as Lang | undefined;
    if (saved) setLang(saved);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const formData = new FormData();
      formData.set("fullName", fullName);
      await updateUserProfile(formData);
      setMessage(t("profile.updated", lang));
      setEditing(false);
    } catch (err: any) {
      setError(err.message || "Xatolik yuz berdi");
    } finally {
      setSaving(false);
    }
  }

  async function handleAvatarUpload(file: File) {
    try {
      const fd = new FormData();
      fd.set("userId", "me");
      fd.set("avatar", file);
      await uploadAvatar(fd);
      window.location.reload();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleTeacherAvatar(userId: string, file: File) {
    try {
      const fd = new FormData();
      fd.set("userId", userId);
      fd.set("avatar", file);
      await uploadAvatar(fd);
      setError("");
      window.location.reload();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleAddTeacher(e: React.FormEvent) {
    e.preventDefault();
    setAddMsg("");
    setAddErr("");
    try {
      const fd = new FormData();
      fd.set("fullName", newFullName);
      fd.set("login", newLogin);
      fd.set("password", newPw);
      fd.set("schoolId", newSchoolId);
      await createTeacher(fd);
      setAddMsg("O'qituvchi qo'shildi");
      setNewFullName("");
      setNewLogin("");
      setNewPw("");
      setShowAddForm(false);
      window.location.reload();
    } catch (err: any) {
      setAddErr(err.message);
    }
  }

  async function handleResetPassword(teacherId: string) {
    try {
      const fd = new FormData();
      fd.set("userId", teacherId);
      fd.set("newPassword", passwordReset[teacherId] || "");
      await resetTeacherPassword(fd);
      setResetMsg((prev) => ({ ...prev, [teacherId]: "Parol o'zgartirildi" }));
      setPasswordReset((prev) => ({ ...prev, [teacherId]: "" }));
      window.location.reload();
    } catch (err: any) {
      setResetMsg((prev) => ({ ...prev, [teacherId]: err.message }));
    }
  }

  const isAdmin = profile.role === "admin";

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Own Profile Card */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-col items-center">
          <div className="group relative">
            <div className={`flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br ${roleColors[profile.role] || "from-gray-500 to-gray-600"} text-3xl font-bold text-white shadow-lg overflow-hidden`}>
              {avatar ? (
                <img src={avatar} alt="" className="h-full w-full object-cover" />
              ) : (
                profile.fullName.charAt(0).toUpperCase()
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-white shadow-md hover:bg-indigo-700 transition-all cursor-pointer"
            >
              <Camera className="h-5 w-5" />
            </button>
            {avatar && (
              <button
                onClick={async () => {
                  const fd = new FormData();
                  fd.set("userId", "me");
                  await deleteAvatar(fd);
                  window.location.reload();
                }}
                className="absolute -bottom-1 -left-1 flex h-10 w-10 items-center justify-center rounded-full bg-red-500 text-white shadow-md hover:bg-red-600 transition-all cursor-pointer"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleAvatarUpload(file);
              }}
            />
          </div>
          <h2 className="mt-3 text-xl font-bold text-gray-900">{profile.fullName}</h2>
          <span className="mt-1 rounded-lg bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
            {t(`role.${profile.role}`, lang)}
          </span>
        </div>

        <div className="mb-6 space-y-3">
          <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
            <span className="text-sm text-gray-500">{t("profile.login", lang)}</span>
            <span className="text-sm font-medium text-gray-900">{profile.login}</span>
          </div>
          {profile.school && (
            <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
              <span className="text-sm text-gray-500">{t("profile.school", lang)}</span>
              <span className="text-sm font-medium text-gray-900">{profile.school.name}</span>
            </div>
          )}
        </div>

        {editing ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">{t("users.full_name", lang)}</label>
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} required
                className="w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-indigo-500 min-h-[44px]" />
            </div>
            {message && <p className="rounded-lg bg-emerald-50 p-3 text-xs font-medium text-emerald-700">{message}</p>}
            {error && <p className="rounded-lg bg-red-50 p-3 text-xs font-medium text-red-600">{error}</p>}
            <div className="flex gap-2">
              <button type="button" onClick={() => { setEditing(false); setFullName(profile.fullName); }}
                className="touch-target flex-1 rounded-lg border border-gray-300 px-3 text-sm text-gray-600 hover:bg-gray-50">
                {t("users.cancel", lang)}
              </button>
              <button type="submit" disabled={saving}
                className="touch-target flex-1 rounded-lg bg-indigo-600 px-3 text-sm text-white hover:bg-indigo-700 disabled:opacity-50">
                <Save className="mr-1.5 inline-block h-4 w-4" /> {saving ? t("common.saving", lang) : t("profile.save", lang)}
              </button>
            </div>
          </form>
        ) : (
          <button onClick={() => setEditing(true)}
            className="touch-target flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-700">
            <User className="h-4 w-4" /> {t("profile.edit", lang)}
          </button>
        )}
      </div>

      {/* Admin: Teacher List */}
      {isAdmin && (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900">O'qituvchilar</h3>
            <button onClick={() => setShowAddForm(!showAddForm)}
              className="touch-target flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 text-xs font-semibold text-white hover:bg-indigo-700 transition-all cursor-pointer">
              <Plus className="h-3.5 w-3.5" /> Yangi o'qituvchi
            </button>
          </div>

          {showAddForm && (
            <form onSubmit={handleAddTeacher} className="mb-6 rounded-xl border border-indigo-100 bg-indigo-50 p-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input value={newFullName} onChange={(e) => setNewFullName(e.target.value)} placeholder="To'liq ism" required
                  className="w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-indigo-500 min-h-[44px]" />
                <input value={newLogin} onChange={(e) => setNewLogin(e.target.value)} placeholder="Login" required
                  className="w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-indigo-500 min-h-[44px]" />
                <input value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="Parol" type="password" required
                  className="w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-indigo-500 min-h-[44px]" />
                <select value={newSchoolId} onChange={(e) => setNewSchoolId(e.target.value)} required
                  className="w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-indigo-500 min-h-[44px]">
                  <option value="">Maktabni tanlang</option>
                  {schools.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              {addMsg && <p className="rounded bg-emerald-50 p-2 text-xs font-medium text-emerald-700">{addMsg}</p>}
              {addErr && <p className="rounded bg-red-50 p-2 text-xs font-medium text-red-600">{addErr}</p>}
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowAddForm(false)}
                  className="touch-target rounded-lg border border-gray-300 px-3 text-xs text-gray-600 hover:bg-gray-50 cursor-pointer">Bekor qilish</button>
                <button type="submit"
                  className="touch-target rounded-lg bg-indigo-600 px-3 text-xs text-white hover:bg-indigo-700 cursor-pointer">Qo'shish</button>
              </div>
            </form>
          )}

          {teachers.length === 0 ? (
            <p className="text-sm text-gray-500">Hozircha o'qituvchilar yo'q</p>
          ) : (
            <div className="space-y-3">
              {teachers.map((tchr) => (
                <div key={tchr.id} className="flex items-center gap-4 rounded-xl border border-gray-100 bg-gray-50/50 p-4">
                  <div className="group relative h-12 w-12 flex-shrink-0">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 text-base font-bold text-white shadow-sm overflow-hidden">
                      {tchr.avatar ? (
                        <img src={tchr.avatar} alt="" className="h-full w-full object-cover" />
                      ) : (
                        tchr.fullName.charAt(0).toUpperCase()
                      )}
                    </div>
                    <button
                      onClick={() => document.getElementById(`avatar-${tchr.id}`)?.click()}
                      className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-white shadow cursor-pointer"
                    >
                      <Camera className="h-3 w-3" />
                    </button>
                    {tchr.avatar && (
                      <button
                        onClick={async () => {
                          const fd = new FormData();
                          fd.set("userId", tchr.id);
                          await deleteAvatar(fd);
                          window.location.reload();
                        }}
                        className="absolute -bottom-1 -left-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow cursor-pointer"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                    <input
                      id={`avatar-${tchr.id}`}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleTeacherAvatar(tchr.id, file);
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900">{tchr.fullName}</p>
                    <p className="text-xs text-gray-500">
                      <span className="font-medium">Login:</span> {tchr.login}
                    </p>
                    {tchr.plainPassword && (
                      <p className="text-xs text-gray-500">
                        <span className="font-medium">Parol:</span>{" "}
                        {showPasswords[tchr.id] ? (
                          <span className="font-mono text-amber-700">{tchr.plainPassword}</span>
                        ) : (
                          <span className="font-mono text-gray-400">••••••</span>
                        )}
                        <button
                          onClick={() => setShowPasswords((prev) => ({ ...prev, [tchr.id]: !prev[tchr.id] }))}
                          className="ml-1 inline-flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                        >
                          {showPasswords[tchr.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        </button>
                      </p>
                    )}
                    <p className="text-xs text-gray-500">
                      <span className="font-medium">Maktab:</span> {tchr.school?.name || "—"}
                    </p>

                    {/* Password reset */}
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        value={passwordReset[tchr.id] || ""}
                        onChange={(e) => setPasswordReset((prev) => ({ ...prev, [tchr.id]: e.target.value }))}
                        placeholder="Yangi parol"
                        type="password"
                        className="w-40 rounded border border-gray-300 px-2 text-xs outline-none focus:border-indigo-500 min-h-[44px]"
                      />
                      <button
                        onClick={() => handleResetPassword(tchr.id)}
                        disabled={!passwordReset[tchr.id] || passwordReset[tchr.id]!.length < 4}
                        className="touch-target flex items-center gap-1 rounded bg-amber-500 px-3 text-xs text-white hover:bg-amber-600 disabled:opacity-40 cursor-pointer"
                      >
                        <KeyRound className="h-3 w-3" /> Parolni yangilash
                      </button>
                      {resetMsg[tchr.id] && (
                        <span className="text-xs text-emerald-600">{resetMsg[tchr.id]}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
