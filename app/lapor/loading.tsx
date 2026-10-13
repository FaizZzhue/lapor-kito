export default function LaporLoading() {
  return (
    <div className="w-full bg-slate-50/60 min-h-screen py-10 px-4 sm:px-6 lg:px-8 civic-grid">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header Skeleton */}
        <div className="space-y-3 pb-2 border-b border-slate-200/80">
          <div className="flex items-center gap-2">
            <div className="h-5 w-44 rounded-full bg-blue-100 animate-pulse" />
            <div className="h-5 w-24 rounded-full bg-slate-200 animate-pulse hidden sm:block" />
          </div>
          <div className="h-8 w-72 sm:w-96 rounded-lg bg-slate-300 animate-pulse" />
          <div className="h-4 w-full max-w-2xl rounded bg-slate-200 animate-pulse" />
        </div>

        {/* Stepper Progress Bar Skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl border border-slate-200 bg-white shadow-2xs">
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-50">
              <div className="h-6 w-6 rounded-md bg-slate-200 animate-pulse shrink-0" />
              <div className="space-y-1 w-full">
                <div className="h-2.5 w-12 rounded bg-slate-200 animate-pulse" />
                <div className="h-3 w-20 rounded bg-slate-300 animate-pulse" />
              </div>
            </div>
          ))}
        </div>

        {/* Main Grid: Form Left (7 cols) + AI Panel Right (5 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT COLUMN: FORM SECTIONS SKELETON */}
          <div className="lg:col-span-7 space-y-6">
            {/* Section 1: Informasi Permasalahan */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-md bg-blue-100 animate-pulse" />
                  <div className="h-5 w-44 rounded bg-slate-200 animate-pulse" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3.5 w-28 rounded bg-slate-200 animate-pulse" />
                <div className="h-10 w-full rounded-lg bg-slate-100 border border-slate-200 animate-pulse" />
              </div>
              <div className="space-y-2">
                <div className="h-3.5 w-32 rounded bg-slate-200 animate-pulse" />
                <div className="h-10 w-full rounded-lg bg-slate-100 border border-slate-200 animate-pulse" />
              </div>
              <div className="space-y-2">
                <div className="h-3.5 w-40 rounded bg-slate-200 animate-pulse" />
                <div className="h-28 w-full rounded-lg bg-slate-100 border border-slate-200 animate-pulse" />
              </div>
            </div>

            {/* Section 2: Lokasi Kejadian */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-md bg-blue-100 animate-pulse" />
                  <div className="h-5 w-48 rounded bg-slate-200 animate-pulse" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="h-3.5 w-24 rounded bg-slate-200 animate-pulse" />
                  <div className="h-10 w-full rounded-lg bg-slate-100 border border-slate-200 animate-pulse" />
                </div>
                <div className="space-y-2">
                  <div className="h-3.5 w-24 rounded bg-slate-200 animate-pulse" />
                  <div className="h-10 w-full rounded-lg bg-slate-100 border border-slate-200 animate-pulse" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3.5 w-36 rounded bg-slate-200 animate-pulse" />
                <div className="h-10 w-full rounded-lg bg-slate-100 border border-slate-200 animate-pulse" />
              </div>
              {/* Map Placeholder */}
              <div className="h-[270px] sm:h-[320px] w-full rounded-xl border border-slate-200 bg-slate-100 flex flex-col items-center justify-center gap-2 animate-pulse">
                <div className="h-8 w-8 rounded-full bg-slate-200" />
                <div className="h-3 w-40 rounded bg-slate-200" />
              </div>
            </div>

            {/* Section 3: Bukti Foto */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-md bg-blue-100 animate-pulse" />
                  <div className="h-5 w-52 rounded bg-slate-200 animate-pulse" />
                </div>
                <div className="h-4 w-20 rounded bg-slate-200 animate-pulse" />
              </div>
              <div className="h-36 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center gap-2 animate-pulse">
                <div className="h-10 w-10 rounded-full bg-slate-200" />
                <div className="h-3.5 w-48 rounded bg-slate-200" />
                <div className="h-2.5 w-64 rounded bg-slate-200" />
              </div>
            </div>

            {/* Section 4: Data Pelapor & Buttons */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-md bg-slate-200 animate-pulse" />
                  <div className="h-5 w-56 rounded bg-slate-200 animate-pulse" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="h-9 rounded-lg bg-slate-100 border border-slate-200 animate-pulse" />
                <div className="h-9 rounded-lg bg-slate-100 border border-slate-200 animate-pulse" />
                <div className="h-9 rounded-lg bg-slate-100 border border-slate-200 animate-pulse" />
              </div>
            </div>

            {/* Buttons Skeleton */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <div className="h-11 w-full sm:flex-1 rounded-lg bg-blue-100/70 border border-blue-200 animate-pulse" />
              <div className="h-11 w-full sm:flex-1 rounded-lg bg-blue-700/80 animate-pulse" />
            </div>
          </div>

          {/* RIGHT COLUMN: AI PANEL SKELETON */}
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="space-y-1">
                  <div className="h-4 w-40 rounded bg-slate-300 animate-pulse" />
                  <div className="h-3 w-56 rounded bg-slate-200 animate-pulse" />
                </div>
                <div className="h-6 w-20 rounded-full bg-blue-100 animate-pulse" />
              </div>

              {/* AI Guidance Placeholder */}
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 space-y-3 text-center animate-pulse">
                <div className="mx-auto h-11 w-11 rounded-full bg-blue-100" />
                <div className="h-4 w-36 mx-auto rounded bg-slate-300" />
                <div className="h-3 w-52 mx-auto rounded bg-slate-200" />
                <div className="space-y-2 pt-2">
                  <div className="h-3 w-full rounded bg-slate-200" />
                  <div className="h-3 w-4/5 mx-auto rounded bg-slate-200" />
                  <div className="h-3 w-3/4 mx-auto rounded bg-slate-200" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
