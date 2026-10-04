import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LAPORKITO — Kanal Pengaduan Warga Kota Palembang",
  description:
    "Sampaikan laporan permasalahan infrastruktur dan layanan publik di Kota Palembang secara cepat, transparan, dan terverifikasi AI.",
  keywords: [
    "LAPORKITO",
    "Palembang",
    "Pengaduan Palembang",
    "Lapor Palembang",
    "Jalan Rusak Palembang",
    "Banjir Palembang",
    "Layanan Publik Palembang",
  ],
  authors: [{ name: "Pemerintah Kota Palembang" }],
};

import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={cn(
        "h-full antialiased",
        geistSans.variable,
        geistMono.variable,
        inter.variable,
        "font-sans"
      )}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Navbar />
        <main className="flex-1 w-full">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
