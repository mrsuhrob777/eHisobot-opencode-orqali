import React, { Suspense } from "react";
import AnnualReportPage from "./annual-report-content";

export default function Page() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]"><div className="animate-pulse text-gray-400">Yuklanmoqda...</div></div>}>
      <AnnualReportPage />
    </Suspense>
  );
}
