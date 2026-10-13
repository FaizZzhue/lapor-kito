import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicReportAction } from "@/lib/actions/tracking";
import { TanggapanForm } from "@/components/pantau/tanggapan-form";

interface TanggapanPageProps {
  params: Promise<{ tracking_code: string }>;
}

export async function generateMetadata({
  params,
}: TanggapanPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  return {
    title: `Balas Tanggapan #${resolvedParams.tracking_code} — LAPORKITO Palembang`,
    description: `Sampaikan keterangan atau klarifikasi tambahan untuk laporan #${resolvedParams.tracking_code}.`,
  };
}

export default async function TanggapanPage({ params }: TanggapanPageProps) {
  const resolvedParams = await params;
  const rawCode = resolvedParams.tracking_code;
  const result = await getPublicReportAction(rawCode);

  if (!result.success || !result.report) {
    notFound();
  }

  const latestOfficialResponse =
    result.responses && result.responses.length > 0
      ? result.responses[result.responses.length - 1]
      : undefined;

  return (
    <div className="w-full bg-[#eef2f6] min-h-screen py-8 sm:py-12 px-3 sm:px-6 lg:px-8 space-y-6">
      <div className="mx-auto max-w-7xl">
        <TanggapanForm
          trackingCode={rawCode}
          report={result.report}
          categoryName={result.categoryName}
          latestOfficialResponse={latestOfficialResponse}
        />
      </div>
    </div>
  );
}
