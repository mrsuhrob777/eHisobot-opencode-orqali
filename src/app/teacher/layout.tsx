import React, { Suspense } from "react";
import TeacherLayoutClient from "./teacher-layout-client";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen"><div className="animate-pulse text-gray-400">Yuklanmoqda...</div></div>}>
      <TeacherLayoutClient>{children}</TeacherLayoutClient>
    </Suspense>
  );
}
