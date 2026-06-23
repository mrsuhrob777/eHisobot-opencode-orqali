-- CreateTable
CREATE TABLE "AnnualReportData" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "year" TEXT NOT NULL,
    "teacherName" TEXT NOT NULL DEFAULT '',
    "data" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AnnualReportData_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "AnnualReportData_userId_idx" ON "AnnualReportData"("userId");

-- CreateIndex
CREATE INDEX "AnnualReportData_userId_createdAt_idx" ON "AnnualReportData"("userId", "createdAt");
