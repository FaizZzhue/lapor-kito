export default function TanggapanLoading() {
  return (
    <div className="w-full bg-[#eef2f6] min-h-screen py-8 sm:py-12 px-3 sm:px-6 lg:px-8 space-y-6 animate-in fade-in duration-150">
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Back Link Skeleton */}
        <div className="h-4 w-36 rounded bg-slate-200 animate-pulse" />

        {/* Form Container Skeleton */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
          {/* Header */}
          <div className="space-y-2 pb-5 border-b border-slate-100">
            <div className="h-4 w-32 rounded bg-blue-100 animate-pulse" />
            <div className="h-7 w-64 sm:w-80 rounded-lg bg-slate-300 animate-pulse" />
            <div className="h-4 w-full max-w-md rounded bg-slate-200 animate-pulse" />
          </div>

          {/* Official Response Context Box Skeleton */}
          <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/60 space-y-2 animate-pulse">
            <div className="h-3.5 w-44 rounded bg-blue-200" />
            <div className="h-3 w-full rounded bg-blue-100" />
            <div className="h-3 w-4/5 rounded bg-blue-100" />
          </div>

          {/* Form Fields Skeleton */}
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="h-3.5 w-40 rounded bg-slate-200 animate-pulse" />
              <div className="h-28 w-full rounded-xl bg-slate-100 border border-slate-200 animate-pulse" />
            </div>

            <div className="space-y-2">
              <div className="h-3.5 w-48 rounded bg-slate-200 animate-pulse" />
              <div className="h-10 w-full rounded-xl bg-slate-100 border border-slate-200 animate-pulse" />
            </div>

            <div className="h-20 w-full rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 animate-pulse" />
          </div>

          {/* Actions Skeleton */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <div className="h-10 w-28 rounded-lg bg-slate-100 border border-slate-200 animate-pulse" />
            <div className="h-10 w-36 rounded-lg bg-blue-700/80 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
