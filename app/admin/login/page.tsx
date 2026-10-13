"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { requestPasswordResetAction } from "@/lib/actions/auth";
import { Eye, EyeOff, KeyRound, X, ExternalLink, CheckCircle2, AlertCircle } from "lucide-react";

function AdminLoginForm() {
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get("redirect") || "/admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Password Reset Modal State
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [isResetLoading, setIsResetLoading] = useState(false);
  const [resetStatus, setResetStatus] = useState<{
    type: "idle" | "success" | "error";
    message: string;
    isLocalDomain?: boolean;
    recoveryUrl?: string;
  }>({ type: "idle", message: "" });

  const handleOpenResetModal = (e: React.MouseEvent) => {
    e.preventDefault();
    setResetEmail(email.trim() || "");
    setResetStatus({ type: "idle", message: "" });
    setIsResetModalOpen(true);
  };

  const handlePasswordResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) return;

    setIsResetLoading(true);
    setResetStatus({ type: "idle", message: "" });

    try {
      const res = await requestPasswordResetAction(
        resetEmail.trim(),
        typeof window !== "undefined" ? window.location.origin : undefined
      );

      if (res.success) {
        setResetStatus({
          type: "success",
          message: res.message,
          isLocalDomain: res.isLocalDomain,
          recoveryUrl: res.recoveryUrl,
        });
      } else {
        setResetStatus({
          type: "error",
          message: res.message,
        });
      }
    } catch (err: unknown) {
      setResetStatus({
        type: "error",
        message: err instanceof Error ? err.message : "Gagal memproses pemulihan kata sandi.",
      });
    } finally {
      setIsResetLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      let loginEmail = email.trim();
      // Allow username shorthand e.g. "admin" -> "admin@laporkito.local"
      if (!loginEmail.includes("@")) {
        loginEmail = `${loginEmail}@laporkito.local`;
      } else if (loginEmail.toLowerCase().endsWith("@laporkito.id")) {
        // Normalize mistyped domain @laporkito.id to @laporkito.local
        loginEmail = loginEmail.replace(/@laporkito\.id$/i, "@laporkito.local");
      }

      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password,
      });

      let supabaseHost = "unknown";
      try {
        if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
          supabaseHost = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname;
        }
      } catch {
        // ignore host parsing error
      }

      const isNormalized = loginEmail !== email;
      const isExpected = loginEmail.toLowerCase() === "admin@laporkito.local";


      if (error) {
        const errCode = (error as { code?: string }).code || "unknown";

        console.warn("[AUTH_DIAGNOSTIC]", {
          operation: "signInWithPassword",
          httpStatus: error.status,
          errorName: error.name,
          errorCode: errCode,
          sanitizedMessage: error.message,
          supabaseHost,
          inputNormalized: isNormalized,
          sentEmail: loginEmail,
          isExpectedEmail: isExpected,
        });

        if (
          error.message.toLowerCase().includes("invalid login credentials") ||
          errCode === "invalid_credentials"
        ) {
          setErrorMessage(
            "Email atau kata sandi yang Anda masukkan tidak sesuai. " +
            "Periksa kembali kredensial Anda dan pastikan menggunakan akun staf internal yang terdaftar."
          );
        } else if (
          error.message.toLowerCase().includes("email not confirmed") ||
          errCode === "email_not_confirmed"
        ) {
          setErrorMessage(
            "Email akun belum dikonfirmasi. Silakan selesaikan konfirmasi email atau hubungi administrator."
          );
        } else if (errCode === "over_request_rate_limit") {
          setErrorMessage(
            "Terlalu banyak percobaan masuk. Silakan tunggu beberapa saat sebelum mencoba lagi."
          );
        } else {
          setErrorMessage(
            "Login belum berhasil. Silakan coba kembali. Jika masalah berlanjut, hubungi administrator."
          );
        }

        setIsLoading(false);
        return;
      }

      if (!data?.user) {
        setErrorMessage(
          "Login belum berhasil. Silakan periksa kembali akun Anda dan coba lagi."
        );
        setIsLoading(false);
        return;
      }


      if (data?.user) {
        console.info("[AUTH_DIAGNOSTIC]", {
          operation: "signInWithPassword",
          httpStatus: 200,
          userId: data.user.id,
          emailConfirmed: !!data.user.email_confirmed_at,
          supabaseHost,
          sentEmail: loginEmail,
          isExpectedEmail: isExpected,
        });
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

        // Successfully authorized - use full navigation to ensure cookies sync with server session
        window.location.href = redirectTarget;
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
        {/* <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#DFE8FF] text-[#0033A7] tracking-wide">
          Portal Internal & Konsol Admin
        </span> */}
      </div>

      {/* Title & Context Description */}
      <div className="mb-6 text-center">
        {/* <h1 className="text-[22px] sm:text-[24px] leading-tight font-semibold tracking-tight text-[#111C2D]">
          Masuk ke LAPORKITO
        </h1> */}
        {/* <p className="text-[13px] sm:text-[14px] text-[#434654] mt-1.5 leading-relaxed">
          Gunakan akun internal untuk mengelola laporan atau konfigurasi platform.
        </p> */}
      </div>

      {/* Error Message Alert */}
      {errorMessage && (
        <div className="mb-5 p-3 rounded-lg bg-[#FFDAD6] border border-[#BA1A1A]/30 text-[#93000A] text-[13px] flex items-start gap-2.5 leading-snug">
          {/* <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">error</span> */}
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Credentials Form */}
      <form className="space-y-4" onSubmit={handleSubmit}>
        {/* Email / Username Field */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-medium text-[#111C2D]" htmlFor="internal-email">
            Username
          </label>
          <div className="relative">
            <input
              id="internal-email"
              name="email"
              type="text"
              inputMode="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@laporkito.local atau admin"
              disabled={isLoading}
              className="w-full h-[42px] px-3 text-[14px] text-[#111C2D] bg-white border border-[#C4C5D7] rounded-lg transition-colors placeholder:text-[#747686] focus:outline-none focus:border-[#1749D2] focus:ring-2 focus:ring-[#1749D2]/15 disabled:bg-[#F0F3FF]"
            />
          </div>
          {/* <p className="text-[11px] text-[#747686]">
            Gunakan akun resmi staf (contoh: <span className="font-mono text-[#1749D2] font-semibold">admin@laporkito.local</span> atau <span className="font-mono text-[#1749D2] font-semibold">admin</span>)
          </p> */}
        </div>

        {/* Password Field */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[13px] font-medium text-[#111C2D]" htmlFor="internal-password">
              Kata Sandi
            </label>
            <button
              type="button"
              onClick={handleOpenResetModal}
              className="text-[12px] text-[#1749D2] hover:underline transition-colors focus:outline-none"
            >
              Lupa kata sandi?
            </button>
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
                {showPassword
                  ? (<EyeOff size={19} strokeWidth={2} />)
                  : (<Eye size={19} strokeWidth={2} />)}
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
              <span>Masuk</span>
            </>
          )}
        </button>
      </form>

      {/* Password Reset Modal */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl border border-[#C4C5D7] shadow-xl w-full max-w-[440px] p-6 relative">
            <button
              type="button"
              onClick={() => setIsResetModalOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-md text-[#747686] hover:text-[#111C2D] hover:bg-slate-100 transition-colors"
              aria-label="Tutup modal"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-[#DFE8FF] text-[#1749D2] flex items-center justify-center">
                <KeyRound size={20} />
              </div>
              <div>
                <h3 className="text-[16px] font-bold text-[#111C2D]">
                  Pemulihan Kata Sandi
                </h3>
                <p className="text-[12px] text-[#434654]">
                  Portal Akun Petugas & Administrator Dinas
                </p>
              </div>
            </div>

            {resetStatus.type === "success" ? (
              <div className="space-y-4">
                <div className="p-3.5 rounded-lg bg-[#E8F5E9] border border-[#2E7D32]/30 text-[#1B5E20] text-[13px] flex items-start gap-2.5">
                  <CheckCircle2 size={18} className="shrink-0 mt-0.5 text-[#2E7D32]" />
                  <div className="space-y-1">
                    <p className="font-semibold">{resetStatus.message}</p>
                    {resetStatus.isLocalDomain ? (
                      <p className="text-[12px] text-[#2E7D32]/90 leading-relaxed">
                        Akun internal dengan domain lokal telah divalidasi. Anda dapat langsung melanjutkan ke formulir pengaturan kata sandi baru.
                      </p>
                    ) : (
                      <p className="text-[12px] text-[#2E7D32]/90 leading-relaxed">
                        Silakan periksa kotak masuk email kedinasan Anda dan buka tautan pemulihan untuk mengatur kata sandi baru.
                      </p>
                    )}
                  </div>
                </div>

                {resetStatus.recoveryUrl && (
                  <div className="pt-1">
                    <a
                      href={resetStatus.recoveryUrl}
                      className="w-full h-[40px] inline-flex items-center justify-center gap-2 rounded-lg bg-[#1749D2] hover:bg-[#10358F] text-white text-[13px] font-medium transition-colors"
                    >
                      <span>Buka Halaman Atur Ulang Sandi</span>
                      <ExternalLink size={15} />
                    </a>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setIsResetModalOpen(false)}
                  className="w-full h-[38px] rounded-lg border border-[#C4C5D7] text-[#434654] hover:bg-slate-50 text-[13px] font-medium transition-colors"
                >
                  Tutup
                </button>
              </div>
            ) : (
              <form onSubmit={handlePasswordResetSubmit} className="space-y-4">
                <p className="text-[13px] text-[#434654] leading-relaxed">
                  Masukkan surel kedinasan atau nama pengguna staf internal yang terdaftar untuk menerima tautan pemulihan kata sandi.
                </p>

                {resetStatus.type === "error" && (
                  <div className="p-3 rounded-lg bg-[#FFDAD6] border border-[#BA1A1A]/30 text-[#93000A] text-[12px] flex items-start gap-2">
                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                    <span>{resetStatus.message}</span>
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-medium text-[#111C2D]" htmlFor="reset-email">
                    Email / Username Staf
                  </label>
                  <input
                    id="reset-email"
                    type="text"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="admin@laporkito.local atau admin"
                    disabled={isResetLoading}
                    className="w-full h-[40px] px-3 text-[13px] text-[#111C2D] bg-white border border-[#C4C5D7] rounded-lg focus:outline-none focus:border-[#1749D2] focus:ring-2 focus:ring-[#1749D2]/15"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsResetModalOpen(false)}
                    disabled={isResetLoading}
                    className="h-[38px] px-4 rounded-lg border border-[#C4C5D7] text-[#434654] hover:bg-slate-50 text-[13px] font-medium transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isResetLoading}
                    className="h-[38px] px-4 rounded-lg bg-[#1749D2] hover:bg-[#10358F] text-white text-[13px] font-medium transition-colors flex items-center gap-2 disabled:opacity-60"
                  >
                    {isResetLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" />
                        <span>Memproses...</span>
                      </>
                    ) : (
                      <span>Kirim Tautan Pemulihan</span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="bg-[#F9F9FF] font-sans text-[#111C2D] antialiased min-h-screen flex flex-col justify-between">
      {/* Top Institutional Header Bar */}
      {/* <div className="w-full py-2 bg-[#F0F3FF] border-b border-[#D9DEE7] shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
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
      </div> */}

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
    </div>
  );
}
