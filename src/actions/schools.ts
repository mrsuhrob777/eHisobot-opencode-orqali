"use server";

import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getSchools() {
  return prisma.school.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { users: true } } } });
}

export async function getSchool(id: string) {
  return prisma.school.findUnique({
    where: { id },
    include: { users: { orderBy: { createdAt: "desc" } } },
  });
}

export async function createSchool(formData: FormData) {
  await prisma.school.create({
    data: { name: formData.get("name") as string, address: formData.get("address") as string || undefined },
  });
  revalidatePath("/dashboard/schools");
}

export async function deleteSchool(id: string) {
  await prisma.user.deleteMany({ where: { schoolId: id } });
  await prisma.school.delete({ where: { id } });
  revalidatePath("/dashboard/schools");
}
