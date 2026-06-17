"use server";

import { prisma } from "@/lib/db";

export async function getDashboardStats() {
  const [schools, users] = await Promise.all([
    prisma.school.count(),
    prisma.user.count(),
  ]);
  return { schools, users };
}
