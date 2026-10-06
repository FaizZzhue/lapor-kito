-- ====================================================================
-- LAPORKITO — Migration 00004: Authority Rules (Data Kewenangan)
-- 
-- Defines the authoritative matrix connecting report categories,
-- administrative districts (kecamatan), problem contexts, and 
-- responsible institutions (OPD) & technical units (UPT).
-- ====================================================================

-- --------------------------------------------------------------------
-- 1. DEPENDENCY: Unique constraint on institution_units(id, institution_id)
-- Required to enforce composite foreign key for institution_unit_id integrity.
-- --------------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'uq_institution_units_id_institution'
    ) THEN
        ALTER TABLE public.institution_units
        ADD CONSTRAINT uq_institution_units_id_institution UNIQUE (id, institution_id);
    END IF;
END $$;

-- --------------------------------------------------------------------
-- 2. TABLE: authority_rules (Matriks Aturan Kewenangan & Perutean)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.authority_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_code TEXT NOT NULL UNIQUE,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
    kecamatan_id UUID REFERENCES public.kecamatan(id) ON DELETE SET NULL,
    context_title TEXT NOT NULL,
    context_description TEXT,
    institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE RESTRICT,
    institution_unit_id UUID,
    regulation_basis TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Enforce: institution_unit_id must belong to institution_id
    CONSTRAINT fk_authority_rules_unit_institution
        FOREIGN KEY (institution_unit_id, institution_id)
        REFERENCES public.institution_units(id, institution_id)
        ON DELETE RESTRICT
);

-- --------------------------------------------------------------------
-- 3. PERFORMANCE INDEXES
-- --------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_authority_rules_category_id ON public.authority_rules(category_id);
CREATE INDEX IF NOT EXISTS idx_authority_rules_kecamatan_id ON public.authority_rules(kecamatan_id);
CREATE INDEX IF NOT EXISTS idx_authority_rules_institution_id ON public.authority_rules(institution_id);
CREATE INDEX IF NOT EXISTS idx_authority_rules_unit_id ON public.authority_rules(institution_unit_id);
CREATE INDEX IF NOT EXISTS idx_authority_rules_is_active ON public.authority_rules(is_active);

-- --------------------------------------------------------------------
-- 4. TRIGGER: auto-update updated_at timestamp
-- Utilizes existing public.set_updated_at() trigger function.
-- --------------------------------------------------------------------
DROP TRIGGER IF EXISTS trigger_authority_rules_updated_at ON public.authority_rules;
CREATE TRIGGER trigger_authority_rules_updated_at
    BEFORE UPDATE ON public.authority_rules
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- --------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY (RLS)
-- --------------------------------------------------------------------
ALTER TABLE public.authority_rules ENABLE ROW LEVEL SECURITY;

-- 5.1 Staff Read: All authenticated internal staff can read authority rules
DROP POLICY IF EXISTS "Staff read authority_rules" ON public.authority_rules;
CREATE POLICY "Staff read authority_rules" ON public.authority_rules
    FOR SELECT
    USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- 5.2 Admin Manage: Only active internal users with 'admin' role can CRUD
DROP POLICY IF EXISTS "Admin manage authority_rules" ON public.authority_rules;
CREATE POLICY "Admin manage authority_rules" ON public.authority_rules
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
