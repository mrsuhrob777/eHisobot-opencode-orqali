"use server";

import { prisma } from "@/lib/db";
import { getSession, hashPassword } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getUserProfile() {
  const session = await getSession();
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      fullName: true,
      login: true,
      role: true,
      schoolId: true,
      school: { select: { name: true } },
    },
  });
  return user;
}

export async function updateUserProfile(formData: FormData) {
  const session = await getSession();
  if (!session) throw new Error("Not authenticated");

  const fullName = formData.get("fullName") as string;
  const newPassword = formData.get("newPassword") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!fullName || fullName.trim().length < 2) {
    throw new Error("Ism kamida 2 harfdan iborat bo'lishi kerak");
  }

  const updateData: any = { fullName: fullName.trim() };

  if (newPassword) {
    if (newPassword.length < 4) {
      throw new Error("Parol kamida 4 belgidan iborat bo'lishi kerak");
    }
    if (newPassword !== confirmPassword) {
      throw new Error("Parollar mos kelmadi");
    }
    updateData.password = await hashPassword(newPassword);
    updateData.plainPassword = newPassword;
  }

  await prisma.user.update({
    where: { id: session.userId },
    data: updateData,
  });

  revalidatePath("/dashboard/profile");
}

export async function getTeachers() {
  const session = await getSession();
  if (!session || session.role !== "admin") return [];

  const teachers = await prisma.user.findMany({
    where: { role: "teacher" },
    select: {
      id: true,
      fullName: true,
      login: true,
      plainPassword: true,
      avatar: true,
      school: { select: { name: true } },
    },
    orderBy: { fullName: "asc" },
  });
  return teachers;
}

export async function uploadAvatar(formData: FormData) {
  const session = await getSession();
  if (!session) throw new Error("Not authenticated");

  const userId = formData.get("userId") as string;
  if (!userId) throw new Error("userId required");

  const targetId = userId === "me" ? session.userId : userId;

  if (userId !== "me" && session.role !== "admin") {
    throw new Error("Only admin can change others' avatars");
  }

  const file = formData.get("avatar") as File;
  if (!file) throw new Error("No file provided");

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const base64 = buffer.toString("base64");
  const dataUrl = `data:${file.type};base64,${base64}`;

  await prisma.user.update({
    where: { id: targetId },
    data: { avatar: dataUrl },
  });

  revalidatePath("/dashboard/profile");
  return dataUrl;
}

export async function deleteAvatar(formData: FormData) {
  const session = await getSession();
  if (!session) throw new Error("Not authenticated");

  const userId = formData.get("userId") as string;
  const targetId = userId === "me" ? session.userId : userId;

  if (userId !== "me" && session.role !== "admin") {
    throw new Error("Only admin can delete others' avatars");
  }

  await prisma.user.update({
    where: { id: targetId },
    data: { avatar: null },
  });

  revalidatePath("/dashboard/profile");
}

export async function createTeacher(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== "admin") throw new Error("Not authorized");

  const fullName = formData.get("fullName") as string;
  const login = formData.get("login") as string;
  const password = formData.get("password") as string;
  const schoolId = formData.get("schoolId") as string;

  if (!fullName || !login || !password || !schoolId) {
    throw new Error("Barcha maydonlarni to'ldiring");
  }

  const existing = await prisma.user.findUnique({ where: { login } });
  if (existing) throw new Error("Bu login band");

  const hashed = await hashPassword(password);

  await prisma.user.create({
    data: {
      fullName,
      login,
      password: hashed,
      plainPassword: password,
      role: "teacher",
      schoolId,
    },
  });

  revalidatePath("/dashboard/profile");
}

export async function resetTeacherPassword(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== "admin") throw new Error("Not authorized");

  const userId = formData.get("userId") as string;
  const newPassword = formData.get("newPassword") as string;

  if (!userId || !newPassword || newPassword.length < 4) {
    throw new Error("Parol kamida 4 belgidan iborat bo'lishi kerak");
  }

  const hashed = await hashPassword(newPassword);

  await prisma.user.update({
    where: { id: userId },
    data: { password: hashed, plainPassword: newPassword },
  });

  revalidatePath("/dashboard/profile");
}
