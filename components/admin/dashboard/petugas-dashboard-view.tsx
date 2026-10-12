"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  Building2,
  Clock3,
  CircleCheck,
  ClipboardCheck,
  MessageSquareWarning,
  FileText,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import type { UserProfile } from "@/types/auth";
import type { InternalReportListItem } from "@/lib/actions/reports";
import { ReportInboxClient } from "@/components/admin/reports/report-inbox-client";

interface PetugasDashboardViewProps {
  userProfile: UserProfile;
  reports: InternalReportListItem[];
  categories: Array<{ id: string; name_id: string; slug: string }>;
}

export function PetugasDashboardView({
  userProfile,
  reports,
  categories,
}: PetugasDashboardViewProps) {
  const institutionName =
    userProfile.institution?.name || "Organisasi Perangkat Daerah (OPD)";
  const institutionShortName =
    userProfile.institution?.short_name || userProfile.institution?.code || "OPD";
  const unitName = userProfile.unit?.name || null;

  // Compute operational metrics scoped to this institution
  const metrics = useMemo(() => {
    let needVerification = 0;
    let inProgress = 0;
    let resolved = 0;
    let citizenAttention = 0;

    for (const r of reports) {
      if (r.status === "submitted" || r.status === "verifying") {
        needVerification++;
      } else if (r.status === "verified" || r.status === "in_progress") {
        inProgress++;
      } else if (r.status === "resolved") {
        resolved++;
      }

      if (r.latest_response_is_citizen) {
        citizenAttention++;
      }
    }

    return {
      totalAssigned: reports.length,
      needVerification,
      inProgress,
      resolved,
      citizenAttention,
    };
  }, [reports]);

  // If petugas has no institution assigned by admin
  if (!userProfile.institution_id) {
    return (
      <div className="flex flex-col w-full">
        <div className="p-8 bg-white border border-[#D9DEE7] rounded-2xl shadow-sm text-center max-w-2xl mx-auto my-12">
          <div className="w-16 h-16 rounded-2xl bg-[#FEF3E6] text-[#B2640A] border border-[#FCD7A9] flex items-center justify-center mx-auto mb-4">
            <ShieldAlert size={32} strokeWidth={2} aria-hidden="true" />
          </div>
          <h2 className="text-[20px] font-bold text-[#111C2D]">
            Akun Belum Dihubungkan ke Instansi
          </h2>
          <p className="text-[14px] text-[#434654] mt-2 leading-relaxed">
            Akun Anda terdaftar sebagai <strong>Petugas</strong>, namun belum ditetapkan ke Organisasi Perangkat Daerah (OPD) tempat bertugas. Demi keamanan dan pemisahan wewenang instansi, daftar laporan hanya dapat diakses setelah akun dihubungkan dengan instansi resmi oleh Administrator LAPORKITO.
          </p>
          <div className="mt-6 p-4 bg-[#F9F9FF] border border-[#D9DEE7] rounded-xl text-left text-[13px] text-[#747686]">
            <p className="font-semibold text-[#111C2D] mb-1">Langkah Penyelesaian:</p>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Hubungi Administrator LAPORKITO Kota Palembang.</li>
              <li>Minta Administrator memperbarui data profil Anda di menu <em>Pengguna Internal</em> dan memilih Instansi tempat Anda bertugas.</li>
              <li>Muat ulang halaman ini setelah penugasan instansi disimpan.</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full gap-8">
      {/* Header Petugas */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#D9DEE7]/80">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-[#16845B]" />
            <p className="text-[11px] font-bold text-[#0033A7] uppercase tracking-wider">
              Konsol Petugas Operasional • {institutionShortName}
            </p>
          </div>
          <h1 className="text-[26px] font-bold text-[#111C2D] tracking-tight">
            Dashboard Operasional Instansi
          </h1>
          <div className="flex items-center gap-2 mt-1.5 text-[13px] text-[#434654]">
            <Building2 size={16} className="text-[#0033A7] shrink-0" aria-hidden="true" />
            <span className="font-semibold text-[#111C2D]">{institutionName}</span>
            {unitName && (
              <>
                <span className="text-[#747686]">•</span>
                <span className="text-[#747686]">{unitName}</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <Link
            href="/admin/laporan"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#F0F3FF] hover:bg-[#DFE8FF] text-[#0033A7] text-[13px] font-semibold transition-colors border border-[#C4D3F8]"
          >
            <FileText size={16} aria-hidden="true" />
            <span>Semua Laporan Instansi</span>
            <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </div>
      </div>

      {/* METRICS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Total Assigned */}
        <div className="bg-gradient-to-br from-[#1749D2] to-[#0033A7] p-5 rounded-xl shadow-sm text-white flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-medium text-white/80">Laporan Ditugaskan</span>
            <FileText size={18} className="text-white/60" aria-hidden="true" />
          </div>
          <div className="mt-4">
            <span className="text-[30px] font-bold">{metrics.totalAssigned}</span>
            <p className="text-[11px] text-white/70 mt-0.5">Tanggung jawab {institutionShortName}</p>
          </div>
        </div>

        {/* Card 2: Perlu Tindak Lanjut / Verifikasi */}
        <div className="bg-white p-5 rounded-xl border border-[#D9DEE7] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-medium text-[#747686]">Perlu Diverifikasi</span>
            <div className="w-8 h-8 rounded-lg bg-[#FEF3E6] text-[#B2640A] flex items-center justify-center">
              <ClipboardCheck size={18} aria-hidden="true" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-[28px] font-bold text-[#B2640A]">
              {metrics.needVerification}
            </span>
            <p className="text-[11px] text-[#747686] mt-0.5">Antrean verifikasi teknis</p>
          </div>
        </div>

        {/* Card 3: Dalam Proses */}
        <div className="bg-white p-5 rounded-xl border border-[#D9DEE7] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-medium text-[#747686]">Dalam Penanganan</span>
            <div className="w-8 h-8 rounded-lg bg-[#EEF2FC] text-[#1749D2] flex items-center justify-center">
              <Clock3 size={18} aria-hidden="true" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-[28px] font-bold text-[#1749D2]">
              {metrics.inProgress}
            </span>
            <p className="text-[11px] text-[#747686] mt-0.5">Tindakan lapangan aktif</p>
          </div>
        </div>

        {/* Card 4: Selesai */}
        <div className="bg-white p-5 rounded-xl border border-[#D9DEE7] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-medium text-[#747686]">Laporan Selesai</span>
            <div className="w-8 h-8 rounded-lg bg-[#EDF7F2] text-[#16845B] flex items-center justify-center">
              <CircleCheck size={18} aria-hidden="true" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-[28px] font-bold text-[#16845B]">
              {metrics.resolved}
            </span>
            <p className="text-[11px] text-[#747686] mt-0.5">Tuntas ditangani</p>
          </div>
        </div>

        {/* Card 5: Balasan Warga Perlu Perhatian */}
        <div className="bg-white p-5 rounded-xl border border-[#D9DEE7] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-medium text-[#747686]">Balasan Warga</span>
            <div className="w-8 h-8 rounded-lg bg-[#FFDAD6] text-[#BA1A1A] flex items-center justify-center">
              <MessageSquareWarning size={18} aria-hidden="true" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-[28px] font-bold text-[#BA1A1A]">
              {metrics.citizenAttention}
            </span>
            <p className="text-[11px] text-[#747686] mt-0.5">Membutuhkan tanggapan</p>
          </div>
        </div>
      </div>

      {/* OPERATIONAL INBOX FOR PETUGAS */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[18px] font-bold text-[#111C2D]">
              Daftar Laporan Ditugaskan ke {institutionShortName}
            </h2>
            <p className="text-[13px] text-[#747686] mt-0.5">
              Kelola pengaduan, perbarui status penanganan, dan berikan tanggapan resmi kepada warga.
            </p>
          </div>
        </div>

        <ReportInboxClient
          initialReports={reports}
          categories={categories}
          userRole="petugas"
        />
      </div>
    </div>
  );
}
