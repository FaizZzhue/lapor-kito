export default function AdminDashboardLoading() {
  return (
    <div className="flex flex-col w-full animate-in fade-in duration-150">
      {/* Page Header Skeleton */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#D9DEE7]/80 mb-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#1749D2] animate-pulse" />
            <div className="h-3 w-56 rounded bg-[#E8EDF5] animate-pulse" />
          </div>
          <div className="h-7 w-48 rounded-lg bg-[#D9DEE7] animate-pulse" />
        </div>
        <div className="h-8 w-32 rounded-lg bg-[#F0F3FF] border border-[#D9DEE7] animate-pulse" />
      </div>

      {/* Section 1: Ringkasan Laporan Header */}
      <div className="mb-8 space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-[#DFE8FF] animate-pulse" />
          <div className="h-5 w-36 rounded bg-[#D9DEE7] animate-pulse" />
        </div>

        {/* 4 Metric Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Hero Card */}
          <div className="bg-gradient-to-br from-[#1749D2]/90 to-[#0033A7] p-5 rounded-xl shadow-sm sm:col-span-2 lg:col-span-1 space-y-4">
            <div className="flex items-center justify-between">
              <div className="h-4 w-24 rounded bg-white/40 animate-pulse" />
              <div className="w-5 h-5 rounded bg-white/30 animate-pulse" />
            </div>
            <div className="space-y-1.5 pt-2">
              <div className="h-8 w-16 rounded bg-white/70 animate-pulse" />
              <div className="h-3 w-32 rounded bg-white/40 animate-pulse" />
            </div>
          </div>

          {/* 3 Secondary Metric Cards */}
          {[1, 2, 3].map((card) => (
            <div
              key={card}
              className="bg-white p-5 rounded-xl border border-[#D9DEE7] shadow-xs flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <div className="h-3.5 w-24 rounded bg-[#E8EDF5] animate-pulse" />
                <div className="w-8 h-8 rounded-lg bg-[#F0F3FF] animate-pulse" />
              </div>
              <div className="mt-4 space-y-1">
                <div className="h-7 w-12 rounded bg-[#D9DEE7] animate-pulse" />
                <div className="h-2.5 w-28 rounded bg-[#E8EDF5] animate-pulse" />
              </div>
            </div>
          ))}
        </div>

        {/* Status Distribution Skeleton */}
        <div className="bg-white rounded-xl border border-[#D9DEE7] shadow-sm p-5 space-y-3">
          <div className="h-4 w-44 rounded bg-[#D9DEE7] animate-pulse" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
              <div
                key={item}
                className="p-3 rounded-lg border border-[#D9DEE7]/80 bg-[#F9F9FF] flex items-center justify-between"
              >
                <div className="h-3.5 w-20 rounded bg-[#E8EDF5] animate-pulse" />
                <div className="h-4 w-8 rounded-full bg-[#D9DEE7] animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Section 2: Master Data & Quick Links Skeleton */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-[#DFE8FF] animate-pulse" />
          <div className="h-5 w-44 rounded bg-[#D9DEE7] animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((link) => (
            <div
              key={link}
              className="p-4 rounded-xl border border-[#D9DEE7] bg-white flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-lg bg-[#F0F3FF] animate-pulse shrink-0" />
              <div className="space-y-1.5 w-full">
                <div className="h-3.5 w-28 rounded bg-[#D9DEE7] animate-pulse" />
                <div className="h-2.5 w-40 rounded bg-[#E8EDF5] animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
