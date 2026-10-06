import { redirect } from "next/navigation";
import { getCurrentInternalUser } from "@/lib/auth/session";
import { AdminSidebar } from "@/components/admin/sidebar";
import { AdminHeader } from "@/components/admin/header";
import { signOutAction } from "@/lib/actions/auth";

export const dynamic = "force-dynamic";

export default async function AdminAuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, authUser, internalUser } = await getCurrentInternalUser();

  // 1. Unauthenticated -> Redirect to login
  if (!isAuthenticated || !authUser) {
    redirect("/admin/login");
  }

  // 2. Authenticated with Supabase Auth, but no record in public.internal_users
  if (!internalUser) {
    return (
      <div className="min-h-screen bg-[#F9F9FF] flex flex-col items-center justify-center p-6 text-[#111C2D]">
        <div className="w-full max-w-md bg-white p-8 rounded-xl border border-[#D9DEE7] shadow-sm text-center">
          <div className="w-12 h-12 rounded-full bg-[#FFDAD6] text-[#BA1A1A] flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-[28px]">no_accounts</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight mb-2">Profil Staf Tidak Ditemukan</h1>
          <p className="text-sm text-[#434654] leading-relaxed mb-6">
            Akun autentikasi ({authUser.email}) berhasil diverifikasi, namun Anda belum terdaftar di direktori staf internal (<code className="bg-[#F0F3FF] px-1 py-0.5 rounded text-xs text-[#0033A7]">public.internal_users</code>).
          </p>
          <form action={signOutAction}>
            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-lg bg-[#1749D2] hover:bg-[#0033A7] text-white text-sm font-semibold transition-colors"
            >
              Kembali ke Halaman Masuk
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 3. User account is deactivated
  if (!internalUser.is_active) {
    return (
      <div className="min-h-screen bg-[#F9F9FF] flex flex-col items-center justify-center p-6 text-[#111C2D]">
        <div className="w-full max-w-md bg-white p-8 rounded-xl border border-[#D9DEE7] shadow-sm text-center">
          <div className="w-12 h-12 rounded-full bg-[#FFDAD6] text-[#BA1A1A] flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-[28px]">block</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight mb-2">Akun Non-Aktif</h1>
          <p className="text-sm text-[#434654] leading-relaxed mb-6">
            Status akun Anda ({internalUser.email}) saat ini dinonaktifkan oleh administrator. Silakan hubungi Administrator Sistem untuk bantuan pengaktifan kembali.
          </p>
          <form action={signOutAction}>
            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-lg bg-[#1749D2] hover:bg-[#0033A7] text-white text-sm font-semibold transition-colors"
            >
              Keluar dari Sesi
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 4. Role Authorization: Admin Console is strictly reserved for 'admin' role
  if (internalUser.role !== "admin") {
    return (
      <div className="min-h-screen bg-[#F9F9FF] flex flex-col items-center justify-center p-6 text-[#111C2D]">
        <div className="w-full max-w-md bg-white p-8 rounded-xl border border-[#D9DEE7] shadow-sm text-center">
          <div className="w-12 h-12 rounded-full bg-[#FEF3E6] text-[#B2640A] flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-[28px]">lock_person</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight mb-2">Akses Terbatas: Bukan Administrator</h1>
          <p className="text-sm text-[#434654] leading-relaxed mb-6">
            Peran Anda terdaftar sebagai <span className="font-semibold text-[#0033A7]">Petugas Instansi</span>. Konsol Admin Pusat hanya dapat diakses oleh akun dengan wewenang <span className="font-semibold text-[#0033A7]">Administrator Sistem</span>.
          </p>
          <form action={signOutAction}>
            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-lg bg-[#1749D2] hover:bg-[#0033A7] text-white text-sm font-semibold transition-colors"
            >
              Keluar dari Sesi
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 5. Authorized Admin -> Render complete Stitch layout
  return (
    <div className="bg-[#F9F9FF] text-[#111C2D] min-h-screen">
      <AdminSidebar user={internalUser} />
      <div className="pl-72">
        <AdminHeader user={internalUser} />
        <main className="pt-16 min-h-screen bg-[#F9F9FF]">
          <div className="max-w-6xl mx-auto px-6 lg:px-8 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
