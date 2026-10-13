import type { Metadata } from "next";
import { getMasterDataAction } from "@/lib/actions/reports";
import { ReportForm } from "@/components/lapor/report-form";

export const metadata: Metadata = {
  title: "LAPORKITO",
  description:
    "Sampaikan laporan masalah fasilitas atau layanan publik di Kota Palembang. Dapatkan telaah awal AI dan rekomendasi instansi berwenang.",
};

export default async function LaporPage() {
  const masterData = await getMasterDataAction();

  return (
    <div className="w-full bg-slate-50/60 min-h-screen py-10 px-4 sm:px-6 lg:px-8 civic-grid">
      <div className="mx-auto max-w-7xl">
        <ReportForm initialMasterData={masterData} />
      </div>
    </div>
  );
}
