"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function getSchools() {
  return prisma.school.findMany({ orderBy: { schoolNumber: "asc" } });
}

export async function getSchool(id: string) {
  return prisma.school.findUnique({
    where: { id },
    include: { teachers: { orderBy: { createdAt: "desc" } }, _count: { select: { students: true, classes: true } } },
  });
}

export async function createSchool(formData: FormData) {
  const data = {
    schoolNumber: parseInt(formData.get("schoolNumber") as string),
    schoolName: formData.get("schoolName") as string,
    region: formData.get("region") as string,
    district: formData.get("district") as string,
    phone: formData.get("phone") as string,
    subscriptionStatus: (formData.get("subscriptionStatus") as string) || "active",
  };

  try {
    await prisma.school.create({ data });
    revalidatePath("/dashboard/schools");
    return { success: true };
  } catch (error: any) {
    if (error?.code === "P2002") {
      return { success: false, error: `School #${data.schoolNumber} already exists` };
    }
    return { success: false, error: "Failed to create school" };
  }
}

export async function updateSchool(id: string, formData: FormData) {
  const data = {
    schoolNumber: parseInt(formData.get("schoolNumber") as string),
    schoolName: formData.get("schoolName") as string,
    region: formData.get("region") as string,
    district: formData.get("district") as string,
    phone: formData.get("phone") as string,
    subscriptionStatus: (formData.get("subscriptionStatus") as string) || "active",
  };

  await prisma.school.update({ where: { id }, data });
  revalidatePath("/dashboard/schools");
}

export async function deleteSchool(id: string) {
  await prisma.teacher.deleteMany({ where: { schoolId: id } });
  await prisma.school.delete({ where: { id } });
  revalidatePath("/dashboard/schools");
}

export async function toggleSchoolStatus(id: string, currentStatus: string) {
  const newStatus = currentStatus === "active" ? "inactive" : "active";
  await prisma.school.update({ where: { id }, data: { subscriptionStatus: newStatus } });
  revalidatePath("/dashboard/schools");
}
