import type { Metadata } from "next";
import { getPublicReportAction } from "@/lib/actions/tracking";
import { BerhasilView } from "@/components/lapor/berhasil-view";

export const metadata: Metadata = {
  title: "Laporan Berhasil Dibuat — LAPORKITO Palembang",
  description: "Laporan Anda telah berhasil dicatat ke dalam sistem pra-pelaporan LAPORKITO.",
};

interface BerhasilPageProps {
  searchParams: Promise<{
    code?: string;
    emailSent?: string;
    recipient?: string;
    emailReason?: string;
  }>;
}

export default async function BerhasilPage({ searchParams }: BerhasilPageProps) {
  const resolvedParams = await searchParams;
  const trackingCode = resolvedParams.code || null;
  const emailSent = resolvedParams.emailSent === "true" ? true : resolvedParams.emailSent === "false" ? false : undefined;
  const emailRecipient = resolvedParams.recipient || undefined;
  const emailReason = resolvedParams.emailReason || undefined;

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
    <div className="w-full bg-[#eef2f6] min-h-screen py-10 sm:py-14 px-3 sm:px-6 lg:px-8 space-y-6">
      <div className="mx-auto max-w-7xl">
        <BerhasilView
          trackingCode={trackingCode}
          reportTitle={reportTitle}
          categoryName={categoryName}
          createdAt={createdAt}
          emailSent={emailSent}
          emailRecipient={emailRecipient}
          emailReason={emailReason}
        />
      </div>
    </div>
  );
}
