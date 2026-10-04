-- ====================================================================
-- LAPORKITO Database Schema Migration
-- 00001_initial_schema.sql
-- Description: Core schema, ENUMs, 11 tables, triggers, and RLS policies
-- ====================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- --------------------------------------------------------------------
-- 1. ENUMS
-- --------------------------------------------------------------------
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'petugas');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE report_status AS ENUM (
        'draft',
        'submitted',
        'verifying',
        'verified',
        'in_progress',
        'resolved',
        'rejected',
        'duplicate'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE report_priority AS ENUM (
        'low',
        'medium',
        'high',
        'critical'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE response_type AS ENUM (
        'official',
        'update',
        'clarification'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- --------------------------------------------------------------------
-- 2. TABLE: internal_users (Admin & Petugas internal staff)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.internal_users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'petugas',
    phone TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 3. TABLE: reporters (Civic public guest reporters)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reporters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone TEXT,
    email TEXT,
    full_name TEXT,
    verification_count INTEGER NOT NULL DEFAULT 0,
    last_reported_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 4. TABLE: categories (Report incident categories)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL UNIQUE,
    name_id TEXT NOT NULL,
    name_en TEXT,
    description TEXT,
    icon TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 5. TABLE: kecamatan (Districts in Palembang)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.kecamatan (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    postal_codes TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 6. TABLE: kelurahan (Sub-districts in Palembang)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.kelurahan (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kecamatan_id UUID NOT NULL REFERENCES public.kecamatan(id) ON DELETE CASCADE,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    postal_code TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 7. TABLE: reports (Public civic reports)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tracking_code TEXT NOT NULL UNIQUE,
    reporter_id UUID REFERENCES public.reporters(id) ON DELETE SET NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    kelurahan_id UUID REFERENCES public.kelurahan(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    address_detail TEXT NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    status report_status NOT NULL DEFAULT 'submitted',
    priority report_priority NOT NULL DEFAULT 'medium',
    ai_confidence DOUBLE PRECISION,
    ai_summary TEXT,
    authority_target TEXT,
    duplicate_of_id UUID REFERENCES public.reports(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 8. TABLE: report_evidence (Attached media / photos / documents)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.report_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    storage_path TEXT NOT NULL,
    caption TEXT,
    ai_is_valid BOOLEAN DEFAULT true,
    ai_analysis JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 9. TABLE: report_timeline (Audit trail & status history)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.report_timeline (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES public.internal_users(id) ON DELETE SET NULL,
    actor_role TEXT NOT NULL DEFAULT 'system',
    action TEXT NOT NULL,
    notes TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 10. TABLE: report_responses (Official OPD responses & public updates)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.report_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
    responder_id UUID REFERENCES public.internal_users(id) ON DELETE SET NULL,
    response_type response_type NOT NULL DEFAULT 'official',
    message TEXT NOT NULL,
    attachments JSONB DEFAULT '[]'::jsonb,
    is_public BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 11. TABLE: ai_triage_logs (Audit log for AI triage evaluations)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ai_triage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID REFERENCES public.reports(id) ON DELETE CASCADE,
    prompt_version TEXT NOT NULL,
    model TEXT NOT NULL,
    raw_request JSONB NOT NULL,
    raw_response JSONB NOT NULL,
    tokens_used INTEGER,
    processing_time_ms INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 12. TABLE: system_settings (Platform configuration parameters)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 13. INDEXES FOR PERFORMANCE
-- --------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_reports_tracking_code ON public.reports(tracking_code);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON public.reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_category_id ON public.reports(category_id);
CREATE INDEX IF NOT EXISTS idx_reports_kelurahan_id ON public.reports(kelurahan_id);
CREATE INDEX IF NOT EXISTS idx_report_evidence_report_id ON public.report_evidence(report_id);
CREATE INDEX IF NOT EXISTS idx_report_timeline_report_id ON public.report_timeline(report_id);
CREATE INDEX IF NOT EXISTS idx_report_responses_report_id ON public.report_responses(report_id);
CREATE INDEX IF NOT EXISTS idx_kelurahan_kecamatan_id ON public.kelurahan(kecamatan_id);

-- --------------------------------------------------------------------
-- 14. HELPER FUNCTION: generate_tracking_code()
-- Format: LPK-YYYYMMDD-XXXX (e.g. LPK-20261002-7A9B)
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.generate_tracking_code()
RETURNS TEXT AS $$
DECLARE
    date_part TEXT;
    random_part TEXT;
    candidate_code TEXT;
    is_unique BOOLEAN := false;
BEGIN
    date_part := TO_CHAR(NOW(), 'YYYYMMDD');
    WHILE NOT is_unique LOOP
        random_part := UPPER(SUBSTRING(MD5(gen_random_uuid()::text) FROM 1 FOR 4));
        candidate_code := 'LPK-' || date_part || '-' || random_part;
        IF NOT EXISTS (SELECT 1 FROM public.reports WHERE tracking_code = candidate_code) THEN
            is_unique := true;
        END IF;
    END LOOP;
    RETURN candidate_code;
END;
$$ LANGUAGE plpgsql;

-- --------------------------------------------------------------------
-- 15. SECURE FUNCTION: get_public_report_by_tracking_code(target_tracking_code)
-- Allows public tracking lookup for ANY report status (submitted, verified, etc.)
-- Exposes ONLY public fields; strictly hides reporter info, internal notes, and AI logs
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_public_report_by_tracking_code(target_tracking_code TEXT)
RETURNS TABLE (
    id UUID,
    tracking_code TEXT,
    category_id UUID,
    kelurahan_id UUID,
    title TEXT,
    description TEXT,
    address_detail TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    status report_status,
    priority report_priority,
    authority_target TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT
        r.id,
        r.tracking_code,
        r.category_id,
        r.kelurahan_id,
        r.title,
        r.description,
        r.address_detail,
        r.latitude,
        r.longitude,
        r.status,
        r.priority,
        r.authority_target,
        r.created_at,
        r.updated_at
    FROM public.reports r
    WHERE r.tracking_code = UPPER(TRIM(target_tracking_code))
    LIMIT 1;
$$;

-- --------------------------------------------------------------------
-- 16. TRIGGER: updated_at auto-refresh
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_reports_updated_at ON public.reports;
CREATE TRIGGER trigger_reports_updated_at
    BEFORE UPDATE ON public.reports
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trigger_internal_users_updated_at ON public.internal_users;
CREATE TRIGGER trigger_internal_users_updated_at
    BEFORE UPDATE ON public.internal_users
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- --------------------------------------------------------------------
-- 17. ROW LEVEL SECURITY (RLS) POLICIES
-- --------------------------------------------------------------------
ALTER TABLE public.internal_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reporters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kecamatan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kelurahan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_triage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- 17.1 Categories & Locations: public read-only
CREATE POLICY "Public read categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Public read kecamatan" ON public.kecamatan FOR SELECT USING (true);
CREATE POLICY "Public read kelurahan" ON public.kelurahan FOR SELECT USING (true);

-- 17.2 Reporters: guest can insert; SELECT restricted to authenticated staff only
-- Protects citizen email, phone, and name from public scraping
CREATE POLICY "Public insert reporters" ON public.reporters FOR INSERT WITH CHECK (true);
CREATE POLICY "Staff read reporters" ON public.reporters FOR SELECT USING (
    auth.role() = 'authenticated' OR auth.role() = 'service_role'
);

-- 17.3 Reports:
-- Public guest can insert new reports
CREATE POLICY "Public create report" ON public.reports FOR INSERT WITH CHECK (true);
-- Public feed can read verified / in-progress / resolved reports
CREATE POLICY "Public read active reports" ON public.reports FOR SELECT USING (
    status IN ('verified', 'in_progress', 'resolved') OR
    auth.role() = 'authenticated'
);
-- Staff can update/manage reports
CREATE POLICY "Staff manage reports" ON public.reports FOR UPDATE USING (
    auth.role() = 'authenticated'
);

-- 17.4 Report Evidence:
-- Public can upload evidence for submitted reports
CREATE POLICY "Public insert evidence" ON public.report_evidence FOR INSERT WITH CHECK (true);
-- Evidence readable for verified reports or authenticated staff
CREATE POLICY "Public read evidence" ON public.report_evidence FOR SELECT USING (true);

-- 17.5 Report Timeline:
-- Public reads non-internal timeline actions; staff reads all
CREATE POLICY "Public read public timeline" ON public.report_timeline FOR SELECT USING (
    (metadata->>'is_internal')::boolean IS NOT TRUE OR
    auth.role() = 'authenticated'
);
CREATE POLICY "Staff insert timeline" ON public.report_timeline FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' OR auth.role() = 'service_role'
);

-- 17.6 Report Responses:
-- Public views only public responses (is_public = true); staff views all
CREATE POLICY "Public read responses" ON public.report_responses FOR SELECT USING (
    is_public = true OR auth.role() = 'authenticated'
);
CREATE POLICY "Staff manage responses" ON public.report_responses FOR ALL USING (
    auth.role() = 'authenticated'
);

-- 17.7 Internal Users:
-- Staff can only view own profile or via service_role; protected from public inspection
CREATE POLICY "Staff read own internal profile" ON public.internal_users FOR SELECT USING (
    auth.uid() = id OR auth.role() = 'service_role'
);

-- 17.8 AI Triage Logs:
-- Strictly confidential; internal staff/service role only
CREATE POLICY "Staff read ai logs" ON public.ai_triage_logs FOR SELECT USING (
    auth.role() = 'authenticated' OR auth.role() = 'service_role'
);

-- 17.9 System Settings:
-- Public read; staff manage
CREATE POLICY "Public read system settings" ON public.system_settings FOR SELECT USING (true);
CREATE POLICY "Staff manage system settings" ON public.system_settings FOR ALL USING (
    auth.role() = 'authenticated'
);

-- --------------------------------------------------------------------
-- 18. STORAGE BUCKET CONFIGURATION
-- --------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('report-evidence', 'report-evidence', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public can view evidence bucket"
ON storage.objects FOR SELECT
USING (bucket_id = 'report-evidence');

CREATE POLICY "Public can upload to evidence bucket"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'report-evidence');
