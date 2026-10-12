/**
 * LAPORKITO — Audit & Evaluasi Kualitas AI Komprehensif
 * 
 * Pengujian terkontrol mandiri (terpisah dari database laporan operasional).
 * Mengukur:
 * 1. Text Classification (Accuracy, Confusion Matrix, Precision, Recall, F1-Score)
 * 2. Penanganan Bahasa Palembang, Bahasa Informal, dan Kiasan (Idiom)
 * 3. Deteksi Laporan Ambigu & Deskripsi Tidak Lengkap
 * 4. Filter Laporan Invalid / Di Luar Kategori (Out-of-Scope)
 * 5. Evaluasi Kalibrasi Confidence (Confidence vs Akurasi Empiris)
 * 6. Fact Fidelity & Anti-Halusinasi (Stated Facts vs Inferences vs Prohibited Inventions)
 * 7. Kesesuaian Rekomendasi Authority Rules (Non-Hallucination & Architecture Compliance)
 * 8. Penanganan Kegagalan & Validasi Skema
 */

import fs from 'fs';
import path from 'path';

// 1. Load .env.local secara aman
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    }
  }
}

import { GeminiProvider, getGeminiModel } from '../lib/ai/gemini';
import type { AuthorityCandidateForAI } from '../lib/ai/provider';

const gemini = new GeminiProvider();

// Kategori Resmi LAPORKITO
const OFFICIAL_CATEGORIES = [
  { slug: 'infrastruktur-jalan', name: 'Infrastruktur & Jalan' },
  { slug: 'kebersihan-lingkungan', name: 'Kebersihan & Lingkungan' },
  { slug: 'drainase-saluran-air', name: 'Drainase & Saluran Air' },
  { slug: 'penerangan-jalan', name: 'Penerangan Jalan' },
];

export interface TestCase {
  id: string;
  categoryGroup: 'infrastruktur-jalan' | 'kebersihan-lingkungan' | 'drainase-saluran-air' | 'penerangan-jalan' | 'invalid';
  languageType: 'formal_id' | 'informal_id' | 'pure_palembang' | 'mixed_palembang' | 'idiom_kiasan' | 'incomplete_info' | 'out_of_scope' | 'spam_short';
  title: string;
  description: string;
  addressDetail?: string;
  expectedCategory: string; // 'infrastruktur-jalan' | 'kebersihan-lingkungan' | 'drainase-saluran-air' | 'penerangan-jalan' | 'invalid'
  expectedValidity: boolean;
  groundTruthFacts: string[];
  prohibitedHallucinations: string[];
  notes: string;
}

// Dataset Evaluasi Terkontrol (Human Ground Truth) - 34 Kasus Uji
export const EVALUATION_DATASET: TestCase[] = [
  // ── 1. INFRASTRUKTUR JALAN (6 kasus) ──
  {
    id: 'IJ-01',
    categoryGroup: 'infrastruktur-jalan',
    languageType: 'formal_id',
    title: 'Kerusakan Jalan di Sudirman KM 3.5',
    description: 'Terdapat lubang berdiameter 60 cm di Jalan Jenderal Sudirman KM 3.5 tepat depan RS Charitas, lapisan aspal mengelupas dan membahayakan pengendara motor.',
    addressDetail: 'Jl. Jenderal Sudirman KM 3.5 depan RS Charitas',
    expectedCategory: 'infrastruktur-jalan',
    expectedValidity: true,
    groundTruthFacts: ['lubang jalan', 'Sudirman', 'RS Charitas'],
    prohibitedHallucinations: ['truk fuso', 'korban jiwa meninggal', 'galian pipa'],
    notes: 'Formal bahasa Indonesia dengan lokasi jelas.',
  },
  {
    id: 'IJ-02',
    categoryGroup: 'infrastruktur-jalan',
    languageType: 'informal_id',
    title: 'Jalan bolong deket rumah',
    description: 'Aspal di jalan deket rumah bolong parah banget, bahaya buat motor kalo malem lewat situ sering mau jatuh.',
    expectedCategory: 'infrastruktur-jalan',
    expectedValidity: true,
    groundTruthFacts: ['aspal bolong', 'bahaya motor'],
    prohibitedHallucinations: ['sejak 3 bulan lalu', 'proyek drainase'],
    notes: 'Informal tanpa alamat detail; tetap valid pengaduan jalan.',
  },
  {
    id: 'IJ-03',
    categoryGroup: 'infrastruktur-jalan',
    languageType: 'pure_palembang',
    title: 'Jalan lorong belobang besak nian',
    description: 'Jalan di Lorong Gotong Royong belobang besak nian, aspalnyo ancur pacak bikin uwong tecampak dari motor pas liwat.',
    addressDetail: 'Lorong Gotong Royong',
    expectedCategory: 'infrastruktur-jalan',
    expectedValidity: true,
    groundTruthFacts: ['Lorong Gotong Royong', 'belobang besak', 'tecampak dari motor'],
    prohibitedHallucinations: ['pembagian sembako', 'jembatan ampera retak'],
    notes: 'Bahasa Palembang kental (belobang, tecampak, uwong).',
  },
  {
    id: 'IJ-04',
    categoryGroup: 'infrastruktur-jalan',
    languageType: 'mixed_palembang',
    title: 'Lobang jalan di simpang lampu merah',
    description: 'Ada jalan rusak di simpang lampu merah Patal, lobangnyo dalam nian lokak buek celako pengendara mobil samo motor.',
    addressDetail: 'Simpang Patal',
    expectedCategory: 'infrastruktur-jalan',
    expectedValidity: true,
    groundTruthFacts: ['jalan rusak', 'simpang Patal', 'lobang dalam'],
    prohibitedHallucinations: ['tabrakan maut', 'kemarin siang'],
    notes: 'Campuran Palembang dan Indonesia (lokak buek celako).',
  },
  {
    id: 'IJ-05',
    categoryGroup: 'infrastruktur-jalan',
    languageType: 'idiom_kiasan',
    title: 'Jalan lorong ancur mincur cak kapal karam',
    description: 'Jalan di lorong kami ancur mincur cak kapal karam lokak makan korban men dibiarke bae.',
    expectedCategory: 'infrastruktur-jalan',
    expectedValidity: true,
    groundTruthFacts: ['jalan rusak parah'],
    prohibitedHallucinations: ['kapal tenggelam di sungai musi', 'kapal laut karam', 'korban tewas'],
    notes: 'Kiasan "cak kapal karam" dan "lokak makan korban" tidak boleh diartikan harfiah.',
  },
  {
    id: 'IJ-06',
    categoryGroup: 'infrastruktur-jalan',
    languageType: 'incomplete_info',
    title: 'Jalan rusak',
    description: 'Jalan berlubang dan becek parah tolong diperbaiki.',
    expectedCategory: 'infrastruktur-jalan',
    expectedValidity: true,
    groundTruthFacts: ['jalan berlubang', 'becek'],
    prohibitedHallucinations: ['Jl. Sudirman', 'Kecamatan Ilir Barat'],
    notes: 'Informasi minim tanpa lokasi spesifik; tetap valid objek fisik.',
  },

  // ── 2. KEBERSIHAN LINGKUNGAN (6 kasus) ──
  {
    id: 'KL-01',
    categoryGroup: 'kebersihan-lingkungan',
    languageType: 'formal_id',
    title: 'Tumpukan Sampah Liar di Pinggir Jalan Soekarno Hatta',
    description: 'Tumpukan sampah liar menumpuk di bahu Jalan Soekarno Hatta sepanjang 15 meter menimbulkan bau busuk menyengat dan mencemari lingkungan sekitar.',
    addressDetail: 'Jl. Soekarno Hatta KM 9',
    expectedCategory: 'kebersihan-lingkungan',
    expectedValidity: true,
    groundTruthFacts: ['sampah liar', 'Soekarno Hatta', 'bau busuk'],
    prohibitedHallucinations: ['limbah kimia industri', 'kebakaran tps'],
    notes: 'Formal bahasa Indonesia terkait sampah liar.',
  },
  {
    id: 'KL-02',
    categoryGroup: 'kebersihan-lingkungan',
    languageType: 'informal_id',
    title: 'Sampah berhari-hari gak diangkut warga resah',
    description: 'Sampah numpuk banyak banget di pinggir jalan raya, udah berhari-hari gak ada yang angkut baunya nyengat bikin pusing.',
    expectedCategory: 'kebersihan-lingkungan',
    expectedValidity: true,
    groundTruthFacts: ['sampah numpuk', 'berhari-hari tidak diangkut', 'bau nyengat'],
    prohibitedHallucinations: ['pasar tumpah liar', 'wabah muntaber'],
    notes: 'Informal bahasa Indonesia.',
  },
  {
    id: 'KL-03',
    categoryGroup: 'kebersihan-lingkungan',
    languageType: 'pure_palembang',
    title: 'Sampah liar bau bacin numpuk serakan',
    description: 'Sampah liar numpuk di pinggir jalan Simpang Macan Lindungan, la seminggu idak diangkut bau bacin nian ringam uwong liwat.',
    addressDetail: 'Simpang Macan Lindungan',
    expectedCategory: 'kebersihan-lingkungan',
    expectedValidity: true,
    groundTruthFacts: ['sampah liar', 'Simpang Macan Lindungan', 'seminggu idak diangkut', 'bau bacin'],
    prohibitedHallucinations: ['truk sampah terguling', 'sungai musi tercemar oli'],
    notes: 'Palembang kental (bau bacin, ringam, liwat).',
  },
  {
    id: 'KL-04',
    categoryGroup: 'kebersihan-lingkungan',
    languageType: 'mixed_palembang',
    title: 'Banyak sampah serakan di trotoar pejalan kaki',
    description: 'Banyak tumpukan sampah serakan di trotoar jalan Merdeka, uwong buang sembarangan tempat ringam nian jingoknyo kumuh kotor.',
    addressDetail: 'Jl. Merdeka',
    expectedCategory: 'kebersihan-lingkungan',
    expectedValidity: true,
    groundTruthFacts: ['sampah di trotoar', 'Jl. Merdeka', 'buang sembarangan'],
    prohibitedHallucinations: ['demonstrasi pedagang', 'pohon tumbang'],
    notes: 'Campuran Palembang-Indonesia (ringam nian jingoknyo).',
  },
  {
    id: 'KL-05',
    categoryGroup: 'kebersihan-lingkungan',
    languageType: 'idiom_kiasan',
    title: 'Sampah menumpuk bau bacin cak bangkai gajah',
    description: 'Sampah di TPS pasar baunyo nyengat cak bangkai gajah busuk menusuk idung pacak buek pingsan.',
    expectedCategory: 'kebersihan-lingkungan',
    expectedValidity: true,
    groundTruthFacts: ['sampah di TPS', 'bau busuk menyengat'],
    prohibitedHallucinations: ['bangkai gajah sungguhan', 'gajah mati', 'kebun binatang'],
    notes: 'Kiasan "cak bangkai gajah" tidak boleh ditafsirkan gajah mati sungguhan.',
  },
  {
    id: 'KL-06',
    categoryGroup: 'kebersihan-lingkungan',
    languageType: 'incomplete_info',
    title: 'Sampah menumpuk',
    description: 'Banyak tumpukan sampah liar berserakan tolong dinas terkait bersihkan.',
    expectedCategory: 'kebersihan-lingkungan',
    expectedValidity: true,
    groundTruthFacts: ['tumpukan sampah liar'],
    prohibitedHallucinations: ['Kecamatan Seberang Ulu', 'Depan Kantor Camat'],
    notes: 'Deskripsi pendek tanpa lokasi rinci, tetap valid.',
  },

  // ── 3. DRAINASE & SALURAN AIR (6 kasus) ──
  {
    id: 'DS-01',
    categoryGroup: 'drainase-saluran-air',
    languageType: 'formal_id',
    title: 'Saluran Drainase Primer Tersumbat Lumpur Tebal',
    description: 'Saluran drainase primer di Jalan R. Sukamto tersumbat sedimentasi lumpur tebal sehingga air meluap ke badan jalan setinggi 25 cm saat hujan deras.',
    addressDetail: 'Jl. R. Sukamto depan PTC Mall',
    expectedCategory: 'drainase-saluran-air',
    expectedValidity: true,
    groundTruthFacts: ['drainase tersumbat', 'R. Sukamto', 'sedimentasi lumpur', 'air meluap'],
    prohibitedHallucinations: ['tanggul jebol 10 meter', 'perahu karet evakuasi'],
    notes: 'Formal bahasa Indonesia saluran drainase.',
  },
  {
    id: 'DS-02',
    categoryGroup: 'drainase-saluran-air',
    languageType: 'informal_id',
    title: 'Got depan gang mampet banjir tiap hujan',
    description: 'Got depan gang mampet total, tiap ujan deres pasti banjir semata kaki masuk pekarangan rumah warga.',
    expectedCategory: 'drainase-saluran-air',
    expectedValidity: true,
    groundTruthFacts: ['got mampet', 'banjir semata kaki'],
    prohibitedHallucinations: ['longsor tanah', 'tenggelam sedada orang dewasa'],
    notes: 'Informal got mampet dan banjir.',
  },
  {
    id: 'DS-03',
    categoryGroup: 'drainase-saluran-air',
    languageType: 'pure_palembang',
    title: 'Got buntet banyu meluber ke rumah',
    description: 'Got di depan lorong kami buntet total, ari ujan dikit banyu langsung meluber banjir semata kaki masuk pekarangan uwong.',
    expectedCategory: 'drainase-saluran-air',
    expectedValidity: true,
    groundTruthFacts: ['got buntet', 'ari ujan', 'banyu meluber banjir'],
    prohibitedHallucinations: ['pompa air meledak', 'posko pengungsian'],
    notes: 'Palembang (buntet, ari ujan, banyu meluber).',
  },
  {
    id: 'DS-04',
    categoryGroup: 'drainase-saluran-air',
    languageType: 'mixed_palembang',
    title: 'Parit buntu air kemano-mano',
    description: 'Parit jalan tersumbat sampah dan lumpur, kalo hujan banyunyo ngalir kemano-mano dak pacak liwat jalan.',
    expectedCategory: 'drainase-saluran-air',
    expectedValidity: true,
    groundTruthFacts: ['parit tersumbat', 'banyunyo ngalir kemano-mano'],
    prohibitedHallucinations: ['jembatan hanyut', 'korban terseret arus'],
    notes: 'Campuran Palembang (dak pacak liwat).',
  },
  {
    id: 'DS-05',
    categoryGroup: 'drainase-saluran-air',
    languageType: 'idiom_kiasan',
    title: 'Banjir cak lautan lepas jalan tenggelam',
    description: 'Saluran air tumpat nian pas ujan jalan lorong banjir cak lautan lepas dak katek perahu dak pacak liwat.',
    expectedCategory: 'drainase-saluran-air',
    expectedValidity: true,
    groundTruthFacts: ['saluran air tumpat', 'banjir parah'],
    prohibitedHallucinations: ['tsunami', 'lautan samudera', 'kapal nelayan'],
    notes: 'Kiasan "cak lautan lepas" jangan ditafsirkan bencana laut.',
  },
  {
    id: 'DS-06',
    categoryGroup: 'drainase-saluran-air',
    languageType: 'incomplete_info',
    title: 'Got mampet parah',
    description: 'Saluran pembuangan air tersumbat dan meluap ke jalan tolong dikeruk.',
    expectedCategory: 'drainase-saluran-air',
    expectedValidity: true,
    groundTruthFacts: ['saluran air tersumbat', 'meluap'],
    prohibitedHallucinations: ['Kecamatan Alang-Alang Lebar', 'Kelurahan Talang Kelapa'],
    notes: 'Minim lokasi, tetap valid pengaduan fisik.',
  },

  // ── 4. PENERANGAN JALAN (6 kasus) ──
  {
    id: 'PJ-01',
    categoryGroup: 'penerangan-jalan',
    languageType: 'formal_id',
    title: 'Lampu Penerangan Jalan Umum (PJU) Padam di Sukabangun',
    description: 'Lampu penerangan jalan umum (PJU) mati total sepanjang 300 meter di Jalan Sukabangun 2 menyebabkan jalanan gelap gulita pada malam hari.',
    addressDetail: 'Jl. Sukabangun 2 Sukarami',
    expectedCategory: 'penerangan-jalan',
    expectedValidity: true,
    groundTruthFacts: ['lampu PJU mati', 'Sukabangun 2', 'gelap gulita'],
    prohibitedHallucinations: ['trafo meledak', 'kabel dicuri maling'],
    notes: 'Formal bahasa Indonesia PJU.',
  },
  {
    id: 'PJ-02',
    categoryGroup: 'penerangan-jalan',
    languageType: 'informal_id',
    title: 'Lampu jalan mati udah dua minggu',
    description: 'Lampu jalan pada mati semua udah dua minggu gak ada perbaikan, jalanan gelap banget rawan begal dan kecelakaan.',
    expectedCategory: 'penerangan-jalan',
    expectedValidity: true,
    groundTruthFacts: ['lampu jalan mati', 'dua minggu', 'gelap'],
    prohibitedHallucinations: ['korban perampokan bersenjata api', 'tersangka ditangkap'],
    notes: 'Informal bahasa Indonesia.',
  },
  {
    id: 'PJ-03',
    categoryGroup: 'penerangan-jalan',
    languageType: 'pure_palembang',
    title: 'Lampu lorong padem kelam kabut',
    description: 'Lampu jalan di simpang lorong padem galo la duo minggu, lorong kelam kabut nian rawan nian uwong lewat malem.',
    expectedCategory: 'penerangan-jalan',
    expectedValidity: true,
    groundTruthFacts: ['lampu padem galo', 'duo minggu', 'kelam kabut'],
    prohibitedHallucinations: ['tiang patah ditabrak truk kontainer'],
    notes: 'Palembang (padem galo, kelam kabut).',
  },
  {
    id: 'PJ-04',
    categoryGroup: 'penerangan-jalan',
    languageType: 'mixed_palembang',
    title: 'Tiang lampu PJU mati dari ujung ke ujung',
    description: 'Tiang lampu PJU mati dari ujung ke ujung jalan Kolonel Atmo, jalannyo gelap kelam idak katek penerangan lampu jalan.',
    addressDetail: 'Jl. Kolonel Atmo',
    expectedCategory: 'penerangan-jalan',
    expectedValidity: true,
    groundTruthFacts: ['tiang lampu PJU mati', 'Kolonel Atmo', 'gelap kelam'],
    prohibitedHallucinations: ['lampu solar cell terbakar'],
    notes: 'Campuran Palembang (gelap kelam idak katek penerangan).',
  },
  {
    id: 'PJ-05',
    categoryGroup: 'penerangan-jalan',
    languageType: 'idiom_kiasan',
    title: 'Jalanan gelap gulita cak kuburan angker',
    description: 'Lampu jalan mati galo lorong gelap gulita cak kuburan angker pacak keno jambret uwong jalan kaki.',
    expectedCategory: 'penerangan-jalan',
    expectedValidity: true,
    groundTruthFacts: ['lampu jalan mati', 'gelap gulita'],
    prohibitedHallucinations: ['pemakaman umum', 'jenazah kuburan', 'hantu'],
    notes: 'Kiasan "cak kuburan angker" tidak boleh diartikan kuburan fisik.',
  },
  {
    id: 'PJ-06',
    categoryGroup: 'penerangan-jalan',
    languageType: 'incomplete_info',
    title: 'Lampu PJU mati',
    description: 'Lampu jalan padam tolong diganti bohlamnya.',
    expectedCategory: 'penerangan-jalan',
    expectedValidity: true,
    groundTruthFacts: ['lampu jalan padam'],
    prohibitedHallucinations: ['Jl. Demang Lebar Daun', 'Kecamatan Ilir Barat I'],
    notes: 'Deskripsi pendek tanpa lokasi, tetap valid.',
  },

  // ── 5. LAPORAN AMBIGU / TUMPANG TINDIH OVERLAP (4 kasus) ──
  {
    id: 'AM-01',
    categoryGroup: 'drainase-saluran-air',
    languageType: 'mixed_palembang',
    title: 'Sampah nyumbat saluran got bikin jalan banjir',
    description: 'Banyak sampah plastik nyumbat saluran got di lorong sehingga air meluap membanjiri jalan dan rumah warga.',
    expectedCategory: 'drainase-saluran-air',
    expectedValidity: true,
    groundTruthFacts: ['sampah menyumbat got', 'air meluap banjir'],
    prohibitedHallucinations: ['tanggul jebol', 'perahu karet'],
    notes: 'Overlap sampah vs got; akibat utama adalah saluran air tersumbat dan banjir.',
  },
  {
    id: 'AM-02',
    categoryGroup: 'infrastruktur-jalan',
    languageType: 'informal_id',
    title: 'Bekas galian pipa bikin aspal jebol berlubang',
    description: 'Bekas galian proyek pipa di tengah jalan ditinggal gitu aja, sekarang aspalnya jebol berlubang dalam banget motor sering oleng.',
    expectedCategory: 'infrastruktur-jalan',
    expectedValidity: true,
    groundTruthFacts: ['bekas galian pipa', 'aspal jebol berlubang'],
    prohibitedHallucinations: ['pipa gas meledak', 'semburan lumpur'],
    notes: 'Overlap utilitas vs jalan; dampak fisik utama adalah kerusakan aspal jalan.',
  },
  {
    id: 'AM-03',
    categoryGroup: 'kebersihan-lingkungan',
    languageType: 'formal_id',
    title: 'Sampah TPS liar meluber ke parit dan jalan',
    description: 'Tempat pembuangan sampah liar di Jalan Mayor Ruslan meluap parah, tumpukan sampah berserakan mengotori jalan dan menimbulkan bau busuk menyengat.',
    expectedCategory: 'kebersihan-lingkungan',
    expectedValidity: true,
    groundTruthFacts: ['TPS liar meluap', 'Mayor Ruslan', 'sampah berserakan', 'bau busuk'],
    prohibitedHallucinations: ['banjir bandang', 'wabah flu burung'],
    notes: 'Fokus utama adalah timbunan sampah liar yang tidak terkelola.',
  },
  {
    id: 'AM-04',
    categoryGroup: 'penerangan-jalan',
    languageType: 'informal_id',
    title: 'Kabel lampu jalan putus menjuntai bikin gelap',
    description: 'Lampu jalan mati dan kabel lampu PJU putus menjuntai ke jalanan sangat bahaya dan jalan jadi gelap gulita.',
    expectedCategory: 'penerangan-jalan',
    expectedValidity: true,
    groundTruthFacts: ['lampu jalan mati', 'kabel PJU putus', 'gelap gulita'],
    prohibitedHallucinations: ['kebakaran tiang listrik PLN', 'warga tersengat listrik tewas'],
    notes: 'PJU padam disertai kerusakan fisik kabel.',
  },

  // ── 6. OUT-OF-SCOPE / INVALID / BUKAN ADUAN FASILITAS (6 kasus) ──
  {
    id: 'ED-01',
    categoryGroup: 'invalid',
    languageType: 'spam_short',
    title: 'tolong',
    description: 'tolong min bantu kami',
    expectedCategory: 'invalid',
    expectedValidity: false,
    groundTruthFacts: [],
    prohibitedHallucinations: ['jalan berlubang', 'sampah menumpuk', 'Jl. Sudirman'],
    notes: 'Teks sangat pendek tanpa substansi masalah fasilitas publik.',
  },
  {
    id: 'ED-02',
    categoryGroup: 'invalid',
    languageType: 'out_of_scope',
    title: 'Pertanyaan info pembuatan KTP',
    description: 'Halo selamat siang admin LAPORKITO, mau tanya syarat dan jadwal perpanjangan KTP elektronik di Dukcapil Palembang apa saja ya?',
    expectedCategory: 'invalid',
    expectedValidity: false,
    groundTruthFacts: ['tanya syarat KTP'],
    prohibitedHallucinations: ['jalan rusak', 'lampu mati'],
    notes: 'Pertanyaan layanan kependudukan, bukan aduan fasilitas publik 4 OPD.',
  },
  {
    id: 'ED-03',
    categoryGroup: 'invalid',
    languageType: 'spam_short',
    title: 'jalan kito',
    description: 'jalan kito aman bae',
    expectedCategory: 'invalid',
    expectedValidity: false,
    groundTruthFacts: [],
    prohibitedHallucinations: ['aspal rusak', 'saluran mampet'],
    notes: 'Teks tidak memuat keluhan kerusakan.',
  },
  {
    id: 'ED-04',
    categoryGroup: 'invalid',
    languageType: 'out_of_scope',
    title: 'Tetangga berisik setel musik malam hari',
    description: 'Tetangga sebelah rumah saya sering setel musik keras-keras sampai tengah malam sangat mengganggu waktu tidur keluarga saya.',
    expectedCategory: 'invalid',
    expectedValidity: false,
    groundTruthFacts: ['tetangga setel musik'],
    prohibitedHallucinations: ['penerangan jalan umum', 'kebersihan jalan'],
    notes: 'Keluhan ketertiban privat warga, di luar 4 kategori infrastruktur sipil.',
  },
  {
    id: 'ED-05',
    categoryGroup: 'invalid',
    languageType: 'spam_short',
    title: 'tes aplikasi',
    description: '123 testing aplikasi baru',
    expectedCategory: 'invalid',
    expectedValidity: false,
    groundTruthFacts: [],
    prohibitedHallucinations: ['jalan berlubang', 'lampu padam'],
    notes: 'Spam testing.',
  },
  {
    id: 'ED-06',
    categoryGroup: 'invalid',
    languageType: 'out_of_scope',
    title: 'Sengketa batas tanah warisan keluarga',
    description: 'Saya mau lapor patok batas tanah warisan keluarga saya digeser oleh saudara saya sendiri mohon solusinya.',
    expectedCategory: 'invalid',
    expectedValidity: false,
    groundTruthFacts: ['sengketa batas tanah warisan'],
    prohibitedHallucinations: ['infrastruktur jalan', 'drainase'],
    notes: 'Sengketa perdata privat, bukan pengaduan fasilitas sipil.',
  },
];

// Test Cases untuk Authority Rules Recommendation (Menguji Kepatuhan Arsitektur Hukum)
export const AUTHORITY_TEST_CASES = [
  {
    id: 'AUTH-01',
    title: 'Jalan Rusak Berlubang Parah di Sudirman',
    description: 'Aspal berlubang besar di Jalan Sudirman KM 3.5 depan RS Charitas membahayakan pengendara motor.',
    categorySlug: 'infrastruktur-jalan',
    candidates: [
      {
        rule_code: 'RULE_JALAN_KOTA',
        institution_name: 'Dinas Pekerjaan Umum dan Penataan Ruang Kota Palembang',
        institution_code: 'DPUPR',
        unit_name: null,
        unit_code: null,
        context_title: 'Pemeliharaan dan Perbaikan Jalan Kota',
        context_description: 'Penanganan kerusakan, penambalan lubang, dan rehabilitasi konstruksi ruas jalan kewenangan Kota Palembang.',
        regulation_basis: 'UU No. 38 Tahun 2004 jo UU No. 2 Tahun 2022; Perwali No. 38 Tahun 2022.',
      },
    ],
    expectedDecision: 'RECOMMEND',
    expectedRuleCode: 'RULE_JALAN_KOTA',
    notes: 'Kandidat tunggal jelas jalan kota.',
  },
  {
    id: 'AUTH-02',
    title: 'Sampah Menumpuk di Pinggir Jalan Protokol',
    description: 'Sampah liar menumpuk di pinggir jalan raya protokol menimbulkan bau busuk belum diangkut armada.',
    categorySlug: 'kebersihan-lingkungan',
    candidates: [
      {
        rule_code: 'RULE_KEBERSIHAN_KOTA',
        institution_name: 'Dinas Lingkungan Hidup Kota Palembang',
        institution_code: 'DLH',
        unit_name: null,
        unit_code: null,
        context_title: 'Pengangkutan Sampah dan Kebersihan Ruang Publik',
        context_description: 'Pengangkutan sampah dari Tempat Penampungan Sementara (TPS) dan pembersihan sampah liar di ruang publik.',
        regulation_basis: 'UU No. 18 Tahun 2008; Perda No. 3 Tahun 2015; Perwali No. 65 Tahun 2022.',
      },
      {
        rule_code: 'RULE_TPA_SUKAWINATAN',
        institution_name: 'Dinas Lingkungan Hidup Kota Palembang',
        institution_code: 'DLH',
        unit_name: 'UPTD TPA Sukawinatan',
        unit_code: 'DLH_UPTD_TPA_SUKAWINATAN',
        context_title: 'Pengelolaan Pemrosesan Akhir Sampah di TPA Sukawinatan',
        context_description: 'Penimbangan armada sampah, pemrosesan akhir, dan pengelolaan kolam lindi di Tempat Pemrosesan Akhir Sukawinatan.',
        regulation_basis: 'Perda No. 3 Tahun 2015; SK Walikota Pembentukan UPTD TPA Sukawinatan.',
      },
    ],
    expectedDecision: 'RECOMMEND',
    expectedRuleCode: 'RULE_KEBERSIHAN_KOTA',
    notes: 'Harus memilih RULE_KEBERSIHAN_KOTA untuk sampah jalan raya, bukan TPA Sukawinatan.',
  },
  {
    id: 'AUTH-03',
    title: 'Penataan Kolam Lindi dan Timbunan di TPA Sukawinatan',
    description: 'Kolam lindi di Tempat Pemrosesan Akhir Sampah TPA Sukawinatan meluap dan armada truk antre panjang.',
    categorySlug: 'kebersihan-lingkungan',
    candidates: [
      {
        rule_code: 'RULE_KEBERSIHAN_KOTA',
        institution_name: 'Dinas Lingkungan Hidup Kota Palembang',
        institution_code: 'DLH',
        unit_name: null,
        unit_code: null,
        context_title: 'Pengangkutan Sampah dan Kebersihan Ruang Publik',
        context_description: 'Pengangkutan sampah dari TPS dan ruang publik.',
        regulation_basis: 'UU No. 18 Tahun 2008.',
      },
      {
        rule_code: 'RULE_TPA_SUKAWINATAN',
        institution_name: 'Dinas Lingkungan Hidup Kota Palembang',
        institution_code: 'DLH',
        unit_name: 'UPTD TPA Sukawinatan',
        unit_code: 'DLH_UPTD_TPA_SUKAWINATAN',
        context_title: 'Pengelolaan Pemrosesan Akhir Sampah di TPA Sukawinatan',
        context_description: 'Penimbangan armada sampah, pemrosesan akhir, dan pengelolaan kolam lindi di TPA Sukawinatan.',
        regulation_basis: 'Perda No. 3 Tahun 2015.',
      },
    ],
    expectedDecision: 'RECOMMEND',
    expectedRuleCode: 'RULE_TPA_SUKAWINATAN',
    notes: 'Harus memilih UPTD TPA Sukawinatan untuk aduan spesifik TPA.',
  },
  {
    id: 'AUTH-04',
    title: 'Saluran Drainase Primer Meluap Banjir',
    description: 'Parit drainase primer tertutup endapan lumpur tebal membuat air meluap ke jalan.',
    categorySlug: 'drainase-saluran-air',
    candidates: [
      {
        rule_code: 'RULE_DRAINASE_KOTA',
        institution_name: 'Dinas Pekerjaan Umum dan Penataan Ruang Kota Palembang',
        institution_code: 'DPUPR',
        unit_name: null,
        unit_code: null,
        context_title: 'Pemeliharaan Saluran Drainase Perkotaan dan Kolam Retensi',
        context_description: 'Pengerukan sedimentasi lumpur dan pemeliharaan drainase kota.',
        regulation_basis: 'UU No. 17 Tahun 2019; Perwali No. 38 Tahun 2022.',
      },
    ],
    expectedDecision: 'RECOMMEND',
    expectedRuleCode: 'RULE_DRAINASE_KOTA',
    notes: 'Kandidat tunggal drainase kota DPUPR.',
  },
  {
    id: 'AUTH-05',
    title: 'Lampu PJU Padam Total Sepanjang Jalan',
    description: 'Lampu penerangan jalan padam total sepanjang 300 meter jalan gelap gulita.',
    categorySlug: 'penerangan-jalan',
    candidates: [
      {
        rule_code: 'RULE_PJU_KOTA',
        institution_name: 'Dinas Perhubungan Kota Palembang',
        institution_code: 'DISHUB',
        unit_name: null,
        unit_code: null,
        context_title: 'Pemeliharaan dan Perbaikan Penerangan Jalan Umum',
        context_description: 'Perbaikan lampu PJU padam, penggantian lampu LED, perbaikan kabel dan panel PJU Kota Palembang.',
        regulation_basis: 'UU No. 22 Tahun 2009; BAST Pengalihan PJU ke Dishub per 1 Januari 2025.',
      },
    ],
    expectedDecision: 'RECOMMEND',
    expectedRuleCode: 'RULE_PJU_KOTA',
    notes: 'Kandidat PJU Dishub.',
  },
  {
    id: 'AUTH-06',
    title: 'Laporan Kategori Tanpa Aturan Terdaftar',
    description: 'Laporan dengan kategori baru yang belum memiliki aturan terdaftar di database.',
    categorySlug: 'kategori-tanpa-aturan',
    candidates: [],
    expectedDecision: 'NEEDS_REVIEW',
    expectedRuleCode: null,
    notes: 'Kandidat kosong wajib menghasilkan decision NEEDS_REVIEW dan rule_code null.',
  },
];

async function runFullAudit() {
  console.log('================================================================');
  console.log('       AUDIT & EVALUASI KUALITAS AI LAPORKITO KOTA PALEMBANG    ');
  console.log('================================================================');
  console.log(`Model Aktif : ${getGeminiModel()}`);
  console.log(`Timestamp   : ${new Date().toISOString()}`);
  console.log(`Total Sampel: ${EVALUATION_DATASET.length} kasus uji teks`);
  console.log(`Kasus Auth  : ${AUTHORITY_TEST_CASES.length} kasus uji kewenangan\n`);

  // ─────────────────────────────────────────────────────────────
  // BAGIAN 1: AUDIT KLASIFIKASI TEKS & BAHASA PALEMBANG
  // ─────────────────────────────────────────────────────────────
  console.log('================================================================');
  console.log('BAGIAN 1: EVALUASI KLASIFIKASI TEKS & PENANGANAN BAHASA');
  console.log('================================================================\n');

  const categories = [
    'infrastruktur-jalan',
    'kebersihan-lingkungan',
    'drainase-saluran-air',
    'penerangan-jalan',
    'invalid',
  ];

  // Confusion matrix: [actual][predicted]
  const matrix: Record<string, Record<string, number>> = {};
  for (const c1 of categories) {
    matrix[c1] = {};
    for (const c2 of categories) {
      matrix[c1][c2] = 0;
    }
  }

  // Tracking per-language performance
  const langStats: Record<string, { total: number; correct: number }> = {};
  
  // Tracking confidence calibration bins: [0.0-0.5, 0.5-0.7, 0.7-0.85, 0.85-1.0]
  const confBins = [
    { label: '< 60%', min: 0, max: 0.60, count: 0, correct: 0, sumConf: 0 },
    { label: '60% - 79%', min: 0.60, max: 0.80, count: 0, correct: 0, sumConf: 0 },
    { label: '80% - 89%', min: 0.80, max: 0.90, count: 0, correct: 0, sumConf: 0 },
    { label: '90% - 100%', min: 0.90, max: 1.01, count: 0, correct: 0, sumConf: 0 },
  ];

  let totalCorrect = 0;
  let totalHallucinations = 0;
  let totalConfidenceSum = 0;
  const errorsList: Array<{ id: string; title: string; expected: string; predicted: string; reasoning: string }> = [];

  for (let i = 0; i < EVALUATION_DATASET.length; i++) {
    const sample = EVALUATION_DATASET[i];
    if (!langStats[sample.languageType]) {
      langStats[sample.languageType] = { total: 0, correct: 0 };
    }
    langStats[sample.languageType].total++;

    try {
      // Pacing untuk menghormati quota rate-limiting
      await new Promise((r) => setTimeout(r, 2000));

      const triage = await gemini.triageReport({
        title: sample.title,
        description: sample.description,
        addressDetail: sample.addressDetail,
        availableCategories: OFFICIAL_CATEGORIES,
      });

      const predicted = triage.isValidComplaint ? triage.categorySlug : 'invalid';
      if (matrix[sample.expectedCategory] && matrix[sample.expectedCategory][predicted] !== undefined) {
        matrix[sample.expectedCategory][predicted]++;
      }

      const isCorrect = predicted === sample.expectedCategory;
      if (isCorrect) {
        totalCorrect++;
        langStats[sample.languageType].correct++;
      } else {
        errorsList.push({
          id: sample.id,
          title: sample.title,
          expected: sample.expectedCategory,
          predicted,
          reasoning: triage.reasoning || '',
        });
      }

      totalConfidenceSum += triage.confidence;

      // Calibration binning
      for (const bin of confBins) {
        if (triage.confidence >= bin.min && triage.confidence < bin.max) {
          bin.count++;
          bin.sumConf += triage.confidence;
          if (isCorrect) bin.correct++;
          break;
        }
      }

      // Cek Halusinasi Fakta
      const summaryLower = (triage.summary || '').toLowerCase();
      let sampleHasHallucination = false;
      for (const forbidden of sample.prohibitedHallucinations) {
        if (summaryLower.includes(forbidden.toLowerCase())) {
          sampleHasHallucination = true;
          console.warn(`  [PERINGATAN HALUSINASI] ${sample.id}: summary memuat frasa terlarang "${forbidden}"`);
        }
      }
      if (sampleHasHallucination) totalHallucinations++;

      console.log(
        `[${(i + 1).toString().padStart(2, '0')}/${EVALUATION_DATASET.length}] ${sample.id.padEnd(5)} | ` +
        `Bahasa: ${sample.languageType.padEnd(16)} | ` +
        `E:${sample.expectedCategory.slice(0, 10).padEnd(10)} -> P:${predicted.slice(0, 10).padEnd(10)} | ` +
        `Valid: ${String(triage.isValidComplaint).padEnd(5)} | ` +
        `Conf: ${(triage.confidence * 100).toFixed(0)}% | ` +
        `${isCorrect ? '✅ TEPAT' : '❌ SALAH'}`
      );
    } catch (err) {
      console.error(`  ERROR pada sampel ${sample.id}:`, (err as Error).message);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // HASIL STATISTIK KLASIFIKASI TEKS
  // ─────────────────────────────────────────────────────────────
  const overallAccuracy = (totalCorrect / EVALUATION_DATASET.length) * 100;
  const avgConfidence = (totalConfidenceSum / EVALUATION_DATASET.length) * 100;
  const hallucinationRate = (totalHallucinations / EVALUATION_DATASET.length) * 100;

  console.log('\n----------------------------------------------------------------');
  console.log('MATRIKS KEBINGUNGAN (CONFUSION MATRIX)');
  console.log('----------------------------------------------------------------');
  console.log('Kategori Aktual \\ Prediksi | infra-jalan | kebersihan  | drainase    | penerangan  | invalid');
  console.log('---------------------------+-------------+-------------+-------------+-------------+--------');
  for (const actual of categories) {
    const row = matrix[actual];
    console.log(
      `${actual.padEnd(26)} | ` +
      `${String(row['infrastruktur-jalan']).padStart(11)} | ` +
      `${String(row['kebersihan-lingkungan']).padStart(11)} | ` +
      `${String(row['drainase-saluran-air']).padStart(11)} | ` +
      `${String(row['penerangan-jalan']).padStart(11)} | ` +
      `${String(row['invalid']).padStart(7)}`
    );
  }

  console.log('\n----------------------------------------------------------------');
  console.log('METRIK KINERJA PER KATEGORI (PRECISION, RECALL, F1-SCORE)');
  console.log('----------------------------------------------------------------');
  console.log('Kategori                   | TP | FP | FN | Precision | Recall    | F1-Score');
  console.log('---------------------------+----+----+----+-----------+-----------+---------');

  let weightedF1Sum = 0;
  for (const cat of categories) {
    const tp = matrix[cat][cat];
    let fp = 0;
    let fn = 0;
    for (const other of categories) {
      if (other !== cat) {
        fp += matrix[other][cat];
        fn += matrix[cat][other];
      }
    }
    const precision = tp + fp > 0 ? (tp / (tp + fp)) * 100 : 0;
    const recall = tp + fn > 0 ? (tp / (tp + fn)) * 100 : 0;
    const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;
    const actualSupport = tp + fn;
    weightedF1Sum += f1 * actualSupport;

    console.log(
      `${cat.padEnd(26)} | ` +
      `${String(tp).padStart(2)} | ` +
      `${String(fp).padStart(2)} | ` +
      `${String(fn).padStart(2)} | ` +
      `${precision.toFixed(1).padStart(8)}% | ` +
      `${recall.toFixed(1).padStart(8)}% | ` +
      `${f1.toFixed(1).padStart(7)}%`
    );
  }
  const macroWeightedF1 = weightedF1Sum / EVALUATION_DATASET.length;

  console.log('\n----------------------------------------------------------------');
  console.log('AKURASI BERDASARKAN VARIAN BAHASA');
  console.log('----------------------------------------------------------------');
  for (const [lang, stats] of Object.entries(langStats)) {
    const pct = (stats.correct / stats.total) * 100;
    console.log(`• ${lang.padEnd(20)}: ${stats.correct}/${stats.total} (${pct.toFixed(1)}%)`);
  }

  console.log('\n----------------------------------------------------------------');
  console.log('KALIBRASI CONFIDENCE MODEL (CONFIDENCE VS AKURASI EMPIRIS)');
  console.log('----------------------------------------------------------------');
  console.log('Rentang Confidence | Jumlah Sampel | Rata-rata Conf | Akurasi Aktual | Selisih ECE');
  console.log('-------------------+---------------+----------------+----------------+------------');
  let expectedCalibrationError = 0;
  for (const bin of confBins) {
    if (bin.count > 0) {
      const avgBinConf = (bin.sumConf / bin.count) * 100;
      const binAcc = (bin.correct / bin.count) * 100;
      const gap = Math.abs(avgBinConf - binAcc);
      expectedCalibrationError += (bin.count / EVALUATION_DATASET.length) * gap;
      console.log(
        `${bin.label.padEnd(18)} | ` +
        `${String(bin.count).padStart(13)} | ` +
        `${avgBinConf.toFixed(1).padStart(13)}% | ` +
        `${binAcc.toFixed(1).padStart(13)}% | ` +
        `${gap.toFixed(1).padStart(9)}%`
      );
    } else {
      console.log(`${bin.label.padEnd(18)} |             0 |              — |              — |          —`);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // BAGIAN 2: AUDIT KESESUAIAN ATURAN KEWENANGAN (AUTHORITY RULES)
  // ─────────────────────────────────────────────────────────────
  console.log('\n================================================================');
  console.log('BAGIAN 2: EVALUASI KEPATUHAN ARSITEKTUR & ATURAN KEWENANGAN');
  console.log('================================================================\n');

  let authCorrect = 0;
  for (const authCase of AUTHORITY_TEST_CASES) {
    await new Promise((r) => setTimeout(r, 2000));
    try {
      const authRes = await gemini.recommendAuthority({
        title: authCase.title,
        description: authCase.description,
        categorySlug: authCase.categorySlug,
        candidates: authCase.candidates as AuthorityCandidateForAI[],
      });

      const isDecisionMatch = authRes.decision === authCase.expectedDecision;
      const isRuleMatch = authRes.rule_code === authCase.expectedRuleCode;
      const isSuccess = isDecisionMatch && isRuleMatch;

      if (isSuccess) authCorrect++;

      console.log(
        `Kasus ${authCase.id.padEnd(8)}: ` +
        `E:[${authCase.expectedDecision}, ${authCase.expectedRuleCode || 'null'}] -> ` +
        `A:[${authRes.decision}, ${authRes.rule_code || 'null'}] ` +
        `(${authRes.institution_name || 'Tidak ada instansi'}) | ` +
        `${isSuccess ? '✅ TEPAT' : '❌ SALAH'}`
      );
    } catch (err) {
      console.error(`  ERROR pada auth case ${authCase.id}:`, (err as Error).message);
    }
  }
  const authAccuracy = (authCorrect / AUTHORITY_TEST_CASES.length) * 100;

  // ─────────────────────────────────────────────────────────────
  // RINGKASAN AUDIT MUTLAK
  // ─────────────────────────────────────────────────────────────
  console.log('\n================================================================');
  console.log('RINGKASAN HASIL AUDIT KUALITAS AI LAPORKITO');
  console.log('================================================================');
  console.log(`• Total Kasus Uji Teks Teruji     : ${EVALUATION_DATASET.length}`);
  console.log(`• Akurasi Klasifikasi Teks        : ${overallAccuracy.toFixed(1)}% (${totalCorrect}/${EVALUATION_DATASET.length})`);
  console.log(`• Macro-Weighted F1-Score         : ${macroWeightedF1.toFixed(1)}%`);
  console.log(`• Rata-rata Self-Confidence Model : ${avgConfidence.toFixed(1)}%`);
  console.log(`• Expected Calibration Error (ECE): ${expectedCalibrationError.toFixed(1)}%`);
  console.log(`• Tingkat Halusinasi / Fact Add   : ${hallucinationRate.toFixed(1)}% (${totalHallucinations}/${EVALUATION_DATASET.length})`);
  console.log(`• Akurasi Authority Rules Match   : ${authAccuracy.toFixed(1)}% (${authCorrect}/${AUTHORITY_TEST_CASES.length})`);
  console.log('================================================================\n');

  if (errorsList.length > 0) {
    console.log('CONTOH KESALAHAN KLASIFIKASI:');
    for (const err of errorsList) {
      console.log(`- [${err.id}] "${err.title}": Aktual=${err.expected}, Prediksi=${err.predicted}`);
      console.log(`  Alasan Model: ${err.reasoning}`);
    }
  } else {
    console.log('Tidak ada kesalahan klasifikasi yang terdeteksi pada dataset evaluasi.');
  }
}

runFullAudit().catch(console.error);
