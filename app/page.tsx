import Link from "next/link";
import Image from "next/image";
import {
  ShieldCheck,
  MapPin,
  Sparkles,
  CheckCircle2,
  FileText,
  Building2,
  Eye,
  Lock,
  AlertTriangle,
  Lightbulb,
  Droplets,
  Trash2,
} from "lucide-react";

export default function Home() {
  return (
    <div className="w-full bg-[#eef2f6] py-6 sm:py-10 px-3 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
      <div className="mx-auto max-w-7xl space-y-6 sm:space-y-8">

        {/* 1. HERO SECTION — EDITORIAL PANEL */}
        <section className="relative border border-slate-200 rounded-2xl isolate flex min-h-[560px] w-full items-center justify-center overflow-hidden bg-slate-950 sm:min-h-[650px] lg:min-h-[720px]">

          {/* Background Image */}
          <Image
            src="/images/palembang-ampera-hero.jpg"
            alt="Jembatan Ampera dan Sungai Musi di Kota Palembang"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />

          {/* Dark Overlay */}
          <div className="absolute inset-0 z-[1] bg-gradient-to-b from-slate-950/50 via-slate-950/55 to-slate-950/70" />

          {/* Center Content */}
          <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center px-5 py-20 text-center text-white sm:px-8 lg:px-12">

            {/* Location Badge */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-xs font-medium tracking-wide text-white backdrop-blur-md">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
              <span>KOTA PALEMBANG</span>
            </div>

            {/* Main Heading */}
            <h1 className="max-w-4xl text-3xl font-bold leading-tight tracking-tight sm:text-5xl sm:leading-[1.15] lg:text-6xl">
              Laporkan masalah kota dengan{" "}
              <span className="text-blue-300">
                lebih tepat &amp; terarah.
              </span>
            </h1>

            {/* Description */}
            <p className="mt-6 max-w-3xl text-sm leading-relaxed text-white/90 sm:text-base lg:text-lg">
              Ceritakan masalah fasilitas umum di sekitar Anda dengan bahasa
              sehari-hari. LAPORKITO membantu merapikan uraian, menguji
              kelengkapan bukti foto, merekomendasikan instansi berwenang
              di Kota Palembang, dan menerbitkan kode lacak terbuka.
            </p>

            {/* Action Buttons */}
            <div className="mt-8 flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row">
              <Link
                href="/lapor"
                className="inline-flex min-h-[48px] w-full items-center justify-center rounded-lg bg-blue-700 px-7 text-sm font-semibold text-white shadow-lg transition-all hover:bg-blue-800 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:w-auto"
              >
                Ceritakan Masalah Sekarang
              </Link>

              <Link
                href="/pantau"
                className="inline-flex min-h-[48px] w-full items-center justify-center rounded-lg border border-white/40 bg-white/10 px-7 text-sm font-semibold text-white backdrop-blur-md transition-all hover:bg-white/20 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:w-auto"
              >
                Pantau Laporan
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="mt-10 flex w-full flex-wrap items-center justify-center gap-x-6 gap-y-3 border-t border-white/25 pt-5 text-xs text-white/90 sm:w-auto sm:text-sm">
              <div className="flex items-center gap-2">
                <MapPin
                  className="h-4 w-4 shrink-0 text-blue-300"
                  aria-hidden="true"
                />
                <span>18 Kecamatan Palembang</span>
              </div>

              <div className="flex items-center gap-2">
                <Lock
                  className="h-4 w-4 shrink-0 text-emerald-300"
                  aria-hidden="true"
                />
                <span>Data Pribadi Terlindungi</span>
              </div>
            </div>

          </div>
        </section>

        {/* 2. 4 KATEGORI PERMASALAHAN YANG DIDUKUNG — EDITORIAL PANEL */}
        <section id="kategori" className="editorial-panel p-6 sm:p-10 lg:p-12 space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              4 Kategori Masalah Fasilitas Kota
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Category 1 */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-2xs flex flex-col justify-between space-y-4 hover:border-blue-600/50 transition-colors">
              <div className="space-y-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                  <AlertTriangle className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Infrastruktur & Jalan</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Jalan berlubang, aspal retak atau amblas, trotoar pejalan kaki rusak, serta kerusakan
                  fasilitas jembatan kota.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-100 font-mono text-[11px] text-slate-500">
                Contoh: Aspal amblas, lubang jalan
              </div>
            </div>

            {/* Category 2 */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-2xs flex flex-col justify-between space-y-4 hover:border-emerald-600/50 transition-colors">
              <div className="space-y-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                  <Trash2 className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Kebersihan & Lingkungan</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Tumpukan sampah liar di pinggir jalan, bak penampungan TPS yang meluber, atau pohon
                  patah yang mengganggu ruang publik.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-100 font-mono text-[11px] text-slate-500">
                Contoh: TPS meluap, sampah liar
              </div>
            </div>

            {/* Category 3 */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-2xs flex flex-col justify-between space-y-4 hover:border-blue-900/50 transition-colors">
              <div className="space-y-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-900">
                  <Droplets className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Drainase & Banjir</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Saluran drainase mampet, sedimentasi lumpur parit lingkungan, serta titik genangan air
                  hujan yang tidak lekas surut.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-100 font-mono text-[11px] text-slate-500">
                Contoh: Parit mampet, genangan air
              </div>
            </div>

            {/* Category 4 */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-2xs flex flex-col justify-between space-y-4 hover:border-amber-600/50 transition-colors">
              <div className="space-y-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                  <Lightbulb className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Penerangan Jalan (PJU)</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Lampu penerangan jalan umum mati di malam hari, kabel menjuntai, atau tiang listrik
                  miring yang membahayakan warga.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-100 font-mono text-[11px] text-slate-500">
                Contoh: Lampu PJU padam, tiang miring
              </div>
            </div>
          </div>
        </section>

        {/* 3. CARA KERJA SECTION — EDITORIAL PANEL */}
        <section id="cara-kerja" className="editorial-panel p-6 sm:p-10 lg:p-12 space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              4 Tahap Alur LAPORKITO
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Step 1 */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-5 shadow-2xs flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-700 font-mono text-xs font-bold text-white">
                    01
                  </span>
                  <FileText className="h-4 w-4 text-slate-400" aria-hidden="true" />
                </div>
                <h3 className="text-base font-semibold text-slate-900">
                  Ceritakan Kondisi Lapangan
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Tuliskan masalah dengan kalimat bebas sehari-hari. Sertakan foto bukti dan alamat
                  atau patokan lokasi di wilayah Palembang.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-200/80 font-mono text-[11px] text-slate-500">
                Input: Teks, Foto & Lokasi
              </div>
            </div>

            {/* Step 2 */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-5 shadow-2xs flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-600 font-mono text-xs font-bold text-white">
                    02
                  </span>
                  <Sparkles className="h-4 w-4 text-amber-500" aria-hidden="true" />
                </div>
                <h3 className="text-base font-semibold text-slate-900">
                  Analisis Pendamping oleh AI
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Sistem AI membantu menyusun klasifikasi kategori masalah, tingkat urgensi, serta
                  memeriksa kecukupan berkas pendukung.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-200/80 font-mono text-[11px] text-slate-500">
                Proses: Gemini AI Triage
              </div>
            </div>

            {/* Step 3 */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-5 shadow-2xs flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-900 font-mono text-xs font-bold text-white">
                    03
                  </span>
                  <Building2 className="h-4 w-4 text-blue-800" aria-hidden="true" />
                </div>
                <h3 className="text-base font-semibold text-slate-900">
                  Rekomendasi Instansi Terkait
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Sistem mencocokkan permasalahan dengan instansi atau OPD yang berwenang di Kota
                  Palembang agar sasaran pengaduan tepat.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-200/80 font-mono text-[11px] text-slate-500">
                Hasil: Rekomendasi Instansi
              </div>
            </div>

            {/* Step 4 */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-5 shadow-2xs flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-700 font-mono text-xs font-bold text-white">
                    04
                  </span>
                  <Eye className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                </div>
                <h3 className="text-base font-semibold text-slate-900">
                  Pantau dengan Kode Lacak
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Dapatkan kode unik untuk memantau tahapan verifikasi dan tanggapan tindak lanjut
                  secara terbuka tanpa perlu membuat akun.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-200/80 font-mono text-[11px] text-slate-500">
                Output: Kode Lacak LPK-XXXX
              </div>
            </div>
          </div>
        </section>

        {/* 4. AI EXPLANATION SECTION — EDITORIAL PANEL */}
        <section className="editorial-panel p-6 sm:p-10 lg:p-12 space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-6 space-y-4">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Bukan Chatbot Percakapan, Melainkan Pendamping Analitis
              </h2>
              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-mono text-xs font-bold">
                    ✓
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">
                      Penataan Uraian Bahasa Bebas
                    </h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Menerjemahkan bahasa cerita sehari-hari menjadi ringkasan faktual yang terstruktur.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-mono text-xs font-bold">
                    ✓
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">
                      Uji Bukti Lapangan
                    </h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Memeriksa kecocokan foto dengan klaim kejadian serta mendeteksi ketidaksesuaian berkas.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-mono text-xs font-bold">
                    ✓
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">
                      Rekomendasi Instansi Berdasarkan Aturan
                    </h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Memadankan kata kunci kejadian dengan katalog aturan kewenangan instansi resmi di basis data.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4 shadow-2xs">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-200 font-mono text-xs text-blue-700 font-semibold">
                  <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                  <span>PRINSIP TATA KELOLA AI LAPORKITO</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  <strong>AI memberi saran, manusia memegang kendali:</strong> Warga memiliki wewenang
                  penuh untuk meninjau, mengoreksi, atau mengubah hasil analisis sebelum laporan
                  disimpan. Setiap instansi rekomendasi dicocokkan dengan basis data kewenangan resmi.
                </p>
                {/* <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-xs font-mono text-slate-500 space-y-1.5">
                  <div className="flex justify-between">
                    <span>Validasi Skema:</span>
                    <span className="text-emerald-700 font-semibold">Ketat melalui Zod</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sumber Kewenangan:</span>
                    <span className="text-blue-900 font-semibold">Katalog Master Database</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Akses Publik:</span>
                    <span className="text-slate-900 font-semibold">Kode Lacak Tertutup RLS</span>
                  </div>
                </div> */}
              </div>
            </div>
          </div>
        </section>

        {/* 5. FAQ SECTION — EDITORIAL PANEL */}
        <section id="faq" className="editorial-panel p-6 sm:p-10 lg:p-12 space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Pertanyaan yang Sering Ditanyakan
            </h2>
          </div>

          <div className="space-y-4 max-w-4xl mx-auto">
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-5">
              <h3 className="text-sm font-semibold text-slate-900">
                Apakah saya harus membuat akun untuk melapor?
              </h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Tidak. Warga Kota Palembang dapat menyampaikan laporan langsung tanpa registrasi akun.
                Setelah mengirimkan laporan, Anda akan menerima Kode Lacak unik (contoh: LPK-20261002-XXXX)
                yang digunakan untuk melihat status kapan saja.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-5">
              <h3 className="text-sm font-semibold text-slate-900">
                Apa peran kecerdasan buatan (AI) di LAPORKITO?
              </h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                AI bertindak sebagai asisten pra-pelaporan: menyaring informasi penting dari bahasa sehari-hari,
                menentukan klasifikasi masalah, menguji kesesuaian foto lampiran, dan menyarankan dinas/OPD
                yang berwenang menangani masalah tersebut.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-5">
              <h3 className="text-sm font-semibold text-slate-900">
                Apakah data kontak pribadi saya aman dan dirahasiakan?
              </h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Ya. Nomor telepon dan alamat email hanya digunakan untuk keperluan pengiriman notifikasi
                pembaruan status dan verifikasi lapangan oleh petugas resmi. Informasi kontak tidak pernah
                ditampilkan pada halaman pemantauan publik.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-5">
              <h3 className="text-sm font-semibold text-slate-900">
                Bagaimana jika kode lacak saya hilang?
              </h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Jika Anda memasukkan alamat email saat melapor, rincian kode lacak dan tautan pemantauan
                telah dikirimkan otomatis ke kotak masuk email Anda.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-5">
              <h3 className="text-sm font-semibold text-slate-900">
                Apakah laporan pasti langsung diselesaikan oleh dinas?
              </h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                LAPORKITO berfungsi menyusun dan memvalidasi berkas pengaduan agar lengkap dan tepat sasaran.
                Penanganan di lapangan bergantung pada verifikasi berkas, ketersediaan anggaran, dan jadwal
                kerja teknis dari masing-masing instansi pelaksana.
              </p>
            </div>
          </div>

          {/* Final CTA Card */}
          <div className="rounded-xl border border-blue-600/30 bg-blue-700 p-8 text-center text-white space-y-4 max-w-4xl mx-auto shadow-sm">
            <h3 className="text-xl font-bold">Siap Menyampaikan Pengaduan?</h3>
            <div>
              <Link
                href="/lapor"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-white px-6 text-xs sm:text-sm font-semibold text-blue-700 shadow-sm hover:bg-blue-50 transition-colors"
              >
                <span>Mulai Buat Laporan</span>
              </Link>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
