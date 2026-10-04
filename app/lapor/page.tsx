import type { Metadata } from "next";
import { getMasterDataAction } from "@/lib/actions/reports";
import { ReportForm } from "@/components/lapor/report-form";

export const metadata: Metadata = {
  title: "Buat Laporan — LAPORKITO Palembang",
  description:
    "Sampaikan laporan masalah fasilitas atau layanan publik di Kota Palembang. Dapatkan telaah awal AI dan rekomendasi instansi berwenang.",
};

export default async function LaporPage() {
  const masterData = await getMasterDataAction();

  return (
    <div className="w-full bg-[#F9F9FF] min-h-screen py-8 px-4 sm:px-6 lg:px-8 civic-grid">
      <div className="mx-auto max-w-7xl">
        <ReportForm initialMasterData={masterData} />
      </div>
    </div>
  );
}
