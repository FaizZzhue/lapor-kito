import { createClient } from "@/lib/supabase/server";
import { getCurrentInternalUser } from "@/lib/auth/session";
import Link from "next/link";
import {
  ShieldCheck,
  Clock,
  MessageSquare,
  Bot,
  BadgeCheck,
  Info,
  Lock,
  Lightbulb,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function LogAuditPage() {
  const { internalUser } = await getCurrentInternalUser();
  if (internalUser?.role !== "admin") {
    redirect("/admin/laporan");
  }
  const supabase = await createClient();

  // Fetch available data sources for audit trail
  const [
    timelineRes,
    responsesRes,
    aiLogsRes,
    staffRes,
  ] = await Promise.all([
    supabase
      .from("report_timeline")
      .select("id, report_id, actor_role, action, created_at")
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("report_responses")
      .select("id, report_id, response_type, is_public, created_at")
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("ai_triage_logs")
      .select("id, report_id, model, prompt_version, tokens_used, processing_time_ms, created_at")
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("internal_users")
      .select("id, full_name, email, role, is_active, created_at, updated_at")
      .order("updated_at", { ascending: false })
      .limit(10),
  ]);

  const timeline = timelineRes.data ?? [];
  const responses = responsesRes.data ?? [];
  const aiLogs = aiLogsRes.data ?? [];
  const staff = staffRes.data ?? [];

  const totalAvailable = timeline.length + responses.length + aiLogs.length;

  return (
    <div className="flex flex-col w-full">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#D9DEE7]/80 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1749D2]" />
            <p className="text-[11px] font-semibold text-[#747686] uppercase tracking-wider">
              Pengaturan &amp; Tata Kelola • Audit
            </p>
          </div>
          <h1 className="text-[26px] font-semibold text-[#111C2D] tracking-tight">
            Log Audit &amp; Sesi
          </h1>
          <p className="text-[14px] text-[#434654] mt-1">
            Riwayat aktivitas operasional, jejak timeline laporan, dan informasi sesi pengguna internal.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#F0F3FF] border border-[#D9DEE7] rounded-lg shadow-sm self-start md:self-auto">
          <ShieldCheck size={18} className="text-[#1749D2]" aria-hidden="true" />
          <div className="flex flex-col">
            <span className="text-[11px] font-semibold text-[#111C2D]">
              {internalUser?.full_name ?? "Staff"}
            </span>
            <span className="text-[10px] text-[#747686]">
              Sesi aktif • {internalUser?.role === "admin" ? "Administrator" : "Petugas"}
            </span>
          </div>
        </div>
      </div>

      {/* ================================================================ */}
      {/* AUDIT DATA SOURCE SUMMARY */}
      {/* ================================================================ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <AuditMetricCard
          label="Timeline Laporan"
          count={timeline.length}
          icon={Clock}
          description="Entri terbaru"
          color="#1749D2"
        />
        <AuditMetricCard
          label="Tanggapan Instansi"
          count={responses.length}
          icon={MessageSquare}
          description="Entri terbaru"
          color="#16845B"
        />
        <AuditMetricCard
          label="Log AI Triage"
          count={aiLogs.length}
          icon={Bot}
          description="Evaluasi AI"
          color="#E58A1F"
        />
        <AuditMetricCard
          label="Pengguna Internal"
          count={staff.length}
          icon={BadgeCheck}
          description="Terakhir diperbarui"
          color="#0033A7"
        />
      </div>

      {/* ================================================================ */}
      {/* AUDIT SCOPE NOTICE */}
      {/* ================================================================ */}
      <div className="flex items-start gap-3 px-4 py-3 rounded-lg bg-[#FEF3E6] border border-[#FCD7A9] mb-6">
        <Info size={18} className="text-[#B2640A] mt-0.5 shrink-0" aria-hidden="true" />
        <div>
          <p className="text-[13px] font-semibold text-[#B2640A]">Cakupan Log Audit Saat Ini</p>
          <p className="text-[12px] text-[#8B6914] mt-0.5 leading-relaxed">
            Halaman ini menampilkan data audit dari sumber yang <strong>sudah tersedia</strong>:{" "}
            <code className="bg-white/50 px-1 rounded">report_timeline</code>,{" "}
            <code className="bg-white/50 px-1 rounded">report_responses</code>,{" "}
            <code className="bg-white/50 px-1 rounded">ai_triage_logs</code>, dan metadata{" "}
            <code className="bg-white/50 px-1 rounded">internal_users</code>.
            Log aksi admin (CRUD instansi, perubahan pengaturan, manajemen pengguna) membutuhkan tabel audit terpisah yang belum diimplementasikan.
            Tidak ada riwayat aksi fiktif yang ditampilkan.
          </p>
        </div>
      </div>

      {/* ================================================================ */}
      {/* SECTION 1: REPORT TIMELINE */}
      {/* ================================================================ */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Clock size={18} className="text-[#1749D2]" aria-hidden="true" />
          <h2 className="text-[16px] font-semibold text-[#111C2D]">Timeline Laporan</h2>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#F0F3FF] text-[#747686] font-medium">
            {timeline.length} entri
          </span>
        </div>

        {timeline.length > 0 ? (
          <div className="bg-white rounded-xl border border-[#D9DEE7] shadow-sm overflow-hidden">
            <table className="w-full text-[13px]">
              <thead className="bg-[#F9F9FF] border-b border-[#D9DEE7]">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-[#434654]">Waktu</th>
                  <th className="text-left px-4 py-3 font-semibold text-[#434654]">Laporan</th>
                  <th className="text-left px-4 py-3 font-semibold text-[#434654]">Aksi</th>
                  <th className="text-left px-4 py-3 font-semibold text-[#434654]">Aktor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F3FF]">
                {timeline.map((t) => (
                  <tr key={t.id} className="hover:bg-[#F9F9FF]">
                    <td className="px-4 py-3 text-[#747686]">
                      {new Date(t.created_at).toLocaleString("id-ID", {
                        day: "numeric", month: "short", year: "numeric",
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <code className="text-[12px] text-[#0033A7] bg-[#F0F3FF] px-1.5 py-0.5 rounded">
                        {t.report_id.slice(0, 8)}…
                      </code>
                    </td>
                    <td className="px-4 py-3 font-medium text-[#111C2D]">{t.action}</td>
                    <td className="px-4 py-3 text-[#747686]">{t.actor_role}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyAuditSection
            icon={Clock}
            title="Belum Ada Timeline Laporan"
            description="Riwayat perubahan status dan aktivitas laporan akan muncul di sini setelah laporan warga diproses oleh petugas."
          />
        )}
      </div>

      {/* ================================================================ */}
      {/* SECTION 2: AI TRIAGE LOGS */}
      {/* ================================================================ */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Bot size={18} className="text-[#E58A1F]" aria-hidden="true" />
          <h2 className="text-[16px] font-semibold text-[#111C2D]">Log AI Triage</h2>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#FEF3E6] text-[#B2640A] font-medium border border-[#FCD7A9]">
            {aiLogs.length} evaluasi
          </span>
        </div>

        {aiLogs.length > 0 ? (
          <div className="bg-white rounded-xl border border-[#D9DEE7] shadow-sm overflow-hidden">
            <table className="w-full text-[13px]">
              <thead className="bg-[#F9F9FF] border-b border-[#D9DEE7]">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-[#434654]">Waktu</th>
                  <th className="text-left px-4 py-3 font-semibold text-[#434654]">Model</th>
                  <th className="text-left px-4 py-3 font-semibold text-[#434654]">Versi Prompt</th>
                  <th className="text-left px-4 py-3 font-semibold text-[#434654]">Token</th>
                  <th className="text-left px-4 py-3 font-semibold text-[#434654]">Waktu Proses</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F3FF]">
                {aiLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#F9F9FF]">
                    <td className="px-4 py-3 text-[#747686]">
                      {new Date(log.created_at).toLocaleString("id-ID", {
                        day: "numeric", month: "short", year: "numeric",
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[12px] font-medium text-[#111C2D] bg-[#F0F3FF] px-2 py-0.5 rounded">
                        {log.model}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#434654]">{log.prompt_version}</td>
                    <td className="px-4 py-3 text-[#434654]">{log.tokens_used?.toLocaleString() ?? "—"}</td>
                    <td className="px-4 py-3 text-[#434654]">
                      {log.processing_time_ms ? `${log.processing_time_ms}ms` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyAuditSection
            icon={Bot}
            title="Belum Ada Log AI"
            description="Riwayat evaluasi AI triage akan ditampilkan setelah sistem AI memproses laporan warga."
          />
        )}
      </div>

      {/* ================================================================ */}
      {/* SECTION 3: INTERNAL USERS SESSION OVERVIEW */}
      {/* ================================================================ */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <BadgeCheck size={18} className="text-[#0033A7]" aria-hidden="true" />
          <h2 className="text-[16px] font-semibold text-[#111C2D]">Pengguna Internal</h2>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#F0F3FF] text-[#0033A7] font-medium border border-[#D9DEE7]">
            {staff.length} pengguna
          </span>
        </div>

        {staff.length > 0 ? (
          <div className="bg-white rounded-xl border border-[#D9DEE7] shadow-sm overflow-hidden">
            <table className="w-full text-[13px]">
              <thead className="bg-[#F9F9FF] border-b border-[#D9DEE7]">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-[#434654]">Nama</th>
                  <th className="text-left px-4 py-3 font-semibold text-[#434654]">Email</th>
                  <th className="text-left px-4 py-3 font-semibold text-[#434654]">Peran</th>
                  <th className="text-left px-4 py-3 font-semibold text-[#434654]">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-[#434654]">Terakhir Diperbarui</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F3FF]">
                {staff.map((u) => (
                  <tr key={u.id} className="hover:bg-[#F9F9FF]">
                    <td className="px-4 py-3 font-medium text-[#111C2D]">{u.full_name}</td>
                    <td className="px-4 py-3 text-[#434654]">{u.email}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                          u.role === "admin"
                            ? "bg-[#EEF2FC] text-[#1749D2] border border-[#C4D3F8]"
                            : "bg-[#F0F3FF] text-[#747686] border border-[#D9DEE7]"
                        }`}
                      >
                        {u.role === "admin" ? "Administrator" : "Petugas"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium ${
                          u.is_active
                            ? "bg-[#EDF7F2] text-[#16845B] border border-[#B5E2CD]"
                            : "bg-[#FFDAD6] text-[#BA1A1A] border border-[#FFB4AB]"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${u.is_active ? "bg-[#16845B]" : "bg-[#BA1A1A]"}`} />
                        {u.is_active ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#747686]">
                      {new Date(u.updated_at).toLocaleString("id-ID", {
                        day: "numeric", month: "short", year: "numeric",
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyAuditSection
            icon={BadgeCheck}
            title="Belum Ada Pengguna Internal"
            description="Daftar pengguna internal akan ditampilkan setelah administrator mendaftarkan akun staf."
          />
        )}

        {staff.length > 0 && (
          <div className="mt-2 flex justify-end">
            <Link
              href="/admin/pengguna-internal"
              className="text-[12px] text-[#0033A7] hover:text-[#1749D2] font-medium inline-flex items-center gap-1"
            >
              Lihat semua pengguna
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
        )}
      </div>

      {/* ================================================================ */}
      {/* SECTION 4: TANGGAPAN LAPORAN */}
      {/* ================================================================ */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <MessageSquare size={18} className="text-[#16845B]" aria-hidden="true" />
          <h2 className="text-[16px] font-semibold text-[#111C2D]">Tanggapan Terbaru</h2>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#EDF7F2] text-[#16845B] font-medium border border-[#B5E2CD]">
            {responses.length} tanggapan
          </span>
        </div>

        {responses.length > 0 ? (
          <div className="bg-white rounded-xl border border-[#D9DEE7] shadow-sm overflow-hidden">
            <table className="w-full text-[13px]">
              <thead className="bg-[#F9F9FF] border-b border-[#D9DEE7]">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-[#434654]">Waktu</th>
                  <th className="text-left px-4 py-3 font-semibold text-[#434654]">Laporan</th>
                  <th className="text-left px-4 py-3 font-semibold text-[#434654]">Tipe</th>
                  <th className="text-left px-4 py-3 font-semibold text-[#434654]">Publik</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F3FF]">
                {responses.map((r) => (
                  <tr key={r.id} className="hover:bg-[#F9F9FF]">
                    <td className="px-4 py-3 text-[#747686]">
                      {new Date(r.created_at).toLocaleString("id-ID", {
                        day: "numeric", month: "short", year: "numeric",
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <code className="text-[12px] text-[#0033A7] bg-[#F0F3FF] px-1.5 py-0.5 rounded">
                        {r.report_id.slice(0, 8)}…
                      </code>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[12px] font-medium text-[#111C2D] bg-[#F0F3FF] px-2 py-0.5 rounded">
                        {r.response_type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                        r.is_public
                          ? "bg-[#EDF7F2] text-[#16845B]"
                          : "bg-[#F0F3FF] text-[#747686]"
                      }`}>
                        {r.is_public ? "Ya" : "Internal"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyAuditSection
            icon={MessageSquare}
            title="Belum Ada Tanggapan"
            description="Riwayat tanggapan instansi terhadap laporan warga akan ditampilkan di sini."
          />
        )}
      </div>

      {/* ================================================================ */}
      {/* SECURITY NOTE */}
      {/* ================================================================ */}
      <div className="flex items-start gap-3 px-4 py-3 rounded-lg bg-[#F0F3FF] border border-[#D9DEE7] mb-6">
        <Lock size={18} className="text-[#0033A7] mt-0.5 shrink-0" aria-hidden="true" />
        <div>
          <p className="text-[13px] font-semibold text-[#111C2D]">Keamanan Informasi</p>
          <p className="text-[12px] text-[#434654] mt-0.5 leading-relaxed">
            Halaman ini tidak menampilkan access tokens, refresh tokens, password hash, atau credential sensitif.
            Session metadata Supabase Auth hanya diakses secara internal melalui server-side helpers dan tidak pernah terekspos ke client bundle.
          </p>
        </div>
      </div>

      {/* Audit Log Migration Proposal Notice */}
      {totalAvailable === 0 && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-lg bg-[#F0F3FF] border border-[#C4D3F8]">
          <Lightbulb size={18} className="text-[#1749D2] mt-0.5 shrink-0" aria-hidden="true" />
          <div>
            <p className="text-[13px] font-semibold text-[#111C2D]">Rekomendasi: Audit Log Terstruktur</p>
            <p className="text-[12px] text-[#434654] mt-0.5 leading-relaxed">
              Untuk jejak audit komprehensif (CRUD instansi, perubahan pengaturan, manajemen pengguna),
              platform membutuhkan tabel <code className="bg-white px-1 rounded">admin_audit_logs</code> khusus.
              Tabel ini belum diimplementasikan dan akan diusulkan sebagai migration terpisah jika dibutuhkan.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ====================================================================
// SUB-COMPONENTS
// ====================================================================

function AuditMetricCard({
  label,
  count,
  icon: Icon,
  description,
  color,
}: {
  label: string;
  count: number;
  icon: LucideIcon;
  description: string;
  color: string;
}) {
  return (
    <div className="bg-white p-4 rounded-xl border border-[#D9DEE7] shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[12px] font-medium text-[#747686]">{label}</span>
        <Icon size={18} style={{ color }} aria-hidden="true" />
      </div>
      <span className="text-[22px] font-bold text-[#111C2D]">{count}</span>
      <p className="text-[11px] text-[#747686] mt-0.5">{description}</p>
    </div>
  );
}

function EmptyAuditSection({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-[#D9DEE7] shadow-sm p-8 text-center">
      <div className="w-12 h-12 rounded-xl bg-[#F0F3FF] flex items-center justify-center mx-auto mb-3">
        <Icon size={28} className="text-[#747686]" aria-hidden="true" />
      </div>
      <p className="text-[14px] font-medium text-[#434654]">{title}</p>
      <p className="text-[12px] text-[#747686] mt-1 max-w-md mx-auto">{description}</p>
    </div>
  );
}
