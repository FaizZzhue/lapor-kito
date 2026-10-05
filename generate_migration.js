const fs = require('fs');
const path = require('path');

const wilayahPath = path.join(__dirname, 'palembang_wilayah.json');
const data = JSON.parse(fs.readFileSync(wilayahPath, 'utf8'));

const categories = [
  {
    slug: 'infrastruktur-jalan',
    name_id: 'Infrastruktur & Jalan',
    name_en: 'Infrastructure & Roads',
    description: 'Laporan kerusakan jalan, jembatan, trotoar, dan fasilitas umum transportasi darat.',
    icon: 'road',
    display_order: 1
  },
  {
    slug: 'kebersihan-lingkungan',
    name_id: 'Kebersihan & Lingkungan',
    name_en: 'Cleanliness & Environment',
    description: 'Laporan timbulan sampah liar, tempat penampungan sampah, dan kebersihan ruang publik.',
    icon: 'trash-2',
    display_order: 2
  },
  {
    slug: 'drainase-saluran-air',
    name_id: 'Drainase & Pengendalian Banjir',
    name_en: 'Drainage & Flood Control',
    description: 'Laporan genangan air, drainase tersumbat, tanggul, dan sedimentasi saluran air.',
    icon: 'droplets',
    display_order: 3
  },
  {
    slug: 'penerangan-jalan',
    name_id: 'Penerangan Jalan Umum',
    name_en: 'Public Street Lighting',
    description: 'Laporan lampu penerangan jalan umum (PJU) mati, redup, atau rusak.',
    icon: 'lightbulb',
    display_order: 4
  }
];

let sql = '-- ====================================================================\n';
sql += '-- LAPORKITO Database Master Data Seed Migration\n';
sql += '-- 00002_master_data.sql\n';
sql += '-- Master Data: LAPORKITO taxonomy categories and official Palembang wilayah\n';
sql += '-- Official Source: Kemendagri / BPS 2023 / Perda Kota Palembang No. 15/2012\n';
sql += '-- Total Kecamatan: 18 | Total Kelurahan: 107\n';
sql += '-- ====================================================================\n\n';

sql += '-- 1. CATEGORIES (LAPORKITO Core Taxonomy)\n';
sql += 'INSERT INTO public.categories (slug, name_id, name_en, description, icon, is_active, display_order)\nVALUES\n';
const catRows = categories.map(c => 
  `  ('${c.slug}', '${c.name_id}', '${c.name_en}', '${c.description.replace(/'/g, "''")}', '${c.icon}', true, ${c.display_order})`
).join(',\n');
sql += catRows + '\n';
sql += 'ON CONFLICT (slug) DO UPDATE SET\n';
sql += '  name_id = EXCLUDED.name_id,\n';
sql += '  name_en = EXCLUDED.name_en,\n';
sql += '  description = EXCLUDED.description,\n';
sql += '  icon = EXCLUDED.icon,\n';
sql += '  is_active = EXCLUDED.is_active,\n';
sql += '  display_order = EXCLUDED.display_order;\n\n';

sql += '-- 2. KECAMATAN (18 Kecamatan Resmi Kota Palembang)\n';
sql += 'INSERT INTO public.kecamatan (code, name)\nVALUES\n';
const kecRows = data.map(d => `  ('${d.code}', '${d.name.replace(/'/g, "''")}')`).join(',\n');
sql += kecRows + '\n';
sql += 'ON CONFLICT (code) DO UPDATE SET\n';
sql += '  name = EXCLUDED.name;\n\n';

sql += '-- 3. KELURAHAN (107 Kelurahan Resmi Kota Palembang terelasi ke Kecamatan)\n';
let kelCount = 0;
data.forEach(d => {
  sql += `-- Kecamatan: ${d.name} (${d.code}) - ${d.villages.length} kelurahan\n`;
  sql += 'INSERT INTO public.kelurahan (kecamatan_id, code, name)\nVALUES\n';
  const vRows = d.villages.map(v => {
    kelCount++;
    return `  ((SELECT id FROM public.kecamatan WHERE code = '${d.code}'), '${v.code}', '${v.name.replace(/'/g, "''")}')`;
  }).join(',\n');
  sql += vRows + '\n';
  sql += 'ON CONFLICT (code) DO UPDATE SET\n';
  sql += '  name = EXCLUDED.name,\n';
  sql += '  kecamatan_id = EXCLUDED.kecamatan_id;\n\n';
});

const outPath = path.join(__dirname, 'supabase', 'migrations', '00002_master_data.sql');
fs.writeFileSync(outPath, sql, 'utf8');

console.log('SUCCESS!');
console.log('Categories count:', categories.length);
console.log('Kecamatan count:', data.length);
console.log('Kelurahan count:', kelCount);
console.log('File written to:', outPath);
