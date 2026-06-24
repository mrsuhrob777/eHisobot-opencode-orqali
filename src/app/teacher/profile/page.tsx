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

  return <ProfileDisplay profile={user} />;
}
