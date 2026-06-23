import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";
import path from "path";

const dbPath = path.resolve("C:\\Users\\user\\Desktop\\login-app\\dev.db");
const adapter = new PrismaBetterSqlite3({ url: dbPath });
const prisma = new PrismaClient({ adapter });

async function main() {
  const adminHash = await bcrypt.hash("admin123", 10);
  const userHash = await bcrypt.hash("123456", 10);
  const dilraboHash = await bcrypt.hash("dilrabo", 10);

  await prisma.user.upsert({
    where: { login: "admin" },
    update: {},
    create: { fullName: "System Admin", login: "admin", password: adminHash, role: "admin" },
  });

  const school = await prisma.school.upsert({
    where: { id: "demo-school-1" },
    update: {},
    create: { id: "demo-school-1", name: "School #37", address: "Tashkent, Mirzo Ulugbek" },
  });

  const users = [
    { login: "dilrabo", fullName: "Dilrabo", role: "teacher", password: dilraboHash },
    { login: "director37", fullName: "Aliyev B.", role: "director", password: userHash },
    { login: "deputy37", fullName: "Rustamov C.", role: "deputy_director", password: userHash },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { login: u.login },
      update: {},
      create: { login: u.login, fullName: u.fullName, password: u.password, role: u.role, schoolId: school.id },
    });
  }

  for (const u of users) {
    await prisma.user.upsert({
      where: { login: u.login },
      update: {},
      create: { ...u, password: userHash, schoolId: school.id },
    });
  }

  // Second school
  const school2 = await prisma.school.upsert({
    where: { id: "demo-school-2" },
    update: {},
    create: { id: "demo-school-2", name: "School #23", address: "Samarkand, Center" },
  });

  await prisma.user.upsert({
    where: { login: "teacher23" },
    update: {},
    create: { login: "teacher23", fullName: "Boboyev D.", password: userHash, role: "teacher", schoolId: school2.id },
  });

  console.log("✅ Seed: 1 admin + 2 schools + 5 users created");
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
