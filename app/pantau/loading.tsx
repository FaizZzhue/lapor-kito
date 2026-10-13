export default function PantauLoading() {
  return (
    <div className="w-full bg-[#eef2f6] min-h-screen py-10 sm:py-14 px-4 sm:px-6 lg:px-8 animate-in fade-in duration-150">
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Search Panel Skeleton */}
        <div className="editorial-panel p-6 sm:p-8 space-y-6 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <div className="space-y-2 border-b border-slate-200/80 pb-5">
            <div className="h-7 w-56 rounded-lg bg-slate-300 animate-pulse" />
            <div className="h-4 w-72 rounded bg-slate-200 animate-pulse" />
          </div>

          <div className="space-y-4">
            {/* Search Input Skeleton */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="h-12 flex-1 rounded-xl bg-slate-100 border border-slate-200 animate-pulse" />
              <div className="h-12 w-full sm:w-28 rounded-xl bg-blue-700/80 animate-pulse" />
            </div>

            {/* Shield Notice Skeleton */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2 animate-pulse">
              <div className="h-3 w-full rounded bg-slate-200" />
              <div className="h-3 w-4/5 rounded bg-slate-200" />
            </div>
          </div>
        </div>

        {/* 2 Helpful Tips Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 space-y-3 shadow-2xs animate-pulse">
            <div className="h-4 w-40 rounded bg-slate-300" />
            <div className="space-y-1.5">
              <div className="h-3 w-full rounded bg-slate-200" />
              <div className="h-3 w-5/6 rounded bg-slate-200" />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 space-y-3 shadow-2xs animate-pulse">
            <div className="h-4 w-44 rounded bg-slate-300" />
            <div className="space-y-1.5">
              <div className="h-3 w-full rounded bg-slate-200" />
              <div className="h-3 w-4/6 rounded bg-slate-200" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
