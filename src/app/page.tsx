import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function Home() {
  const session = await getSession();
  if (!session) redirect("/login");
  const dashboards: Record<string, string> = {
    admin: "/dashboard", teacher: "/teacher", director: "/director", deputy_director: "/deputy-director",
  };
  redirect(dashboards[session.role] || "/login");
}
