"use server";

import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function getDirectorStats() {
  const session = await getSession();
  if (!session || !session.schoolId) {
    return { teachers: 0, students: 0, classes: 0, subjects: 0, bsbCount: 0, chsbCount: 0, annualCount: 0 };
  }

  const schoolId = session.schoolId;

  const [teachers, students, classes, subjects, bsbCount, chsbCount, annualCount] = await Promise.all([
    prisma.user.count({ where: { schoolId, role: "teacher" } }),
    prisma.student.count({ where: { class: { schoolId } } }),
    prisma.schoolClass.count({ where: { schoolId } }),
    prisma.schoolSubject.count({ where: { schoolId } }),
    prisma.report.count({ where: { type: "BSB", user: { schoolId } } }),
    prisma.report.count({ where: { type: "CHSB", user: { schoolId } } }),
    prisma.annualReportData.count({ where: { user: { schoolId } } }),
  ]);

  return { teachers, students, classes, subjects, bsbCount, chsbCount, annualCount };
}

export async function getSchoolReports(filters: {
  type?: string;
  teacherId?: string;
  classLevel?: string;
  subject?: string;
  quarter?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}) {
  const session = await getSession();
  if (!session || !session.schoolId) {
    return { data: [], total: 0, teachers: [], classes: [], subjects: [] };
  }

  const schoolId = session.schoolId;
  const page = filters.page || 1;
  const pageSize = filters.pageSize || 50;

  const where: any = { user: { schoolId } };

  if (filters.type) {
    where.type = filters.type;
  }
  if (filters.teacherId) {
    where.userId = filters.teacherId;
  }
  if (filters.dateFrom || filters.dateTo) {
    where.createdAt = {};
    if (filters.dateFrom) where.createdAt.gte = new Date(filters.dateFrom);
    if (filters.dateTo) where.createdAt.lte = new Date(filters.dateTo + "T23:59:59.999Z");
  }

  const [data, total, teachers, classes, subjects] = await Promise.all([
    prisma.report.findMany({
      where,
      include: { user: { select: { id: true, fullName: true, login: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.report.count({ where }),
    prisma.user.findMany({
      where: { schoolId, role: "teacher" },
      select: { id: true, fullName: true },
      orderBy: { fullName: "asc" },
    }),
    prisma.schoolClass.findMany({
      where: { schoolId },
      select: { name: true },
      orderBy: { name: "asc" },
    }),
    prisma.schoolSubject.findMany({
      where: { schoolId },
      select: { name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const parsed = data.map((r) => {
    let parsedData: any = null;
    try { parsedData = JSON.parse(r.data); } catch {}
    return {
      id: r.id,
      type: r.type,
      title: r.title,
      createdAt: r.createdAt.toISOString(),
      teacherName: r.user.fullName,
      teacherId: r.user.id,
      config: parsedData?.config || null,
    };
  });

  let result = parsed;
  if (filters.classLevel) {
    result = result.filter((r) => r.config?.classLevel === filters.classLevel);
  }
  if (filters.subject) {
    result = result.filter((r) => r.config?.subject === filters.subject);
  }
  if (filters.quarter) {
    result = result.filter((r) => r.config?.quarter === filters.quarter);
  }

  return { data: result, total: result.length, teachers, classes: classes.map(c => c.name), subjects: subjects.map(s => s.name) };
}

export async function getSchoolAnnualReports(filters: {
  teacherId?: string;
  subject?: string;
  year?: string;
}) {
  const session = await getSession();
  if (!session || !session.schoolId) {
    return { data: [], total: 0, teachers: [], subjects: [], years: [] };
  }

  const schoolId = session.schoolId;
  const where: any = { user: { schoolId } };
  if (filters.teacherId) where.userId = filters.teacherId;
  if (filters.subject) where.subject = filters.subject;
  if (filters.year) where.year = filters.year;

  const [data, teachers, subjects] = await Promise.all([
    prisma.annualReportData.findMany({
      where,
      include: { user: { select: { id: true, fullName: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findMany({
      where: { schoolId, role: "teacher" },
      select: { id: true, fullName: true },
      orderBy: { fullName: "asc" },
    }),
    prisma.annualReportData.findMany({
      where: { user: { schoolId } },
      select: { subject: true },
      distinct: ["subject"],
      orderBy: { subject: "asc" },
    }),
  ]);

  const years = [...new Set(data.map(r => r.year).filter(Boolean))].sort();
  const parsed = data.map(r => ({
    id: r.id,
    title: r.title,
    subject: r.subject,
    year: r.year,
    teacherName: r.user.fullName,
    teacherId: r.user.id,
    createdAt: r.createdAt.toISOString(),
  }));

  return { data: parsed, total: parsed.length, teachers, subjects: subjects.map(s => s.subject), years };
}
