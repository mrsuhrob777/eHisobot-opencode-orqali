export default function TeacherDashboard() {
  return (
    <div>
      <div className="mb-8"><h1 className="text-2xl font-bold text-gray-900">O'qituvchi paneli</h1><p className="mt-1 text-sm text-gray-500">Teacher dashboard</p></div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="text-sm font-medium text-gray-500">BSB / CHSB</div>
          <div className="mt-2 text-3xl font-bold text-gray-900">0</div>
          <div className="mt-1 text-xs text-gray-400">Jami hisobotlar</div>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="text-sm font-medium text-gray-500">Yillik hisobot</div>
          <div className="mt-2 text-3xl font-bold text-gray-900">0</div>
          <div className="mt-1 text-xs text-gray-400">Jami hisobotlar</div>
        </div>
      </div>
    </div>
  );
}
