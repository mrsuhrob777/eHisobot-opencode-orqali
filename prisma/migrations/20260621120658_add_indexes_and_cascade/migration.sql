-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AnnualReportClass" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "className" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AnnualReportClass_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_AnnualReportClass" ("className", "createdAt", "id", "subject", "updatedAt", "userId") SELECT "className", "createdAt", "id", "subject", "updatedAt", "userId" FROM "AnnualReportClass";
DROP TABLE "AnnualReportClass";
ALTER TABLE "new_AnnualReportClass" RENAME TO "AnnualReportClass";
CREATE INDEX "AnnualReportClass_userId_subject_idx" ON "AnnualReportClass"("userId", "subject");
CREATE UNIQUE INDEX "AnnualReportClass_userId_className_subject_key" ON "AnnualReportClass"("userId", "className", "subject");
CREATE TABLE "new_Report" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Report_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Report" ("createdAt", "data", "id", "title", "type", "updatedAt", "userId") SELECT "createdAt", "data", "id", "title", "type", "updatedAt", "userId" FROM "Report";
DROP TABLE "Report";
ALTER TABLE "new_Report" RENAME TO "Report";
CREATE INDEX "Report_userId_idx" ON "Report"("userId");
CREATE INDEX "Report_userId_createdAt_idx" ON "Report"("userId", "createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "SchoolClass_schoolId_idx" ON "SchoolClass"("schoolId");

-- CreateIndex
CREATE INDEX "SchoolGroup_classId_idx" ON "SchoolGroup"("classId");

-- CreateIndex
CREATE INDEX "SchoolSubject_schoolId_idx" ON "SchoolSubject"("schoolId");

-- CreateIndex
CREATE INDEX "Student_classId_idx" ON "Student"("classId");

-- CreateIndex
CREATE INDEX "Student_groupId_idx" ON "Student"("groupId");

-- CreateIndex
CREATE INDEX "TeacherClass_classId_idx" ON "TeacherClass"("classId");

-- CreateIndex
CREATE INDEX "TeacherGroup_groupId_idx" ON "TeacherGroup"("groupId");

-- CreateIndex
CREATE INDEX "TeacherSubject_subjectId_idx" ON "TeacherSubject"("subjectId");

-- CreateIndex
CREATE INDEX "User_schoolId_idx" ON "User"("schoolId");
