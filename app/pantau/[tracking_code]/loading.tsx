export default function TrackingDetailLoading() {
  return (
    <div className="w-full bg-[#eef2f6] min-h-screen py-8 sm:py-12 px-3 sm:px-6 lg:px-8 space-y-6 animate-in fade-in duration-150">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Top Search Bar Skeleton */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-2xs">
          <div className="h-11 w-full rounded-xl bg-slate-100 border border-slate-200 animate-pulse" />
        </div>

        {/* Main Report Header Banner Skeleton */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7 shadow-sm space-y-5">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <div className="h-6 w-36 rounded bg-blue-100 animate-pulse" />
                <div className="h-6 w-28 rounded-full bg-slate-200 animate-pulse" />
              </div>
              <div className="h-7 w-72 sm:w-96 rounded-lg bg-slate-300 animate-pulse" />
            </div>
            <div className="h-6 w-24 rounded-full bg-slate-200 animate-pulse" />
          </div>

          {/* Stepper Progress Skeleton */}
          <div className="pt-2 border-t border-slate-100">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[1, 2, 3, 4].map((step) => (
                <div key={step} className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
                  <div className="h-2.5 w-12 rounded bg-slate-200 animate-pulse" />
                  <div className="h-3 w-20 rounded bg-slate-300 animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Dual Column Layout Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (7 cols): Uraian, Bukti Foto, Linimasa */}
          <div className="lg:col-span-7 space-y-6">
            {/* Uraian Box Skeleton */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="h-4 w-32 rounded bg-slate-300 animate-pulse" />
                <div className="h-4 w-20 rounded bg-slate-200 animate-pulse" />
              </div>
              <div className="space-y-2">
                <div className="h-3.5 w-full rounded bg-slate-200 animate-pulse" />
                <div className="h-3.5 w-5/6 rounded bg-slate-200 animate-pulse" />
                <div className="h-3.5 w-4/6 rounded bg-slate-200 animate-pulse" />
              </div>

              {/* Ringkasan AI Skeleton */}
              <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/60 space-y-2 animate-pulse">
                <div className="h-3.5 w-44 rounded bg-blue-200" />
                <div className="h-3 w-full rounded bg-blue-100" />
                <div className="h-3 w-4/5 rounded bg-blue-100" />
              </div>
            </div>

            {/* Bukti Foto Skeleton */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="h-4 w-36 rounded bg-slate-300 animate-pulse" />
                <div className="h-4 w-16 rounded bg-slate-200 animate-pulse" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="h-32 rounded-xl bg-slate-100 border border-slate-200 animate-pulse"
                  />
                ))}
              </div>
            </div>

            {/* Linimasa Status Skeleton */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xs space-y-4">
              <div className="h-4 w-40 rounded bg-slate-300 animate-pulse pb-1" />
              <div className="space-y-4 pl-4 border-l-2 border-slate-200">
                {[1, 2, 3].map((step) => (
                  <div key={step} className="space-y-1">
                    <div className="h-3.5 w-28 rounded bg-slate-300 animate-pulse" />
                    <div className="h-3 w-48 rounded bg-slate-200 animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column (5 cols): Instansi, Lokasi, Form Tanggapan Link */}
          <div className="lg:col-span-5 space-y-6">
            {/* Instansi OPD Skeleton */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xs space-y-3">
              <div className="h-4 w-32 rounded bg-slate-300 animate-pulse" />
              <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/50 space-y-2 animate-pulse">
                <div className="h-4 w-44 rounded bg-blue-200" />
                <div className="h-3 w-32 rounded bg-blue-100" />
              </div>
            </div>

            {/* Lokasi Skeleton */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xs space-y-3">
              <div className="h-4 w-36 rounded bg-slate-300 animate-pulse" />
              <div className="space-y-2 pt-1">
                <div className="h-3.5 w-40 rounded bg-slate-200 animate-pulse" />
                <div className="h-3.5 w-48 rounded bg-slate-200 animate-pulse" />
                <div className="h-3.5 w-full rounded bg-slate-200 animate-pulse" />
              </div>
            </div>

            {/* Citizen Response Button Skeleton */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3 shadow-2xs">
              <div className="h-4 w-36 rounded bg-slate-300 animate-pulse" />
              <div className="h-3 w-full rounded bg-slate-200 animate-pulse" />
              <div className="h-10 w-full rounded-xl bg-blue-700/80 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
