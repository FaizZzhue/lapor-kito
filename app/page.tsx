import Link from "next/link";
import {
  ArrowRight,
  ShieldCheck,
  MapPin,
  Sparkles,
  Search,
  CheckCircle2,
  FileText,
  HelpCircle,
  Building2,
  Eye,
  Lock,
} from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col w-full">
      {/* 1. HERO SECTION */}
      <section className="relative w-full border-b border-[#D9DEE7] bg-white px-4 py-16 sm:px-6 md:py-24 lg:px-8 overflow-hidden">
        {/* Subtle Civic Grid */}
        <div className="absolute inset-0 pointer-events-none civic-grid opacity-75" />

        {/* Topographic Contour Background */}
        <svg
          className="absolute -right-24 -top-24 w-[500px] h-[500px] pointer-events-none opacity-[0.04] text-[#1749D2]"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          viewBox="0 0 600 600"
          aria-hidden="true"
        >
          <path d="M 50,300 C 150,150 350,120 550,280 C 620,330 580,500 400,520 C 220,540 100,450 50,300 Z" />
          <path d="M 100,300 C 180,180 340,160 500,290 C 560,340 520,470 380,480 C 240,490 140,420 100,300 Z" />
          <path d="M 160,310 C 220,220 320,200 440,300 C 490,340 460,430 350,440 C 250,450 190,400 160,310 Z" />
        </svg>

        <div className="relative mx-auto max-w-7xl">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
            {/* Left Content */}
            <div className="flex flex-col items-start space-y-6 lg:col-span-7">
              {/* Technical Tag */}
              <div className="inline-flex items-center gap-2 rounded-md border border-[#D9DEE7] bg-[#F0F3FF] px-3 py-1 text-xs font-mono font-medium text-[#1749D2]">
                <span className="h-2 w-2 rounded-full bg-[#1749D2] animate-pulse" />
                <span>KOTA PALEMBANG</span>
              </div>

              {/* Headline */}
              <h1 className="text-3xl font-bold tracking-tight text-[#111C2D] sm:text-5xl sm:leading-[1.15]">
                Laporkan masalah kota dengan{" "}
                <span className="text-[#1749D2]">lebih tepat & terarah.</span>
              </h1>

              {/* Subheading */}
              <p className="max-w-2xl text-base text-[#434654] leading-relaxed sm:text-lg">
                Ceritakan masalah fasilitas publik di sekitar Anda. LAPORKITO membantu merapikan
                uraian laporan, menguji validitas bukti foto, mengidentifikasi instansi berwenang di
                Kota Palembang, dan menyiapkannya untuk penanganan resmi.
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-3 pt-2 w-full sm:w-auto">
                <Link
                  href="/lapor"
                  className="inline-flex h-12 w-full sm:w-auto items-center justify-center gap-2 rounded-lg bg-[#1749D2] px-6 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#0033A7] active:scale-95"
                >
                  <span>Ceritakan Masalah</span>
                  {/* <ArrowRight className="h-4 w-4" /> */}
                </Link>
                {/* <Link
                  href="#cara-kerja"
                  className="inline-flex h-12 w-full sm:w-auto items-center justify-center rounded-lg border border-[#D9DEE7] bg-white px-5 text-sm font-semibold text-[#111C2D] transition-colors hover:bg-[#F0F3FF]"
                >
                  Cara Kerja
                </Link> */}
                <Link
                  href="/pantau"
                  className="inline-flex h-12 w-full sm:w-auto items-center justify-center rounded-lg border border-dashed border-[#D9DEE7] bg-[#F9F9FF] px-5 text-sm font-medium text-[#434654] transition-colors hover:bg-[#F0F3FF] hover:text-[#1749D2]"
                >
                  {/* <Search className="h-4 w-4 mr-2 text-[#667085]" /> */}
                  Pantau Laporan
                </Link>
              </div>

              {/* Verification Badges */}
              <div className="flex flex-wrap items-center gap-6 pt-4 text-xs font-mono text-[#667085] border-t border-[#D9DEE7] w-full">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-[#16845B]" />
                  <span>Tanpa Perlu Akun</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-[#1749D2]" />
                  <span>Cakupan 18 Kecamatan Palembang</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Lock className="h-4 w-4 text-[#E58A1F]" />
                  <span>Data Pribadi Dilindungi</span>
                </div>
              </div>
            </div>

            {/* Right Visual: Civic HUD Cartography Card */}
            <div className="lg:col-span-5 w-full">
              <div className="rounded-xl border border-[#D9DEE7] bg-[#F0F3FF] p-5 shadow-sm space-y-4">
                {/* HUD Header */}
                <div className="flex items-center justify-between pb-3 border-b border-[#D9DEE7] text-xs font-mono text-[#434654]">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[#16845B] animate-pulse" />
                    <span>TITIK KOORDINAT PALEMBANG</span>
                  </div>
                  <span className="rounded bg-white px-2 py-0.5 border border-[#D9DEE7] font-semibold text-[#1749D2]">
                    2.9909° S, 104.7565° E
                  </span>
                </div>

                {/* Simulated Workflow Preview Box */}
                <div className="rounded-lg border border-[#D9DEE7] bg-white p-4 space-y-3.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-semibold uppercase text-[#1749D2] tracking-wider">
                      Simulasi Pra-Pelaporan
                    </span>
                    <span className="rounded bg-[#E6F7EF] text-[#006443] px-2 py-0.5 font-mono text-[10px] font-medium border border-[#78D9AA]/40">
                      SISTEM SIAP
                    </span>
                  </div>

                  <div className="rounded-md bg-[#F9F9FF] border border-[#D9DEE7] p-3 text-xs space-y-2">
                    <div className="flex items-start gap-2">
                      <span className="text-[#667085] font-mono text-[11px] w-24 shrink-0">
                        Masukan Warga:
                      </span>
                      <span className="text-[#111C2D] font-medium">
                        &quot;Aspal ambles di dekat simpang lampu merah, membahayakan pengendara roda dua&quot;
                      </span>
                    </div>
                    <div className="flex items-start gap-2 pt-1 border-t border-[#D9DEE7]/50">
                      <span className="text-[#667085] font-mono text-[11px] w-24 shrink-0">
                        Analisis AI:
                      </span>
                      <span className="text-[#1749D2] font-semibold">
                        Infrastruktur Jalan & Jembatan · Urgensi Tinggi
                      </span>
                    </div>
                    <div className="flex items-start gap-2 pt-1 border-t border-[#D9DEE7]/50">
                      <span className="text-[#667085] font-mono text-[11px] w-24 shrink-0">
                        Rekomendasi:
                      </span>
                      <span className="text-[#111C2D]">
                        Dinas Pekerjaan Umum dan Penataan Ruang (PUPR)
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 text-[11px] font-mono text-[#667085]">
                    <span>Keluaran: Kode Lacak Unik</span>
                    <span className="font-bold text-[#111C2D] bg-[#F0F3FF] px-2 py-0.5 rounded border border-[#D9DEE7]">
                      LPK-YYYYMMDD-XXXX
                    </span>
                  </div>
                </div>

                {/* Transparency Footnote */}
                <div className="flex items-center gap-2 text-xs text-[#667085]">
                  <CheckCircle2 className="h-4 w-4 text-[#16845B] shrink-0" />
                  <span>
                    Membantu memastikan laporan lengkap sebelum dikirim ke instansi terkait.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. CARA KERJA SECTION */}
      <section
        id="cara-kerja"
        className="w-full border-b border-[#D9DEE7] bg-[#F9F9FF] px-4 py-16 sm:px-6 md:py-20 lg:px-8"
      >
        <div className="mx-auto max-w-7xl space-y-12">
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto space-y-3">
            {/* <div className="inline-flex items-center gap-1.5 rounded-md border border-[#D9DEE7] bg-white px-3 py-1 font-mono text-xs font-semibold text-[#1749D2]">
              <span>ALUR 4 TAHAP</span>
            </div> */}
            <h2 className="text-2xl font-bold tracking-tight text-[#111C2D] sm:text-3xl">
              Bagaimana LAPORKITO Membantu Anda
            </h2>
            {/* <p className="text-sm text-[#434654] leading-relaxed">
              Dari cerita sehari-hari menjadi berkas laporan yang terstruktur, jelas, dan siap ditindaklanjuti.
            </p> */}
          </div>

          {/* Steps Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Step 1 */}
            <div className="rounded-xl border border-[#D9DEE7] bg-white p-5 shadow-xs flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1749D2] font-mono text-xs font-bold text-white">
                    01
                  </span>
                  <FileText className="h-4 w-4 text-[#667085]" />
                </div>
                <h3 className="text-base font-semibold text-[#111C2D]">
                  Ceritakan Kondisi Lapangan
                </h3>
                <p className="text-xs text-[#434654] leading-relaxed">
                  Tuliskan masalah dengan kalimat bebas sehari-hari. Sertakan foto bukti dan alamat
                  atau koordinat lokasi kejadian di Palembang.
                </p>
              </div>
              <div className="pt-3 border-t border-[#D9DEE7] font-mono text-[11px] text-[#667085]">
                Input: Teks, Foto & Lokasi
              </div>
            </div>

            {/* Step 2 */}
            <div className="rounded-xl border border-[#D9DEE7] bg-white p-5 shadow-xs flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E58A1F] font-mono text-xs font-bold text-white">
                    02
                  </span>
                  <Sparkles className="h-4 w-4 text-[#E58A1F]" />
                </div>
                <h3 className="text-base font-semibold text-[#111C2D]">
                  Analisis Cerdas oleh AI
                </h3>
                <p className="text-xs text-[#434654] leading-relaxed">
                  Sistem AI menganalisis isi laporan untuk mengidentifikasi kategori masalah, tingkat
                  urgensi, serta memeriksa kecukupan bukti pendukung.
                </p>
              </div>
              <div className="pt-3 border-t border-[#D9DEE7] font-mono text-[11px] text-[#667085]">
                Proses: Gemini AI Triage
              </div>
            </div>

            {/* Step 3 */}
            <div className="rounded-xl border border-[#D9DEE7] bg-white p-5 shadow-xs flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0033A7] font-mono text-xs font-bold text-white">
                    03
                  </span>
                  <Building2 className="h-4 w-4 text-[#0033A7]" />
                </div>
                <h3 className="text-base font-semibold text-[#111C2D]">
                  Rekomendasi Instansi
                </h3>
                <p className="text-xs text-[#434654] leading-relaxed">
                  Sistem mencocokkan permasalahan dengan instansi atau OPD yang berwenang di Kota
                  Palembang, sehingga laporan tidak salah sasaran.
                </p>
              </div>
              <div className="pt-3 border-t border-[#D9DEE7] font-mono text-[11px] text-[#667085]">
                Hasil: Rekomendasi Instansi
              </div>
            </div>

            {/* Step 4 */}
            <div className="rounded-xl border border-[#D9DEE7] bg-white p-5 shadow-xs flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#16845B] font-mono text-xs font-bold text-white">
                    04
                  </span>
                  <Eye className="h-4 w-4 text-[#16845B]" />
                </div>
                <h3 className="text-base font-semibold text-[#111C2D]">
                  Pantau dengan Kode Lacak
                </h3>
                <p className="text-xs text-[#434654] leading-relaxed">
                  Dapatkan kode unik untuk memantau tahapan verifikasi dan tanggapan resmi dari
                  petugas secara terbuka tanpa harus mendaftar akun.
                </p>
              </div>
              <div className="pt-3 border-t border-[#D9DEE7] font-mono text-[11px] text-[#667085]">
                Output: Kode Lacak LPK-XXXX
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. AI EXPLANATION SECTION */}
      <section className="w-full border-b border-[#D9DEE7] bg-white px-4 py-16 sm:px-6 md:py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-6 space-y-4">
              {/* <div className="inline-flex items-center gap-2 rounded-md bg-[#FFF8EF] border border-[#E58A1F]/30 px-3 py-1 font-mono text-xs font-semibold text-[#8C5000]">
                <Sparkles className="h-3.5 w-3.5" />
                <span>KECERDASAN BUATAN BERINTEGRITAS</span>
              </div> */}
              <h2 className="text-2xl font-bold tracking-tight text-[#111C2D] sm:text-3xl">
                Bukan Chatbot Biasa, Melainkan Pendamping Analitis
              </h2>
              <p className="text-sm text-[#434654] leading-relaxed">
                Di LAPORKITO, AI tidak menghasilkan jawaban percakapan sembarangan. Model AI teruji
                menjalankan tugas terstruktur:
              </p>
              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#DFE8FF] text-[#0033A7] font-mono text-xs font-bold">
                    ✓
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-[#111C2D]">
                      Klasifikasi Kategori Berdasarkan Bukti
                    </h4>
                    <p className="text-xs text-[#434654] mt-0.5">
                      Menilai konteks uraian apakah menyangkut jalan, drainase, persampahan, atau penerangan jalan.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#DFE8FF] text-[#0033A7] font-mono text-xs font-bold">
                    ✓
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-[#111C2D]">
                      Verifikasi Kelayakan Berkas Foto
                    </h4>
                    <p className="text-xs text-[#434654] mt-0.5">
                      Memastikan foto yang diunggah relevan dengan uraian masalah sebelum diteruskan.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#DFE8FF] text-[#0033A7] font-mono text-xs font-bold">
                    ✓
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-[#111C2D]">
                      Deteksi Potensi Aduan Serupa
                    </h4>
                    <p className="text-xs text-[#434654] mt-0.5">
                      Menemukan laporan di sekitar lokasi kejadian untuk menghindari duplikasi berkas.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="rounded-xl border border-[#D9DEE7] bg-[#F0F3FF] p-6 space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-[#D9DEE7] font-mono text-xs text-[#1749D2] font-semibold">
                  <ShieldCheck className="h-4 w-4" />
                  <span>PRINSIP TATA KELOLA AI LAPORKITO</span>
                </div>
                <p className="text-xs text-[#434654] leading-relaxed">
                  <strong>AI memberi saran, manusia memegang kendali:</strong> Warga memiliki wewenang
                  penuh untuk meninjau, mengoreksi, atau menyetujui hasil analisis sebelum laporan
                  disimpan. Setiap instansi rekomendasi diverifikasi oleh basis data kewenangan resmi,
                  bukan karangan model AI.
                </p>
                <div className="rounded-lg bg-white border border-[#D9DEE7] p-3 text-xs font-mono text-[#667085] space-y-1.5">
                  <div className="flex justify-between">
                    <span>Validasi Skema:</span>
                    <span className="text-[#16845B] font-semibold">Ketat melalui Zod</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sumber Kewenangan:</span>
                    <span className="text-[#0033A7] font-semibold">Katalog Master Database</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Akses Publik:</span>
                    <span className="text-[#111C2D] font-semibold">Kode Lacak Tertutup RLS</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. TRACKING LOOKUP CALLOUT SECTION */}
      <section className="w-full border-b border-[#D9DEE7] bg-[#F0F3FF] px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center space-y-5">
          <h2 className="text-2xl font-bold tracking-tight text-[#111C2D]">
            Sudah Pernah Mengirim Laporan?
          </h2>
          <p className="text-sm text-[#434654] max-w-xl mx-auto">
            Masukkan kode lacak yang Anda terima saat mengirimkan laporan untuk melihat progres
            penanganan dan tanggapan instansi terkait.
          </p>
          <div className="pt-2">
            <Link
              href="/pantau"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#1749D2] px-6 text-sm font-semibold text-white shadow-sm hover:bg-[#0033A7] transition-colors"
            >
              {/* <Search className="h-4 w-4" /> */}
              <span>Buka Halaman Pantau Laporan</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 5. FAQ SECTION */}
      <section id="faq" className="w-full bg-white px-4 py-16 sm:px-6 md:py-20 lg:px-8">
        <div className="mx-auto max-w-4xl space-y-8">
          <div className="text-center space-y-2">
            {/* <div className="inline-flex items-center gap-1 rounded bg-[#F0F3FF] border border-[#D9DEE7] px-2.5 py-1 font-mono text-xs font-semibold text-[#1749D2]">
              <HelpCircle className="h-3.5 w-3.5" />
              <span>PERTANYAAN UMUM</span>
            </div> */}
            <h2 className="text-2xl font-bold tracking-tight text-[#111C2D]">
              Frequently Asked Questions (FAQ)
            </h2>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-[#D9DEE7] bg-[#F9F9FF] p-5">
              <h3 className="text-sm font-semibold text-[#111C2D]">
                Apakah saya harus membuat akun untuk melapor?
              </h3>
              <p className="text-xs text-[#434654] mt-2 leading-relaxed">
                Tidak. Warga Kota Palembang dapat menyampaikan laporan langsung tanpa registrasi akun.
                Setelah mengirimkan laporan, Anda akan menerima Kode Lacak unik (contoh: LPK-20261002-XXXX)
                yang digunakan untuk melihat status kapan saja.
              </p>
            </div>

            <div className="rounded-xl border border-[#D9DEE7] bg-[#F9F9FF] p-5">
              <h3 className="text-sm font-semibold text-[#111C2D]">
                Apa peran kecerdasan buatan (AI) di LAPORKITO?
              </h3>
              <p className="text-xs text-[#434654] mt-2 leading-relaxed">
                AI bertindak sebagai asisten pra-pelaporan: menyaring informasi penting dari bahasa sehari-hari,
                menentukan klasifikasi masalah, menguji kesesuaian foto lampiran, dan menyarankan dinas/OPD
                yang berwenang menangani masalah tersebut.
              </p>
            </div>

            <div className="rounded-xl border border-[#D9DEE7] bg-[#F9F9FF] p-5">
              <h3 className="text-sm font-semibold text-[#111C2D]">
                Apakah data kontak pribadi saya aman dan dirahasiakan?
              </h3>
              <p className="text-xs text-[#434654] mt-2 leading-relaxed">
                Ya. Nomor telepon dan alamat email hanya digunakan untuk keperluan pengiriman notifikasi
                pembaruan status dan verifikasi lapangan oleh petugas resmi. Informasi kontak tidak pernah
                ditampilkan pada halaman pemantauan publik.
              </p>
            </div>

            <div className="rounded-xl border border-[#D9DEE7] bg-[#F9F9FF] p-5">
              <h3 className="text-sm font-semibold text-[#111C2D]">
                Bagaimana jika kode lacak saya hilang?
              </h3>
              <p className="text-xs text-[#434654] mt-2 leading-relaxed">
                Jika Anda memasukkan alamat email saat melapor, rincian kode lacak dan tautan pemantauan
                telah dikirimkan otomatis ke kotak masuk email Anda.
              </p>
            </div>
          </div>

          {/* Final CTA */}
          <div className="rounded-xl border border-[#D9DEE7] bg-[#1749D2] p-8 text-center text-white space-y-4">
            <h3 className="text-xl font-bold">Siap Menyampaikan Pengaduan?</h3>
            <p className="text-xs text-white/80 max-w-lg mx-auto leading-relaxed">
              Bantu wujudkan fasilitas kota yang lebih baik dan terpelihara. Setiap laporan Anda tercatat
              dan dapat dipantau secara transparan.
            </p>
            <div>
              <Link
                href="/lapor"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-white px-6 text-sm font-semibold text-[#1749D2] shadow-sm hover:bg-[#F0F3FF] transition-colors"
              >
                <span>Mulai Buat Laporan</span>
                {/* <ArrowRight className="h-4 w-4" /> */}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
