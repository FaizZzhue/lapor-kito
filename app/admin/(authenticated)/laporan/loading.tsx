export default function AdminLaporanLoading() {
  return (
    <div className="flex flex-col w-full animate-in fade-in duration-150">
      {/* Page Header Skeleton */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#D9DEE7]/80 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1749D2] animate-pulse" />
            <div className="h-3 w-48 rounded bg-[#E8EDF5] animate-pulse" />
          </div>
          <div className="flex items-center gap-3">
            <div className="h-7 w-44 rounded-lg bg-[#D9DEE7] animate-pulse" />
            <div className="h-5 w-16 rounded-full bg-[#DFE8FF] animate-pulse" />
          </div>
        </div>

        <div className="h-9 w-28 rounded-lg bg-white border border-[#D9DEE7] animate-pulse self-start md:self-auto" />
      </div>

      {/* Filter and Search Bar Skeleton */}
      <div className="bg-white p-4 rounded-xl border border-[#D9DEE7] shadow-sm flex flex-col gap-3 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-5 h-9 rounded-lg bg-[#F9F9FF] border border-[#D9DEE7] animate-pulse" />
          <div className="md:col-span-2 h-9 rounded-lg bg-[#F0F3FF] border border-[#D9DEE7] animate-pulse" />
          <div className="md:col-span-2 h-9 rounded-lg bg-[#F0F3FF] border border-[#D9DEE7] animate-pulse" />
          <div className="md:col-span-3 h-9 rounded-lg bg-[#F0F3FF] border border-[#D9DEE7] animate-pulse" />
        </div>

        {/* Secondary Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[#F0F3FF]">
          <div className="h-6 w-52 rounded bg-[#E8EDF5] animate-pulse" />
          <div className="h-4 w-40 rounded bg-[#E8EDF5] animate-pulse" />
        </div>
      </div>

      {/* Mobile Card Skeletons (< md) */}
      <div className="md:hidden flex flex-col gap-3.5">
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="bg-white rounded-xl border border-[#D9DEE7] p-4 shadow-xs flex flex-col gap-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-4 w-28 rounded bg-[#DFE8FF] animate-pulse" />
              <div className="h-5 w-20 rounded-full bg-[#E8EDF5] animate-pulse" />
            </div>
            <div className="space-y-1.5">
              <div className="h-4 w-3/4 rounded bg-[#D9DEE7] animate-pulse" />
              <div className="h-3 w-full rounded bg-[#E8EDF5] animate-pulse" />
            </div>
            <div className="pt-2 border-t border-[#F0F3FF] flex items-center justify-between">
              <div className="h-3.5 w-32 rounded bg-[#E8EDF5] animate-pulse" />
              <div className="h-3.5 w-24 rounded bg-[#E8EDF5] animate-pulse" />
            </div>
            <div className="h-9 w-full rounded-lg bg-[#F0F3FF] animate-pulse" />
          </div>
        ))}
      </div>

      {/* Desktop Table View Skeleton (>= md) */}
      <div className="hidden md:block bg-white rounded-xl border border-[#D9DEE7] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F9F9FF] border-b border-[#D9DEE7] text-[11px] font-semibold text-[#747686] uppercase tracking-wider">
                <th className="py-3 px-4 w-[130px]"># Kode Lacak</th>
                <th className="py-3 px-4 min-w-[260px]">Judul & Deskripsi</th>
                <th className="py-3 px-4 min-w-[170px]">Disposisi OPD</th>
                <th className="py-3 px-4 min-w-[160px]">Lokasi</th>
                <th className="py-3 px-4 w-[110px]">Prioritas</th>
                <th className="py-3 px-4 w-[130px]">Status</th>
                <th className="py-3 px-4 w-[120px]">Waktu Masuk</th>
                <th className="py-3 px-4 w-[60px] text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D9DEE7]/70">
              {[1, 2, 3, 4, 5, 6].map((row) => (
                <tr key={row} className="bg-white">
                  {/* Tracking Code */}
                  <td className="py-3.5 px-4">
                    <div className="h-4 w-24 rounded bg-[#DFE8FF] animate-pulse" />
                  </td>
                  {/* Title & Description */}
                  <td className="py-3.5 px-4 space-y-1.5">
                    <div className="h-4 w-3/4 rounded bg-[#D9DEE7] animate-pulse" />
                    <div className="h-3 w-5/6 rounded bg-[#E8EDF5] animate-pulse" />
                  </td>
                  {/* OPD */}
                  <td className="py-3.5 px-4">
                    <div className="h-5 w-32 rounded bg-[#E8EDF5] animate-pulse" />
                  </td>
                  {/* Location */}
                  <td className="py-3.5 px-4">
                    <div className="h-3.5 w-28 rounded bg-[#E8EDF5] animate-pulse" />
                  </td>
                  {/* Priority */}
                  <td className="py-3.5 px-4">
                    <div className="h-5 w-16 rounded-full bg-[#E8EDF5] animate-pulse" />
                  </td>
                  {/* Status */}
                  <td className="py-3.5 px-4">
                    <div className="h-5 w-20 rounded-full bg-[#E8EDF5] animate-pulse" />
                  </td>
                  {/* Date */}
                  <td className="py-3.5 px-4">
                    <div className="h-3.5 w-20 rounded bg-[#E8EDF5] animate-pulse" />
                  </td>
                  {/* Action */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="h-6 w-6 rounded bg-[#F0F3FF] animate-pulse ml-auto" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
