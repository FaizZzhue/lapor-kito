export default function AdminLaporanDetailLoading() {
  return (
    <div className="flex flex-col w-full animate-in fade-in duration-150 space-y-6">
      {/* Header Skeleton */}
      <div className="flex flex-col gap-3 pb-6 border-b border-[#D9DEE7]/80">
        <div className="h-4 w-44 rounded bg-[#E8EDF5] animate-pulse" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-5 w-28 rounded bg-[#DFE8FF] animate-pulse" />
              <div className="h-5 w-20 rounded-full bg-[#E8EDF5] animate-pulse" />
            </div>
            <div className="h-7 w-72 sm:w-96 rounded-lg bg-[#D9DEE7] animate-pulse" />
          </div>

          <div className="flex items-center gap-2">
            <div className="h-8 w-24 rounded-lg bg-[#E8EDF5] animate-pulse" />
            <div className="h-8 w-28 rounded-lg bg-[#E8EDF5] animate-pulse" />
          </div>
        </div>
      </div>

      {/* Main Grid: Left 8 cols, Right 4 cols */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Main Report Content */}
        <div className="lg:col-span-8 space-y-6">
          {/* Section 1: Uraian Laporan */}
          <div className="bg-white rounded-xl border border-[#D9DEE7] shadow-sm p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0F3FF]">
              <div className="h-4 w-36 rounded bg-[#D9DEE7] animate-pulse" />
              <div className="h-5 w-24 rounded bg-[#E8EDF5] animate-pulse" />
            </div>

            <div className="space-y-2">
              <div className="h-4 w-full rounded bg-[#E8EDF5] animate-pulse" />
              <div className="h-4 w-5/6 rounded bg-[#E8EDF5] animate-pulse" />
              <div className="h-4 w-4/6 rounded bg-[#E8EDF5] animate-pulse" />
            </div>

            {/* AI Summary Highlight Box Skeleton */}
            <div className="p-4 rounded-xl border border-blue-200/80 bg-blue-50/50 space-y-2 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="h-3.5 w-40 rounded bg-blue-200" />
                <div className="h-4 w-16 rounded bg-blue-100" />
              </div>
              <div className="h-3.5 w-full rounded bg-blue-200/60" />
              <div className="h-3.5 w-4/5 rounded bg-blue-200/60" />
            </div>

            {/* Location Details Skeleton */}
            <div className="pt-2 border-t border-[#F0F3FF] grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-[#F9F9FF] border border-[#D9DEE7] space-y-1.5">
                <div className="h-3 w-20 rounded bg-[#D9DEE7] animate-pulse" />
                <div className="h-3.5 w-36 rounded bg-[#E8EDF5] animate-pulse" />
              </div>
              <div className="p-3 rounded-lg bg-[#F9F9FF] border border-[#D9DEE7] space-y-1.5">
                <div className="h-3 w-20 rounded bg-[#D9DEE7] animate-pulse" />
                <div className="h-3.5 w-36 rounded bg-[#E8EDF5] animate-pulse" />
              </div>
            </div>
          </div>

          {/* Section 2: Bukti Foto Grid Skeleton */}
          <div className="bg-white rounded-xl border border-[#D9DEE7] shadow-sm p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0F3FF]">
              <div className="h-4 w-32 rounded bg-[#D9DEE7] animate-pulse" />
              <div className="h-4 w-16 rounded bg-[#E8EDF5] animate-pulse" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[1, 2, 3].map((photo) => (
                <div
                  key={photo}
                  className="h-36 rounded-lg bg-[#F0F3FF] border border-[#D9DEE7] animate-pulse"
                />
              ))}
            </div>
          </div>

          {/* Section 3: Linimasa Status Skeleton */}
          <div className="bg-white rounded-xl border border-[#D9DEE7] shadow-sm p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0F3FF]">
              <div className="h-4 w-40 rounded bg-[#D9DEE7] animate-pulse" />
            </div>
            <div className="space-y-4 pl-4 border-l-2 border-[#E8EDF5]">
              {[1, 2, 3].map((step) => (
                <div key={step} className="space-y-1 relative">
                  <div className="h-3.5 w-32 rounded bg-[#D9DEE7] animate-pulse" />
                  <div className="h-3 w-52 rounded bg-[#E8EDF5] animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Status Manager & Assignment */}
        <div className="lg:col-span-4 space-y-6">
          {/* Card 1: Manajer Status */}
          <div className="bg-white rounded-xl border border-[#D9DEE7] shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0F3FF]">
              <div className="h-4 w-28 rounded bg-[#D9DEE7] animate-pulse" />
              <div className="h-5 w-20 rounded-full bg-[#DFE8FF] animate-pulse" />
            </div>
            <div className="space-y-2">
              <div className="h-9 w-full rounded-lg bg-[#0033A7]/70 animate-pulse" />
              <div className="h-9 w-full rounded-lg bg-[#E8EDF5] animate-pulse" />
            </div>
          </div>

          {/* Card 2: Disposisi Instansi */}
          <div className="bg-white rounded-xl border border-[#D9DEE7] shadow-sm p-5 space-y-3">
            <div className="h-4 w-32 rounded bg-[#D9DEE7] animate-pulse" />
            <div className="p-3.5 rounded-lg bg-[#F0F3FF] border border-[#C4D3F8] space-y-2 animate-pulse">
              <div className="h-4 w-40 rounded bg-blue-200" />
              <div className="h-3 w-28 rounded bg-blue-100" />
            </div>
            <div className="h-8 w-full rounded-lg bg-[#E8EDF5] animate-pulse" />
          </div>

          {/* Card 3: Informasi Pelapor */}
          <div className="bg-white rounded-xl border border-[#D9DEE7] shadow-sm p-5 space-y-3">
            <div className="h-4 w-32 rounded bg-[#D9DEE7] animate-pulse" />
            <div className="space-y-2 pt-1">
              <div className="h-3.5 w-28 rounded bg-[#E8EDF5] animate-pulse" />
              <div className="h-3.5 w-36 rounded bg-[#E8EDF5] animate-pulse" />
              <div className="h-3.5 w-44 rounded bg-[#E8EDF5] animate-pulse" />
            </div>
            <div className="h-10 rounded-lg bg-[#EDF7F2] border border-[#B5E2CD] animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
