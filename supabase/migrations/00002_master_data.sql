-- ====================================================================
-- LAPORKITO Database Master Data Seed Migration
-- 00002_master_data.sql
-- Master Data: LAPORKITO taxonomy categories and official Palembang wilayah
-- Official Source: Kemendagri / BPS 2023 / Perda Kota Palembang No. 15/2012
-- Total Kecamatan: 18 | Total Kelurahan: 107
-- ====================================================================

-- 1. CATEGORIES (LAPORKITO Core Taxonomy)
INSERT INTO public.categories (slug, name_id, name_en, description, icon, is_active, display_order)
VALUES
  ('infrastruktur-jalan', 'Infrastruktur & Jalan', 'Infrastructure & Roads', 'Laporan kerusakan jalan, jembatan, trotoar, dan fasilitas umum transportasi darat.', 'road', true, 1),
  ('kebersihan-lingkungan', 'Kebersihan & Lingkungan', 'Cleanliness & Environment', 'Laporan timbulan sampah liar, tempat penampungan sampah, dan kebersihan ruang publik.', 'trash-2', true, 2),
  ('drainase-saluran-air', 'Drainase & Pengendalian Banjir', 'Drainage & Flood Control', 'Laporan genangan air, drainase tersumbat, tanggul, dan sedimentasi saluran air.', 'droplets', true, 3),
  ('penerangan-jalan', 'Penerangan Jalan Umum', 'Public Street Lighting', 'Laporan lampu penerangan jalan umum (PJU) mati, redup, atau rusak.', 'lightbulb', true, 4)
ON CONFLICT (slug) DO UPDATE SET
  name_id = EXCLUDED.name_id,
  name_en = EXCLUDED.name_en,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  is_active = EXCLUDED.is_active,
  display_order = EXCLUDED.display_order;

-- 2. KECAMATAN (18 Kecamatan Resmi Kota Palembang)
INSERT INTO public.kecamatan (code, name)
VALUES
  ('1671010', 'ILIR BARAT II'),
  ('1671011', 'GANDUS'),
  ('1671020', 'SEBERANG ULU I'),
  ('1671021', 'KERTAPATI'),
  ('1671022', 'JAKABARING'),
  ('1671030', 'SEBERANG ULU II'),
  ('1671031', 'PLAJU'),
  ('1671040', 'ILIR BARAT I'),
  ('1671041', 'BUKIT KECIL'),
  ('1671050', 'ILIR TIMUR I'),
  ('1671051', 'KEMUNING'),
  ('1671060', 'ILIR TIMUR II'),
  ('1671061', 'KALIDONI'),
  ('1671062', 'ILIR TIMUR III'),
  ('1671070', 'SAKO'),
  ('1671071', 'SEMATANG BORANG'),
  ('1671080', 'SUKARAMI'),
  ('1671081', 'ALANG ALANG LEBAR')
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name;

-- 3. KELURAHAN (107 Kelurahan Resmi Kota Palembang terelasi ke Kecamatan)
-- Kecamatan: ILIR BARAT II (1671010) - 7 kelurahan
INSERT INTO public.kelurahan (kecamatan_id, code, name)
VALUES
  ((SELECT id FROM public.kecamatan WHERE code = '1671010'), '1671010006', '35 ILIR'),
  ((SELECT id FROM public.kecamatan WHERE code = '1671010'), '1671010007', '32 ILIR'),
  ((SELECT id FROM public.kecamatan WHERE code = '1671010'), '1671010008', '30 ILIR'),
  ((SELECT id FROM public.kecamatan WHERE code = '1671010'), '1671010009', 'KEMANG MANIS'),
  ((SELECT id FROM public.kecamatan WHERE code = '1671010'), '1671010010', '29 ILIR'),
  ((SELECT id FROM public.kecamatan WHERE code = '1671010'), '1671010011', '28 ILIR'),
  ((SELECT id FROM public.kecamatan WHERE code = '1671010'), '1671010012', '27 ILIR')
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  kecamatan_id = EXCLUDED.kecamatan_id;

-- Kecamatan: GANDUS (1671011) - 5 kelurahan
INSERT INTO public.kelurahan (kecamatan_id, code, name)
VALUES
  ((SELECT id FROM public.kecamatan WHERE code = '1671011'), '1671011001', 'PULO KERTO'),
  ((SELECT id FROM public.kecamatan WHERE code = '1671011'), '1671011002', 'GANDUS'),
  ((SELECT id FROM public.kecamatan WHERE code = '1671011'), '1671011003', 'KARANG JAYA'),
  ((SELECT id FROM public.kecamatan WHERE code = '1671011'), '1671011004', 'KARANG ANYAR'),
  ((SELECT id FROM public.kecamatan WHERE code = '1671011'), '1671011005', '36 ILIR')
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  kecamatan_id = EXCLUDED.kecamatan_id;

-- Kecamatan: SEBERANG ULU I (1671020) - 5 kelurahan
INSERT INTO public.kelurahan (kecamatan_id, code, name)
VALUES
  ((SELECT id FROM public.kecamatan WHERE code = '1671020'), '1671020008', '1 ULU'),
  ((SELECT id FROM public.kecamatan WHERE code = '1671020'), '1671020010', '2 ULU'),
  ((SELECT id FROM public.kecamatan WHERE code = '1671020'), '1671020011', '3-4 ULU'),
  ((SELECT id FROM public.kecamatan WHERE code = '1671020'), '1671020012', '5 ULU'),
  ((SELECT id FROM public.kecamatan WHERE code = '1671020'), '1671020013', '7 ULU')
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  kecamatan_id = EXCLUDED.kecamatan_id;

-- Kecamatan: KERTAPATI (1671021) - 6 kelurahan
INSERT INTO public.kelurahan (kecamatan_id, code, name)
VALUES
  ((SELECT id FROM public.kecamatan WHERE code = '1671021'), '1671021001', 'KARYA JAYA'),
  ((SELECT id FROM public.kecamatan WHERE code = '1671021'), '1671021002', 'KERAMASAN'),
  ((SELECT id FROM public.kecamatan WHERE code = '1671021'), '1671021003', 'KEMANG AGUNG'),
  ((SELECT id FROM public.kecamatan WHERE code = '1671021'), '1671021004', 'KEMAS RINDO'),
  ((SELECT id FROM public.kecamatan WHERE code = '1671021'), '1671021005', 'OGAN BARU'),
  ((SELECT id FROM public.kecamatan WHERE code = '1671021'), '1671021006', 'KERTAPATI')
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  kecamatan_id = EXCLUDED.kecamatan_id;

-- Kecamatan: JAKABARING (1671022) - 5 kelurahan
INSERT INTO public.kelurahan (kecamatan_id, code, name)
VALUES
  ((SELECT id FROM public.kecamatan WHERE code = '1671022'), '1671022001', '15 ULU'),
  ((SELECT id FROM public.kecamatan WHERE code = '1671022'), '1671022002', 'TUAN KENTANG'),
  ((SELECT id FROM public.kecamatan WHERE code = '1671022'), '1671022003', '8 ULU'),
  ((SELECT id FROM public.kecamatan WHERE code = '1671022'), '1671022004', 'SILABERANTI'),
  ((SELECT id FROM public.kecamatan WHERE code = '1671022'), '1671022005', '9/10 ULU')
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  kecamatan_id = EXCLUDED.kecamatan_id;

-- Kecamatan: SEBERANG ULU II (1671030) - 7 kelurahan
INSERT INTO public.kelurahan (kecamatan_id, code, name)
VALUES
  ((SELECT id FROM public.kecamatan WHERE code = '1671030'), '1671030007', 'SENTOSA'),
  ((SELECT id FROM public.kecamatan WHERE code = '1671030'), '1671030008', '16 ULU'),
  ((SELECT id FROM public.kecamatan WHERE code = '1671030'), '1671030010', 'TANGGA TAKAT'),
  ((SELECT id FROM public.kecamatan WHERE code = '1671030'), '1671030011', '14 ULU'),
  ((SELECT id FROM public.kecamatan WHERE code = '1671030'), '1671030012', '13 ULU'),
  ((SELECT id FROM public.kecamatan WHERE code = '1671030'), '1671030013', '12 ULU'),
  ((SELECT id FROM public.kecamatan WHERE code = '1671030'), '1671030014', '11 ULU')
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  kecamatan_id = EXCLUDED.kecamatan_id;

-- Kecamatan: PLAJU (1671031) - 7 kelurahan
INSERT INTO public.kelurahan (kecamatan_id, code, name)
VALUES
  ((SELECT id FROM public.kecamatan WHERE code = '1671031'), '1671031001', 'PLAJU DARAT'),
  ((SELECT id FROM public.kecamatan WHERE code = '1671031'), '1671031002', 'TALANG PUTRI'),
  ((SELECT id FROM public.kecamatan WHERE code = '1671031'), '1671031003', 'KOMPERTA'),
  ((SELECT id FROM public.kecamatan WHERE code = '1671031'), '1671031004', 'PLAJU ILIR'),
  ((SELECT id FROM public.kecamatan WHERE code = '1671031'), '1671031005', 'TALANG BUBUK'),
  ((SELECT id FROM public.kecamatan WHERE code = '1671031'), '1671031006', 'PLAJU ULU'),
  ((SELECT id FROM public.kecamatan WHERE code = '1671031'), '1671031007', 'BAGUS KUNING')
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  kecamatan_id = EXCLUDED.kecamatan_id;

-- Kecamatan: ILIR BARAT I (1671040) - 6 kelurahan
INSERT INTO public.kelurahan (kecamatan_id, code, name)
VALUES
  ((SELECT id FROM public.kecamatan WHERE code = '1671040'), '1671040001', 'BUKIT LAMA'),
  ((SELECT id FROM public.kecamatan WHERE code = '1671040'), '1671040002', '26 ILIR I'),
  ((SELECT id FROM public.kecamatan WHERE code = '1671040'), '1671040009', 'LOROK PAKJO'),
  ((SELECT id FROM public.kecamatan WHERE code = '1671040'), '1671040010', 'DEMANG LEBAR DAUN'),
  ((SELECT id FROM public.kecamatan WHERE code = '1671040'), '1671040011', 'BUKIT BARU'),
  ((SELECT id FROM public.kecamatan WHERE code = '1671040'), '1671040012', 'SIRING AGUNG')
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  kecamatan_id = EXCLUDED.kecamatan_id;

-- Kecamatan: BUKIT KECIL (1671041) - 6 kelurahan
INSERT INTO public.kelurahan (kecamatan_id, code, name)
VALUES
  ((SELECT id FROM public.kecamatan WHERE code = '1671041'), '1671041001', 'TALANG SEMUT'),
  ((SELECT id FROM public.kecamatan WHERE code = '1671041'), '1671041002', '22 ILIR'),
  ((SELECT id FROM public.kecamatan WHERE code = '1671041'), '1671041003', '19 ILIR'),
  ((SELECT id FROM public.kecamatan WHERE code = '1671041'), '1671041004', '23 ILIR'),
  ((SELECT id FROM public.kecamatan WHERE code = '1671041'), '1671041005', '26 ILIR'),
  ((SELECT id FROM public.kecamatan WHERE code = '1671041'), '1671041006', '24 ILIR')
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  kecamatan_id = EXCLUDED.kecamatan_id;

-- Kecamatan: ILIR TIMUR I (1671050) - 11 kelurahan
INSERT INTO public.kelurahan (kecamatan_id, code, name)
VALUES
  ((SELECT id FROM public.kecamatan WHERE code = '1671050'), '1671050001', '18 ILIR'),
  ((SELECT id FROM public.kecamatan WHERE code = '1671050'), '1671050002', '16 ILIR'),
  ((SELECT id FROM public.kecamatan WHERE code = '1671050'), '1671050003', '13 ILIR'),
  ((SELECT id FROM public.kecamatan WHERE code = '1671050'), '1671050004', '14 ILIR'),
  ((SELECT id FROM public.kecamatan WHERE code = '1671050'), '1671050005', '15 ILIR'),
  ((SELECT id FROM public.kecamatan WHERE code = '1671050'), '1671050006', '17 ILIR'),
  ((SELECT id FROM public.kecamatan WHERE code = '1671050'), '1671050007', 'KEPANDEAN BARU'),
  ((SELECT id FROM public.kecamatan WHERE code = '1671050'), '1671050008', '20 ILIR I'),
  ((SELECT id FROM public.kecamatan WHERE code = '1671050'), '1671050009', 'SEI PANGERAN'),
  ((SELECT id FROM public.kecamatan WHERE code = '1671050'), '1671050011', '20 ILIR III'),
  ((SELECT id FROM public.kecamatan WHERE code = '1671050'), '1671050017', '20 ILIR IV')
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  kecamatan_id = EXCLUDED.kecamatan_id;

-- Kecamatan: KEMUNING (1671051) - 6 kelurahan
INSERT INTO public.kelurahan (kecamatan_id, code, name)
VALUES
  ((SELECT id FROM public.kecamatan WHERE code = '1671051'), '1671051001', 'SEKIP JAYA'),
  ((SELECT id FROM public.kecamatan WHERE code = '1671051'), '1671051002', 'PAHLAWAN'),
  ((SELECT id FROM public.kecamatan WHERE code = '1671051'), '1671051003', '20 ILIR II'),
  ((SELECT id FROM public.kecamatan WHERE code = '1671051'), '1671051004', 'PIPA REJA'),
  ((SELECT id FROM public.kecamatan WHERE code = '1671051'), '1671051005', 'TALANG AMAN'),
  ((SELECT id FROM public.kecamatan WHERE code = '1671051'), '1671051006', 'ARIO KEMUNING')
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  kecamatan_id = EXCLUDED.kecamatan_id;

-- Kecamatan: ILIR TIMUR II (1671060) - 6 kelurahan
INSERT INTO public.kelurahan (kecamatan_id, code, name)
VALUES
  ((SELECT id FROM public.kecamatan WHERE code = '1671060'), '1671060004', 'LAWANG KIDUL'),
  ((SELECT id FROM public.kecamatan WHERE code = '1671060'), '1671060005', '3 ILIR'),
  ((SELECT id FROM public.kecamatan WHERE code = '1671060'), '1671060006', '1 ILIR'),
  ((SELECT id FROM public.kecamatan WHERE code = '1671060'), '1671060007', 'SUNGAI BUAH'),
  ((SELECT id FROM public.kecamatan WHERE code = '1671060'), '1671060008', '2 ILIR'),
  ((SELECT id FROM public.kecamatan WHERE code = '1671060'), '1671060009', '5 ILIR')
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  kecamatan_id = EXCLUDED.kecamatan_id;

-- Kecamatan: KALIDONI (1671061) - 5 kelurahan
INSERT INTO public.kelurahan (kecamatan_id, code, name)
VALUES
  ((SELECT id FROM public.kecamatan WHERE code = '1671061'), '1671061001', 'SEI LAIS'),
  ((SELECT id FROM public.kecamatan WHERE code = '1671061'), '1671061002', 'SEI SELINCAH'),
  ((SELECT id FROM public.kecamatan WHERE code = '1671061'), '1671061003', 'SEI SELAYUR'),
  ((SELECT id FROM public.kecamatan WHERE code = '1671061'), '1671061004', 'KALIDONI'),
  ((SELECT id FROM public.kecamatan WHERE code = '1671061'), '1671061005', 'BUKIT SANGKAL')
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  kecamatan_id = EXCLUDED.kecamatan_id;

-- Kecamatan: ILIR TIMUR III (1671062) - 6 kelurahan
INSERT INTO public.kelurahan (kecamatan_id, code, name)
VALUES
  ((SELECT id FROM public.kecamatan WHERE code = '1671062'), '1671062001', '10 ILIR'),
  ((SELECT id FROM public.kecamatan WHERE code = '1671062'), '1671062002', '11 ILIR'),
  ((SELECT id FROM public.kecamatan WHERE code = '1671062'), '1671062003', 'KUTO BATU'),
  ((SELECT id FROM public.kecamatan WHERE code = '1671062'), '1671062004', 'DUKU'),
  ((SELECT id FROM public.kecamatan WHERE code = '1671062'), '1671062005', '9 ILIR'),
  ((SELECT id FROM public.kecamatan WHERE code = '1671062'), '1671062006', '8 ILIR')
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  kecamatan_id = EXCLUDED.kecamatan_id;

-- Kecamatan: SAKO (1671070) - 4 kelurahan
INSERT INTO public.kelurahan (kecamatan_id, code, name)
VALUES
  ((SELECT id FROM public.kecamatan WHERE code = '1671070'), '1671070001', 'SUKAMAJU'),
  ((SELECT id FROM public.kecamatan WHERE code = '1671070'), '1671070002', 'SIALANG'),
  ((SELECT id FROM public.kecamatan WHERE code = '1671070'), '1671070003', 'SAKO'),
  ((SELECT id FROM public.kecamatan WHERE code = '1671070'), '1671070007', 'SAKO BARU')
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  kecamatan_id = EXCLUDED.kecamatan_id;

-- Kecamatan: SEMATANG BORANG (1671071) - 4 kelurahan
INSERT INTO public.kelurahan (kecamatan_id, code, name)
VALUES
  ((SELECT id FROM public.kecamatan WHERE code = '1671071'), '1671071001', 'LEBONG GAJAH'),
  ((SELECT id FROM public.kecamatan WHERE code = '1671071'), '1671071002', 'SRIMULYO'),
  ((SELECT id FROM public.kecamatan WHERE code = '1671071'), '1671071003', 'SUKA MULYA'),
  ((SELECT id FROM public.kecamatan WHERE code = '1671071'), '1671071004', 'KARYA MULYA')
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  kecamatan_id = EXCLUDED.kecamatan_id;

-- Kecamatan: SUKARAMI (1671080) - 7 kelurahan
INSERT INTO public.kelurahan (kecamatan_id, code, name)
VALUES
  ((SELECT id FROM public.kecamatan WHERE code = '1671080'), '1671080002', 'SUKA BANGUN'),
  ((SELECT id FROM public.kecamatan WHERE code = '1671080'), '1671080003', 'SUKAJAYA'),
  ((SELECT id FROM public.kecamatan WHERE code = '1671080'), '1671080004', 'SUKARAMI'),
  ((SELECT id FROM public.kecamatan WHERE code = '1671080'), '1671080008', 'KEBUN BUNGA'),
  ((SELECT id FROM public.kecamatan WHERE code = '1671080'), '1671080009', 'TALANG BETUTU'),
  ((SELECT id FROM public.kecamatan WHERE code = '1671080'), '1671080010', 'SUKODADI'),
  ((SELECT id FROM public.kecamatan WHERE code = '1671080'), '1671080011', 'TALANG JAMBE')
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  kecamatan_id = EXCLUDED.kecamatan_id;

-- Kecamatan: ALANG ALANG LEBAR (1671081) - 4 kelurahan
INSERT INTO public.kelurahan (kecamatan_id, code, name)
VALUES
  ((SELECT id FROM public.kecamatan WHERE code = '1671081'), '1671081001', 'SRIJAYA'),
  ((SELECT id FROM public.kecamatan WHERE code = '1671081'), '1671081002', 'KARYA BARU'),
  ((SELECT id FROM public.kecamatan WHERE code = '1671081'), '1671081003', 'TALANG KELAPA'),
  ((SELECT id FROM public.kecamatan WHERE code = '1671081'), '1671081004', 'ALANG ALANG LEBAR')
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  kecamatan_id = EXCLUDED.kecamatan_id;

