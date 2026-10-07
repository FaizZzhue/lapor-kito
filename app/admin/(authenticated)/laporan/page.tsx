import { redirect } from "next/navigation";
import { getCurrentInternalUser } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/server";
import { getInternalReportsAction } from "@/lib/actions/reports";
import { ReportInboxClient } from "@/components/admin/reports/report-inbox-client";

export const dynamic = "force-dynamic";

export default async function AdminLaporanInboxPage() {
  const { isAuthenticated, internalUser } = await getCurrentInternalUser();

  if (!isAuthenticated || !internalUser || !internalUser.is_active) {
    redirect("/admin/login");
  }

  if (internalUser.role !== "admin" && internalUser.role !== "petugas") {
    redirect("/admin/login");
  }

  const adminSupabase = createAdminClient();

  // Fetch categories for filtering dropdown
  const { data: categoriesData } = await adminSupabase
    .from("categories")
    .select("id, name_id, slug")
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  const categories = categoriesData || [];

  // Fetch initial report list
  const reportsRes = await getInternalReportsAction({
    status: "all",
    priority: "all",
    categoryId: "all",
    sortBy: "newest",
  });

  const initialReports = reportsRes.success ? reportsRes.data : [];

  return (
    <ReportInboxClient
      initialReports={initialReports}
      categories={categories}
      userRole={internalUser.role}
    />
  );
}
