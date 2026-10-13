"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  MapPin,
  Calendar,
  Building2,
  Clock,
  Reply,
  ShieldCheck,
  AlertCircle,
  FileText,
  HelpCircle,
  Check,
  Camera,
  Maximize2,
  X,
} from "lucide-react";
import type { TrackingLookupResult } from "@/lib/actions/tracking";
import { TrackingSearchBar } from "@/components/pantau/search-bar";

interface TrackingDetailViewProps {
  trackingCode: string;
  result: TrackingLookupResult;
}

export function TrackingDetailView({ trackingCode, result }: TrackingDetailViewProps) {
  const [previewImage, setPreviewImage] = useState<{ url: string; caption?: string } | null>(null);
  if (!result.success || !result.report) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
          <TrackingSearchBar initialCode={trackingCode} />
        </div>

        <div className="rounded-2xl border border-red-200 bg-white p-8 sm:p-10 text-center space-y-4 shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-700">
            <AlertCircle className="h-7 w-7" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Laporan Tidak Ditemukan</h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
            {result.error ||
              `Tidak ditemukan catatan laporan dengan kode "${trackingCode}". Pastikan format kode sudah sesuai (contoh: LPK-20261002-XXXX).`}
          </p>
          <div className="pt-2 flex flex-wrap justify-center gap-3">
            <Link
              href="/pantau"
              className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-300 bg-white px-5 font-mono text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cari Kode Lain
            </Link>
            <Link
              href="/lapor"
              className="inline-flex h-10 items-center justify-center rounded-lg bg-blue-700 px-5 font-mono text-xs font-bold text-white hover:bg-blue-800 transition-colors"
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
        return { label: "Laporan Diterima", bg: "bg-blue-50 text-blue-800 border-blue-200" };
      case "verifying":
        return { label: "Sedang Diverifikasi", bg: "bg-amber-50 text-amber-800 border-amber-200" };
      case "verified":
        return { label: "Terverifikasi", bg: "bg-emerald-50 text-emerald-800 border-emerald-200" };
      case "in_progress":
        return { label: "Dalam Penanganan", bg: "bg-blue-50 text-blue-800 border-blue-200" };
      case "resolved":
        return { label: "Selesai Dikerjakan", bg: "bg-emerald-50 text-emerald-800 border-emerald-200" };
      case "rejected":
        return { label: "Ditolak", bg: "bg-red-50 text-red-800 border-red-200" };
      case "duplicate":
        return { label: "Duplikat", bg: "bg-red-50 text-red-800 border-red-200" };
      default:
        return { label: report.status, bg: "bg-slate-100 text-slate-800 border-slate-200" };
    }
  };

  const getPriorityBadge = () => {
    switch (report.priority) {
      case "critical":
        return { label: "Kritis", bg: "bg-red-50 text-red-800 border-red-200" };
      case "high":
        return { label: "Tinggi", bg: "bg-amber-50 text-amber-800 border-amber-200" };
      case "medium":
        return { label: "Sedang", bg: "bg-blue-50 text-blue-800 border-blue-200" };
      case "low":
        return { label: "Rendah", bg: "bg-slate-100 text-slate-700 border-slate-200" };
      default:
        return { label: report.priority, bg: "bg-slate-100 text-slate-700 border-slate-200" };
    }
  };

  const badge = getStatusBadge();
  const priorityBadge = getPriorityBadge();

  return (
    <div className="space-y-6">
      {/* Top Search Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-2xs">
        <TrackingSearchBar initialCode={trackingCode} />
      </div>

      {/* Main Report Header Banner — Editorial Blue */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-base sm:text-xl font-extrabold text-blue-800 break-all select-all">
                #{report.tracking_code}
              </span>
              <span className={`rounded-full px-3 py-0.5 font-mono text-xs font-bold border ${badge.bg}`}>
                {badge.label}
              </span>
              <span className={`rounded-full px-3 py-0.5 font-mono text-xs font-semibold border ${priorityBadge.bg}`}>
                Prioritas: {priorityBadge.label}
              </span>
            </div>

            <h1 className="text-lg sm:text-2xl font-extrabold text-slate-900 tracking-tight break-words">
              {report.title}
            </h1>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500 font-mono">
              <span className="flex items-center gap-1.5 text-slate-700">
                <MapPin className="h-3.5 w-3.5 text-blue-700 shrink-0" />
                {kelurahanName ? `Kel. ${kelurahanName}, ` : ""}
                {kecamatanName ? `Kec. ${kecamatanName}` : "Kota Palembang"}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                {new Date(report.created_at).toLocaleString("id-ID", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}{" "}
                WIB
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-mono text-slate-700 self-start shrink-0">
            <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>Pemantauan Terbuka</span>
          </div>
        </div>
      </div>

      {/* 2-Column Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Lifecycle Timeline & Official Responses */}
        <div className="lg:col-span-7 space-y-6">
          {/* Status Progression Timeline Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-700" />
                <h2 className="text-sm sm:text-base font-bold text-slate-900">
                  Tahapan Progres Penanganan
                </h2>
              </div>
            </div>

            {/* Rejected & Duplicate Notices */}
            {isRejected && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-800 space-y-1">
                <div className="flex items-center gap-1.5 font-bold font-mono">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                  <span>Laporan Tidak Dapat Diproses (Ditolak)</span>
                </div>
                <p className="text-[11px] leading-relaxed text-red-700">
                  Laporan ini telah ditinjau dan dinyatakan belum memenuhi kriteria fasilitas umum atau rincian lokasi kejadian belum mencukupi untuk tindak lanjut lapangan.
                </p>
              </div>
            )}

            {isDuplicate && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-800 space-y-1">
                <div className="flex items-center gap-1.5 font-bold font-mono">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                  <span>Laporan Ditandai Sebagai Duplikat</span>
                </div>
                <p className="text-[11px] leading-relaxed text-red-700">
                  Kejadian pada titik lokasi ini telah dilaporkan sebelumnya oleh warga lain dan penanganan dipusatkan pada berkas laporan utama.
                </p>
              </div>
            )}

            {/* Visual Step Progression */}
            <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-200">
              {/* Step 1: Laporan Dicatat */}
              <div className="relative flex items-start gap-3">
                <div
                  className={`absolute -left-[24px] top-0.5 flex h-5 w-5 items-center justify-center rounded-full text-white font-mono text-[10px] font-bold ${currentStep >= 1 ? "bg-blue-700" : "bg-slate-300"
                    }`}
                >
                  <Check className="h-3 w-3" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">Laporan Dicatat</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Berkas pengaduan telah masuk ke sistem pra-pelaporan LAPORKITO.
                  </p>
                </div>
              </div>

              {/* Step 2: Verifikasi Berkas */}
              <div className="relative flex items-start gap-3">
                <div
                  className={`absolute -left-[24px] top-0.5 flex h-5 w-5 items-center justify-center rounded-full text-white font-mono text-[10px] font-bold ${currentStep >= 2 ? "bg-blue-700" : "bg-slate-200 text-slate-500"
                    }`}
                >
                  {currentStep >= 2 ? <Check className="h-3 w-3" /> : "2"}
                </div>
                <div>
                  <p className={`text-xs font-bold ${currentStep >= 2 ? "text-slate-900" : "text-slate-500"}`}>
                    Verifikasi Berkas & Bukti Foto
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Pemeriksaan kesesuaian uraian dan foto fisik oleh verifikator wilayah.
                  </p>
                </div>
              </div>

              {/* Step 3: Diteruskan ke Instansi */}
              <div className="relative flex items-start gap-3">
                <div
                  className={`absolute -left-[24px] top-0.5 flex h-5 w-5 items-center justify-center rounded-full text-white font-mono text-[10px] font-bold ${currentStep >= 3 ? "bg-blue-700" : "bg-slate-200 text-slate-500"
                    }`}
                >
                  {currentStep >= 3 ? <Check className="h-3 w-3" /> : "3"}
                </div>
                <div>
                  <p className={`text-xs font-bold ${currentStep >= 3 ? "text-slate-900" : "text-slate-500"}`}>
                    Diteruskan ke Instansi / Penanganan Lapangan
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Instansi teknis menyusun jadwal peninjauan fisik dan perbaikan.
                  </p>
                </div>
              </div>

              {/* Step 4: Selesai */}
              <div className="relative flex items-start gap-3">
                <div
                  className={`absolute -left-[24px] top-0.5 flex h-5 w-5 items-center justify-center rounded-full text-white font-mono text-[10px] font-bold ${currentStep >= 4 ? "bg-emerald-700" : "bg-slate-200 text-slate-500"
                    }`}
                >
                  {currentStep >= 4 ? <Check className="h-3 w-3" /> : "4"}
                </div>
                <div>
                  <p className={`text-xs font-bold ${currentStep >= 4 ? "text-emerald-700" : "text-slate-500"}`}>
                    Penanganan Selesai
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Pekerjaan fisik perbaikan lapangan telah selesai dikonfirmasi.
                  </p>
                </div>
              </div>
            </div>

            {/* Real Timeline Events from DB */}
            {timeline && timeline.length > 0 && (
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <span className="font-mono text-xs font-bold text-slate-800 uppercase block">
                  Catatan Riwayat Terdaftar:
                </span>
                <div className="space-y-2">
                  {timeline.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-lg border border-slate-200 bg-slate-50/70 p-3 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between font-mono text-[11px]">
                        <span className="font-bold text-slate-900">{item.action}</span>
                        <span className="text-slate-500">
                          {new Date(item.created_at).toLocaleString("id-ID", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })}{" "}
                          WIB
                        </span>
                      </div>
                      {item.notes && <p className="text-slate-600 text-[11px] leading-relaxed">{item.notes}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Official Responses Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-emerald-700" />
                <h2 className="text-sm sm:text-base font-bold text-slate-900">
                  Tanggapan Resmi Instansi
                </h2>
              </div>
              <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 font-mono text-[11px] font-bold text-emerald-800">
                {responses?.length || 0} Tanggapan
              </span>
            </div>

            {responses && responses.length > 0 ? (
              <div className="space-y-4">
                {responses.map((resp) => {
                  const isCitizen = resp.response_type === "clarification";

                  return (
                    <div
                      key={resp.id}
                      className={`rounded-xl border p-4 space-y-3 shadow-2xs ${isCitizen
                          ? "bg-amber-50/60 border-amber-200 ml-2 sm:ml-6"
                          : "bg-blue-50/60 border-blue-200 mr-2 sm:mr-6"
                        }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                        <div className="flex items-center gap-2">
                          <div
                            className={`flex h-7 w-7 items-center justify-center rounded-lg text-white ${isCitizen ? "bg-amber-600" : "bg-blue-700"
                              }`}
                          >
                            {isCitizen ? <Reply className="h-4 w-4" /> : <Building2 className="h-4 w-4" />}
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900">
                              {isCitizen ? "Pelapor (Warga)" : "Petugas Instansi / OPD"}
                            </h4>
                            <span className="font-mono text-[10px] text-slate-500 uppercase">
                              {isCitizen ? "Klarifikasi Warga" : `Tipe: ${resp.response_type}`}
                            </span>
                          </div>
                        </div>
                        <span className="font-mono text-[11px] text-slate-500">
                          {new Date(resp.created_at).toLocaleString("id-ID", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}{" "}
                          WIB
                        </span>
                      </div>

                      <blockquote className="rounded-lg bg-white p-3.5 border border-slate-200 text-xs text-slate-800 leading-relaxed whitespace-pre-line">
                        &quot;{resp.message}&quot;
                      </blockquote>

                      {/* Officer Field Documentation Photos */}
                      {resp.attachments &&
                        Array.isArray(resp.attachments) &&
                        resp.attachments.length > 0 && (
                          <div className="space-y-1.5 pt-1">
                            <span className="font-mono text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                              <Camera className="h-3 w-3 text-emerald-600" />
                              <span>Foto Bukti Tindak Lanjut Lapangan:</span>
                            </span>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                              {(resp.attachments as Array<{ fileUrl: string; caption?: string }>).map(
                                (att, attIdx) => (
                                  <div
                                    key={att.fileUrl || attIdx}
                                    className="relative h-24 rounded-lg overflow-hidden border border-slate-200 bg-white group shadow-2xs"
                                  >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                      src={att.fileUrl}
                                      alt={att.caption || "Dokumentasi Tindak Lanjut"}
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                      loading="lazy"
                                    />
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setPreviewImage({
                                          url: att.fileUrl,
                                          caption:
                                            att.caption ||
                                            `Dokumentasi Petugas #${attIdx + 1}`,
                                        })
                                      }
                                      aria-label="Perbesar foto tindak lanjut"
                                      className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity font-mono text-[11px] gap-1 cursor-pointer"
                                    >
                                      <Maximize2 className="h-3.5 w-3.5" />
                                      <span>Perbesar</span>
                                    </button>
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        )}

                      {!isCitizen && (
                        <div className="flex justify-end pt-1">
                          <Link
                            href={`/pantau/${report.tracking_code}/tanggapan`}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-mono text-xs font-semibold text-slate-800 hover:bg-slate-50 shadow-2xs transition-colors"
                          >
                            <Reply className="h-3.5 w-3.5 text-blue-700" />
                            <span>Balas Tanggapan Ini</span>
                          </Link>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/60 p-6 text-center space-y-2.5">
                <HelpCircle className="mx-auto h-8 w-8 text-slate-400" />
                <p className="text-xs font-bold text-slate-900">
                  Belum ada tanggapan resmi dari instansi penanganan
                </p>
                <p className="text-[11px] text-slate-500 max-w-sm mx-auto leading-relaxed">
                  Laporan Anda masih dalam antrean penelaahan teknis. Petugas akan mencantumkan pembaruan jadwal atau tindakan lapangan di bagian ini.
                </p>
                <div className="pt-2">
                  <Link
                    href={`/pantau/${report.tracking_code}/tanggapan`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 font-mono text-xs font-bold text-blue-700 hover:bg-blue-50 transition-colors shadow-2xs"
                  >
                    <Reply className="h-3.5 w-3.5" />
                    <span>Tambahkan Keterangan Warga</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Report Details, Public Evidence & Privacy Protection */}
        <div className="lg:col-span-5 space-y-6">
          {/* Summary Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <FileText className="h-5 w-5 text-blue-700" />
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                Ringkasan Laporan
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 space-y-1">
                <span className="font-mono text-[11px] font-bold text-slate-500 uppercase">
                  Uraian Kejadian:
                </span>
                <p className="text-slate-800 leading-relaxed mt-1">{report.description}</p>
              </div>

              <div className="grid grid-cols-1 gap-2 font-mono">
                <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 flex justify-between items-center">
                  <span className="text-slate-500">Kategori:</span>
                  <span className="font-bold text-slate-900">{categoryName}</span>
                </div>

                <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 flex justify-between items-center">
                  <span className="text-slate-500">Prioritas:</span>
                  <span className={`font-bold uppercase text-[11px] px-2 py-0.5 rounded border ${priorityBadge.bg}`}>
                    {priorityBadge.label}
                  </span>
                </div>

                <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                  <span className="text-slate-500 shrink-0">Lokasi Alamat:</span>
                  <span className="font-medium text-slate-900 text-left sm:text-right break-words">
                    {report.address_detail}
                  </span>
                </div>

                <div className="rounded-lg bg-blue-50/70 border border-blue-200 px-3 py-2.5 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                  <span className="text-blue-900 shrink-0 font-bold">Instansi Sasaran:</span>
                  <span className="font-bold text-blue-800 text-left sm:text-right break-words">
                    {report.authority_target || "Menunggu Verifikasi Instansi"}
                  </span>
                </div>
              </div>
            </div>

            {/* Evidence Photos Grid */}
            <div className="space-y-2 pt-3 border-t border-slate-100">
              <span className="font-mono text-xs font-bold text-slate-900 block uppercase">
                Bukti Awal Pelapor (Warga) ({evidence?.length || 0})
              </span>
              {evidence && evidence.length > 0 ? (
                <div className="grid grid-cols-2 gap-2.5">
                  {evidence.map((ev) => (
                    <div
                      key={ev.id}
                      className="relative h-28 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 group shadow-2xs cursor-pointer"
                      onClick={() =>
                        setPreviewImage({
                          url: ev.file_url,
                          caption: ev.caption || "Bukti Awal Pelapor (Warga)",
                        })
                      }
                    >
                      <Image
                        src={ev.file_url}
                        alt={ev.caption || "Bukti Awal Pelapor"}
                        fill
                        unoptimized
                        className="object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity font-mono text-[11px] gap-1">
                        <Maximize2 className="h-3.5 w-3.5" />
                        <span>Lihat</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic font-mono">
                  Tidak ada berkas bukti yang dilampirkan.
                </p>
              )}
            </div>
          </div>

          {/* Privacy & Governance Notice */}
          <div className="rounded-2xl border border-slate-200 bg-blue-50/60 p-5 space-y-2 text-xs text-slate-700">
            <div className="flex items-center gap-1.5 font-bold font-mono text-blue-800">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>PERLINDUNGAN PRIVASI PELAPOR</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-600">
              Sesuai kebijakan perlindungan privasi LAPORKITO, identitas pribadi pelapor (nama, nomor telepon, dan email) dirahasiakan sepenuhnya dan tidak dapat diakses pada halaman pemantauan publik ini.
            </p>
          </div>
        </div>
      </div>

      {/* Image Lightbox Modal */}
      {previewImage && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3 bg-slate-900 text-white flex items-center justify-between font-mono text-xs">
              <span className="truncate max-w-lg">
                {previewImage.caption || "Lampiran Bukti Foto"}
              </span>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                aria-label="Tutup pratinjau"
                className="p-1 rounded-lg hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-auto bg-black/90 flex items-center justify-center p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewImage.url}
                alt={previewImage.caption || "Pratinjau foto"}
                className="max-h-[80vh] w-auto object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
