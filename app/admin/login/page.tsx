"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get("redirect") || "/admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        if (error.message.toLowerCase().includes("invalid login credentials")) {
          setErrorMessage("Surel atau kata sandi tidak cocok. Pastikan akun terdaftar sebagai staf internal.");
        } else if (error.message.toLowerCase().includes("email not confirmed")) {
          setErrorMessage("Surel akun belum dikonfirmasi. Silakan periksa kotak masuk email Anda.");
        } else {
          setErrorMessage(error.message || "Gagal masuk ke sistem. Silakan coba beberapa saat lagi.");
        }
        setIsLoading(false);
        return;
      }

      if (data?.user) {
        // Query internal_users to verify authorization
        const { data: internalUser, error: roleError } = await supabase
          .from("internal_users")
          .select("id, role, is_active, full_name")
          .eq("id", data.user.id)
          .single();

        if (roleError || !internalUser) {
          await supabase.auth.signOut();
          setErrorMessage("Akun Anda terdaftar di autentikasi, namun belum memiliki profil staf internal aktif (public.internal_users).");
          setIsLoading(false);
          return;
        }

        if (!internalUser.is_active) {
          await supabase.auth.signOut();
          setErrorMessage("Akun Anda berstatus non-aktif. Silakan hubungi Administrator Sistem untuk aktivasi.");
          setIsLoading(false);
          return;
        }

        // Successfully authorized
        router.push(redirectTarget);
        router.refresh();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan internal saat autentikasi.";
      setErrorMessage(msg);
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[450px] mx-auto bg-white rounded-xl border border-[#C4C5D7]/60 shadow-[0_1px_3px_rgba(0,0,0,0.05)] p-7 sm:p-10">
      {/* Brand Identity Header */}
      <div className="flex flex-col items-center text-center mb-6">
        <div className="h-10 mb-2 flex items-center justify-center">
          <div className="flex items-center gap-2.5">
            <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-[#1749D2] text-white shadow-sm">
              <span className="relative block h-5 w-4">
                <span className="absolute left-0 top-0 h-full w-1 bg-white" />
                <span className="absolute left-0 top-0 h-1 w-full bg-white" />
              </span>
              <span className="absolute bottom-1 right-1 h-2.5 w-2.5 rounded-full bg-[#E58A1F]" />
            </div>
            <span className="text-xl font-bold tracking-tight text-[#111C2D]">LAPORKITO</span>
          </div>
        </div>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#DFE8FF] text-[#0033A7] tracking-wide">
          Portal Internal & Konsol Admin
        </span>
      </div>

      {/* Title & Context Description */}
      <div className="mb-6 text-center">
        <h1 className="text-[22px] sm:text-[24px] leading-tight font-semibold tracking-tight text-[#111C2D]">
          Masuk ke LAPORKITO
        </h1>
        <p className="text-[13px] sm:text-[14px] text-[#434654] mt-1.5 leading-relaxed">
          Gunakan akun internal untuk mengelola laporan atau konfigurasi platform.
        </p>
      </div>

      {/* Error Message Alert */}
      {errorMessage && (
        <div className="mb-5 p-3 rounded-lg bg-[#FFDAD6] border border-[#BA1A1A]/30 text-[#93000A] text-[13px] flex items-start gap-2.5 leading-snug">
          <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">error</span>
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Credentials Form */}
      <form className="space-y-4" onSubmit={handleSubmit}>
        {/* Email Field */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-medium text-[#111C2D]" htmlFor="internal-email">
            Surel Akun Internal
          </label>
          <div className="relative">
            <input
              id="internal-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@laporkito.id"
              disabled={isLoading}
              className="w-full h-[42px] px-3 text-[14px] text-[#111C2D] bg-white border border-[#C4C5D7] rounded-lg transition-colors placeholder:text-[#747686] focus:outline-none focus:border-[#1749D2] focus:ring-2 focus:ring-[#1749D2]/15 disabled:bg-[#F0F3FF]"
            />
          </div>
        </div>

        {/* Password Field */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[13px] font-medium text-[#111C2D]" htmlFor="internal-password">
              Kata Sandi
            </label>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                alert("Untuk pengaturan ulang kata sandi dinas, silakan hubungi Administrator TI Pemkot Palembang.");
              }}
              className="text-[12px] text-[#1749D2] hover:underline transition-colors"
            >
              Lupa kata sandi?
            </a>
          </div>
          <div className="relative flex items-center">
            <input
              id="internal-password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              disabled={isLoading}
              className="w-full h-[42px] pl-3 pr-10 text-[14px] text-[#111C2D] bg-white border border-[#C4C5D7] rounded-lg transition-colors placeholder:text-[#747686] focus:outline-none focus:border-[#1749D2] focus:ring-2 focus:ring-[#1749D2]/15 disabled:bg-[#F0F3FF]"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label="Tampilkan atau sembunyikan kata sandi"
              className="absolute right-2.5 p-1 text-[#747686] hover:text-[#111C2D] focus:outline-none transition-colors"
            >
              <span className="material-symbols-outlined text-[19px]">
                {showPassword ? "visibility_off" : "visibility"}
              </span>
            </button>
          </div>
        </div>

        {/* Session Checkbox */}
        <div className="flex items-start gap-2.5 pt-1">
          <div className="flex items-center h-5">
            <input
              id="remember-device"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-[18px] h-[18px] rounded border-[#C4C5D7] text-[#1749D2] focus:ring-[#1749D2]/20 cursor-pointer"
            />
          </div>
          <label
            htmlFor="remember-device"
            className="text-[13px] text-[#434654] cursor-pointer select-none leading-5"
          >
            Ingat sesi di perangkat kedinasan ini
          </label>
        </div>

        {/* Primary Action Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-[42px] mt-2 inline-flex items-center justify-center gap-2 rounded-lg bg-[#1749D2] hover:bg-[#10358F] text-white text-[14px] font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#1749D2] focus:ring-offset-2 active:bg-[#0C276B] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <span>Memverifikasi Akses...</span>
            </>
          ) : (
            <>
              <span>Masuk ke Sistem</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </>
          )}
        </button>
      </form>

      {/* Institutional Notice Banner */}
      <div className="mt-6 p-3.5 rounded-lg bg-[#F0F3FF] border border-[#C4C5D7]/50 flex items-start gap-3 text-left">
        <span className="material-symbols-outlined text-[#747686] text-[18px] mt-0.5 shrink-0">lock</span>
        <p className="text-[12px] leading-relaxed text-[#434654]">
          Area ini khusus untuk Administrator Platform dan Petugas Instansi Penerima Resmi. Warga publik tidak memerlukan akun untuk membuat atau memantau laporan.
        </p>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="bg-[#F9F9FF] font-sans text-[#111C2D] antialiased min-h-screen flex flex-col justify-between">
      {/* Top Institutional Header Bar */}
      <div className="w-full py-2 bg-[#F0F3FF] border-b border-[#D9DEE7] shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px] text-[#0033A7]">verified_user</span>
            <span className="text-[11px] font-semibold text-[#434654] uppercase tracking-wider">
              Republik Indonesia • Sistem Pelaporan Internal Terpadu
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-[#006443]" />
            <span className="text-[11px] font-medium text-[#434654]">Sistem Aman v2.4</span>
          </div>
        </div>
      </div>

      {/* Main Form Area */}
      <main className="w-full flex-1 flex flex-col items-center justify-center p-4 sm:p-6">
        <div className="flex flex-col w-full items-center justify-center py-8">
          <Suspense fallback={
            <div className="w-full max-w-[450px] mx-auto bg-white rounded-xl border border-[#C4C5D7]/60 shadow-[0_1px_3px_rgba(0,0,0,0.05)] p-10 text-center text-[#747686]">
              Memuat formulir login...
            </div>
          }>
            <AdminLoginForm />
          </Suspense>

          {/* Auxiliary Footer Links & Administrative Meta */}
          <div className="w-full max-w-[460px] mx-auto mt-4 text-center flex flex-col items-center gap-1.5 px-4">
            <p className="text-[12px] text-[#434654]">
              Sistem Manajemen Laporan Sipil Terpadu • Pemerintah Kota Palembang
            </p>
            <div className="flex items-center justify-center gap-3 text-[12px] text-[#747686]">
              <Link className="hover:text-[#111C2D] transition-colors" href="/lapor">
                Panduan Warga
              </Link>
              <span>•</span>
              <Link className="hover:text-[#111C2D] transition-colors" href="/pantau">
                Kamus Kewenangan
              </Link>
              <span>•</span>
              <Link className="hover:text-[#111C2D] transition-colors" href="/">
                Pusat Bantuan
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Institutional Footer */}
      <footer className="w-full py-4 bg-white border-t border-[#D9DEE7] shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <p className="text-[12px] text-[#434654]">
            © 2026 LAPORKITO Portal Administrasi Pemerintahan. Hak Cipta Dilindungi Undang-Undang.
          </p>
          <div className="flex items-center gap-4 text-[11px] text-[#434654]">
            <span>Kepatuhan Standar Siber BSSN</span>
            <span>•</span>
            <span>Akses Terenkripsi TLS 1.3</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
