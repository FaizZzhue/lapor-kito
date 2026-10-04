"use client";

import Link from "next/link";
import Image from "next/image";
import {
  MapPin,
  Calendar,
  Building2,
  CheckCircle2,
  Clock,
  Reply,
  ShieldCheck,
  AlertCircle,
  FileText,
  AlertTriangle,
  HelpCircle,
  ArrowRight,
} from "lucide-react";
import type { TrackingLookupResult } from "@/lib/actions/tracking";
import { TrackingSearchBar } from "@/components/pantau/search-bar";

interface TrackingDetailViewProps {
  trackingCode: string;
  result: TrackingLookupResult;
}

export function TrackingDetailView({ trackingCode, result }: TrackingDetailViewProps) {
  if (!result.success || !result.report) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="rounded-xl border border-[#D9DEE7] bg-white p-6 shadow-sm">
          <TrackingSearchBar initialCode={trackingCode} />
        </div>

        <div className="rounded-xl border border-[#FFDAD6] bg-white p-8 text-center space-y-4 shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#FFF5F5] text-[#BA1A1A]">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold text-[#111C2D]">Laporan Tidak Ditemukan</h2>
          <p className="text-xs text-[#434654] max-w-md mx-auto leading-relaxed">
            {result.error ||
              `Tidak ada laporan dengan kode "${trackingCode}". Pastikan format kode sudah sesuai (contoh: LPK-20261002-XXXX).`}
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <Link
              href="/pantau"
              className="inline-flex h-9 items-center justify-center rounded-lg border border-[#D9DEE7] bg-white px-4 font-mono text-xs font-semibold text-[#111C2D] hover:bg-[#F0F3FF]"
            >
              Cari Kode Lain
            </Link>
            <Link
              href="/lapor"
              className="inline-flex h-9 items-center justify-center rounded-lg bg-[#1749D2] px-4 font-mono text-xs font-semibold text-white hover:bg-[#0033A7]"
            >
              Buat Laporan Baru
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { report, categoryName, kelurahanName, kecamatanName, evidence, timeline, responses } =
    result;

  // Lifecycle steps mapping
  const statusOrder: Record<string, number> = {
    draft: 0,
    submitted: 1,
    verifying: 2,
    verified: 2,
    in_progress: 3,
    resolved: 4,
    rejected: -1,
    duplicate: -1,
  };

  const currentStep = statusOrder[report.status] ?? 1;
  const isRejected = report.status === "rejected";
  const isDuplicate = report.status === "duplicate";

  const getStatusBadge = () => {
    switch (report.status) {
      case "submitted":
        return { label: "Laporan Diterima", bg: "bg-[#F0F3FF] text-[#1749D2] border-[#D9DEE7]" };
      case "verifying":
        return { label: "Sedang Diverifikasi", bg: "bg-[#FFF8EF] text-[#8C5000] border-[#E58A1F]/40" };
      case "verified":
        return { label: "Terverifikasi", bg: "bg-[#E6F7EF] text-[#006443] border-[#78D9AA]/50" };
      case "in_progress":
        return { label: "Dalam Penanganan", bg: "bg-[#E6F7EF] text-[#006443] border-[#78D9AA]/50" };
      case "resolved":
        return { label: "Selesai Dikerjakan", bg: "bg-[#E6F7EF] text-[#006443] border-[#78D9AA]/50" };
      case "rejected":
        return { label: "Ditolak", bg: "bg-[#FFF5F5] text-[#BA1A1A] border-[#FFDAD6]" };
      case "duplicate":
        return { label: "Duplikat", bg: "bg-[#FFF5F5] text-[#BA1A1A] border-[#FFDAD6]" };
      default:
        return { label: report.status, bg: "bg-[#F0F3FF] text-[#1749D2] border-[#D9DEE7]" };
    }
  };

  const badge = getStatusBadge();

  return (
    <div className="space-y-6">
      {/* Top Search Bar */}
      <div className="rounded-xl border border-[#D9DEE7] bg-white p-4 shadow-sm">
        <TrackingSearchBar initialCode={trackingCode} />
      </div>

      {/* Main Report Header Banner */}
      <div className="rounded-xl border border-[#D9DEE7] bg-white p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-mono text-xl sm:text-2xl font-bold text-[#111C2D]">
                Laporan #{report.tracking_code}
              </h1>
              <span
                className={`rounded-full px-3 py-0.5 font-mono text-xs font-semibold border ${badge.bg}`}
              >
                {badge.label}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-semibold text-[#111C2D]">{report.title}</h2>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#667085] font-mono">
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-[#1749D2]" />
                {kelurahanName ? `Kel. ${kelurahanName}, ` : ""}
                {kecamatanName ? `Kec. ${kecamatanName}` : "Kota Palembang"}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-[#667085]" />
                {new Date(report.created_at).toLocaleString("id-ID", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}{" "}
                WIB
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-[#D9DEE7] bg-[#F0F3FF] px-3.5 py-2 text-xs font-mono text-[#434654] self-start md:self-center">
            <ShieldCheck className="h-4 w-4 text-[#16845B] shrink-0" />
            <span>Pemantauan Publik Terbuka</span>
          </div>
        </div>
      </div>

      {/* 2-Column Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Lifecycle Timeline & Official Responses */}
        <div className="lg:col-span-7 space-y-6">
          {/* Status Timeline Card */}
          <div className="rounded-xl border border-[#D9DEE7] bg-white p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#D9DEE7]">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-[#1749D2]" />
                <h3 className="text-base font-bold text-[#111C2D]">Tahapan Progres Penanganan</h3>
              </div>
              <span className="font-mono text-xs text-[#667085]">Audit Trail Sistem</span>
            </div>

            {/* Visual Step Progression */}
            <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-[#D9DEE7]">
              {/* Step 1: Laporan Dibuat */}
              <div className="relative flex items-start gap-3">
                <div
                  className={`absolute -left-[24px] top-0.5 flex h-5 w-5 items-center justify-center rounded-full text-white font-mono text-[10px] font-bold ${
                    currentStep >= 1 ? "bg-[#1749D2]" : "bg-gray-300"
                  }`}
                >
                  ✓
                </div>
                <div>
                  <p className="text-xs font-bold text-[#111C2D]">Laporan Dicatat</p>
                  <p className="text-[11px] text-[#667085] mt-0.5">
                    Laporan berhasil dicatat dalam platform pra-pelaporan.
                  </p>
                </div>
              </div>

              {/* Step 2: Verifikasi */}
              <div className="relative flex items-start gap-3">
                <div
                  className={`absolute -left-[24px] top-0.5 flex h-5 w-5 items-center justify-center rounded-full text-white font-mono text-[10px] font-bold ${
                    currentStep >= 2 ? "bg-[#1749D2]" : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {currentStep >= 2 ? "✓" : "2"}
                </div>
                <div>
                  <p
                    className={`text-xs font-bold ${
                      currentStep >= 2 ? "text-[#111C2D]" : "text-[#667085]"
                    }`}
                  >
                    Verifikasi Berkas & Bukti Lapangan
                  </p>
                  <p className="text-[11px] text-[#667085] mt-0.5">
                    Pemeriksaan kesesuaian uraian dan foto oleh petugas verifikator.
                  </p>
                </div>
              </div>

              {/* Step 3: Dalam Penanganan */}
              <div className="relative flex items-start gap-3">
                <div
                  className={`absolute -left-[24px] top-0.5 flex h-5 w-5 items-center justify-center rounded-full text-white font-mono text-[10px] font-bold ${
                    currentStep >= 3 ? "bg-[#1749D2]" : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {currentStep >= 3 ? "✓" : "3"}
                </div>
                <div>
                  <p
                    className={`text-xs font-bold ${
                      currentStep >= 3 ? "text-[#111C2D]" : "text-[#667085]"
                    }`}
                  >
                    Diteruskan ke Instansi / Penanganan Lapangan
                  </p>
                  <p className="text-[11px] text-[#667085] mt-0.5">
                    Instansi teknis melakukan tinjauan fisik dan jadwal perbaikan.
                  </p>
                </div>
              </div>

              {/* Step 4: Selesai */}
              <div className="relative flex items-start gap-3">
                <div
                  className={`absolute -left-[24px] top-0.5 flex h-5 w-5 items-center justify-center rounded-full text-white font-mono text-[10px] font-bold ${
                    currentStep >= 4 ? "bg-[#16845B]" : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {currentStep >= 4 ? "✓" : "4"}
                </div>
                <div>
                  <p
                    className={`text-xs font-bold ${
                      currentStep >= 4 ? "text-[#16845B]" : "text-[#667085]"
                    }`}
                  >
                    Penanganan Selesai
                  </p>
                  <p className="text-[11px] text-[#667085] mt-0.5">
                    Pekerjaan perbaikan di lapangan telah rampung dikonfirmasi.
                  </p>
                </div>
              </div>
            </div>

            {/* Real Timeline Events from DB */}
            {timeline && timeline.length > 0 && (
              <div className="pt-4 border-t border-[#D9DEE7] space-y-3">
                <span className="font-mono text-xs font-semibold text-[#111C2D] block uppercase">
                  Catatan Riwayat Terdaftar:
                </span>
                <div className="space-y-2">
                  {timeline.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-lg border border-[#D9DEE7] bg-[#F9F9FF] p-3 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between font-mono text-[11px]">
                        <span className="font-semibold text-[#111C2D]">{item.action}</span>
                        <span className="text-[#667085]">
                          {new Date(item.created_at).toLocaleString("id-ID", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })}{" "}
                          WIB
                        </span>
                      </div>
                      {item.notes && <p className="text-[#434654] text-[11px]">{item.notes}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Official Responses Card */}
          <div className="rounded-xl border border-[#D9DEE7] bg-white p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#D9DEE7]">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-[#16845B]" />
                <h3 className="text-base font-bold text-[#111C2D]">Tanggapan Resmi Instansi</h3>
              </div>
              <span className="rounded-full bg-[#E6F7EF] border border-[#78D9AA]/50 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-[#006443]">
                {responses?.length || 0} Tanggapan
              </span>
            </div>

            {responses && responses.length > 0 ? (
              <div className="space-y-4">
                {responses.map((resp) => (
                  <div
                    key={resp.id}
                    className="rounded-xl border border-[#D9DEE7] bg-[#F0F3FF] p-4 space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#0033A7] text-white">
                          <Building2 className="h-4 w-4" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-[#111C2D]">
                            Petugas Teknis Instansi
                          </h4>
                          <span className="font-mono text-[10px] text-[#667085] uppercase">
                            Tipe: {resp.response_type}
                          </span>
                        </div>
                      </div>
                      <span className="font-mono text-[11px] text-[#667085]">
                        {new Date(resp.created_at).toLocaleString("id-ID", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}{" "}
                        WIB
                      </span>
                    </div>

                    <blockquote className="rounded-lg bg-white p-3.5 border border-[#D9DEE7] text-xs text-[#111C2D] leading-relaxed">
                      &quot;{resp.message}&quot;
                    </blockquote>

                    <div className="flex justify-end pt-1">
                      <Link
                        href={`/pantau/${report.tracking_code}/tanggapan`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[#D9DEE7] bg-white px-3 py-1.5 font-mono text-xs font-semibold text-[#111C2D] hover:bg-[#F9F9FF] shadow-xs"
                      >
                        <Reply className="h-3.5 w-3.5 text-[#1749D2]" />
                        <span>Balas Tanggapan</span>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-[#D9DEE7] bg-[#F9F9FF] p-6 text-center space-y-2">
                <HelpCircle className="mx-auto h-8 w-8 text-[#667085]" />
                <p className="text-xs font-semibold text-[#111C2D]">
                  Belum ada tanggapan resmi dari instansi penanganan
                </p>
                <p className="text-[11px] text-[#667085] max-w-sm mx-auto leading-relaxed">
                  Laporan Anda masih dalam antrean penelaahan teknis. Petugas akan mencantumkan
                  pembaruan jadwal atau tindakan lapangan di bagian ini.
                </p>
                <div className="pt-2">
                  <Link
                    href={`/pantau/${report.tracking_code}/tanggapan`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#D9DEE7] bg-white px-3.5 py-2 font-mono text-xs font-semibold text-[#1749D2] hover:bg-[#F0F3FF]"
                  >
                    <Reply className="h-3.5 w-3.5" />
                    <span>Tambahkan Keterangan Warga</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Report Details, Public Evidence & Privacy */}
        <div className="lg:col-span-5 space-y-6">
          {/* Summary Card */}
          <div className="rounded-xl border border-[#D9DEE7] bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[#D9DEE7]">
              <FileText className="h-5 w-5 text-[#1749D2]" />
              <h3 className="text-base font-bold text-[#111C2D]">Ringkasan Laporan</h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="rounded-lg bg-[#F9F9FF] border border-[#D9DEE7] p-3 space-y-1">
                <span className="font-mono text-[11px] font-semibold text-[#667085] uppercase">
                  Uraian Kejadian
                </span>
                <p className="text-[#111C2D] leading-relaxed mt-1">{report.description}</p>
              </div>

              <div className="grid grid-cols-1 gap-2 font-mono">
                <div className="rounded-lg bg-[#F9F9FF] border border-[#D9DEE7] px-3 py-2 flex justify-between items-center">
                  <span className="text-[#667085]">Kategori:</span>
                  <span className="font-semibold text-[#111C2D]">{categoryName}</span>
                </div>

                <div className="rounded-lg bg-[#F9F9FF] border border-[#D9DEE7] px-3 py-2 flex justify-between items-center">
                  <span className="text-[#667085]">Lokasi Alamat:</span>
                  <span className="font-medium text-[#111C2D] text-right truncate max-w-[200px]">
                    {report.address_detail}
                  </span>
                </div>

                <div className="rounded-lg bg-[#F0F3FF] border border-[#D9DEE7] px-3 py-2 flex justify-between items-center">
                  <span className="text-[#667085]">Instansi Sasaran:</span>
                  <span className="font-bold text-[#0033A7] text-right truncate max-w-[200px]">
                    {report.authority_target || "Dinas Terkait Kota Palembang"}
                  </span>
                </div>
              </div>
            </div>

            {/* Evidence Photos */}
            <div className="space-y-2 pt-3 border-t border-[#D9DEE7]">
              <span className="font-mono text-xs font-semibold text-[#111C2D] block uppercase">
                Bukti Foto Lapangan ({evidence?.length || 0})
              </span>
              {evidence && evidence.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {evidence.map((ev) => (
                    <div
                      key={ev.id}
                      className="relative h-28 rounded-lg overflow-hidden border border-[#D9DEE7] bg-gray-100 group"
                    >
                      <Image
                        src={ev.file_url}
                        alt={ev.caption || "Bukti Laporan"}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#667085] italic font-mono">
                  Tidak ada berkas bukti yang dilampirkan.
                </p>
              )}
            </div>
          </div>

          {/* Privacy & Governance Notice */}
          <div className="rounded-xl border border-[#D9DEE7] bg-[#F0F3FF] p-5 space-y-2 text-xs text-[#434654]">
            <div className="flex items-center gap-1.5 font-bold font-mono text-[#1749D2]">
              <ShieldCheck className="h-4 w-4" />
              <span>PERLINDUNGAN PRIVASI PELAPOR</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Sesuai kebijakan perlindungan privasi LAPORKITO, identitas pribadi pelapor (nama, nomor
              telepon, dan email) dirahasiakan sepenuhnya dan tidak dapat diakses pada halaman
              pemantauan publik ini.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
