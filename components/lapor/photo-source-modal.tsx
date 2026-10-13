"use client";

import React, { useEffect } from "react";
import { Camera, Image as ImageIcon, X } from "lucide-react";

interface PhotoSourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCamera: () => void;
  onSelectGallery: () => void;
  currentCount: number;
  maxCount?: number;
}

export function PhotoSourceModal({
  isOpen,
  onClose,
  onSelectCamera,
  onSelectGallery,
  currentCount,
  maxCount = 3,
}: PhotoSourceModalProps) {
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
      aria-labelledby="photo-source-title"
      aria-describedby="photo-source-desc"
    >
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div>
            <h3
              id="photo-source-title"
              className="text-sm font-bold text-slate-900 leading-tight"
            >
              Pilih Sumber Foto Bukti
            </h3>
            <p id="photo-source-desc" className="text-[11px] text-slate-500 font-mono mt-0.5">
              Lampiran foto {currentCount}/{maxCount} berkas
            </p>
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

        {/* Content Body / Options */}
        <div className="p-5 space-y-3">
          {/* Option 1: Ambil Foto dengan Kamera */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onSelectCamera();
            }}
            className="w-full flex items-center gap-3.5 p-3.5 rounded-xl border border-slate-200 bg-white hover:border-blue-500 hover:bg-blue-50/60 transition-all text-left group cursor-pointer"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-700 group-hover:bg-blue-600 group-hover:text-white transition-colors shrink-0">
              <Camera className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="block text-xs font-bold text-slate-900 group-hover:text-blue-900">
                Ambil Foto dengan Kamera
              </span>
              <span className="block text-[11px] text-slate-500 mt-0.5 leading-snug">
                Buka kamera perangkat untuk memotret kondisi di lapangan
              </span>
            </div>
          </button>

          {/* Option 2: Pilih dari Galeri / File */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onSelectGallery();
            }}
            className="w-full flex items-center gap-3.5 p-3.5 rounded-xl border border-slate-200 bg-white hover:border-blue-500 hover:bg-blue-50/60 transition-all text-left group cursor-pointer"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700 group-hover:bg-blue-600 group-hover:text-white transition-colors shrink-0">
              <ImageIcon className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="block text-xs font-bold text-slate-900 group-hover:text-blue-900">
                Pilih dari Galeri / File
              </span>
              <span className="block text-[11px] text-slate-500 mt-0.5 leading-snug">
                Unggah berkas JPG, PNG, atau WebP yang sudah tersimpan
              </span>
            </div>
          </button>
        </div>

        {/* Footer / Cancel Button */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto h-9 px-4 rounded-lg border border-slate-200 bg-white font-mono text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer text-center"
          >
            Batal
          </button>
        </div>
      </div>
    </div>
  );
}
