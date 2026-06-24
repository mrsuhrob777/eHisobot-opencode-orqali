"use server";

import { prisma } from "@/lib/db";
import { comparePassword, createSession, logout as destroySession, getSession } from "@/lib/auth";
import { LoginSchema } from "@/lib/definitions";
import { redirect } from "next/navigation";

export async function login(prevState: unknown, formData: FormData) {
  const validated = LoginSchema.safeParse({
    login: formData.get("login"),
    password: formData.get("password"),
  });
  if (!validated.success) return { errors: validated.error.flatten().fieldErrors };

  const { login: inputLogin, password } = validated.data;
  const user = await prisma.user.findUnique({ where: { login: inputLogin } });
  if (!user) return { message: "Invalid login or password" };

  const valid = await comparePassword(password, user.password);
  if (!valid) return { message: "Invalid login or password" };

  await createSession(user.id, user.login, user.role, user.schoolId);

  const dashboards: Record<string, string> = {
    admin: "/dashboard",
    teacher: "/teacher",
    director: "/director",
    deputy_director: "/deputy-director",
  };
  redirect(dashboards[user.role] || "/login");
}

export async function logout() {
  await destroySession();
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, fullName: true, login: true, role: true, schoolId: true, avatar: true },
  });
  return user;
}
