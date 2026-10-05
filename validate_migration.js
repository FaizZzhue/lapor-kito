const fs = require('fs');
const path = require('path');

const migrationPath = path.join(__dirname, 'supabase', 'migrations', '00002_master_data.sql');
const content = fs.readFileSync(migrationPath, 'utf8');

console.log('=== VALIDATING 00002_master_data.sql ===\n');

// 1. Validate Categories
const catMatches = [...content.matchAll(/\('(infrastruktur-jalan|kebersihan-lingkungan|drainase-saluran-air|penerangan-jalan)',\s*'([^']+)'/g)];
const catSlugs = new Set();
console.log(`[CATEGORIES] Found ${catMatches.length} categories:`);
catMatches.forEach(m => {
  console.log(` - ${m[1]}: "${m[2]}"`);
  if (catSlugs.has(m[1])) {
    throw new Error(`Duplicate category slug: ${m[1]}`);
  }
  catSlugs.add(m[1]);
});

// 2. Validate Kecamatan
const kecSectionRegex = /INSERT INTO public\.kecamatan\s*\([^)]+\)\s*VALUES\s*([\s\S]*?)ON CONFLICT/i;
const kecMatch = content.match(kecSectionRegex);
if (!kecMatch) throw new Error('Could not find kecamatan INSERT statement');

const kecRows = [...kecMatch[1].matchAll(/\('(\d{7})',\s*'([^']+)'\)/g)];
console.log(`\n[KECAMATAN] Found ${kecRows.length} kecamatan entries:`);
const kecCodes = new Set();
kecRows.forEach(r => {
  if (kecCodes.has(r[1])) throw new Error(`Duplicate kecamatan code: ${r[1]}`);
  kecCodes.add(r[1]);
});
console.log(`Verified ${kecCodes.size} unique kecamatan codes (target: 18).`);
if (kecCodes.size !== 18) throw new Error(`Expected 18 kecamatan, got ${kecCodes.size}`);

// 3. Validate Kelurahan
const kelRows = [...content.matchAll(/\(\(SELECT id FROM public\.kecamatan WHERE code = '(\d{7})'\),\s*'(\d{10})',\s*'([^']+)'\)/g)];
console.log(`\n[KELURAHAN] Found ${kelRows.length} kelurahan entries:`);
const kelCodes = new Set();
const kelPerKec = {};

kelRows.forEach(r => {
  const kecCode = r[1];
  const kelCode = r[2];
  const kelName = r[3];

  if (!kecCodes.has(kecCode)) {
    throw new Error(`Kelurahan "${kelName}" (${kelCode}) references non-existent kecamatan code: ${kecCode}`);
  }
  if (kelCodes.has(kelCode)) {
    throw new Error(`Duplicate kelurahan code: ${kelCode} (${kelName})`);
  }
  kelCodes.add(kelCode);

  kelPerKec[kecCode] = (kelPerKec[kecCode] || 0) + 1;
});

console.log(`Verified ${kelCodes.size} unique kelurahan codes (target: 107).`);
if (kelCodes.size !== 107) throw new Error(`Expected 107 kelurahan, got ${kelCodes.size}`);

console.log('\n[BREAKDOWN PER KECAMATAN]:');
kecRows.forEach(k => {
  const count = kelPerKec[k[1]] || 0;
  console.log(` - ${k[1]} ${k[2]}: ${count} kelurahan`);
});

console.log('\n>>> ALL MASTER DATA MIGRATION CHECKS PASSED! <<<');
