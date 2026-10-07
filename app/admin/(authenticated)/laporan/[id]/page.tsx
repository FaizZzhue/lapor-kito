import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileQuestion } from "lucide-react";
import { getCurrentInternalUser } from "@/lib/auth/session";
import { getInternalReportDetailAction } from "@/lib/actions/reports";
import { ReportDetailView } from "@/components/admin/reports/report-detail-view";

export const dynamic = "force-dynamic";

interface LaporanDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminLaporanDetailPage({ params }: LaporanDetailPageProps) {
  const { isAuthenticated, internalUser } = await getCurrentInternalUser();

  if (!isAuthenticated || !internalUser || !internalUser.is_active) {
    redirect("/admin/login");
  }

  if (internalUser.role !== "admin" && internalUser.role !== "petugas") {
    redirect("/admin/login");
  }

  const { id } = await params;
  const result = await getInternalReportDetailAction(id);

  if (!result.success || !result.data) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center max-w-lg mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-[#FFDAD6] text-[#BA1A1A] flex items-center justify-center mb-4 shadow-sm">
          <FileQuestion size={32} strokeWidth={2} aria-hidden="true" />
        </div>
        <h1 className="text-[20px] font-bold text-[#111C2D]">
          Laporan Tidak Ditemukan
        </h1>
        <p className="text-[13px] text-[#747686] mt-1.5 leading-relaxed">
          {result.error ||
            `Berkas laporan dengan ID atau kode lacak "${id}" tidak ditemukan dalam sistem LAPORKITO.`}
        </p>
        <Link
          href="/admin/laporan"
          className="mt-6 inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#1749D2] hover:bg-[#0033A7] text-white text-[13px] font-semibold transition-colors shadow-sm"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          <span>Kembali ke Laporan Masuk</span>
        </Link>
      </div>
    );
  }

  return <ReportDetailView data={result.data} userRole={internalUser.role} />;
}
