import { prisma } from "@/lib/db";
import { comparePassword, signToken } from "@/lib/auth";

export async function GET() {
  try {
    const user = await prisma.user.findUnique({ where: { login: "admin" } });
    if (!user) return Response.json({ error: "admin not found" }, { status: 404 });

    const valid = await comparePassword("admin123", user.password);
    if (!valid) return Response.json({ error: "password mismatch" }, { status: 401 });

    const token = signToken({ userId: user.id, login: user.login, role: user.role, schoolId: user.schoolId });

    return Response.json({
      ok: true,
      role: user.role,
      login: user.login,
      token: token.substring(0, 20) + "...",
    });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
