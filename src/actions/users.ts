"use server";

import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getUsersBySchool(schoolId: string) {
  return prisma.user.findMany({ where: { schoolId }, orderBy: { createdAt: "desc" } });
}

export async function createSchoolUser(schoolId: string, formData: FormData) {
  const fullName = formData.get("fullName") as string;
  const login = formData.get("login") as string;
  const password = formData.get("password") as string;
  const role = formData.get("role") as string;

  const hashed = await hashPassword(password);
  await prisma.user.create({ data: { fullName, login, password: hashed, role, schoolId } });
  revalidatePath(`/dashboard/schools/${schoolId}`);
}

export async function deleteUser(id: string) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (user) {
    await prisma.user.delete({ where: { id } });
    revalidatePath(`/dashboard/schools/${user.schoolId}`);
  }
}
