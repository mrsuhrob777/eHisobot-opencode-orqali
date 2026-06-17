import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const teachers = await prisma.teacher.findMany({
    where: { schoolId: id },
    orderBy: { createdAt: "desc" },
    select: { id: true, fullName: true, username: true, phone: true, status: true, createdAt: true },
  });
  return NextResponse.json(teachers);
}
