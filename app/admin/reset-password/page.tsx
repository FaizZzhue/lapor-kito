"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Eye, EyeOff, CheckCircle2, AlertCircle, KeyRound, ArrowLeft } from "lucide-react";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [hasValidSession, setHasValidSession] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    async function initRecoverySession() {
      try {
        // 1. Check if PKCE code is in query params
        const code = searchParams.get("code");
        if (code) {
          const { data: codeData, error: codeError } = await supabase.auth.exchangeCodeForSession(code);
          if (!codeError && codeData.session) {
            setHasValidSession(true);
            setUserEmail(codeData.session.user.email ?? null);
            setIsCheckingSession(false);
            return;
          }
        }

        // 2. Check current session (which handles hash fragments automatically)
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setHasValidSession(true);
          setUserEmail(session.user.email ?? null);
          setIsCheckingSession(false);
          return;
        }

        // 3. Listen for auth state change (PASSWORD_RECOVERY event)
        const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
          if (event === "PASSWORD_RECOVERY" || (session && event === "SIGNED_IN")) {
            setHasValidSession(true);
            setUserEmail(session?.user.email ?? null);
            setIsCheckingSession(false);
          }
        });

        // Give hash parsing a brief moment
        const timer = setTimeout(() => {
          setIsCheckingSession(false);
        }, 1200);

        return () => {
          authListener.subscription.unsubscribe();
          clearTimeout(timer);
        };
      } catch (err) {
        console.error("Session init error:", err);
        setIsCheckingSession(false);
      }
    }

    initRecoverySession();
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);

    if (password.length < 8) {
      setErrorMessage("Kata sandi baru minimal harus terdiri dari 8 karakter.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Konfirmasi kata sandi tidak cocok. Mohon periksa kembali.");
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        const errCode = (error as { code?: string }).code || "unknown";
        setErrorMessage(`Gagal memperbarui kata sandi [${errCode}]: ${error.message}`);
        setIsLoading(false);
        return;
      }

      setSuccessMessage("Kata sandi berhasil diperbarui! Anda akan dialihkan ke konsol admin...");
      setIsLoading(false);

      setTimeout(() => {
        router.push("/admin");
      }, 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan internal saat memperbarui kata sandi.";
      setErrorMessage(msg);
      setIsLoading(false);
    }
  };

  if (isCheckingSession) {
    return (
      <div className="w-full max-w-[450px] mx-auto bg-white rounded-xl border border-[#C4C5D7]/60 shadow-[0_1px_3px_rgba(0,0,0,0.05)] p-10 text-center">
        <div className="flex flex-col items-center justify-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1749D2]" />
          <p className="text-[14px] text-[#434654]">Memverifikasi tautan pemulihan sandi...</p>
        </div>
      </div>
    );
  }

  if (!hasValidSession) {
    return (
      <div className="w-full max-w-[450px] mx-auto bg-white rounded-xl border border-[#C4C5D7]/60 shadow-[0_1px_3px_rgba(0,0,0,0.05)] p-8 text-center">
        <div className="w-12 h-12 mx-auto rounded-full bg-[#FFDAD6] flex items-center justify-center text-[#BA1A1A] mb-4">
          <AlertCircle size={24} />
        </div>
        <h2 className="text-[18px] font-bold text-[#111C2D] mb-2">
          Tautan Pemulihan Tidak Valid
        </h2>
        <p className="text-[13px] text-[#434654] leading-relaxed mb-6">
          Sesi pemulihan tidak ditemukan atau telah kedaluwarsa. Untuk keamanan akun dinas, silakan minta tautan pemulihan baru dari halaman masuk.
        </p>
        <Link
          href="/admin/login"
          className="inline-flex items-center justify-center gap-2 w-full h-[42px] rounded-lg bg-[#1749D2] hover:bg-[#10358F] text-white text-[14px] font-medium transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Kembali ke Halaman Masuk</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[450px] mx-auto bg-white rounded-xl border border-[#C4C5D7]/60 shadow-[0_1px_3px_rgba(0,0,0,0.05)] p-7 sm:p-10">
      {/* Header */}
      <div className="flex flex-col items-center text-center mb-6">
        <div className="w-10 h-10 rounded-lg bg-[#DFE8FF] text-[#1749D2] flex items-center justify-center mb-3">
          <KeyRound size={22} />
        </div>
        <h1 className="text-[20px] font-bold text-[#111C2D]">
          Atur Ulang Kata Sandi
        </h1>
        <p className="text-[13px] text-[#434654] mt-1">
          {userEmail ? (
            <>Akun Staf: <span className="font-semibold text-[#111C2D]">{userEmail}</span></>
          ) : (
            "Masukkan kata sandi baru untuk akun dinas Anda"
          )}
        </p>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="mb-5 p-3.5 rounded-lg bg-[#E8F5E9] border border-[#2E7D32]/30 text-[#1B5E20] text-[13px] flex items-start gap-2.5">
          <CheckCircle2 size={18} className="shrink-0 mt-0.5 text-[#2E7D32]" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Error Notification */}
      {errorMessage && (
        <div className="mb-5 p-3 rounded-lg bg-[#FFDAD6] border border-[#BA1A1A]/30 text-[#93000A] text-[13px] flex items-start gap-2.5">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* New Password */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-medium text-[#111C2D]" htmlFor="new-password">
            Kata Sandi Baru
          </label>
          <div className="relative flex items-center">
            <input
              id="new-password"
              name="newPassword"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimal 8 karakter"
              disabled={isLoading || !!successMessage}
              className="w-full h-[42px] pl-3 pr-10 text-[14px] text-[#111C2D] bg-white border border-[#C4C5D7] rounded-lg transition-colors placeholder:text-[#747686] focus:outline-none focus:border-[#1749D2] focus:ring-2 focus:ring-[#1749D2]/15 disabled:bg-[#F0F3FF]"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label="Tampilkan atau sembunyikan kata sandi"
              className="absolute right-2.5 p-1 text-[#747686] hover:text-[#111C2D] focus:outline-none transition-colors"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* Confirm New Password */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-medium text-[#111C2D]" htmlFor="confirm-password">
            Konfirmasi Kata Sandi Baru
          </label>
          <div className="relative flex items-center">
            <input
              id="confirm-password"
              name="confirmPassword"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Ulangi kata sandi baru"
              disabled={isLoading || !!successMessage}
              className="w-full h-[42px] pl-3 pr-10 text-[14px] text-[#111C2D] bg-white border border-[#C4C5D7] rounded-lg transition-colors placeholder:text-[#747686] focus:outline-none focus:border-[#1749D2] focus:ring-2 focus:ring-[#1749D2]/15 disabled:bg-[#F0F3FF]"
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || !!successMessage}
          className="w-full h-[42px] mt-2 inline-flex items-center justify-center gap-2 rounded-lg bg-[#1749D2] hover:bg-[#10358F] text-white text-[14px] font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#1749D2] focus:ring-offset-2 active:bg-[#0C276B] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              <span>Memperbarui Sandi...</span>
            </>
          ) : (
            <span>Simpan Kata Sandi Baru</span>
          )}
        </button>
      </form>

      <div className="mt-6 text-center">
        <Link
          href="/admin/login"
          className="text-[12px] text-[#1749D2] hover:underline inline-flex items-center gap-1"
        >
          <ArrowLeft size={13} />
          <span>Batal dan kembali ke halaman masuk</span>
        </Link>
      </div>
    </div>
  );
}

export default function AdminResetPasswordPage() {
  return (
    <div className="bg-[#F9F9FF] font-sans text-[#111C2D] antialiased min-h-screen flex flex-col justify-between">
      <main className="w-full flex-1 flex flex-col items-center justify-center p-4 sm:p-6">
        <div className="flex flex-col w-full items-center justify-center py-8">
          <Suspense
            fallback={
              <div className="w-full max-w-[450px] mx-auto bg-white rounded-xl border border-[#C4C5D7]/60 shadow-[0_1px_3px_rgba(0,0,0,0.05)] p-10 text-center text-[#747686]">
                Memuat formulir pemulihan...
              </div>
            }
          >
            <ResetPasswordForm />
          </Suspense>
        </div>
      </main>

      <footer className="w-full py-4 bg-white border-t border-[#D9DEE7] text-center">
        <p className="text-[12px] text-[#434654]">
          © 2026 LAPORKITO • Pemerintah Kota Palembang
        </p>
      </footer>
    </div>
  );
}
