import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";
import path from "path";

const dbPath = path.resolve("C:\\Users\\user\\Desktop\\login-app\\dev.db");
const adapter = new PrismaBetterSqlite3({ url: dbPath });
const prisma = new PrismaClient({ adapter });

async function main() {
  const hash = await bcrypt.hash("admin123", 10);

  await prisma.user.upsert({
    where: { email: "admin@ehisobot.uz" },
    update: {},
    create: {
      name: "Super Admin",
      email: "admin@ehisobot.uz",
      password: hash,
      role: "super_admin",
    },
  });

  const schoolsData = [
    { schoolNumber: 37, schoolName: "School #37", region: "Tashkent", district: "Mirzo Ulugbek", phone: "+998901234567" },
    { schoolNumber: 38, schoolName: "School #38", region: "Tashkent", district: "Yunusabad", phone: "+998902345678" },
    { schoolNumber: 23, schoolName: "School #23", region: "Samarkand", district: "Center", phone: "+998903456789" },
    { schoolNumber: 24, schoolName: "School #24", region: "Samarkand", district: "Sogdiana", phone: "+998904567890" },
    { schoolNumber: 36, schoolName: "School #36", region: "Bukhara", district: "Old City", phone: "+998905678901" },
    { schoolNumber: 1, schoolName: "School #1", region: "Fergana", district: "Center", phone: "+998906789012" },
  ];

  for (const s of schoolsData) {
    const school = await prisma.school.upsert({
      where: { schoolNumber: s.schoolNumber },
      update: {},
      create: s,
    });

    for (let i = 1; i <= 3; i++) {
      const tid = String(school.schoolNumber).padStart(2, "0");
      const tnum = String(i).padStart(3, "0");
      const username = `teacher_${tid}_${tnum}`;
      const tHash = await bcrypt.hash(`T${s.schoolNumber}@2026#${i}`, 10);

      await prisma.teacher.upsert({
        where: { username },
        update: {},
        create: {
          schoolId: school.id,
          fullName: `Teacher ${s.schoolNumber}.${i}`,
          username,
          password: tHash,
          phone: `+99890${String(s.schoolNumber).padStart(7, "0")}`,
        },
      });
    }
  }

  console.log("✅ Seed: 1 Super Admin + 6 schools + 18 teachers created");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
