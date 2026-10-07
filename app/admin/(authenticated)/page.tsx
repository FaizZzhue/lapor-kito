import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Activity,
  ArrowRight,
  Badge,
  BarChart3,
  Building2,
  CircleCheck,
  CircleX,
  ClipboardCheck,
  Clock3,
  Copy,
  FileText,
  History,
  Inbox,
  ListChecks,
  PencilLine,
  Send,
  Server,
  Settings2,
  ShieldCheck,
  Tags,
  Users,
  Warehouse,
  type LucideIcon,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { getCurrentInternalUser } from "@/lib/auth/session";
import type { ReportStatus } from "@/types/database";
export const dynamic = "force-dynamic";

// ====================================================================
// STATUS CONFIG
// ====================================================================

const STATUS_CONFIG: Record<
  ReportStatus,
  {
    label: string;
    icon: LucideIcon;
    color: string;
    bgColor: string;
    borderColor: string;
  }
> = {
  draft: {
    label: "Draf",
    icon: PencilLine,
    color: "#747686",
    bgColor: "#F0F3FF",
    borderColor: "#D9DEE7",
  },
  submitted: {
    label: "Dikirim",
    icon: Send,
    color: "#0033A7",
    bgColor: "#EEF2FC",
    borderColor: "#C4D3F8",
  },
  verifying: {
    label: "Verifikasi",
    icon: ClipboardCheck,
    color: "#B2640A",
    bgColor: "#FEF3E6",
    borderColor: "#FCD7A9",
  },
  verified: {
    label: "Terverifikasi",
    icon: CircleCheck,
    color: "#16845B",
    bgColor: "#EDF7F2",
    borderColor: "#B5E2CD",
  },
  in_progress: {
    label: "Dalam Proses",
    icon: Clock3,
    color: "#1749D2",
    bgColor: "#EEF2FC",
    borderColor: "#C4D3F8",
  },
  resolved: {
    label: "Selesai",
    icon: ListChecks,
    color: "#16845B",
    bgColor: "#EDF7F2",
    borderColor: "#B5E2CD",
  },
  rejected: {
    label: "Ditolak",
    icon: CircleX,
    color: "#BA1A1A",
    bgColor: "#FFDAD6",
    borderColor: "#FFB4AB",
  },
  duplicate: {
    label: "Duplikat",
    icon: Copy,
    color: "#747686",
    bgColor: "#F0F3FF",
    borderColor: "#D9DEE7",
  },
};

// ====================================================================
// PAGE
// ====================================================================

export default async function AdminDashboardPage() {
  const { internalUser } = await getCurrentInternalUser();
  if (internalUser?.role === "petugas") {
    redirect("/admin/laporan");
  }

  const supabase = await createClient();

  // Parallel queries for all metrics — real data only
  const [
    { count: categoriesCount },
    { count: internalUsersCount },
    institutionsRes,
    unitsRes,
    authorityRulesRes,
    activeStaffRes,
    reportsRes,
    timelineRes,
    responsesRes,
  ] = await Promise.all([
    supabase.from("categories").select("*", { count: "exact", head: true }),
    supabase.from("internal_users").select("*", { count: "exact", head: true }),
    supabase.from("institutions").select("*", { count: "exact", head: true }),
    supabase.from("institution_units").select("*", { count: "exact", head: true }),
    supabase.from("authority_rules").select("*", { count: "exact", head: true }),
    supabase.from("internal_users").select("*", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("reports").select("id, status"),
    supabase.from("report_timeline").select("*", { count: "exact", head: true }),
    supabase.from("report_responses").select("*", { count: "exact", head: true }),
  ]);

  const institutionsCount = institutionsRes.error ? 0 : (institutionsRes.count ?? 0);
  const unitsCount = unitsRes.error ? 0 : (unitsRes.count ?? 0);
  const authorityRulesCount = authorityRulesRes.error ? 0 : (authorityRulesRes.count ?? 0);
  const activeStaff = activeStaffRes.error ? 0 : (activeStaffRes.count ?? 0);
  const timelineCount = timelineRes.error ? 0 : (timelineRes.count ?? 0);
  const responsesCount = responsesRes.error ? 0 : (responsesRes.count ?? 0);

  // Build report status breakdown
  const reports = reportsRes.data ?? [];
  const totalReports = reports.length;
  const statusCounts: Record<ReportStatus, number> = {
    draft: 0, submitted: 0, verifying: 0, verified: 0,
    in_progress: 0, resolved: 0, rejected: 0, duplicate: 0,
  };
  for (const r of reports) {
    const s = r.status as ReportStatus;
    if (s in statusCounts) statusCounts[s]++;
  }

  return (
    <div className="flex flex-col w-full">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#D9DEE7]/80 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1749D2]" />
            <p className="text-[11px] font-semibold text-[#747686] uppercase tracking-wider">
              Sistem Pusat • Konsol Administrator Operasional
            </p>
          </div>
          <h1 className="text-[26px] font-semibold text-[#111C2D] tracking-tight">
            Ringkasan Platform
          </h1>
          <p className="text-[14px] text-[#434654] mt-1">
            Pemantauan real-time terhadap ekosistem LAPORKITO Kota Palembang berdasarkan data aktual.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#EDF7F2] border border-[#B5E2CD] rounded-lg shadow-sm self-start md:self-auto">
          <CircleCheck size={18} strokeWidth={2} className="text-[#16845B]" />
          <div className="flex flex-col">
            <span className="text-[11px] font-semibold text-[#111C2D]">Sistem Operasional</span>
            <span className="text-[10px] text-[#747686]">Fase 4F — Dashboard Aktif</span>
          </div>
        </div>
      </div>

      {/* ================================================================ */}
      {/* SECTION 1: LAPORAN OVERVIEW */}
      {/* ================================================================ */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 size={20} strokeWidth={2} className="text-[#1749D2]" />
          <h2 className="text-[18px] font-semibold text-[#111C2D]">Ringkasan Laporan</h2>
        </div>

        {/* Total Reports Hero Card */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div className="bg-gradient-to-br from-[#1749D2] to-[#0033A7] p-5 rounded-xl shadow-sm flex flex-col justify-between sm:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-medium text-white/80">Total Laporan</span>
              <FileText size={20} strokeWidth={2} className="text-white/60" />
            </div>
            <div className="mt-4">
              <span className="text-[32px] font-bold text-white">{totalReports}</span>
              <p className="text-[12px] text-white/70 mt-0.5">Seluruh laporan warga</p>
            </div>
          </div>

          {/* Key Status Cards */}
          <StatusCard
            label="Baru / Dikirim"
            count={statusCounts.submitted}
            icon={Send}
            color="#0033A7"
            bgColor="#EEF2FC"
          />
          <StatusCard
            label="Dalam Proses"
            count={statusCounts.in_progress + statusCounts.verifying + statusCounts.verified}
            icon={Clock3}
            color="#B2640A"
            bgColor="#FEF3E6"
          />
          <StatusCard
            label="Selesai"
            count={statusCounts.resolved}
            icon={ListChecks}
            color="#16845B"
            bgColor="#EDF7F2"
          />
        </div>

        {/* Full Status Breakdown */}
        {totalReports > 0 ? (
          <div className="bg-white rounded-xl border border-[#D9DEE7] shadow-sm p-5">
            <p className="text-[13px] font-semibold text-[#111C2D] mb-3">Distribusi Status Laporan</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(Object.entries(STATUS_CONFIG) as [ReportStatus, typeof STATUS_CONFIG[ReportStatus]][]).map(
                ([status, cfg]) => {
                  const Icon = cfg.icon;
                  return (
                    <div
                      key={status}
                      className="flex items-center gap-2.5 p-3 rounded-lg border"
                      style={{ borderColor: cfg.borderColor, backgroundColor: cfg.bgColor }}
                    >
                      <Icon
                        size={18}
                        strokeWidth={2}
                        style={{ color: cfg.color }}
                      />
                      <div>
                        <p className="text-[12px] font-medium" style={{ color: cfg.color }}>
                          {cfg.label}
                        </p>
                        <p className="text-[16px] font-bold text-[#111C2D]">
                          {statusCounts[status]}
                        </p>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-[#D9DEE7] shadow-sm p-8 text-center">
            <div className="w-12 h-12 rounded-xl bg-[#F0F3FF] flex items-center justify-center mx-auto mb-3">
              <Inbox size={28} strokeWidth={2} className="text-[#747686]" />
            </div>
            <p className="text-[14px] font-medium text-[#434654]">Belum Ada Laporan</p>
            <p className="text-[12px] text-[#747686] mt-1">
              Sistem LAPORKITO belum menerima laporan warga. Data distribusi status akan tampil setelah laporan pertama dikirim.
            </p>
          </div>
        )}
      </div>

      {/* ================================================================ */}
      {/* SECTION 2: INFRASTRUKTUR PLATFORM */}
      {/* ================================================================ */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Server size={20} strokeWidth={2} className="text-[#1749D2]" />
          <h2 className="text-[18px] font-semibold text-[#111C2D]">Infrastruktur Platform</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <MetricCard label="Instansi" count={institutionsCount} icon={Building2} href="/admin/instansi" />
          <MetricCard label="Unit Teknis" count={unitsCount} icon={Warehouse} href="/admin/unit" />
          <MetricCard label="Pengguna Aktif" count={activeStaff} icon={Badge} href="/admin/pengguna-internal" />
          <MetricCard label="Kategori" count={categoriesCount ?? 0} icon={Tags} href="/admin/kategori-laporan" color="#16845B" />
          <MetricCard label="Aturan Kewenangan" count={authorityRulesCount} icon={ShieldCheck} href="/admin/data-kewenangan" />
          <MetricCard label="Total Pengguna" count={internalUsersCount ?? 0} icon={Users} href="/admin/pengguna-internal" />
        </div>
      </div>

      {/* ================================================================ */}
      {/* SECTION 3: AKTIVITAS & DATA OPERASIONAL */}
      {/* ================================================================ */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Activity size={20} strokeWidth={2} className="text-[#1749D2]" />
          <h2 className="text-[18px] font-semibold text-[#111C2D]">Aktivitas Operasional</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Activity Timeline */}
          <div className="bg-white rounded-xl border border-[#D9DEE7] shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[13px] font-semibold text-[#111C2D]">Aktivitas Terbaru</p>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#F0F3FF] text-[#747686] font-medium">
                {timelineCount + responsesCount} Entri
              </span>
            </div>
            {timelineCount + responsesCount > 0 ? (
              <p className="text-[13px] text-[#434654]">
                Terdapat {timelineCount} entri timeline dan {responsesCount} tanggapan terdokumentasi.
              </p>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-10 h-10 rounded-lg bg-[#F0F3FF] flex items-center justify-center mb-3">
                  <History size={22} strokeWidth={2} className="text-[#747686]" />
                </div>
                <p className="text-[13px] text-[#434654] font-medium">Belum Ada Aktivitas</p>
                <p className="text-[12px] text-[#747686] mt-1 max-w-xs">
                  Riwayat timeline laporan dan tanggapan instansi akan ditampilkan di sini setelah laporan warga diproses.
                </p>
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div className="bg-white rounded-xl border border-[#D9DEE7] shadow-sm p-5">
            <p className="text-[13px] font-semibold text-[#111C2D] mb-4">Aksi Cepat</p>
            <div className="flex flex-col gap-2">
              <QuickLink href="/admin/laporan" icon={Inbox} label="Laporan Masuk" description="Buka antrean inspeksi operasional laporan warga" />
              <QuickLink href="/admin/instansi" icon={Building2} label="Kelola Instansi" description="Tambah atau edit OPD penerima laporan" />
              <QuickLink href="/admin/pengguna-internal" icon={Badge} label="Kelola Pengguna" description="Undang atau atur akun staf internal" />
              <QuickLink href="/admin/data-kewenangan" icon={ShieldCheck} label="Aturan Kewenangan" description="Konfigurasi matriks routing laporan" />
              <QuickLink href="/admin/pengaturan-sistem" icon={Settings2} label="Pengaturan Sistem" description="Konfigurasi parameter platform" />
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================ */}
      {/* SECTION 4: DATA MASTER MANAGEMENT (existing) */}
      {/* ================================================================ */}
      <div className="flex flex-col gap-4 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div>
            <h2 className="text-[18px] font-semibold text-[#111C2D]">
              Pusat Pengelolaan Data Master
            </h2>
            <p className="text-[13px] text-[#434654]">
              Pilih entitas data untuk memperbarui struktur kedinasan, hak verifikasi, dan aturan penerusan laporan warga.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#D9DEE7] shadow-sm overflow-hidden flex flex-col divide-y divide-[#F0F3FF]">
          <DataMasterRow href="/admin/instansi" icon={Building2} label="Instansi" badge={`${institutionsCount} Instansi Terdaftar`} description="Kelola daftar instansi penerima laporan kedinasan (PUPR, DLHK, Dishub, Perumda Tirta Musi, dll)." />
          <DataMasterRow href="/admin/unit" icon={Warehouse} label="Unit Instansi" badge={`${unitsCount} Unit Pelaksana`} description="Kelola unit kerja dan seksi operasional di bawah instansi (UPT Wilayah, Seksi Jalan & Jembatan, Posko Kebersihan)." />
          <DataMasterRow href="/admin/pengguna-internal" icon={Badge} label="Pengguna Internal" badge={`${internalUsersCount ?? 0} Pengguna`} description="Kelola akun ASN, verifikator lapangan, dan operator penerima pengaduan di lingkungan Pemkot Palembang." />
          <DataMasterRow href="/admin/kategori-laporan" icon={Tags} label="Kategori Laporan" badge={`${categoriesCount ?? 0} Kategori Aktif`} badgeColor="green" description="Kelola taksonomi insiden sipil resmi (Infrastruktur & Jalan, Kebersihan & Sampah, Drainase & Banjir, Penerangan Jalan)." />
          <DataMasterRow href="/admin/data-kewenangan" icon={ShieldCheck} label="Data Kewenangan" badge={`${authorityRulesCount} Aturan Aktif`} description="Kelola matriks aturan routing pengaduan warga ke instansi yang berwenang secara akurat." />
        </div>
      </div>
    </div>
  );
}

// ====================================================================
// SUB-COMPONENTS
// ====================================================================

function StatusCard({
  label,
  count,
  icon: Icon,
  color,
  bgColor,
}: {
  label: string;
  count: number;
  icon: LucideIcon;
  color: string;
  bgColor: string;
}) {
  return (
    <div className="bg-white p-5 rounded-xl border border-[#D9DEE7] shadow-sm flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-medium text-[#747686]">{label}</span>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: bgColor }}>
          <Icon size={18} strokeWidth={2} style={{ color }} />
        </div>
      </div>
      <div className="mt-4">
        <span className="text-[26px] font-bold text-[#111C2D]">{count}</span>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  count,
  icon: Icon,
  href,
  color = "#1749D2",
}: {
  label: string;
  count: number;
  icon: LucideIcon;
  href: string;
  color?: string;
}) {
  return (
    <Link
      href={href}
      className="bg-white p-4 rounded-xl border border-[#D9DEE7] shadow-sm hover:border-[#C4D3F8] hover:shadow-md transition-all group"
    >
      <div className="flex items-center gap-2.5 mb-2">
        <div className="w-8 h-8 rounded-lg bg-[#F0F3FF] flex items-center justify-center" style={{ color }}>
          <Icon size={18} strokeWidth={2} />
        </div>
        <span className="text-[12px] font-medium text-[#747686]">{label}</span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-[22px] font-bold text-[#111C2D]">{count}</span>
        <ArrowRight size={14} strokeWidth={2} className="text-[#747686] group-hover:text-[#1749D2] transition-colors" />
      </div>
    </Link>
  );
}

function QuickLink({
  href,
  icon: Icon,
  label,
  description,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#F0F3FF] transition-colors group"
    >
      <div className="w-9 h-9 rounded-lg bg-[#F0F3FF] flex items-center justify-center shrink-0 text-[#0033A7] group-hover:bg-[#DFE8FF] transition-colors">
        <Icon size={18} strokeWidth={2} />
      </div>
      <div className="min-w-0">
        <p className="text-[13px] font-semibold text-[#111C2D] group-hover:text-[#0033A7] transition-colors">{label}</p>
        <p className="text-[12px] text-[#747686] truncate">{description}</p>
      </div>
      <ArrowRight size={16} strokeWidth={2} className="text-[#747686] ml-auto shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
    </Link>
  );
}

function DataMasterRow({
  href,
  icon: Icon,
  label,
  badge,
  badgeColor,
  description,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  badge: string;
  badgeColor?: "green" | "blue";
  description: string;
}) {
  const badgeClasses =
    badgeColor === "green"
      ? "bg-[#EDF7F2] text-[#16845B] border border-[#B5E2CD]"
      : "bg-[#F0F3FF] text-[#0033A7] border border-[#D9DEE7]";

  return (
    <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-[#F9F9FF] transition-colors">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-lg bg-[#F0F3FF] flex items-center justify-center shrink-0 mt-0.5 text-[#0033A7]">
          <Icon size={22} strokeWidth={2} />
        </div>
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-[15px] font-semibold text-[#111C2D]">{label}</span>
            <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${badgeClasses}`}>
              {badge}
            </span>
          </div>
          <p className="text-[13px] text-[#434654] mt-0.5 max-w-2xl leading-relaxed">
            {description}
          </p>
        </div>
      </div>
      <div className="flex items-center self-end md:self-center shrink-0">
        <Link
          href={href}
          className="inline-flex items-center gap-1.5 text-[13px] text-[#0033A7] hover:text-[#1749D2] font-semibold transition-colors px-3 py-1.5 rounded-lg hover:bg-[#F0F3FF]"
        >
          <span>Buka</span>
          <ArrowRight size={16} strokeWidth={2} />
        </Link>
      </div>
    </div>
  );
}
