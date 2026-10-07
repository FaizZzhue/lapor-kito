"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Clock3,
  Calendar,
  MapPin,
  ExternalLink,
  Tags,
  Paperclip,
  Image as ImageIcon,
  Sparkles,
  ShieldCheck,
  Building2,
  Network,
  Scale,
  User,
  Phone,
  Mail,
  ShieldAlert,
  Info,
  Maximize2,
  X,
  FileText,
  History,
  Bot,
} from "lucide-react";
import type { InternalReportDetailData } from "@/lib/actions/reports";
import { ReportStatusBadge } from "./report-status-badge";
import { ReportPriorityBadge } from "./report-priority-badge";

interface ReportDetailViewProps {
  data: InternalReportDetailData;
  userRole?: "admin" | "petugas";
}

export function ReportDetailView({ data }: ReportDetailViewProps) {
  const { report, category, location, reporter, evidence, timeline, aiTriage, authorityRule } =
    data;

  const [previewImage, setPreviewImage] = useState<{
    url: string;
    caption: string | null;
  } | null>(null);

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return new Intl.DateTimeFormat("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date);
    } catch {
      return isoString;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const hasCoordinates = report.latitude !== null && report.longitude !== null;
  const mapsUrl = hasCoordinates
    ? `https://www.google.com/maps/search/?api=1&query=${report.latitude},${report.longitude}`
    : null;

  return (
    <div className="flex flex-col w-full gap-6 pb-12">
      {/* Top Navigation & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#D9DEE7]/80">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/laporan"
            className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-white border border-[#D9DEE7] text-[#434654] hover:text-[#0033A7] hover:bg-[#F0F3FF] hover:border-[#C4D3F8] shadow-sm transition-all"
            aria-label="Kembali ke antrean laporan masuk"
          >
            <ArrowLeft size={18} aria-hidden="true" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-[#747686] uppercase tracking-wider">
                Operasional • Detail Laporan
              </span>
              <span className="text-[#D9DEE7]">•</span>
              <span className="font-mono text-[12px] font-semibold text-[#0033A7]">
                {report.tracking_code}
              </span>
            </div>
            <h1 className="text-[22px] font-bold text-[#111C2D] tracking-tight">
              {report.title}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
          <ReportPriorityBadge priority={report.priority} size="md" />
          <ReportStatusBadge status={report.status} size="md" />
        </div>
      </div>

      {/* Operational Inspection Notice (Phase 6A Read-Only) */}
      <div className="bg-[#EEF2FC] border border-[#C4D3F8] rounded-xl p-4 flex items-start gap-3">
        <Info size={18} className="text-[#0033A7] shrink-0 mt-0.5" aria-hidden="true" />
        <div className="text-[13px] text-[#111C2D] leading-relaxed">
          <p className="font-semibold text-[#0033A7]">
            Fase 6A — Mode Inspeksi Operasional (Hanya Baca)
          </p>
          <p className="text-[#434654] mt-0.5">
            Halaman ini menampilkan seluruh data berkas pengaduan warga secara lengkap dan terverifikasi dari basis data.
            Tindakan transisi status laporan (Fase 6B) dan pengiriman tanggapan resmi (Fase 6C) akan diaktifkan pada tahapan berikutnya.
          </p>
        </div>
      </div>

      {/* Main Grid: Left Column (Content & Evidence), Right Column (Category, Reporter, AI, Authority) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: 7 cols */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Section B: Complaint Content */}
          <div className="bg-white rounded-xl border border-[#D9DEE7] shadow-sm p-6">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#F0F3FF]">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-[#0033A7]" aria-hidden="true" />
                <h2 className="text-[15px] font-bold text-[#111C2D]">Uraian Pengaduan Warga</h2>
              </div>
              <span className="text-[12px] text-[#747686]">
                {formatDate(report.created_at)}
              </span>
            </div>

            <div className="text-[14px] text-[#111C2D] leading-relaxed whitespace-pre-line bg-[#F9F9FF] p-4 rounded-lg border border-[#D9DEE7]/70">
              {report.description}
            </div>

            <div className="mt-4 pt-4 border-t border-[#F0F3FF] flex flex-wrap items-center justify-between gap-2 text-[12px] text-[#747686]">
              <div className="flex items-center gap-1.5">
                <Calendar size={14} aria-hidden="true" />
                <span>Terdaftar: {formatDate(report.created_at)}</span>
              </div>
              {report.updated_at !== report.created_at && (
                <div className="flex items-center gap-1.5">
                  <Clock3 size={14} aria-hidden="true" />
                  <span>Pembaruan: {formatDate(report.updated_at)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Section C: Location */}
          <div className="bg-white rounded-xl border border-[#D9DEE7] shadow-sm p-6">
            <div className="flex items-center gap-2 pb-3 mb-4 border-b border-[#F0F3FF]">
              <MapPin size={18} className="text-[#0033A7]" aria-hidden="true" />
              <h2 className="text-[15px] font-bold text-[#111C2D]">Lokasi Kejadian</h2>
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <p className="text-[11px] font-semibold text-[#747686] uppercase tracking-wider">
                  Alamat / Patokan Lokasi
                </p>
                <p className="text-[14px] font-medium text-[#111C2D] mt-0.5">
                  {report.address_detail}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="bg-[#F9F9FF] p-3 rounded-lg border border-[#D9DEE7]/70">
                  <span className="text-[11px] text-[#747686] block">Kelurahan</span>
                  <span className="text-[13px] font-semibold text-[#111C2D]">
                    {location.kelurahan_name || "Tidak ditentukan"}
                  </span>
                </div>
                <div className="bg-[#F9F9FF] p-3 rounded-lg border border-[#D9DEE7]/70">
                  <span className="text-[11px] text-[#747686] block">Kecamatan</span>
                  <span className="text-[13px] font-semibold text-[#111C2D]">
                    {location.kecamatan_name || "Tidak ditentukan"}
                  </span>
                </div>
              </div>

              {/* Coordinates info */}
              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[12px]">
                {hasCoordinates ? (
                  <>
                    <span className="font-mono text-[#434654]">
                      Koordinat: {report.latitude}, {report.longitude}
                    </span>
                    {mapsUrl && (
                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-semibold text-[#0033A7] hover:underline"
                      >
                        <span>Buka di Google Maps</span>
                        <ExternalLink size={13} aria-hidden="true" />
                      </a>
                    )}
                  </>
                ) : (
                  <span className="text-[#747686] italic">
                    Koordinat GPS tidak dicantumkan oleh pelapor.
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Section E: Evidence Files */}
          <div className="bg-white rounded-xl border border-[#D9DEE7] shadow-sm p-6">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#F0F3FF]">
              <div className="flex items-center gap-2">
                <Paperclip size={18} className="text-[#0033A7]" aria-hidden="true" />
                <h2 className="text-[15px] font-bold text-[#111C2D]">
                  Berkas Bukti ({evidence.length})
                </h2>
              </div>
              <span className="text-[12px] text-[#747686]">
                {evidence.length > 0 ? "Tersimpan di Cloud Storage" : "Tanpa Berkas"}
              </span>
            </div>

            {evidence.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {evidence.map((ev, idx) => {
                  const isImage =
                    ev.file_type.startsWith("image/") ||
                    /\.(jpg|jpeg|png|webp|gif)$/i.test(ev.file_url);

                  return (
                    <div
                      key={ev.id}
                      className="border border-[#D9DEE7] rounded-xl overflow-hidden bg-[#F9F9FF] flex flex-col group hover:border-[#C4D3F8] transition-colors"
                    >
                      {/* Thumbnail container */}
                      <div className="relative aspect-video bg-[#EEF2FC] flex items-center justify-center overflow-hidden">
                        {isImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={ev.file_url}
                            alt={ev.caption || `Berkas bukti ${idx + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex flex-col items-center gap-1 text-[#747686]">
                            <ImageIcon size={32} aria-hidden="true" />
                            <span className="text-[11px] font-mono">{ev.file_type}</span>
                          </div>
                        )}

                        {isImage && (
                          <button
                            type="button"
                            onClick={() =>
                              setPreviewImage({ url: ev.file_url, caption: ev.caption })
                            }
                            aria-label={`Perbesar tampilan bukti ${idx + 1}`}
                            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity font-medium text-[12px] gap-1.5"
                          >
                            <Maximize2 size={16} aria-hidden="true" />
                            <span>Perbesar</span>
                          </button>
                        )}
                      </div>

                      {/* Evidence metadata */}
                      <div className="p-3 flex flex-col gap-1 text-[12px]">
                        <p className="font-semibold text-[#111C2D] truncate" title={ev.caption || `Lampiran #${idx + 1}`}>
                          {ev.caption || `Lampiran Bukti #${idx + 1}`}
                        </p>
                        <div className="flex items-center justify-between text-[#747686]">
                          <span>{formatFileSize(ev.file_size)}</span>
                          <a
                            href={ev.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#0033A7] hover:underline font-medium inline-flex items-center gap-1"
                          >
                            <span>Buka URL</span>
                            <ExternalLink size={11} aria-hidden="true" />
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-[#747686] bg-[#F9F9FF] rounded-lg border border-dashed border-[#D9DEE7]">
                <Paperclip size={24} className="mx-auto mb-2 text-[#747686]/60" aria-hidden="true" />
                <p className="text-[13px] font-medium text-[#434654]">
                  Tidak ada berkas bukti yang dilampirkan
                </p>
                <p className="text-[11px] text-[#747686] mt-0.5">
                  Pelapor tidak mengunggah foto atau dokumen untuk pengaduan ini.
                </p>
              </div>
            )}
          </div>

          {/* Section G: Timeline Audit */}
          <div className="bg-white rounded-xl border border-[#D9DEE7] shadow-sm p-6">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#F0F3FF]">
              <div className="flex items-center gap-2">
                <History size={18} className="text-[#0033A7]" aria-hidden="true" />
                <h2 className="text-[15px] font-bold text-[#111C2D]">
                  Riwayat & Linimasa ({timeline.length})
                </h2>
              </div>
              <span className="text-[12px] text-[#747686]">Urutan Kronologis</span>
            </div>

            {timeline.length > 0 ? (
              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#D9DEE7]">
                {timeline.map((item, idx) => (
                  <div key={item.id || idx} className="relative">
                    {/* Timeline bullet */}
                    <span className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-[#DFE8FF] border-2 border-[#0033A7] flex items-center justify-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#0033A7]" />
                    </span>

                    <div className="bg-[#F9F9FF] p-3.5 rounded-lg border border-[#D9DEE7]/70">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                        <span className="text-[13px] font-bold text-[#111C2D]">
                          {item.action}
                        </span>
                        <span className="text-[11px] text-[#747686]">
                          {formatDate(item.created_at)}
                        </span>
                      </div>
                      {item.notes && (
                        <p className="text-[13px] text-[#434654] leading-relaxed">
                          {item.notes}
                        </p>
                      )}
                      <div className="mt-2 flex items-center gap-2 text-[10px] text-[#747686]">
                        <span className="font-semibold uppercase tracking-wider px-1.5 py-0.5 bg-white border border-[#D9DEE7] rounded">
                          Aktor: {item.actor_role}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-[#747686]">
                <Clock3 size={24} className="mx-auto mb-2 text-[#747686]/60" aria-hidden="true" />
                <p className="text-[13px]">Belum ada catatan riwayat aktivitas.</p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: 5 cols */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Section D: Category */}
          <div className="bg-white rounded-xl border border-[#D9DEE7] shadow-sm p-6">
            <div className="flex items-center gap-2 pb-3 mb-3 border-b border-[#F0F3FF]">
              <Tags size={18} className="text-[#0033A7]" aria-hidden="true" />
              <h2 className="text-[15px] font-bold text-[#111C2D]">Kategori Pengaduan</h2>
            </div>

            <div className="bg-[#F0F3FF] p-4 rounded-xl border border-[#C4D3F8]/60 flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold text-[#0033A7] uppercase tracking-wider">
                Taksonomi Resmi
              </span>
              <p className="text-[16px] font-bold text-[#111C2D]">
                {category?.name_id || "Kategori Umum"}
              </p>
              {category?.description && (
                <p className="text-[12px] text-[#434654] leading-relaxed mt-1">
                  {category.description}
                </p>
              )}
              {category?.slug && (
                <span className="font-mono text-[11px] text-[#747686] mt-1">
                  slug: {category.slug}
                </span>
              )}
            </div>
          </div>

          {/* Section H: Reporter Info (Strictly Internal Authorized) */}
          <div className="bg-white rounded-xl border border-[#D9DEE7] shadow-sm p-6">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#F0F3FF]">
              <div className="flex items-center gap-2">
                <User size={18} className="text-[#0033A7]" aria-hidden="true" />
                <h2 className="text-[15px] font-bold text-[#111C2D]">Informasi Pelapor</h2>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#FEF3E6] text-[#B2640A] border border-[#FCD7A9]">
                Khusus Staf
              </span>
            </div>

            {reporter ? (
              <div className="flex flex-col gap-3">
                <div className="bg-[#F9F9FF] p-3 rounded-lg border border-[#D9DEE7]/70">
                  <span className="text-[11px] text-[#747686] block">Nama Lengkap</span>
                  <span className="text-[14px] font-semibold text-[#111C2D]">
                    {reporter.full_name || "Warga (Tidak mencantumkan nama)"}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-2.5">
                  <div className="flex items-center gap-2.5 text-[13px] text-[#434654] bg-[#F9F9FF] p-2.5 rounded-lg border border-[#D9DEE7]/70">
                    <Phone size={15} className="text-[#747686] shrink-0" aria-hidden="true" />
                    <span className="font-mono font-medium text-[#111C2D]">
                      {reporter.phone || "Nomor telepon tidak dicantumkan"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5 text-[13px] text-[#434654] bg-[#F9F9FF] p-2.5 rounded-lg border border-[#D9DEE7]/70">
                    <Mail size={15} className="text-[#747686] shrink-0" aria-hidden="true" />
                    <span className="truncate text-[#111C2D]">
                      {reporter.email || "Email tidak dicantumkan"}
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-[#747686] mt-1 leading-relaxed">
                  Informasi kontak ini dilindungi undang-undang privasi dan hanya digunakan oleh petugas resmi untuk kepentingan verifikasi fakta lapangan.
                </p>
              </div>
            ) : (
              <div className="bg-[#F9F9FF] p-4 rounded-lg text-center text-[#747686] text-[13px] border border-[#D9DEE7]/70">
                <User size={24} className="mx-auto mb-1 text-[#747686]/60" aria-hidden="true" />
                <p className="font-semibold text-[#111C2D]">Laporan Anonim Murni</p>
                <p className="text-[11px] text-[#747686] mt-0.5">
                  Laporan didaftarkan tanpa data identitas pelapor.
                </p>
              </div>
            )}
          </div>

          {/* Section F.1: AI Triage Summary */}
          <div className="bg-white rounded-xl border border-[#D9DEE7] shadow-sm p-6">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#F0F3FF]">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-[#1749D2]" aria-hidden="true" />
                <h2 className="text-[15px] font-bold text-[#111C2D]">Rekomendasi AI</h2>
              </div>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#DFE8FF] text-[#0033A7]">
                Penelaahan Awal
              </span>
            </div>

            {aiTriage && aiTriage.hasData ? (
              <div className="flex flex-col gap-3">
                {/* Confidence score & Decision */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#F0F3FF] p-3 rounded-lg border border-[#C4D3F8]/60">
                    <span className="text-[11px] text-[#747686] block">Tingkat Keyakinan</span>
                    <span className="text-[16px] font-bold text-[#0033A7]">
                      {aiTriage.confidence !== null && aiTriage.confidence !== undefined
                        ? `${Math.round(aiTriage.confidence * 100)}%`
                        : "N/A"}
                    </span>
                  </div>

                  <div className="bg-[#F0F3FF] p-3 rounded-lg border border-[#C4D3F8]/60">
                    <span className="text-[11px] text-[#747686] block">Keputusan Rekomendasi</span>
                    <span
                      className={`text-[13px] font-bold ${
                        aiTriage.decision === "RECOMMEND"
                          ? "text-[#16845B]"
                          : "text-[#B2640A]"
                      }`}
                    >
                      {aiTriage.decision === "RECOMMEND"
                        ? "SIAP TERUSKAN"
                        : aiTriage.decision === "NEEDS_REVIEW"
                        ? "PERLU DITELAAH"
                        : "OTOMATIS"}
                    </span>
                  </div>
                </div>

                {/* AI Summary */}
                {aiTriage.summary && (
                  <div>
                    <span className="text-[11px] font-semibold text-[#747686] uppercase tracking-wider">
                      Ringkasan Otomatis
                    </span>
                    <p className="text-[13px] text-[#111C2D] bg-[#F9F9FF] p-3 rounded-lg border border-[#D9DEE7]/70 mt-1 leading-relaxed">
                      {aiTriage.summary}
                    </p>
                  </div>
                )}

                {/* AI Reasoning */}
                {aiTriage.reasoning && (
                  <div>
                    <span className="text-[11px] font-semibold text-[#747686] uppercase tracking-wider">
                      Penalaran AI
                    </span>
                    <p className="text-[12px] text-[#434654] bg-[#F9F9FF] p-3 rounded-lg border border-[#D9DEE7]/70 mt-1 leading-relaxed">
                      {aiTriage.reasoning}
                    </p>
                  </div>
                )}

                {/* Recommended target */}
                {aiTriage.recommendedAuthority && (
                  <div className="text-[12px] text-[#434654] flex items-center justify-between pt-1">
                    <span className="text-[#747686]">Instansi Rekomendasi:</span>
                    <span className="font-semibold text-[#111C2D]">
                      {aiTriage.recommendedAuthority}
                    </span>
                  </div>
                )}

                {/* Metadata */}
                <div className="pt-2 border-t border-[#F0F3FF] flex items-center justify-between text-[11px] text-[#747686]">
                  <span className="flex items-center gap-1 font-mono">
                    <Bot size={13} aria-hidden="true" />
                    <span>{aiTriage.model || "Gemini AI"}</span>
                  </span>
                  {aiTriage.processingTimeMs && (
                    <span>Waktu proses: {aiTriage.processingTimeMs} ms</span>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-[#F9F9FF] p-4 rounded-lg text-center text-[#747686] text-[13px] border border-[#D9DEE7]/70">
                <Sparkles size={24} className="mx-auto mb-1 text-[#747686]/60" aria-hidden="true" />
                <p className="font-medium text-[#434654]">Analisis AI belum tersedia</p>
                <p className="text-[11px] text-[#747686] mt-0.5">
                  Laporan ini didaftarkan tanpa catatan penelaahan otomatis dari pipeline AI.
                </p>
              </div>
            )}
          </div>

          {/* Section F.2: Official Authority Data (Strictly from authority_rules) */}
          <div className="bg-white rounded-xl border border-[#D9DEE7] shadow-sm p-6">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#F0F3FF]">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-[#16845B]" aria-hidden="true" />
                <h2 className="text-[15px] font-bold text-[#111C2D]">Data Kewenangan Resmi</h2>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#EDF7F2] text-[#16845B] border border-[#B5E2CD]">
                Regulasi Hukum
              </span>
            </div>

            {authorityRule && authorityRule.hasData ? (
              <div className="flex flex-col gap-3.5">
                {/* Rule title & code */}
                <div>
                  <span className="text-[11px] font-semibold text-[#747686] uppercase tracking-wider">
                    Aturan Kewenangan Terpilih
                  </span>
                  <p className="text-[14px] font-bold text-[#111C2D] mt-0.5">
                    {authorityRule.context_title || "Aturan Penanganan Pengaduan"}
                  </p>
                  {authorityRule.rule_code && (
                    <span className="font-mono text-[11px] font-semibold text-[#0033A7] bg-[#F0F3FF] px-2 py-0.5 rounded border border-[#C4D3F8] inline-block mt-1">
                      {authorityRule.rule_code}
                    </span>
                  )}
                </div>

                {/* Institution & Unit */}
                <div className="bg-[#F9F9FF] p-3.5 rounded-lg border border-[#D9DEE7]/70 flex flex-col gap-2.5">
                  <div className="flex items-start gap-2">
                    <Building2 size={16} className="text-[#0033A7] shrink-0 mt-0.5" aria-hidden="true" />
                    <div>
                      <span className="text-[11px] text-[#747686] block">Instansi Berwenang (OPD)</span>
                      <span className="text-[13px] font-semibold text-[#111C2D]">
                        {authorityRule.institution?.name || "Instansi Pemerintah Terkait"}
                      </span>
                    </div>
                  </div>

                  {authorityRule.unit && (
                    <div className="flex items-start gap-2 pt-2 border-t border-[#D9DEE7]/50">
                      <Network size={16} className="text-[#1749D2] shrink-0 mt-0.5" aria-hidden="true" />
                      <div>
                        <span className="text-[11px] text-[#747686] block">Unit Kerja Pelaksana (UPT)</span>
                        <span className="text-[13px] font-semibold text-[#111C2D]">
                          {authorityRule.unit.name}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Legal basis */}
                {authorityRule.regulation_basis && (
                  <div>
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#747686] uppercase tracking-wider mb-1">
                      <Scale size={13} aria-hidden="true" />
                      <span>Dasar Hukum Kewenangan</span>
                    </div>
                    <p className="text-[12px] text-[#434654] bg-[#EDF7F2]/60 border border-[#B5E2CD] p-3 rounded-lg leading-relaxed">
                      {authorityRule.regulation_basis}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-[#F9F9FF] p-4 rounded-lg text-center text-[#747686] text-[13px] border border-[#D9DEE7]/70">
                <ShieldAlert size={24} className="mx-auto mb-1 text-[#747686]/60" aria-hidden="true" />
                <p className="font-medium text-[#434654]">Aturan kewenangan belum ditentukan</p>
                <p className="text-[11px] text-[#747686] mt-0.5">
                  Belum ada relasi matriks kewenangan yang cocok secara otomatis dengan kategori dan lokasi pengaduan ini.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Image Lightbox Modal */}
      {previewImage && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3 bg-[#111C2D] text-white flex items-center justify-between">
              <span className="text-[13px] font-medium truncate max-w-lg">
                {previewImage.caption || "Lampiran Bukti Laporan"}
              </span>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                aria-label="Tutup pratinjau foto"
                className="p-1 rounded-lg hover:bg-white/20 text-white transition-colors"
              >
                <X size={18} aria-hidden="true" />
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
