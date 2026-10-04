import type { Metadata } from "next";
import { getPublicReportAction } from "@/lib/actions/tracking";
import { TrackingDetailView } from "@/components/pantau/tracking-detail-view";

interface TrackingDetailPageProps {
  params: Promise<{ tracking_code: string }>;
}

export async function generateMetadata({
  params,
}: TrackingDetailPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  return {
    title: `Laporan #${resolvedParams.tracking_code} — LAPORKITO Palembang`,
    description: `Pantau detail perkembangan laporan dengan kode lacak #${resolvedParams.tracking_code} di Kota Palembang.`,
  };
}

export default async function TrackingDetailPage({ params }: TrackingDetailPageProps) {
  const resolvedParams = await params;
  const rawCode = resolvedParams.tracking_code;
  const result = await getPublicReportAction(rawCode);

  return (
    <div className="w-full bg-[#F9F9FF] min-h-screen py-8 px-4 sm:px-6 lg:px-8 civic-grid">
      <div className="mx-auto max-w-7xl">
        <TrackingDetailView trackingCode={rawCode} result={result} />
      </div>
    </div>
  );
}
