import { prisma } from "@/lib/db";
import { comparePassword } from "@/lib/auth";

export async function GET() {
  try {
    const user = await prisma.user.findUnique({ where: { login: "admin" } });
    if (!user) return Response.json({ error: "admin not found" });

    const valid = await comparePassword("admin123", user.password);
    const validWrong = await comparePassword("wrong", user.password);

    return Response.json({
      exists: true,
      passwordValid: valid,
      wrongPasswordValid: validWrong,
      hash: user.password.slice(0, 20) + "...",
    });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
