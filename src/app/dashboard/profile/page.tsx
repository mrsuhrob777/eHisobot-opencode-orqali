import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import ProfileDisplay from "@/components/profile-display";

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      fullName: true,
      login: true,
      role: true,
      avatar: true,
      school: { select: { name: true } },
    },
  });

  if (!user) redirect("/login");

  let teachers: any[] = [];
  let schools: any[] = [];

  if (user.role === "admin") {
    teachers = await prisma.user.findMany({
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

    schools = await prisma.school.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
  }

  return <ProfileDisplay profile={user} teachers={teachers} schools={schools} />;
}
