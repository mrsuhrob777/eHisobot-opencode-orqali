import { prisma } from "@/lib/db";

export async function GET() {
  const userCount = await prisma.user.count();
  const schoolCount = await prisma.school.count();
  return Response.json({ users: userCount, schools: schoolCount });
}
