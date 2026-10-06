-- ====================================================================
-- LAPORKITO — Migration 00003: Admin Institutions & Units Master Data
-- 
-- Defines official master tables for governmental institutions (OPD/Dinas/Badan)
-- and their technical sub-units (UPT/Bidang/Seksi) in Kota Palembang.
-- ====================================================================

-- --------------------------------------------------------------------
-- 1. TABLE: institutions (Instansi Pemerintahan Penerima Laporan)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.institutions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    short_name TEXT,
    category TEXT DEFAULT 'Dinas / Badan Teknis',
    address TEXT,
    email TEXT,
    phone TEXT,
    mandate TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 2. TABLE: institution_units (Unit Pelaksana Teknis / UPT / Bidang)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.institution_units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE RESTRICT,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    work_area TEXT,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 3. PERFORMANCE INDEXES
-- --------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_institutions_code ON public.institutions(code);
CREATE INDEX IF NOT EXISTS idx_institutions_is_active ON public.institutions(is_active);
CREATE INDEX IF NOT EXISTS idx_institution_units_institution_id ON public.institution_units(institution_id);
CREATE INDEX IF NOT EXISTS idx_institution_units_code ON public.institution_units(code);
CREATE INDEX IF NOT EXISTS idx_institution_units_is_active ON public.institution_units(is_active);

-- --------------------------------------------------------------------
-- 4. TRIGGER FUNCTION & TRIGGERS: auto-update updated_at timestamp
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_institutions_updated_at ON public.institutions;
CREATE TRIGGER trigger_institutions_updated_at
    BEFORE UPDATE ON public.institutions
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trigger_institution_units_updated_at ON public.institution_units;
CREATE TRIGGER trigger_institution_units_updated_at
    BEFORE UPDATE ON public.institution_units
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- --------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY (RLS)
-- --------------------------------------------------------------------
ALTER TABLE public.institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.institution_units ENABLE ROW LEVEL SECURITY;

-- 5.1 Staff Read: All authenticated internal staff can read master data
DROP POLICY IF EXISTS "Staff read institutions" ON public.institutions;
CREATE POLICY "Staff read institutions" ON public.institutions
    FOR SELECT
    USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Staff read institution_units" ON public.institution_units;
CREATE POLICY "Staff read institution_units" ON public.institution_units
    FOR SELECT
    USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- 5.2 Admin Manage: Only active internal users with 'admin' role can CRUD
DROP POLICY IF EXISTS "Admin manage institutions" ON public.institutions;
CREATE POLICY "Admin manage institutions" ON public.institutions
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.internal_users
            WHERE internal_users.id = auth.uid()
            AND internal_users.role = 'admin'
            AND internal_users.is_active = true
        )
        OR auth.role() = 'service_role'
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.internal_users
            WHERE internal_users.id = auth.uid()
            AND internal_users.role = 'admin'
            AND internal_users.is_active = true
        )
        OR auth.role() = 'service_role'
    );

DROP POLICY IF EXISTS "Admin manage institution_units" ON public.institution_units;
CREATE POLICY "Admin manage institution_units" ON public.institution_units
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.internal_users
            WHERE internal_users.id = auth.uid()
            AND internal_users.role = 'admin'
            AND internal_users.is_active = true
        )
        OR auth.role() = 'service_role'
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.internal_users
            WHERE internal_users.id = auth.uid()
            AND internal_users.role = 'admin'
            AND internal_users.is_active = true
        )
        OR auth.role() = 'service_role'
    );

