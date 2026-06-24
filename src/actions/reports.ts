"use server";

import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { validate, reportSchema } from "@/lib/validation";
import { logger } from "@/lib/logger";

export async function saveReport(type: string, title: string, data: string) {
  const session = await getSession();
  if (!session) throw new Error("Not authenticated");
  if (session.role !== "teacher") throw new Error("Only teachers can save reports");

  const validation = validate(reportSchema, { type, title, data });
  if (validation.error) {
    logger.warn("saveReport validation failed", { userId: session.userId, error: validation.error });
    throw new Error(validation.error);
  }

  const report = await prisma.report.create({
    data: { userId: session.userId, type, title, data },
  });

  logger.info("report saved", { reportId: report.id, userId: session.userId, type, title });

  const parsed = JSON.parse(data);
  const className = parsed.config?.classLevel;
  const subject = parsed.config?.subject;
  if (className && subject) {
    await prisma.annualReportClass.upsert({
      where: { userId_className_subject: { userId: session.userId, className, subject } },
      update: {},
      create: { userId: session.userId, className, subject },
    });
  }

  revalidatePath("/teacher/reports");
  revalidatePath("/teacher");
  revalidatePath("/teacher/annual-report");
  return { id: report.id };
}

export async function updateReport(id: string, type: string, title: string, data: string) {
  const session = await getSession();
  if (!session) throw new Error("Not authenticated");

  const report = await prisma.report.findUnique({ where: { id } });
  if (!report || report.userId !== session.userId) throw new Error("Not found");

  await prisma.report.update({
    where: { id },
    data: { type, title, data },
  });

  logger.info("report updated", { reportId: id, userId: session.userId, type, title });

  const parsed = JSON.parse(data);
  const className = parsed.config?.classLevel;
  const subject = parsed.config?.subject;
  if (className && subject) {
    await prisma.annualReportClass.upsert({
      where: { userId_className_subject: { userId: session.userId, className, subject } },
      update: {},
      create: { userId: session.userId, className, subject },
    });
  }

  revalidatePath("/teacher/reports");
  revalidatePath("/teacher");
  revalidatePath("/teacher/annual-report");
}

export async function getReports(page = 1, pageSize = 50) {
  const session = await getSession();
  if (!session) return { data: [], total: 0 };

  const [data, total] = await Promise.all([
    prisma.report.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.report.count({ where: { userId: session.userId } }),
  ]);

  return { data, total };
}

export async function getReportById(id: string) {
  const session = await getSession();
  if (!session) return null;

  const report = await prisma.report.findUnique({ where: { id } });
  if (!report || report.userId !== session.userId) return null;
  return report;
}

export async function deleteReport(id: string) {
  const session = await getSession();
  if (!session) throw new Error("Not authenticated");

  const report = await prisma.report.findUnique({ where: { id } });
  if (!report || report.userId !== session.userId) throw new Error("Not found");

  await prisma.report.delete({ where: { id } });

  logger.info("report deleted", { reportId: id, userId: session.userId });
  revalidatePath("/teacher/reports");
  revalidatePath("/teacher");
  revalidatePath("/teacher/annual-report");
}

export async function getReportCount() {
  const session = await getSession();
  if (!session) return 0;
  return prisma.report.count({ where: { userId: session.userId } });
}

function parseQuarter(q: string): number {
  if (q.includes("1")) return 1;
  if (q.includes("2")) return 2;
  if (q.includes("3")) return 3;
  if (q.includes("4")) return 4;
  return 1;
}

export interface AnnualReportData {
  classLevel: string;
  quarter: number;
  bsbReports: { index: number; avgBall: number; avgFoiz: number }[];
  chsbReport: { avgBall: number; avgFoiz: number } | null;
}

export interface AnnualReportMeta {
  maxScores: Record<string, string>;
  chsbMaxScores: Record<string, string>;
}

export interface AnnualReportDataBySubject {
  school: { id: string; name: string; district: string } | null;
  classes: { name: string; studentCount: number }[];
  subjects: { id: string; name: string }[];
  data: AnnualReportData[];
  meta: AnnualReportMeta;
}

export async function getAnnualReportDataBySubject(subject: string): Promise<AnnualReportDataBySubject> {
  const session = await getSession();
  if (!session) return { school: null, classes: [], subjects: [], data: [], meta: { maxScores: {}, chsbMaxScores: {} } };

  const school = session.schoolId
    ? await prisma.school.findUnique({
        where: { id: session.schoolId },
        select: { id: true, name: true, district: true },
      })
    : null;

  const [rawSubjects, rawClasses, rawAnnualClasses] = await Promise.all([
    prisma.teacherSubject.findMany({
      where: { userId: session.userId },
      include: { subject: { select: { id: true, name: true } } },
    }),
    prisma.teacherClass.findMany({
      where: { userId: session.userId },
      include: { class: { include: { _count: { select: { students: true } } } } },
    }),
    prisma.annualReportClass.findMany({
      where: { userId: session.userId, subject },
      select: { className: true },
    }),
  ]);

  const subjects = rawSubjects.map((ts) => ts.subject);

  const classNames = new Set<string>();
  for (const tc of rawClasses) {
    classNames.add(tc.class.name);
  }
  for (const ac of rawAnnualClasses) {
    classNames.add(ac.className);
  }

  const schoolClasses = session.schoolId
    ? await prisma.schoolClass.findMany({
        where: { schoolId: session.schoolId, name: { in: Array.from(classNames) } },
        select: { name: true, _count: { select: { students: true } } },
      })
    : [];

  const studentCountByClassName = new Map(schoolClasses.map((sc) => [sc.name, sc._count.students]));

  const classMap = new Map<string, number>();
  for (const tc of rawClasses) {
    classMap.set(tc.class.name, tc.class._count.students);
  }
  for (const ac of rawAnnualClasses) {
    if (!classMap.has(ac.className)) {
      classMap.set(ac.className, studentCountByClassName.get(ac.className) ?? 0);
    }
  }

  const classes = Array.from(classMap.entries()).map(([name, studentCount]) => ({
    name,
    studentCount,
  }));

  const reports = await prisma.report.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "asc" },
  });

  const filtered = reports.filter((r) => {
    try {
      const d = JSON.parse(r.data);
      return d.config?.subject === subject;
    } catch {
      return false;
    }
  });

  const grouped: Record<string, Record<number, { bsbs: Record<number, { ballSum: number; foizSum: number; count: number }>; chsb: { ballSum: number; foizSum: number; count: number } | null }>> = {};
  const maxScoresByQ: Record<number, Record<number, number>> = {};

  for (const report of filtered) {
    try {
      const data = JSON.parse(report.data);
      const config = data.config;
      if (!config || !config.classLevel || !config.quarter) continue;

      const cls = config.classLevel;
      const q = parseQuarter(config.quarter);
      const isBsb = report.type === "BSB";
      const reportNum = parseInt(config.reportNumber) || 1;

      if (!grouped[cls]) grouped[cls] = {};
      if (!grouped[cls][q]) grouped[cls][q] = { bsbs: {}, chsb: null };

      const students = data.students || [];
      if (students.length === 0) continue;

      let ballSum = 0;
      let scoreCount = 0;
      for (const s of students) {
        const scores = s.scores || [];
        for (const sc of scores) {
          ballSum += Number(sc) || 0;
          scoreCount++;
        }
      }
      const avgBall = scoreCount > 0 ? ballSum / students.length : 0;

      const maxScores = data.maxScores || [];
      const maxTotal = maxScores.reduce((a: number, b: number) => a + (Number(b) || 0), 0);
      const avgFoiz = maxTotal > 0 ? (avgBall / maxTotal) * 100 : 0;

      if (isBsb) {
        if (!grouped[cls][q].bsbs[reportNum]) {
          grouped[cls][q].bsbs[reportNum] = { ballSum: 0, foizSum: 0, count: 0 };
        }
        grouped[cls][q].bsbs[reportNum].ballSum += avgBall;
        grouped[cls][q].bsbs[reportNum].foizSum += avgFoiz;
        grouped[cls][q].bsbs[reportNum].count++;

        if (maxTotal > 0) {
          if (!maxScoresByQ[q]) maxScoresByQ[q] = {};
          if (!maxScoresByQ[q][reportNum]) maxScoresByQ[q][reportNum] = maxTotal;
        }
      } else {
        if (!grouped[cls][q].chsb) {
          grouped[cls][q].chsb = { ballSum: 0, foizSum: 0, count: 0 };
        }
        grouped[cls][q].chsb.ballSum += avgBall;
        grouped[cls][q].chsb.foizSum += avgFoiz;
        grouped[cls][q].chsb.count++;
      }
    } catch {
      continue;
    }
  }

  const chsbMaxScores: Record<string, string> = {};
  for (const report of filtered) {
    try {
      const data = JSON.parse(report.data);
      const config = data.config;
      if (!config || !config.quarter) continue;

      const q = parseQuarter(config.quarter);
      const isChsb = report.type !== "BSB";
      if (!isChsb) continue;

      const maxScores = data.maxScores || [];
      const maxTotal = maxScores.reduce((a: number, b: number) => a + (Number(b) || 0), 0);
      const key = String(q);
      if (maxTotal > 0 && !chsbMaxScores[key]) {
        chsbMaxScores[key] = String(maxTotal);
      }
    } catch {
      continue;
    }
  }

  const result: AnnualReportData[] = [];

  for (const cls of Object.keys(grouped)) {
    for (const q of Object.keys(grouped[cls]).map(Number)) {
      const entry = grouped[cls][q];
      const sortedKeys = Object.keys(entry.bsbs).sort((a, b) => Number(a) - Number(b));
      const bsbReports = sortedKeys.map((idx, pos) => {
        const b = entry.bsbs[Number(idx)];
        return { index: pos + 1, avgBall: b.ballSum / b.count, avgFoiz: b.foizSum / b.count };
      });
      const chsbReport = entry.chsb ? { avgBall: entry.chsb.ballSum / entry.chsb.count, avgFoiz: entry.chsb.foizSum / entry.chsb.count } : null;
      result.push({ classLevel: cls, quarter: q, bsbReports, chsbReport });
    }
  }

  const meta: AnnualReportMeta = { maxScores: {}, chsbMaxScores };
  for (const qStr of Object.keys(maxScoresByQ)) {
    const q = Number(qStr);
    const sortedNums = Object.keys(maxScoresByQ[q]).map(Number).sort((a, b) => a - b);
    sortedNums.forEach((_reportNum, pos) => {
      meta.maxScores[`${q}_${pos + 1}`] = String(maxScoresByQ[q][_reportNum]);
    });
  }

  return { school, classes, subjects, data: result, meta };
}

export async function getAnnualReportData(): Promise<{ data: AnnualReportData[]; meta: AnnualReportMeta }> {
  const session = await getSession();
  if (!session) return { data: [], meta: { maxScores: {}, chsbMaxScores: {} } };

  const reports = await prisma.report.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "asc" },
  });

  const grouped: Record<string, Record<number, { bsbs: Record<number, { ballSum: number; foizSum: number; count: number }>; chsb: { ballSum: number; foizSum: number; count: number } | null }>> = {};

  for (const report of reports) {
    try {
      const data = JSON.parse(report.data);
      const config = data.config;
      if (!config || !config.classLevel || !config.quarter) continue;

      const cls = config.classLevel;
      const q = parseQuarter(config.quarter);
      const isBsb = report.type === "BSB";
      const reportNum = parseInt(config.reportNumber) || 1;

      if (!grouped[cls]) grouped[cls] = {};
      if (!grouped[cls][q]) grouped[cls][q] = { bsbs: {}, chsb: null };

      const students = data.students || [];
      if (students.length === 0) continue;

      let ballSum = 0;
      let scoreCount = 0;
      for (const s of students) {
        const scores = s.scores || [];
        for (const sc of scores) {
          ballSum += Number(sc) || 0;
          scoreCount++;
        }
      }
      const avgBall = scoreCount > 0 ? ballSum / students.length : 0;

      const maxScores = data.maxScores || [];
      const maxTotal = maxScores.reduce((a: number, b: number) => a + (Number(b) || 0), 0);
      const avgFoiz = maxTotal > 0 ? (avgBall / maxTotal) * 100 : 0;

      if (isBsb) {
        if (!grouped[cls][q].bsbs[reportNum]) {
          grouped[cls][q].bsbs[reportNum] = { ballSum: 0, foizSum: 0, count: 0 };
        }
        grouped[cls][q].bsbs[reportNum].ballSum += avgBall;
        grouped[cls][q].bsbs[reportNum].foizSum += avgFoiz;
        grouped[cls][q].bsbs[reportNum].count++;
      } else {
        if (!grouped[cls][q].chsb) {
          grouped[cls][q].chsb = { ballSum: 0, foizSum: 0, count: 0 };
        }
        grouped[cls][q].chsb.ballSum += avgBall;
        grouped[cls][q].chsb.foizSum += avgFoiz;
        grouped[cls][q].chsb.count++;
      }
    } catch (e) {
      continue;
    }
  }

  const result: AnnualReportData[] = [];
  const meta: AnnualReportMeta = { maxScores: {}, chsbMaxScores: {} };

  for (const cls of Object.keys(grouped)) {
    for (const q of Object.keys(grouped[cls]).map(Number)) {
      const entry = grouped[cls][q];
      const bsbReports = Object.keys(entry.bsbs).sort((a, b) => Number(a) - Number(b)).map((idx) => {
        const b = entry.bsbs[Number(idx)];
        return { index: Number(idx), avgBall: b.ballSum / b.count, avgFoiz: b.foizSum / b.count };
      });
      const chsbReport = entry.chsb ? { avgBall: entry.chsb.ballSum / entry.chsb.count, avgFoiz: entry.chsb.foizSum / entry.chsb.count } : null;
      result.push({ classLevel: cls, quarter: q, bsbReports, chsbReport });
    }
  }

  // Collect max scores from reports for each quarter's BSB/CHSB
  for (const report of reports) {
    try {
      const data = JSON.parse(report.data);
      const config = data.config;
      if (!config || !config.quarter) continue;

      const q = parseQuarter(config.quarter);
      const isBsb = report.type === "BSB";
      const reportNum = parseInt(config.reportNumber) || 1;
      const maxScores = data.maxScores || [];
      const maxTotal = maxScores.reduce((a: number, b: number) => a + (Number(b) || 0), 0);

      if (isBsb) {
        const key = `${q}_${reportNum}`;
        if (maxTotal > 0 && !meta.maxScores[key]) {
          meta.maxScores[key] = String(maxTotal);
        }
      } else {
        const key = String(q);
        if (maxTotal > 0 && !meta.chsbMaxScores[key]) {
          meta.chsbMaxScores[key] = String(maxTotal);
        }
      }
    } catch (e) {
      continue;
    }
  }

  return { data: result, meta };
}

export async function saveAnnualReport(subject: string, title: string, year: string, teacherName: string, data: string, reportId?: string) {
  const session = await getSession();
  if (!session) throw new Error("Not authenticated");
  if (session.role !== "teacher") throw new Error("Only teachers can save reports");

  let report;
  if (reportId) {
    const existing = await prisma.annualReportData.findUnique({ where: { id: reportId } });
    if (!existing || existing.userId !== session.userId) throw new Error("Not found");
    report = await prisma.annualReportData.update({
      where: { id: reportId },
      data: { subject, title, year, teacherName, data },
    });
    logger.info("annual report updated", { reportId: report.id, userId: session.userId, subject, title });
  } else {
    report = await prisma.annualReportData.create({
      data: { userId: session.userId, subject, title, year, teacherName, data },
    });
    logger.info("annual report saved", { reportId: report.id, userId: session.userId, subject, title });
  }

  revalidatePath("/teacher/reports");
  revalidatePath("/teacher");
  revalidatePath("/teacher/annual-report");
  return { id: report.id };
}

export async function getAnnualReportList() {
  const session = await getSession();
  if (!session) return [];
  return prisma.annualReportData.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getAnnualReportById(id: string) {
  const session = await getSession();
  if (!session) return null;

  const report = await prisma.annualReportData.findUnique({ where: { id } });
  if (!report || report.userId !== session.userId) return null;
  return report;
}

export async function deleteAnnualReport(id: string) {
  const session = await getSession();
  if (!session) throw new Error("Not authenticated");

  const report = await prisma.annualReportData.findUnique({ where: { id } });
  if (!report || report.userId !== session.userId) throw new Error("Not found");

  await prisma.annualReportData.delete({ where: { id } });

  logger.info("annual report deleted", { reportId: id, userId: session.userId });
  revalidatePath("/teacher/reports");
  revalidatePath("/teacher");
}
