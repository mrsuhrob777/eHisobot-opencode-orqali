"use server";

import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getTeachers(schoolId: string) {
  return prisma.teacher.findMany({ where: { schoolId }, orderBy: { createdAt: "desc" } });
}

export async function createTeacher(schoolId: string, formData: FormData) {
  const fullName = formData.get("fullName") as string;
  const username = formData.get("username") as string;
  let password = formData.get("password") as string;
  const phone = formData.get("phone") as string;

  if (!password) password = username + "@2026";

  const hashed = await hashPassword(password);
  await prisma.teacher.create({
    data: { schoolId, fullName, username, password: hashed, phone },
  });
  revalidatePath(`/dashboard/schools/${schoolId}`);
}

export async function updateTeacher(id: string, formData: FormData) {
  const fullName = formData.get("fullName") as string;
  const username = formData.get("username") as string;
  const phone = formData.get("phone") as string;
  const password = formData.get("password") as string;

  const data: any = { fullName, username, phone };
  if (password) data.password = await hashPassword(password);

  const teacher = await prisma.teacher.update({ where: { id }, data });
  revalidatePath(`/dashboard/schools/${teacher.schoolId}`);
}

export async function deleteTeacher(id: string) {
  const teacher = await prisma.teacher.findUnique({ where: { id } });
  if (teacher) {
    await prisma.teacher.delete({ where: { id } });
    revalidatePath(`/dashboard/schools/${teacher.schoolId}`);
  }
}

export async function resetTeacherPassword(id: string) {
  const teacher = await prisma.teacher.findUnique({ where: { id } });
  if (!teacher) return;
  const newPassword = teacher.username + "@2026";
  const hashed = await hashPassword(newPassword);
  await prisma.teacher.update({ where: { id }, data: { password: hashed } });
  revalidatePath(`/dashboard/schools/${teacher.schoolId}`);
  return newPassword;
}
