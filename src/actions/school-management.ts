"use server";

import { prisma } from "@/lib/db";

export async function getSchoolClasses(schoolId: string) {
  try {
    const classes = await prisma.schoolClass.findMany({
      where: { schoolId },
      include: {
        _count: {
          select: { groups: true, students: true },
        },
      },
    });
    return { data: classes };
  } catch (error) {
    return { error: "Failed to fetch school classes" };
  }
}

export async function createSchoolClass(schoolId: string, name: string) {
  try {
    const schoolClass = await prisma.schoolClass.create({
      data: { schoolId, name },
    });
    return { data: schoolClass };
  } catch (error) {
    return { error: "Failed to create school class" };
  }
}

export async function deleteSchoolClass(id: string) {
  try {
    await prisma.schoolClass.delete({ where: { id } });
    return { data: { success: true } };
  } catch (error) {
    return { error: "Failed to delete school class" };
  }
}

export async function getSchoolSubjects(schoolId: string) {
  try {
    const subjects = await prisma.schoolSubject.findMany({
      where: { schoolId },
    });
    return { data: subjects };
  } catch (error) {
    return { error: "Failed to fetch school subjects" };
  }
}

export async function createSchoolSubject(schoolId: string, name: string) {
  try {
    const subject = await prisma.schoolSubject.create({
      data: { schoolId, name },
    });
    return { data: subject };
  } catch (error) {
    return { error: "Failed to create school subject" };
  }
}

export async function deleteSchoolSubject(id: string) {
  try {
    await prisma.schoolSubject.delete({ where: { id } });
    return { data: { success: true } };
  } catch (error) {
    return { error: "Failed to delete school subject" };
  }
}

export async function getClassGroups(classId: string) {
  try {
    const groups = await prisma.schoolGroup.findMany({
      where: { classId },
      include: {
        _count: { select: { students: true } },
      },
    });
    return { data: groups };
  } catch (error) {
    return { error: "Failed to fetch class groups" };
  }
}

export async function createSchoolGroup(classId: string, name: string) {
  try {
    const group = await prisma.schoolGroup.create({
      data: { classId, name },
    });
    return { data: group };
  } catch (error) {
    return { error: "Failed to create school group" };
  }
}

export async function deleteSchoolGroup(id: string) {
  try {
    await prisma.schoolGroup.delete({ where: { id } });
    return { data: { success: true } };
  } catch (error) {
    return { error: "Failed to delete school group" };
  }
}

export async function getClassStudents(classId: string, groupId?: string) {
  try {
    const students = await prisma.student.findMany({
      where: { classId, ...(groupId ? { groupId } : {}) },
    });
    return { data: students };
  } catch (error) {
    return { error: "Failed to fetch class students" };
  }
}

export async function getClassStudentsByGender(classId: string, gender: string) {
  try {
    const students = await prisma.student.findMany({
      where: { classId, gender },
    });
    return { data: students };
  } catch (error) {
    return { error: "Failed to fetch class students by gender" };
  }
}

export async function createStudent(
  classId: string,
  name: string,
  groupId?: string,
  gender?: string
) {
  try {
    const student = await prisma.student.create({
      data: { classId, name, gender: gender || "", ...(groupId ? { groupId } : {}) },
    });
    return { data: student };
  } catch (error) {
    return { error: "Failed to create student" };
  }
}

export async function deleteStudent(id: string) {
  try {
    await prisma.student.delete({ where: { id } });
    return { data: { success: true } };
  } catch (error) {
    return { error: "Failed to delete student" };
  }
}

export async function updateStudent(
  id: string,
  name: string,
  groupId?: string,
  gender?: string
) {
  try {
    const student = await prisma.student.update({
      where: { id },
      data: { name, gender: gender || "", ...(groupId !== undefined ? { groupId } : {}) },
    });
    return { data: student };
  } catch (error) {
    return { error: "Failed to update student" };
  }
}

export async function getTeacherClasses(userId: string) {
  try {
    const assignments = await prisma.teacherClass.findMany({
      where: { userId },
      include: { class: true },
    });
    return { data: assignments.map((a) => a.class) };
  } catch (error) {
    return { error: "Failed to fetch teacher classes" };
  }
}

export async function getTeacherSubjects(userId: string) {
  try {
    const assignments = await prisma.teacherSubject.findMany({
      where: { userId },
      include: { subject: true },
    });
    return { data: assignments.map((a) => a.subject) };
  } catch (error) {
    return { error: "Failed to fetch teacher subjects" };
  }
}

export async function getTeacherGroups(userId: string) {
  try {
    const assignments = await prisma.teacherGroup.findMany({
      where: { userId },
      include: { group: true },
    });
    return { data: assignments.map((a) => a.group) };
  } catch (error) {
    return { error: "Failed to fetch teacher groups" };
  }
}

export async function setTeacherClasses(userId: string, classIds: string[]) {
  try {
    await prisma.$transaction([
      prisma.teacherClass.deleteMany({ where: { userId } }),
      ...classIds.map((classId) =>
        prisma.teacherClass.create({ data: { userId, classId } })
      ),
    ]);
    return { data: { success: true } };
  } catch (error) {
    return { error: "Failed to set teacher classes" };
  }
}

export async function setTeacherSubjects(userId: string, subjectIds: string[]) {
  try {
    await prisma.$transaction([
      prisma.teacherSubject.deleteMany({ where: { userId } }),
      ...subjectIds.map((subjectId) =>
        prisma.teacherSubject.create({ data: { userId, subjectId } })
      ),
    ]);
    return { data: { success: true } };
  } catch (error) {
    return { error: "Failed to set teacher subjects" };
  }
}

export async function setTeacherGroups(userId: string, groupIds: string[]) {
  try {
    await prisma.$transaction([
      prisma.teacherGroup.deleteMany({ where: { userId } }),
      ...groupIds.map((groupId) =>
        prisma.teacherGroup.create({ data: { userId, groupId } })
      ),
    ]);
    return { data: { success: true } };
  } catch (error) {
    return { error: "Failed to set teacher groups" };
  }
}

export async function importStudentsBulk(
  classId: string,
  names: string[],
  groupId?: string
) {
  try {
    const result = await prisma.student.createMany({
      data: names.map((name) => ({
        classId,
        name,
        ...(groupId ? { groupId } : {}),
      })),
    });
    return { data: { count: result.count } };
  } catch (error) {
    return { error: "Failed to import students" };
  }
}

export async function importSchoolBulk(schoolId: string, text: string) {
  try {
    const normalized = text.replace(/\r\n/g, "\n");
    const blocks = normalized.split(/\n\s*:\s*\n/).map(b => b.trim()).filter(Boolean);
    let totalStudents = 0;
    let totalClasses = 0;

    for (const block of blocks) {
      const classMatch = block.match(/^(.+?)\s*:\s*([\s\S]+)/);
      if (!classMatch) continue;
      const className = classMatch[1].trim();
      const groupsPart = classMatch[2].trim();

      let cls = await prisma.schoolClass.findFirst({ where: { schoolId, name: className } });
      if (!cls) {
        cls = await prisma.schoolClass.create({ data: { schoolId, name: className } });
        totalClasses++;
      }

      const groupRegex = /([^;(]+)\(([^)]*)\)/g;
      let groupMatch;

      while ((groupMatch = groupRegex.exec(groupsPart)) !== null) {
        let groupName = groupMatch[1].trim();
        const studentsRaw = groupMatch[2].trim();
        if (!groupName) continue;

        let group = await prisma.schoolGroup.findFirst({ where: { classId: cls.id, name: groupName } });
        if (!group) {
          group = await prisma.schoolGroup.create({ data: { classId: cls.id, name: groupName } });
        }

        if (studentsRaw) {
          const names = studentsRaw.split(",").map(n => n.trim()).filter(Boolean);
          if (names.length > 0) {
            await prisma.student.createMany({
              data: names.map(name => ({ classId: cls!.id, groupId: group!.id, name })),
            });
            totalStudents += names.length;
          }
        }
      }
    }

    return { data: { classes: totalClasses, students: totalStudents } };
  } catch (error) {
    return { error: "Failed to import school data" };
  }
}

export async function getTeacherData() {
  try {
    const { getSession } = await import("@/lib/auth");
    const session = await getSession();
    if (!session || !session.schoolId) return { error: "Session not found" };

    const school = await prisma.school.findUnique({
      where: { id: session.schoolId },
      select: { id: true, name: true, address: true, region: true, district: true },
    });
    if (!school) return { error: "School not found" };

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { fullName: true },
    });

    const [classesRes, subjectsRes, groupsRes] = await Promise.all([
      getTeacherClasses(session.userId),
      getTeacherSubjects(session.userId),
      getTeacherGroups(session.userId),
    ]);

    const groups = (groupsRes.data || []) as { id: string; name: string; classId: string }[];
    const studentsByClass: Record<string, Record<string, string[]>> = {};

    if (groups.length > 0) {
      const allClassIds = [...new Set(groups.map(g => g.classId))];
      const allGroupIds = groups.map(g => g.id);

      const [studentsByClassId, studentsByGroupId] = await Promise.all([
        prisma.student.findMany({
          where: { classId: { in: allClassIds } },
          select: { name: true, classId: true, gender: true },
          orderBy: { name: "asc" },
        }),
        prisma.student.findMany({
          where: { groupId: { in: allGroupIds } },
          select: { name: true, groupId: true, gender: true },
          orderBy: { name: "asc" },
        }),
      ]);

      const classStudentMap = new Map<string, { name: string; gender: string }[]>();
      for (const s of studentsByClassId) {
        const arr = classStudentMap.get(s.classId) || [];
        arr.push(s);
        classStudentMap.set(s.classId, arr);
      }

      const groupStudentMap = new Map<string, string[]>();
      for (const s of studentsByGroupId) {
        if (s.groupId) {
          const arr = groupStudentMap.get(s.groupId) || [];
          arr.push(s.name);
          groupStudentMap.set(s.groupId, arr);
        }
      }

      for (const group of groups) {
        const classObj = (classesRes.data || []).find((c: any) => c.id === group.classId);
        const className = classObj?.name || group.classId;
        if (!studentsByClass[className]) studentsByClass[className] = {};

        if (group.name === "O'g'il bolalar") {
          studentsByClass[className][group.name] = (classStudentMap.get(group.classId) || [])
            .filter(s => s.gender === "o'g'il")
            .map(s => s.name);
        } else if (group.name === "Qiz bolalar") {
          studentsByClass[className][group.name] = (classStudentMap.get(group.classId) || [])
            .filter(s => s.gender === "qiz")
            .map(s => s.name);
        } else if (group.name === "Butun sinf") {
          studentsByClass[className][group.name] = (classStudentMap.get(group.classId) || [])
            .map(s => s.name);
        } else {
          studentsByClass[className][group.name] = groupStudentMap.get(group.id) || [];
        }
      }
    }

    return {
      data: {
        school,
        userId: session.userId,
        schoolId: session.schoolId,
        classes: classesRes.data || [],
        subjects: subjectsRes.data || [],
        groups,
        studentsByClass,
        teacherName: user?.fullName || '',
      },
    };
  } catch (error) {
    return { error: "Failed to get teacher data" };
  }
}

export async function deleteAllSchoolClasses(schoolId: string) {
  try {
    const classIds = await prisma.schoolClass.findMany({
      where: { schoolId },
      select: { id: true },
    });
    const ids = classIds.map(c => c.id);
    if (ids.length > 0) {
      await prisma.schoolGroup.deleteMany({ where: { classId: { in: ids } } });
      await prisma.student.deleteMany({ where: { classId: { in: ids } } });
      await prisma.schoolClass.deleteMany({ where: { id: { in: ids } } });
    }
    return { data: { deleted: ids.length } };
  } catch (error) {
    return { error: "Failed to delete all classes" };
  }
}

export async function importSchoolBulkWithGender(schoolId: string, text: string) {
  try {
    const normalized = text.replace(/\r\n/g, "\n");
    const blocks = normalized.split(/\n\s*:\s*\n/).map(b => b.trim()).filter(Boolean);
    let totalStudents = 0;
    let totalClasses = 0;

    const groupNameMap: Record<string, string> = {
      "butun sinf": "Butun sinf",
      "1-guruh": "1-guruh",
      "2-guruh": "2-guruh",
      "bolalar": "O'g'il bolalar",
      "qizlar": "Qiz bolalar",
    };

    function normalizeGroupName(name: string): string {
      const lower = name.trim().toLowerCase();
      return groupNameMap[lower] || name.trim();
    }

    function detectGender(groupDisplayName: string): string {
      const lower = groupDisplayName.toLowerCase();
      if (lower === "o'g'il bolalar" || lower === "bolalar") return "o'g'il";
      if (lower === "qiz bolalar" || lower === "qizlar") return "qiz";
      return "";
    }

    for (const block of blocks) {
      const classMatch = block.match(/^(.+?)\s*:\s*([\s\S]+)/);
      if (!classMatch) continue;
      const className = classMatch[1].trim();
      const groupsPart = classMatch[2].trim();

      let cls = await prisma.schoolClass.findFirst({ where: { schoolId, name: className } });
      if (!cls) {
        cls = await prisma.schoolClass.create({ data: { schoolId, name: className } });
        totalClasses++;
      }

      const groupRegex = /([^;(]+)\(([^)]*)\)/g;
      let groupMatch;

      while ((groupMatch = groupRegex.exec(groupsPart)) !== null) {
        let rawGroupName = groupMatch[1].trim();
        const studentsRaw = groupMatch[2].trim();
        if (!rawGroupName) continue;

        const gender = detectGender(rawGroupName);

        const isGenderGroup = ["bolalar", "qizlar", "o'g'il bolalar", "qiz bolalar"].includes(rawGroupName.toLowerCase());
        const isButunSinf = ["butun sinf"].includes(rawGroupName.toLowerCase());
        let groupId: string | undefined;

        const groupDisplayName = isButunSinf ? "Butun sinf" : normalizeGroupName(rawGroupName);

        let group = await prisma.schoolGroup.findFirst({
          where: { classId: cls!.id, name: groupDisplayName },
        });
        if (!group) {
          group = await prisma.schoolGroup.create({
            data: { classId: cls!.id, name: groupDisplayName },
          });
        }
        if (!isGenderGroup && !isButunSinf) groupId = group.id;

        if (studentsRaw) {
          const names = studentsRaw.split(",").map(n => n.trim().replace(/^['"]|['"]$/g, "")).filter(Boolean);
          for (const name of names) {
            const existing = await prisma.student.findFirst({
              where: { classId: cls!.id, name },
            });
            if (existing) {
              if (gender && !existing.gender) {
                await prisma.student.update({
                  where: { id: existing.id },
                  data: { gender },
                });
              }
              if (groupId && !existing.groupId) {
                await prisma.student.update({
                  where: { id: existing.id },
                  data: { groupId },
                });
              }
            } else {
              await prisma.student.create({
                data: {
                  classId: cls!.id,
                  name,
                  gender: gender || "",
                  ...(groupId ? { groupId } : {}),
                },
              });
              totalStudents++;
            }
          }
        }
      }
    }

    return { data: { classes: totalClasses, students: totalStudents } };
  } catch (error) {
    console.error("importSchoolBulkWithGender error:", error);
    const msg = error instanceof Error ? error.message : "Failed to import school data";
    return { error: msg };
  }
}

export async function createDefaultGroups(classId: string) {
  try {
    const defaultNames = [
      "Butun sinf",
      "1-guruh",
      "2-guruh",
      "O'g'il bolalar",
      "Qiz bolalar",
    ];

    const existing = await prisma.schoolGroup.findMany({
      where: { classId, name: { in: defaultNames } },
      select: { name: true },
    });

    const existingNames = new Set(existing.map((g) => g.name));
    const newNames = defaultNames.filter((n) => !existingNames.has(n));

    if (newNames.length > 0) {
      await prisma.schoolGroup.createMany({
        data: newNames.map((name) => ({ classId, name })),
      });
    }

    return { data: { created: newNames.length } };
  } catch (error) {
    return { error: "Failed to create default groups" };
  }
}
