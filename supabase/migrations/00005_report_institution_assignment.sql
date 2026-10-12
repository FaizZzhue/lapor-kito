-- ====================================================================
-- LAPORKITO — Migration 00005: Institution-Based Report Assignment & Access Control
-- 
-- Tujuan:
-- 1. Menambahkan relasi instansi dan unit kerja pada tabel public.internal_users
--    agar setiap pengguna dengan role 'petugas' terikat pada OPD tertentu.
-- 2. Menambahkan kolom penugasan resmi pada tabel public.reports
--    (assigned_institution_id, assigned_unit_id, assigned_at, assigned_by_id)
--    sebagai dasar tunggal hak akses operasional petugas.
-- 3. Memperbarui indeks dan aturan RLS demi isolasi data lintas instansi.
-- ====================================================================

-- 1. PERUBAHAN TABEL public.internal_users
-- Tambahkan kolom relasi ke institutions dan institution_units
ALTER TABLE public.internal_users
ADD COLUMN IF NOT EXISTS institution_id UUID REFERENCES public.institutions(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS institution_unit_id UUID REFERENCES public.institution_units(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_internal_users_institution
ON public.internal_users (institution_id);

CREATE INDEX IF NOT EXISTS idx_internal_users_institution_unit
ON public.internal_users (institution_unit_id);

COMMENT ON COLUMN public.internal_users.institution_id IS 'Instansi (OPD) tempat bertugas pengguna internal (khususnya Petugas).';
COMMENT ON COLUMN public.internal_users.institution_unit_id IS 'Unit pelaksana teknis (UPT) spesifik dari instansi jika berlaku.';

-- 2. PERUBAHAN TABEL public.reports
-- Tambahkan kolom penugasan resmi (Official Assignment)
ALTER TABLE public.reports
ADD COLUMN IF NOT EXISTS assigned_institution_id UUID REFERENCES public.institutions(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS assigned_unit_id UUID REFERENCES public.institution_units(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS assigned_by_id UUID REFERENCES public.internal_users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_reports_assigned_institution
ON public.reports (assigned_institution_id);

CREATE INDEX IF NOT EXISTS idx_reports_assigned_unit
ON public.reports (assigned_unit_id);

CREATE INDEX IF NOT EXISTS idx_reports_assigned_status
ON public.reports (assigned_institution_id, status);

COMMENT ON COLUMN public.reports.assigned_institution_id IS 'Instansi (OPD) yang secara resmi ditugaskan menangani laporan ini.';
COMMENT ON COLUMN public.reports.assigned_unit_id IS 'Unit kerja pelaksana (UPT) dari OPD yang ditugaskan.';
COMMENT ON COLUMN public.reports.assigned_at IS 'Waktu penetapan penugasan resmi laporan.';
COMMENT ON COLUMN public.reports.assigned_by_id IS 'ID Admin/Verifikator yang menetapkan penugasan.';

-- 3. MIGRASI DATA AWAL (BACKFILL DATA LAPORAN YANG SUDAH ADA)
-- Memetakan authority_target teks yang ada ke institutions.id secara akurat
UPDATE public.reports r
SET 
    assigned_institution_id = i.id,
    assigned_at = r.created_at
FROM public.institutions i
WHERE r.assigned_institution_id IS NULL
  AND r.authority_target IS NOT NULL
  AND (
      LOWER(TRIM(r.authority_target)) = LOWER(TRIM(i.name))
      OR LOWER(TRIM(r.authority_target)) = LOWER(TRIM(i.short_name))
      OR LOWER(TRIM(r.authority_target)) = LOWER(TRIM(i.code))
  );

-- 4. KEBIJAKAN ROW LEVEL SECURITY (RLS) UPDATE (DEFENSE IN DEPTH)
-- Memperketat akses level basis data agar Petugas hanya dapat membaca laporan instansinya

-- Hapus kebijakan lama yang terlalu longgar untuk update internal
DROP POLICY IF EXISTS "Staff manage reports" ON public.reports;

-- Kebijakan baru: Admin LAPORKITO dapat mengelola semua laporan
CREATE POLICY "Admin manage all reports" ON public.reports
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.internal_users iu
        WHERE iu.id = auth.uid()
          AND iu.role = 'admin'
          AND iu.is_active = true
    )
);

-- Kebijakan baru: Petugas hanya dapat mengelola laporan yang ditugaskan ke instansinya
CREATE POLICY "Petugas manage assigned reports" ON public.reports
FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM public.internal_users iu
        WHERE iu.id = auth.uid()
          AND iu.role = 'petugas'
          AND iu.is_active = true
          AND iu.institution_id = reports.assigned_institution_id
    )
);

-- Kebijakan tanggapan: Petugas hanya dapat menambah tanggapan pada laporan instansinya
DROP POLICY IF EXISTS "Staff manage responses" ON public.report_responses;

CREATE POLICY "Admin manage all responses" ON public.report_responses
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.internal_users iu
        WHERE iu.id = auth.uid()
          AND iu.role = 'admin'
          AND iu.is_active = true
    )
);

CREATE POLICY "Petugas manage assigned responses" ON public.report_responses
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.internal_users iu
        JOIN public.reports r ON r.id = report_responses.report_id
        WHERE iu.id = auth.uid()
          AND iu.role = 'petugas'
          AND iu.is_active = true
          AND iu.institution_id = r.assigned_institution_id
    )
);
