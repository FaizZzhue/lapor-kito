"use client";

import { useState, useMemo, useTransition } from "react";
import Link from "next/link";
import {
  Inbox,
  Search,
  RefreshCw,
  Hash,
  MapPin,
  Clock3,
  Eye,
  X,
  AlertCircle,
} from "lucide-react";
import type { InternalReportListItem } from "@/lib/actions/reports";
import { getInternalReportsAction } from "@/lib/actions/reports";
import { ReportStatusBadge } from "./report-status-badge";
import { ReportPriorityBadge } from "./report-priority-badge";
import type { ReportPriority, ReportStatus } from "@/types/database";

interface CategoryOption {
  id: string;
  name_id: string;
  slug: string;
}

interface ReportInboxClientProps {
  initialReports: InternalReportListItem[];
  categories: CategoryOption[];
  userRole?: "admin" | "petugas";
}

export function ReportInboxClient({
  initialReports,
  categories,
}: ReportInboxClientProps) {
  const [reports, setReports] = useState<InternalReportListItem[]>(initialReports);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ReportStatus | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<ReportPriority | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "priority_desc">("newest");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();

  // Helper to refresh data from server
  const refreshData = () => {
    startTransition(async () => {
      setErrorMessage(null);
      try {
        const res = await getInternalReportsAction({
          status: statusFilter,
          priority: priorityFilter,
          categoryId: categoryFilter,
          sortBy,
          search: search.trim() || undefined,
        });

        if (res.success) {
          setReports(res.data);
        } else {
          setErrorMessage(res.error || "Gagal memperbarui antrean laporan.");
        }
      } catch (err: unknown) {
        setErrorMessage(err instanceof Error ? err.message : "Kesalahan koneksi.");
      }
    });
  };

  // Client-side instant filtering over loaded data
  const filteredReports = useMemo(() => {
    let result = [...reports];

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter((r) => r.status === statusFilter);
    }

    // Priority filter
    if (priorityFilter !== "all") {
      result = result.filter((r) => r.priority === priorityFilter);
    }

    // Category filter
    if (categoryFilter !== "all") {
      result = result.filter((r) => r.category_id === categoryFilter);
    }

    // Search query
    if (search.trim() !== "") {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (r) =>
          r.tracking_code.toLowerCase().includes(q) ||
          r.title.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.address_detail.toLowerCase().includes(q) ||
          r.category_name.toLowerCase().includes(q) ||
          (r.kelurahan_name && r.kelurahan_name.toLowerCase().includes(q)) ||
          (r.kecamatan_name && r.kecamatan_name.toLowerCase().includes(q))
      );
    }

    // Sorting
    if (sortBy === "oldest") {
      result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    } else if (sortBy === "priority_desc") {
      const weight: Record<ReportPriority, number> = {
        critical: 4,
        high: 3,
        medium: 2,
        low: 1,
      };
      result.sort((a, b) => weight[b.priority] - weight[a.priority]);
    } else {
      // Default: newest
      result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    return result;
  }, [reports, search, statusFilter, priorityFilter, categoryFilter, sortBy]);

  const hasActiveFilters =
    search.trim() !== "" ||
    statusFilter !== "all" ||
    priorityFilter !== "all" ||
    categoryFilter !== "all" ||
    sortBy !== "newest";

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setPriorityFilter("all");
    setCategoryFilter("all");
    setSortBy("newest");
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return new Intl.DateTimeFormat("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date);
    } catch {
      return isoString;
    }
  };

  return (
    <div className="flex flex-col w-full gap-6">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#D9DEE7]/80">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1749D2]" />
            <p className="text-[11px] font-semibold text-[#747686] uppercase tracking-wider">
              Operasional Kedinasan • Laporan Warga
            </p>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-[26px] font-semibold text-[#111C2D] tracking-tight">
              Laporan Masuk
            </h1>
            <span className="text-[12px] font-semibold px-2.5 py-0.5 rounded-full bg-[#DFE8FF] text-[#0033A7] border border-[#C4D3F8]">
              {reports.length} Total
            </span>
          </div>
          <p className="text-[14px] text-[#434654] mt-1">
            Antrean verifikasi dan inspeksi laporan warga Palembang (Phase 6A: Tinjauan Operasional).
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          <button
            type="button"
            onClick={refreshData}
            disabled={isPending}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-[13px] font-semibold rounded-lg bg-white border border-[#D9DEE7] text-[#111C2D] hover:bg-[#F0F3FF] hover:border-[#C4D3F8] shadow-sm transition-all disabled:opacity-50"
            aria-label="Segarkan daftar laporan"
          >
            <RefreshCw
              size={15}
              strokeWidth={2}
              className={`text-[#0033A7] ${isPending ? "animate-spin" : ""}`}
              aria-hidden="true"
            />
            <span>{isPending ? "Memuat..." : "Segarkan"}</span>
          </button>
        </div>
      </div>

      {/* Error alert if any */}
      {errorMessage && (
        <div className="bg-[#FFDAD6]/60 border border-[#FFB4AB] p-4 rounded-xl flex items-start gap-3 text-[#BA1A1A]">
          <AlertCircle size={18} className="shrink-0 mt-0.5" aria-hidden="true" />
          <div className="text-[13px] leading-relaxed">
            <p className="font-semibold">Gagal memuat data:</p>
            <p>{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-[#D9DEE7] shadow-sm flex flex-col gap-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search Input */}
          <div className="md:col-span-5 relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#747686]"
              aria-hidden="true"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari kode lacak, judul, jalan, atau kelurahan..."
              aria-label="Cari laporan"
              className="w-full pl-9 pr-8 py-2 text-[13px] bg-[#F9F9FF] border border-[#D9DEE7] rounded-lg text-[#111C2D] placeholder-[#747686] focus:outline-none focus:ring-2 focus:ring-[#1749D2]/30 focus:border-[#1749D2] transition-colors"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Hapus kata kunci pencarian"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#747686] hover:text-[#111C2D] p-0.5"
              >
                <X size={14} aria-hidden="true" />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div className="md:col-span-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ReportStatus | "all")}
              aria-label="Filter status laporan"
              className="w-full py-2 px-3 text-[13px] bg-[#F9F9FF] border border-[#D9DEE7] rounded-lg text-[#111C2D] focus:outline-none focus:ring-2 focus:ring-[#1749D2]/30 focus:border-[#1749D2] transition-colors cursor-pointer"
            >
              <option value="all">Semua Status</option>
              <option value="submitted">Laporan Masuk</option>
              <option value="verifying">Verifikasi</option>
              <option value="verified">Terverifikasi</option>
              <option value="in_progress">Dalam Proses</option>
              <option value="resolved">Selesai</option>
              <option value="rejected">Ditolak</option>
              <option value="duplicate">Duplikat</option>
              <option value="draft">Draf</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div className="md:col-span-2">
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as ReportPriority | "all")}
              aria-label="Filter prioritas laporan"
              className="w-full py-2 px-3 text-[13px] bg-[#F9F9FF] border border-[#D9DEE7] rounded-lg text-[#111C2D] focus:outline-none focus:ring-2 focus:ring-[#1749D2]/30 focus:border-[#1749D2] transition-colors cursor-pointer"
            >
              <option value="all">Semua Prioritas</option>
              <option value="critical">Kritis</option>
              <option value="high">Tinggi</option>
              <option value="medium">Sedang</option>
              <option value="low">Rendah</option>
            </select>
          </div>

          {/* Category Filter */}
          <div className="md:col-span-3">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              aria-label="Filter kategori laporan"
              className="w-full py-2 px-3 text-[13px] bg-[#F9F9FF] border border-[#D9DEE7] rounded-lg text-[#111C2D] focus:outline-none focus:ring-2 focus:ring-[#1749D2]/30 focus:border-[#1749D2] transition-colors cursor-pointer"
            >
              <option value="all">Semua Kategori</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name_id}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Secondary row: Sort and active filter pills */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[#F0F3FF]">
          <div className="flex items-center gap-2">
            <span className="text-[12px] text-[#747686] font-medium">Urutkan:</span>
            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value as "newest" | "oldest" | "priority_desc")
              }
              aria-label="Urutkan daftar laporan"
              className="py-1 px-2.5 text-[12px] bg-[#F0F3FF] border border-[#D9DEE7] rounded-lg text-[#111C2D] focus:outline-none cursor-pointer"
            >
              <option value="newest">Waktu Masuk: Terbaru</option>
              <option value="oldest">Waktu Masuk: Terlama</option>
              <option value="priority_desc">Prioritas Tertinggi</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[12px] text-[#747686]">
              Menampilkan <span className="font-semibold text-[#111C2D]">{filteredReports.length}</span> dari{" "}
              {reports.length} laporan
            </span>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1 text-[12px] text-[#BA1A1A] hover:underline font-semibold ml-2"
                aria-label="Reset semua filter"
              >
                <X size={13} aria-hidden="true" />
                <span>Reset Filter</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Table / List View */}
      {filteredReports.length > 0 ? (
        <div className="bg-white rounded-xl border border-[#D9DEE7] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F0F3FF] border-b border-[#D9DEE7] text-[12px] font-semibold text-[#434654]">
                  <th scope="col" className="py-3 px-4 w-[160px]">
                    Kode Lacak
                  </th>
                  <th scope="col" className="py-3 px-4">
                    Judul & Uraian Laporan
                  </th>
                  <th scope="col" className="py-3 px-4 w-[180px]">
                    Kategori
                  </th>
                  <th scope="col" className="py-3 px-4 w-[180px]">
                    Lokasi
                  </th>
                  <th scope="col" className="py-3 px-4 w-[120px]">
                    Prioritas
                  </th>
                  <th scope="col" className="py-3 px-4 w-[140px]">
                    Status
                  </th>
                  <th scope="col" className="py-3 px-4 w-[140px]">
                    Tanggal Masuk
                  </th>
                  <th scope="col" className="py-3 px-4 w-[100px] text-right">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F3FF] text-[13px]">
                {filteredReports.map((report) => (
                  <tr
                    key={report.id}
                    className="hover:bg-[#F9F9FF] transition-colors group"
                  >
                    {/* Tracking Code */}
                    <td className="py-3.5 px-4 font-mono font-medium text-[#0033A7] whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Hash size={14} className="text-[#747686]" aria-hidden="true" />
                        <span>{report.tracking_code}</span>
                      </div>
                    </td>

                    {/* Title & Description preview */}
                    <td className="py-3.5 px-4 max-w-xs md:max-w-md">
                      <Link
                        href={`/admin/laporan/${report.id}`}
                        className="font-semibold text-[#111C2D] group-hover:text-[#0033A7] transition-colors block truncate"
                        title={report.title}
                      >
                        {report.title}
                      </Link>
                      <p className="text-[12px] text-[#747686] truncate mt-0.5">
                        {report.description}
                      </p>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4">
                      <span className="inline-block text-[12px] text-[#434654] font-medium bg-[#F0F3FF] px-2 py-0.5 rounded border border-[#D9DEE7]/70 truncate max-w-[170px]">
                        {report.category_name}
                      </span>
                    </td>

                    {/* Location */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-start gap-1 text-[12px] text-[#434654]">
                        <MapPin size={13} className="text-[#747686] shrink-0 mt-0.5" aria-hidden="true" />
                        <span className="truncate max-w-[160px]" title={report.address_detail}>
                          {report.kelurahan_name
                            ? `${report.kelurahan_name}, ${report.kecamatan_name || ""}`
                            : report.address_detail}
                        </span>
                      </div>
                    </td>

                    {/* Priority */}
                    <td className="py-3.5 px-4">
                      <ReportPriorityBadge priority={report.priority} size="sm" />
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <ReportStatusBadge status={report.status} size="sm" />
                    </td>

                    {/* Submitted At */}
                    <td className="py-3.5 px-4 text-[12px] text-[#747686] whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <Clock3 size={13} className="text-[#747686]" aria-hidden="true" />
                        <span>{formatDate(report.created_at)}</span>
                      </div>
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <Link
                        href={`/admin/laporan/${report.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[12px] font-semibold text-[#0033A7] bg-[#F0F3FF] hover:bg-[#DFE8FF] rounded-lg transition-colors"
                        aria-label={`Buka detail laporan ${report.tracking_code}`}
                      >
                        <Eye size={14} aria-hidden="true" />
                        <span>Detail</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white rounded-xl border border-[#D9DEE7] shadow-sm p-12 text-center flex flex-col items-center justify-center">
          <div className="w-14 h-14 rounded-2xl bg-[#F0F3FF] text-[#0033A7] flex items-center justify-center mb-4">
            <Inbox size={30} strokeWidth={2} aria-hidden="true" />
          </div>
          <h2 className="text-[17px] font-bold text-[#111C2D]">
            {reports.length === 0 ? "Belum ada laporan masuk" : "Tidak ada laporan yang cocok"}
          </h2>
          <p className="text-[13px] text-[#747686] max-w-md mt-1 leading-relaxed">
            {reports.length === 0
              ? "Laporan warga yang telah dikirim melalui portal pelaporan akan otomatis muncul di antrean ini untuk diverifikasi."
              : "Tidak ditemukan laporan yang memenuhi kriteria pencarian dan filter saat ini. Silakan periksa kembali kata kunci atau atur ulang filter."}
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="mt-4 px-4 py-2 text-[13px] font-semibold text-[#0033A7] bg-[#F0F3FF] hover:bg-[#DFE8FF] rounded-lg transition-colors inline-flex items-center gap-1.5"
            >
              <X size={14} aria-hidden="true" />
              <span>Reset Semua Filter</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
