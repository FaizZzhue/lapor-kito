import type { ReportStatus } from "@/types/database";

/**
 * Valid operational status transition graph.
 * Enforces strict transitions without arbitrary jumps.
 */
export const VALID_STATUS_TRANSITIONS: Record<ReportStatus, readonly ReportStatus[]> = {
  submitted: ["verifying"],
  verifying: ["verified", "rejected", "duplicate"],
  verified: ["in_progress", "rejected", "duplicate"],
  in_progress: ["resolved", "rejected"],
  resolved: [],
  rejected: [],
  duplicate: [],
  draft: [],
};

export interface StatusTransitionConfig {
  targetStatus: ReportStatus;
  label: string;
  actionTitle: string;
  defaultNotes: string;
  confirmTitle: string;
  confirmDescription: string;
  requiresReason?: boolean;
  variant: "primary" | "success" | "warning" | "destructive";
}

export const STATUS_TRANSITIONS_METADATA: Record<ReportStatus, StatusTransitionConfig[]> = {
  submitted: [
    {
      targetStatus: "verifying",
      label: "Mulai Verifikasi",
      actionTitle: "Proses Verifikasi Dimulai",
      defaultNotes: "Laporan masuk ke tahap verifikasi operasional dan sedang ditinjau kesesuaian berkasnya oleh petugas.",
      confirmTitle: "Mulai Verifikasi Laporan?",
      confirmDescription: "Status laporan akan diperbarui dari 'Laporan Masuk' menjadi 'Verifikasi'. Petugas akan mulai memproses berkas pengaduan ini.",
      variant: "primary",
    },
  ],
  verifying: [
    {
      targetStatus: "verified",
      label: "Verifikasi Laporan",
      actionTitle: "Laporan Terverifikasi",
      defaultNotes: "Laporan telah diverifikasi keabsahannya dan memenuhi syarat untuk diteruskan tindak lanjut penanganan.",
      confirmTitle: "Verifikasi Laporan Ini?",
      confirmDescription: "Laporan akan dinyatakan sah dan siap untuk ditindaklanjuti oleh unit dinas atau pihak pelaksana.",
      variant: "success",
    },
    {
      targetStatus: "rejected",
      label: "Tolak Laporan",
      actionTitle: "Laporan Ditolak",
      defaultNotes: "Laporan ditolak setelah penelaahan verifikasi operasional.",
      confirmTitle: "Tolak Laporan Pengaduan?",
      confirmDescription: "PERINGATAN: Laporan akan ditandai 'Ditolak' sebagai status akhir operasional. Berikan alasan penolakan yang jelas untuk catatan audit dan warga.",
      requiresReason: true,
      variant: "destructive",
    },
    {
      targetStatus: "duplicate",
      label: "Tandai sebagai Duplikat",
      actionTitle: "Laporan Ditandai Duplikat",
      defaultNotes: "Laporan ditandai sebagai duplikasi dari laporan lain yang telah masuk sebelumnya.",
      confirmTitle: "Tandai Laporan sebagai Duplikat?",
      confirmDescription: "PERINGATAN: Laporan akan ditandai 'Duplikat' sebagai status terminal dan tidak akan diproses lebih lanjut.",
      requiresReason: true,
      variant: "warning",
    },
  ],
  verified: [
    {
      targetStatus: "in_progress",
      label: "Mulai Ditindaklanjuti",
      actionTitle: "Laporan Sedang Ditindaklanjuti",
      defaultNotes: "Laporan dalam penanganan langsung di lapangan oleh tim dinas/instansi terkait.",
      confirmTitle: "Mulai Tindak Lanjut Lapangan?",
      confirmDescription: "Status laporan akan diubah menjadi 'Dalam Proses'. Tim teknis di lapangan sedang menangani masalah pengaduan ini.",
      variant: "primary",
    },
    {
      targetStatus: "rejected",
      label: "Tolak Laporan",
      actionTitle: "Laporan Ditolak",
      defaultNotes: "Laporan ditolak pada tahap persiapan penanganan.",
      confirmTitle: "Tolak Laporan Pengaduan?",
      confirmDescription: "PERINGATAN: Laporan akan ditandai 'Ditolak'. Cantumkan alasan pembatalan atau penolakan pengaduan.",
      requiresReason: true,
      variant: "destructive",
    },
    {
      targetStatus: "duplicate",
      label: "Tandai sebagai Duplikat",
      actionTitle: "Laporan Ditandai Duplikat",
      defaultNotes: "Laporan ditandai sebagai duplikasi dari laporan pengaduan terdahulu.",
      confirmTitle: "Tandai Laporan sebagai Duplikat?",
      confirmDescription: "Laporan akan ditandai sebagai pengaduan duplikat.",
      requiresReason: true,
      variant: "warning",
    },
  ],
  in_progress: [
    {
      targetStatus: "resolved",
      label: "Tandai Selesai",
      actionTitle: "Laporan Selesai",
      defaultNotes: "Penanganan pengaduan telah tuntas dilaksanakan oleh pihak dinas berwenang.",
      confirmTitle: "Tandai Laporan Selesai?",
      confirmDescription: "Laporan akan dinyatakan 'Selesai' (Tuntas). Pastikan penanganan teknis di lapangan telah benar-benar selesai.",
      variant: "success",
    },
    {
      targetStatus: "rejected",
      label: "Tolak Laporan",
      actionTitle: "Laporan Ditolak",
      defaultNotes: "Laporan dihentikan dan ditolak saat proses tindak lanjut.",
      confirmTitle: "Hentikan dan Tolak Laporan?",
      confirmDescription: "PERINGATAN: Tindak lanjut pengaduan akan dibatalkan dan status dialihkan ke 'Ditolak'. Cantumkan alasan resmi.",
      requiresReason: true,
      variant: "destructive",
    },
  ],
  resolved: [],
  rejected: [],
  duplicate: [],
  draft: [],
};

export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  draft: "Draf",
  submitted: "Laporan Masuk",
  verifying: "Verifikasi",
  verified: "Terverifikasi",
  in_progress: "Sedang Diproses",
  resolved: "Selesai",
  rejected: "Ditolak",
  duplicate: "Duplikat",
};

export const REPORT_STATUS_DESCRIPTIONS: Record<ReportStatus, string> = {
  draft: "Laporan masih dalam bentuk draf dan belum diajukan.",
  submitted: "Laporan Anda telah berhasil diajukan dan sedang mengantre untuk diperiksa.",
  verifying: "Laporan Anda sedang dalam tahap verifikasi kelayakan dan kelengkapan oleh tim verifikator.",
  verified: "Laporan Anda telah dinyatakan sah dan memenuhi syarat untuk diteruskan tindak lanjut penanganan.",
  in_progress: "Laporan Anda saat ini sedang dalam penanganan aktif dan tindak lanjut lapangan oleh unit instansi terkait.",
  resolved: "Penanganan pengaduan telah selesai ditindaklanjuti secara tuntas oleh pihak berwenang.",
  rejected: "Laporan tidak dapat diproses lebih lanjut setelah penelaahan verifikasi operasional.",
  duplicate: "Laporan ditandai sebagai duplikasi karena permasalahan serupa telah dilaporkan sebelumnya.",
};
