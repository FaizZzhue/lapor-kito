import type { Metadata } from "next";
import { getPublicReportAction } from "@/lib/actions/tracking";
import { BerhasilView } from "@/components/lapor/berhasil-view";

export const metadata: Metadata = {
  title: "Laporan Berhasil Dibuat — LAPORKITO Palembang",
  description: "Laporan Anda telah berhasil dicatat ke dalam sistem pra-pelaporan LAPORKITO.",
};

interface BerhasilPageProps {
  searchParams: Promise<{ code?: string }>;
}

export default async function BerhasilPage({ searchParams }: BerhasilPageProps) {
  const resolvedParams = await searchParams;
  const trackingCode = resolvedParams.code || null;

  let reportTitle: string | undefined;
  let categoryName: string | undefined;
  let createdAt: string | undefined;

  if (trackingCode) {
    const res = await getPublicReportAction(trackingCode);
    if (res.success && res.report) {
      reportTitle = res.report.title;
      categoryName = res.categoryName;
      createdAt = res.report.created_at;
    }
  }

  return (
    <div className="w-full bg-[#F9F9FF] min-h-screen py-12 px-4 sm:px-6 lg:px-8 civic-grid">
      <div className="mx-auto max-w-7xl">
        <BerhasilView
          trackingCode={trackingCode}
          reportTitle={reportTitle}
          categoryName={categoryName}
          createdAt={createdAt}
        />
      </div>
    </div>
  );
}
