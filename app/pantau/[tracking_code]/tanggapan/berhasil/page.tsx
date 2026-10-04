import type { Metadata } from "next";
import { TanggapanBerhasilView } from "@/components/pantau/tanggapan-berhasil-view";

interface TanggapanBerhasilPageProps {
  params: Promise<{ tracking_code: string }>;
}

export async function generateMetadata({
  params,
}: TanggapanBerhasilPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  return {
    title: `Tanggapan Terkirim #${resolvedParams.tracking_code} — LAPORKITO Palembang`,
    description: `Tanggapan Anda atas laporan #${resolvedParams.tracking_code} berhasil dikirim.`,
  };
}

export default async function TanggapanBerhasilPage({ params }: TanggapanBerhasilPageProps) {
  const resolvedParams = await params;
  return (
    <div className="w-full bg-[#F9F9FF] min-h-screen py-12 px-4 sm:px-6 lg:px-8 civic-grid">
      <div className="mx-auto max-w-7xl">
        <TanggapanBerhasilView trackingCode={resolvedParams.tracking_code} />
      </div>
    </div>
  );
}
