"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function getDashboardStats() {
  const [schools, teachers, students] = await Promise.all([
    prisma.school.count(),
    prisma.teacher.count(),
    prisma.student.count(),
  ]);
  return { schools, teachers, students };
}
