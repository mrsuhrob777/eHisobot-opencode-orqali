import pkg from "@prisma/client";
const { PrismaClient } = pkg;
const p = new PrismaClient();
const subjects = await p.schoolSubject.findMany();
console.log(JSON.stringify(subjects));
await p.$disconnect();
