"use client";

import { useState, useTransition } from "react";
import type { SystemSettingRow } from "@/lib/actions/system-settings";
import {
  upsertSettingAction,
  deleteSettingAction,
} from "@/lib/actions/system-settings";

// ====================================================================
// KNOWN SETTING DEFINITIONS
// ====================================================================

interface KnownSetting {
  key: string;
  label: string;
  description: string;
  icon: string;
  defaultValue: Record<string, unknown>;
  fields: { name: string; label: string; type: "text" | "number" | "boolean"; placeholder?: string }[];
}

const KNOWN_SETTINGS: KnownSetting[] = [
  {
    key: "platform_name",
    label: "Nama Platform",
    description: "Nama resmi platform yang ditampilkan kepada publik.",
    icon: "badge",
    defaultValue: { value: "LAPORKITO" },
    fields: [{ name: "value", label: "Nama", type: "text", placeholder: "LAPORKITO" }],
  },
  {
    key: "maintenance_mode",
    label: "Mode Pemeliharaan",
    description: "Aktifkan untuk menonaktifkan sementara penerimaan laporan publik.",
    icon: "engineering",
    defaultValue: { enabled: false, message: "" },
    fields: [
      { name: "enabled", label: "Aktif", type: "boolean" },
      { name: "message", label: "Pesan Pemeliharaan", type: "text", placeholder: "Sistem sedang dalam pemeliharaan..." },
    ],
  },
  {
    key: "report_limits",
    label: "Batas Laporan",
    description: "Konfigurasi batas unggahan dan pengiriman laporan.",
    icon: "upload_file",
    defaultValue: { max_file_size_mb: 10, max_files_per_report: 5 },
    fields: [
      { name: "max_file_size_mb", label: "Maks. Ukuran File (MB)", type: "number", placeholder: "10" },
      { name: "max_files_per_report", label: "Maks. File per Laporan", type: "number", placeholder: "5" },
    ],
  },
  {
    key: "notification_settings",
    label: "Notifikasi",
    description: "Pengaturan notifikasi email dan pemberitahuan sistem.",
    icon: "notifications",
    defaultValue: { email_enabled: true, admin_digest: false },
    fields: [
      { name: "email_enabled", label: "Notifikasi Email Aktif", type: "boolean" },
      { name: "admin_digest", label: "Ringkasan Harian Admin", type: "boolean" },
    ],
  },
];

// ====================================================================
// COMPONENT
// ====================================================================

interface Props {
  initialSettings: SystemSettingRow[];
  isAdmin: boolean;
}

export function SystemSettingsManager({ initialSettings, isAdmin }: Props) {
  const [settings, setSettings] = useState<SystemSettingRow[]>(initialSettings);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, unknown>>({});
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const getSettingValue = (key: string): Record<string, unknown> | null => {
    const found = settings.find((s) => s.key === key);
    return found ? (found.value as Record<string, unknown>) : null;
  };

  const handleEdit = (ks: KnownSetting) => {
    const currentValue = getSettingValue(ks.key) ?? ks.defaultValue;
    setEditValues(currentValue);
    setEditingKey(ks.key);
    setMessage(null);
  };

  const handleCancel = () => {
    setEditingKey(null);
    setEditValues({});
    setMessage(null);
  };

  const handleSave = (ks: KnownSetting) => {
    startTransition(async () => {
      const result = await upsertSettingAction({
        key: ks.key,
        value: editValues,
        description: ks.description,
      });

      if (result.success) {
        // Update local state
        setSettings((prev) => {
          const idx = prev.findIndex((s) => s.key === ks.key);
          const updated: SystemSettingRow = {
            id: idx >= 0 ? prev[idx].id : crypto.randomUUID(),
            key: ks.key,
            value: editValues as Record<string, unknown>,
            description: ks.description,
            updated_at: new Date().toISOString(),
          };
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = updated;
            return next;
          }
          return [...prev, updated];
        });
        setEditingKey(null);
        setMessage({ type: "success", text: `Pengaturan "${ks.label}" berhasil disimpan.` });
      } else {
        setMessage({ type: "error", text: result.error ?? "Gagal menyimpan." });
      }
    });
  };

  const handleDelete = (ks: KnownSetting) => {
    if (!confirm(`Hapus pengaturan "${ks.label}"? Nilai akan dikembalikan ke default.`)) return;

    startTransition(async () => {
      const result = await deleteSettingAction(ks.key);
      if (result.success) {
        setSettings((prev) => prev.filter((s) => s.key !== ks.key));
        setMessage({ type: "success", text: `Pengaturan "${ks.label}" dihapus.` });
      } else {
        setMessage({ type: "error", text: result.error ?? "Gagal menghapus." });
      }
    });
  };

  // Custom (non-known) settings from DB
  const customSettings = settings.filter(
    (s) => !KNOWN_SETTINGS.some((ks) => ks.key === s.key)
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Status Message */}
      {message && (
        <div
          className={`flex items-center gap-2 px-4 py-3 rounded-lg border text-[13px] font-medium ${
            message.type === "success"
              ? "bg-[#EDF7F2] border-[#B5E2CD] text-[#16845B]"
              : "bg-[#FFDAD6] border-[#FFB4AB] text-[#BA1A1A]"
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">
            {message.type === "success" ? "check_circle" : "error"}
          </span>
          <span>{message.text}</span>
          <button
            onClick={() => setMessage(null)}
            className="ml-auto text-[16px] opacity-60 hover:opacity-100"
          >
            ×
          </button>
        </div>
      )}

      {/* Security Notice */}
      <div className="flex items-start gap-3 px-4 py-3 rounded-lg bg-[#FEF3E6] border border-[#FCD7A9]">
        <span className="material-symbols-outlined text-[#B2640A] text-[18px] mt-0.5">shield</span>
        <div>
          <p className="text-[13px] font-semibold text-[#B2640A]">Keamanan Pengaturan</p>
          <p className="text-[12px] text-[#8B6914] mt-0.5">
            API keys, service role keys, dan kredensial sensitif <strong>tidak ditampilkan</strong> di halaman ini.
            Kredensial tersebut dikelola melalui environment variables server.
          </p>
        </div>
      </div>

      {/* Known Settings */}
      <div className="bg-white rounded-xl border border-[#D9DEE7] shadow-sm overflow-hidden divide-y divide-[#F0F3FF]">
        {KNOWN_SETTINGS.map((ks) => {
          const saved = getSettingValue(ks.key);
          const isEditing = editingKey === ks.key;
          const hasSavedValue = saved !== null;

          return (
            <div key={ks.key} className="p-5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-[#F0F3FF] flex items-center justify-center shrink-0 text-[#0033A7]">
                  <span className="material-symbols-outlined text-[22px]">{ks.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-[15px] font-semibold text-[#111C2D]">{ks.label}</span>
                    {hasSavedValue ? (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#EDF7F2] text-[#16845B] font-medium border border-[#B5E2CD]">
                        Dikonfigurasi
                      </span>
                    ) : (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#F0F3FF] text-[#747686] font-medium border border-[#D9DEE7]">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="text-[13px] text-[#434654] mt-0.5">{ks.description}</p>

                  {/* Current Value Display */}
                  {!isEditing && hasSavedValue && (
                    <div className="mt-3 p-3 rounded-lg bg-[#F9F9FF] border border-[#D9DEE7]">
                      <p className="text-[11px] font-semibold text-[#747686] uppercase tracking-wider mb-1.5">
                        Nilai Tersimpan
                      </p>
                      <div className="flex flex-wrap gap-x-6 gap-y-1">
                        {ks.fields.map((f) => (
                          <div key={f.name} className="text-[13px]">
                            <span className="text-[#747686]">{f.label}: </span>
                            <span className="font-medium text-[#111C2D]">
                              {f.type === "boolean"
                                ? (saved[f.name] ? "Aktif" : "Nonaktif")
                                : String(saved[f.name] ?? "—")}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Edit Form */}
                  {isEditing && (
                    <div className="mt-3 p-4 rounded-lg bg-[#F9F9FF] border border-[#C4D3F8]">
                      <div className="flex flex-col gap-3">
                        {ks.fields.map((f) => (
                          <div key={f.name}>
                            <label className="text-[12px] font-semibold text-[#434654] mb-1 block">
                              {f.label}
                            </label>
                            {f.type === "boolean" ? (
                              <button
                                type="button"
                                onClick={() =>
                                  setEditValues((prev) => ({ ...prev, [f.name]: !prev[f.name] }))
                                }
                                className={`relative inline-flex h-6 w-11 rounded-full transition-colors ${
                                  editValues[f.name]
                                    ? "bg-[#1749D2]"
                                    : "bg-[#D9DEE7]"
                                }`}
                              >
                                <span
                                  className={`inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform ${
                                    editValues[f.name] ? "translate-x-5" : "translate-x-0.5"
                                  } mt-0.5`}
                                />
                              </button>
                            ) : (
                              <input
                                type={f.type}
                                value={String(editValues[f.name] ?? "")}
                                onChange={(e) =>
                                  setEditValues((prev) => ({
                                    ...prev,
                                    [f.name]: f.type === "number" ? Number(e.target.value) : e.target.value,
                                  }))
                                }
                                placeholder={f.placeholder}
                                className="w-full px-3 py-2 text-[13px] rounded-lg border border-[#D9DEE7] bg-white text-[#111C2D] placeholder:text-[#747686] focus:border-[#1749D2] focus:ring-2 focus:ring-[#1749D2]/15 outline-none transition-all"
                              />
                            )}
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 mt-4">
                        <button
                          onClick={() => handleSave(ks)}
                          disabled={isPending}
                          className="px-4 py-2 text-[13px] font-semibold bg-[#1749D2] hover:bg-[#0033A7] text-white rounded-lg transition-colors disabled:opacity-50"
                        >
                          {isPending ? "Menyimpan..." : "Simpan"}
                        </button>
                        <button
                          onClick={handleCancel}
                          className="px-4 py-2 text-[13px] font-medium text-[#434654] hover:bg-[#F0F3FF] rounded-lg transition-colors"
                        >
                          Batal
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                {!isEditing && isAdmin && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleEdit(ks)}
                      className="p-2 text-[#0033A7] hover:bg-[#F0F3FF] rounded-lg transition-colors"
                      title="Edit pengaturan"
                    >
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                    </button>
                    {hasSavedValue && (
                      <button
                        onClick={() => handleDelete(ks)}
                        disabled={isPending}
                        className="p-2 text-[#BA1A1A] hover:bg-[#FFDAD6] rounded-lg transition-colors disabled:opacity-50"
                        title="Hapus pengaturan"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Custom Settings (from DB, not in KNOWN_SETTINGS) */}
      {customSettings.length > 0 && (
        <div>
          <h3 className="text-[14px] font-semibold text-[#111C2D] mb-3">Pengaturan Lainnya</h3>
          <div className="bg-white rounded-xl border border-[#D9DEE7] shadow-sm overflow-hidden divide-y divide-[#F0F3FF]">
            {customSettings.map((s) => (
              <div key={s.id} className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <code className="text-[13px] font-semibold text-[#0033A7] bg-[#F0F3FF] px-2 py-0.5 rounded">
                      {s.key}
                    </code>
                    {s.description && (
                      <p className="text-[12px] text-[#747686] mt-1">{s.description}</p>
                    )}
                    <pre className="text-[12px] text-[#434654] mt-2 p-2 bg-[#F9F9FF] rounded border border-[#D9DEE7] overflow-x-auto max-w-lg">
                      {JSON.stringify(s.value, null, 2)}
                    </pre>
                  </div>
                  <div className="text-[11px] text-[#747686] shrink-0">
                    {new Date(s.updated_at).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {settings.length === 0 && (
        <div className="bg-white rounded-xl border border-[#D9DEE7] shadow-sm p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#F0F3FF] flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-[#747686] text-[32px]">settings</span>
          </div>
          <p className="text-[15px] font-semibold text-[#111C2D] mb-1">Belum Dikonfigurasi</p>
          <p className="text-[13px] text-[#434654] max-w-md mx-auto leading-relaxed">
            Pengaturan sistem menggunakan nilai default. Klik tombol edit pada setiap pengaturan di atas untuk mengonfigurasi sesuai kebutuhan.
          </p>
        </div>
      )}
    </div>
  );
}
