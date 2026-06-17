import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const schools = await prisma.school.findMany({ orderBy: { schoolNumber: "asc" } });
  return NextResponse.json(schools);
}
