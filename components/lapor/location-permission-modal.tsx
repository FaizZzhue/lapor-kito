"use client";

import React, { useEffect } from "react";
import { MapPin, X, ShieldCheck } from "lucide-react";

interface LocationPermissionModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function LocationPermissionModal({
  isOpen,
  onConfirm,
  onClose,
}: LocationPermissionModalProps) {
  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="location-dialog-title"
      aria-describedby="location-dialog-desc"
    >
      {/* Modal Card */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-700 shrink-0">
              <MapPin className="h-5 w-5" />
            </span>
            <div>
              <h3
                id="location-dialog-title"
                className="text-sm font-bold text-slate-900 leading-tight"
              >
                Izin Akses Lokasi Perangkat
              </h3>
              <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                Bantu tentukan titik laporan secara akurat
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Tutup dialog"
            title="Tutup dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Body */}
        <div id="location-dialog-desc" className="p-5 space-y-3.5 text-xs text-slate-600 leading-relaxed">
          <p>
            LAPORKITO membutuhkan koordinat GPS perangkat Anda untuk menandai titik kerusakan fasilitas publik di Kota Palembang secara langsung pada peta operasional.
          </p>

          <div className="space-y-2 rounded-xl bg-blue-50/60 border border-blue-100 p-3.5 text-slate-700">
            <div className="font-semibold text-blue-950 flex items-center gap-1.5 text-[11px]">
              <ShieldCheck className="h-3.5 w-3.5 text-blue-700 shrink-0" />
              <span>Ketentuan Akses Lokasi:</span>
            </div>
            <ul className="space-y-1.5 text-[11px] pl-1">
              <li className="flex items-start gap-1.5">
                <span className="text-blue-600 font-bold">•</span>
                <span>
                  Lokasi <strong>hanya diambil satu kali</strong> saat Anda menekan tombol setuju.
                </span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-blue-600 font-bold">•</span>
                <span>
                  Peramban (browser) akan menampilkan konfirmasi izin sistem jika belum pernah diberikan.
                </span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-blue-600 font-bold">•</span>
                <span>
                  Titik koordinat dan patokan jalan tetap dapat Anda tinjau di Google Maps atau diisi secara manual.
                </span>
              </li>
            </ul>
          </div>

          <p className="text-[11px] text-slate-500 italic">
            *Jika Anda menolak, formulir tetap dapat diisi lengkap menggunakan pilihan Kecamatan, Kelurahan, dan alamat patokan manual.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="px-5 py-3.5 bg-slate-50/80 border-t border-slate-100 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto h-9 px-4 rounded-lg border border-slate-200 bg-white font-mono text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer text-center"
          >
            Nanti Saja
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="w-full sm:w-auto h-9 px-4 rounded-lg bg-blue-700 font-mono text-xs font-bold text-white hover:bg-blue-800 transition-colors shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer text-center"
          >
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span>Izinkan &amp; Deteksi Lokasi</span>
          </button>
        </div>
      </div>
    </div>
  );
}
