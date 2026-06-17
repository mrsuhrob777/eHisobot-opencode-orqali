"use server";

import { prisma } from "@/lib/db";
import { comparePassword, createSession, logout as destroySession } from "@/lib/auth";
import { LoginSchema } from "@/lib/definitions";
import { redirect } from "next/navigation";

export async function login(prevState: unknown, formData: FormData) {
  const validated = LoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!validated.success) return { errors: validated.error.flatten().fieldErrors };

  const { email, password } = validated.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    const valid = await comparePassword(password, user.password);
    if (valid) {
      await createSession(user.id, user.email, user.role);
      redirect("/dashboard");
    }
  }

  const teacher = await prisma.teacher.findUnique({ where: { username: email } });
  if (teacher) {
    const valid = await comparePassword(password, teacher.password);
    if (valid) {
      await createSession(teacher.id, teacher.username, "teacher");
      redirect("/teacher");
    }
  }

  return { message: "Invalid email or password" };
}

export async function logout() {
  await destroySession();
}
