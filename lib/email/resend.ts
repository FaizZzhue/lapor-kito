import { Resend } from 'resend'
import type { ReportStatus } from '@/types/database'

const resendApiKey = process.env.RESEND_API_KEY
const fromEmail = process.env.RESEND_FROM_EMAIL || 'LAPORKITO <onboarding@resend.dev>'

export const resend = resendApiKey ? new Resend(resendApiKey) : null

export interface SendReportSubmittedEmailParams {
  to: string
  reporterName?: string
  trackingCode: string
  reportTitle: string
  categoryName: string
  trackingUrl: string
}

export async function sendReportSubmittedEmail({
  to,
  reporterName = 'Warga Palembang',
  trackingCode,
  reportTitle,
  categoryName,
  trackingUrl,
}: SendReportSubmittedEmailParams) {
  const activeApiKey = process.env.RESEND_API_KEY
  const activeFromEmail = process.env.RESEND_FROM_EMAIL || fromEmail

  if (!activeApiKey) {
    console.warn('Resend API key is not configured. Email notification skipped.')
    return { success: false, reason: 'RESEND_NOT_CONFIGURED' }
  }

  const client = new Resend(activeApiKey)

  try {
    const { data, error } = await client.emails.send({
      from: activeFromEmail,
      to,
      subject: `[LAPORKITO] Pengaduan Diterima — Kode Lacak: ${trackingCode}`,
      text: `Halo ${reporterName},\n\nTerima kasih atas laporan Anda. Pengaduan Anda telah berhasil dicatat ke dalam sistem LAPORKITO dan akan ditinjau oleh tim verifikator.\n\nKode Lacak: ${trackingCode}\nJudul: ${reportTitle}\nKategori: ${categoryName}\n\nPantau status pengaduan Anda melalui tautan berikut:\n${trackingUrl}\n\nSimpan kode lacak ini. Anda dapat menggunakannya kapan saja di situs LAPORKITO untuk melihat perkembangan penanganan aduan Anda.\n\nLAPORKITO — Kanal Pengaduan Warga Kota Palembang`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px;">
          <div style="background-color: #047857; color: white; padding: 16px 20px; border-radius: 6px; text-align: center;">
            <h1 style="margin: 0; font-size: 20px; font-weight: 700;">LAPORKITO</h1>
            <p style="margin: 4px 0 0; font-size: 13px; opacity: 0.9;">Kanal Pengaduan Warga Kota Palembang</p>
          </div>

          <div style="padding: 20px 0;">
            <p style="font-size: 15px; line-height: 1.5;">Halo <strong>${reporterName}</strong>,</p>
            <p style="font-size: 14px; line-height: 1.6; color: #475569;">
              Terima kasih atas laporan Anda. Pengaduan Anda telah berhasil dicatat ke dalam sistem dan akan ditinjau oleh tim verifikator.
            </p>

            <div style="background-color: #f8fafc; border-left: 4px solid #047857; padding: 14px; margin: 18px 0; border-radius: 4px;">
              <p style="margin: 0 0 6px; font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: 600;">Kode Lacak Laporan</p>
              <p style="margin: 0; font-size: 20px; font-weight: 700; color: #047857; letter-spacing: 1px;">${trackingCode}</p>
              <div style="margin-top: 10px; font-size: 13px; color: #334155;">
                <p style="margin: 4px 0;"><strong>Judul:</strong> ${reportTitle}</p>
                <p style="margin: 4px 0;"><strong>Kategori:</strong> ${categoryName}</p>
              </div>
            </div>

            <div style="text-align: center; margin: 24px 0;">
              <a href="${trackingUrl}" style="background-color: #047857; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; display: inline-block;">
                Pantau Status Pengaduan
              </a>
            </div>

            <p style="font-size: 12px; color: #94a3b8; line-height: 1.5;">
              Simpan kode lacak ini. Anda dapat menggunakannya kapan saja di situs LAPORKITO untuk melihat perkembangan penanganan aduan Anda.
            </p>
          </div>

          <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 11px; color: #94a3b8; text-align: center;">
            <p style="margin: 0;">LAPORKITO — Platform Pra-Pelaporan Pengaduan Warga Kota Palembang</p>
          </div>
        </div>
      `,
    })

    if (error) {
      console.error('Error sending email via Resend:', error)
      return { success: false, error }
    }

    return { success: true, data }
  } catch (err) {
    console.error('Unexpected error sending email:', err)
    return { success: false, error: err }
  }
}

export interface SendOfficialResponseEmailParams {
  to: string
  reporterName?: string
  trackingCode: string
  reportTitle: string
  responseMessage: string
  trackingUrl: string
}

export async function sendOfficialResponseEmail({
  to,
  reporterName = 'Warga Palembang',
  trackingCode,
  reportTitle,
  responseMessage,
  trackingUrl,
}: SendOfficialResponseEmailParams) {
  const activeApiKey = process.env.RESEND_API_KEY
  const activeFromEmail = process.env.RESEND_FROM_EMAIL || fromEmail

  if (!activeApiKey) {
    console.warn('Resend API key is not configured. Email notification skipped.')
    return { success: false, reason: 'RESEND_NOT_CONFIGURED' }
  }

  const client = new Resend(activeApiKey)

  // Safe excerpt for email preview (first 300 chars)
  const safeExcerpt =
    responseMessage.length > 300
      ? responseMessage.slice(0, 300) + '...'
      : responseMessage

  try {
    const { data, error } = await client.emails.send({
      from: activeFromEmail,
      to,
      subject: `[LAPORKITO] Tanggapan Resmi — Laporan #${trackingCode}`,
      text: `Halo ${reporterName},\n\nPetugas telah memberikan tanggapan resmi terkait pengaduan Anda.\n\nKode Lacak: ${trackingCode}\nJudul: ${reportTitle}\n\nTanggapan Resmi:\n"${safeExcerpt}"\n\nUntuk membaca tanggapan lengkap dan memberikan balasan, silakan kunjungi:\n${trackingUrl}\n\nLAPORKITO — Kanal Pengaduan Warga Kota Palembang`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px;">
          <div style="background-color: #0033A7; color: white; padding: 16px 20px; border-radius: 6px; text-align: center;">
            <h1 style="margin: 0; font-size: 20px; font-weight: 700;">LAPORKITO</h1>
            <p style="margin: 4px 0 0; font-size: 13px; opacity: 0.9;">Pemberitahuan Tanggapan Resmi</p>
          </div>

          <div style="padding: 20px 0;">
            <p style="font-size: 15px; line-height: 1.5;">Halo <strong>${reporterName}</strong>,</p>
            <p style="font-size: 14px; line-height: 1.6; color: #475569;">
              Petugas kedinasan telah memberikan tanggapan resmi terkait pengaduan Anda pada sistem LAPORKITO.
            </p>

            <div style="background-color: #f8fafc; border-left: 4px solid #0033A7; padding: 14px; margin: 18px 0; border-radius: 4px;">
              <p style="margin: 0 0 6px; font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: 600;">Kode Lacak Laporan</p>
              <p style="margin: 0; font-size: 20px; font-weight: 700; color: #0033A7; letter-spacing: 1px;">${trackingCode}</p>
              <p style="margin: 6px 0 0; font-size: 13px; color: #334155;"><strong>Judul Laporan:</strong> ${reportTitle}</p>
            </div>

            <div style="background-color: #F0F3FF; border: 1px solid #C4D3F8; border-radius: 6px; padding: 16px; margin: 18px 0;">
              <p style="margin: 0 0 8px; font-size: 12px; color: #0033A7; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Isi Tanggapan Resmi Petugas:</p>
              <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #111C2D; white-space: pre-line;">&ldquo;${safeExcerpt}&rdquo;</p>
            </div>

            <div style="text-align: center; margin: 24px 0;">
              <a href="${trackingUrl}" style="background-color: #0033A7; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; display: inline-block;">
                Buka & Balas Tanggapan
              </a>
            </div>

            <p style="font-size: 12px; color: #94a3b8; line-height: 1.5;">
              Anda dapat memberikan tanggapan balik atau klarifikasi lanjutan secara langsung melalui tautan pantau di atas.
            </p>
          </div>

          <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 11px; color: #94a3b8; text-align: center;">
            <p style="margin: 0;">LAPORKITO — Platform Pra-Pelaporan Pengaduan Warga Kota Palembang</p>
          </div>
        </div>
      `,
    })

    if (error) {
      console.error('Error sending official response email via Resend:', error)
      return { success: false, error }
    }

    return { success: true, data }
  } catch (err) {
    console.error('Unexpected error sending official response email:', err)
    return { success: false, error: err }
  }
}

export interface SendStatusChangeEmailParams {
  to: string
  reporterName?: string
  trackingCode: string
  reportTitle: string
  newStatus: ReportStatus
  statusLabel: string
  statusDescription: string
  notes?: string
  trackingUrl: string
}

const STATUS_COLOR_CONFIG: Record<
  string,
  { bg: string; text: string; border: string; banner: string }
> = {
  verifying: { bg: '#FEF3C7', text: '#92400E', border: '#FDE68A', banner: '#D97706' },
  verified: { bg: '#E0F2FE', text: '#0369A1', border: '#BAE6FD', banner: '#0284C7' },
  in_progress: { bg: '#DBEAFE', text: '#1D4ED8', border: '#BFDBFE', banner: '#2563EB' },
  resolved: { bg: '#D1FAE5', text: '#065F46', border: '#A7F3D0', banner: '#059669' },
  rejected: { bg: '#FEE2E2', text: '#991B1B', border: '#FECACA', banner: '#DC2626' },
  duplicate: { bg: '#F1F5F9', text: '#334155', border: '#E2E8F0', banner: '#64748B' },
  submitted: { bg: '#E0E7FF', text: '#3730A3', border: '#C7D2FE', banner: '#4F46E5' },
}

export async function sendStatusChangeEmail({
  to,
  reporterName = 'Warga Palembang',
  trackingCode,
  reportTitle,
  newStatus,
  statusLabel,
  statusDescription,
  notes,
  trackingUrl,
}: SendStatusChangeEmailParams) {
  const activeApiKey = process.env.RESEND_API_KEY
  const activeFromEmail = process.env.RESEND_FROM_EMAIL || fromEmail

  if (!activeApiKey) {
    console.warn('Resend API key is not configured. Status change notification skipped.')
    return { success: false, reason: 'RESEND_NOT_CONFIGURED' }
  }

  const client = new Resend(activeApiKey)
  const colors = STATUS_COLOR_CONFIG[newStatus] || {
    bg: '#F1F5F9',
    text: '#1E293B',
    border: '#CBD5E1',
    banner: '#0033A7',
  }

  const notesHtml = notes
    ? `
      <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 6px; padding: 14px; margin: 16px 0;">
        <p style="margin: 0 0 6px; font-size: 12px; color: #64748B; font-weight: 700; text-transform: uppercase;">Catatan Petugas:</p>
        <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #1E293B; white-space: pre-line;">${notes}</p>
      </div>
    `
    : ''

  const notesText = notes ? `\n\nCatatan Petugas:\n"${notes}"` : ''

  try {
    const { data, error } = await client.emails.send({
      from: activeFromEmail,
      to,
      subject: `[LAPORKITO] Pembaruan Status Laporan #${trackingCode} — ${statusLabel}`,
      text: `Halo ${reporterName},\n\nStatus pengaduan Anda pada sistem LAPORKITO telah diperbarui.\n\nKode Lacak: ${trackingCode}\nJudul: ${reportTitle}\nStatus Baru: ${statusLabel}\nKeterangan: ${statusDescription}${notesText}\n\nPantau perkembangan pengaduan Anda secara lengkap melalui tautan berikut:\n${trackingUrl}\n\nLAPORKITO — Kanal Pengaduan Warga Kota Palembang`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px;">
          <div style="background-color: ${colors.banner}; color: white; padding: 16px 20px; border-radius: 6px; text-align: center;">
            <h1 style="margin: 0; font-size: 20px; font-weight: 700;">LAPORKITO</h1>
            <p style="margin: 4px 0 0; font-size: 13px; opacity: 0.9;">Pemberitahuan Perkembangan Laporan</p>
          </div>

          <div style="padding: 20px 0;">
            <p style="font-size: 15px; line-height: 1.5;">Halo <strong>${reporterName}</strong>,</p>
            <p style="font-size: 14px; line-height: 1.6; color: #475569;">
              Pengaduan Anda telah mengalami perubahan status operasional dalam sistem penanganan LAPORKITO Kota Palembang.
            </p>

            <div style="background-color: #f8fafc; border-left: 4px solid ${colors.banner}; padding: 14px; margin: 18px 0; border-radius: 4px;">
              <p style="margin: 0 0 4px; font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: 600;">Kode Lacak Laporan</p>
              <p style="margin: 0; font-size: 20px; font-weight: 700; color: #0033A7; letter-spacing: 1px;">${trackingCode}</p>
              <p style="margin: 8px 0 0; font-size: 13px; color: #334155;"><strong>Judul Laporan:</strong> ${reportTitle}</p>
            </div>

            <div style="background-color: ${colors.bg}; border: 1px solid ${colors.border}; border-radius: 6px; padding: 16px; margin: 18px 0;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                <span style="font-size: 12px; font-weight: 700; color: #64748B; text-transform: uppercase;">Status Baru:</span>
                <span style="display: inline-block; padding: 3px 10px; font-size: 12px; font-weight: 700; color: ${colors.text}; background: #ffffff; border: 1px solid ${colors.border}; border-radius: 12px;">
                  ${statusLabel}
                </span>
              </div>
              <p style="margin: 0; font-size: 13px; line-height: 1.6; color: ${colors.text};">
                ${statusDescription}
              </p>
            </div>

            ${notesHtml}

            <div style="text-align: center; margin: 24px 0;">
              <a href="${trackingUrl}" style="background-color: #0033A7; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; display: inline-block;">
                Pantau Detail Pengaduan
              </a>
            </div>

            <p style="font-size: 12px; color: #94a3b8; line-height: 1.5;">
              Anda dapat memantau linimasa lengkap dan memberikan informasi klarifikasi bila dibutuhkan melalui halaman pelacakan di atas.
            </p>
          </div>

          <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 11px; color: #94a3b8; text-align: center;">
            <p style="margin: 0;">LAPORKITO — Platform Pra-Pelaporan Pengaduan Warga Kota Palembang</p>
          </div>
        </div>
      `,
    })

    if (error) {
      console.error('Error sending status change email via Resend:', error)
      return { success: false, error }
    }

    return { success: true, data }
  } catch (err) {
    console.error('Unexpected error sending status change email:', err)
    return { success: false, error: err }
  }
}

export interface SendPasswordResetEmailParams {
  to: string
  fullName?: string
  resetUrl: string
}

export async function sendPasswordResetEmail({
  to,
  fullName = 'Staf Kedinasan',
  resetUrl,
}: SendPasswordResetEmailParams) {
  const activeApiKey = process.env.RESEND_API_KEY
  const activeFromEmail = process.env.RESEND_FROM_EMAIL || fromEmail

  if (!activeApiKey) {
    console.warn('Resend API key is not configured. Password reset email skipped.')
    return { success: false, reason: 'RESEND_NOT_CONFIGURED' }
  }

  const client = new Resend(activeApiKey)

  try {
    const { data, error } = await client.emails.send({
      from: activeFromEmail,
      to,
      subject: '[LAPORKITO] Tautan Pengaturan Ulang Kata Sandi Akun Petugas',
      text: `Halo ${fullName},\n\nPermintaan pengaturan ulang kata sandi telah diterima untuk akun dinas Anda pada sistem LAPORKITO.\n\nSilakan klik tautan berikut untuk membuat kata sandi baru:\n${resetUrl}\n\nTautan ini hanya berlaku untuk waktu terbatas. Jika Anda tidak merasa meminta pengaturan ulang ini, segera hubungi Administrator TI Pemkot Palembang.\n\nLAPORKITO — Portal Operasional Staf Kota Palembang`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px;">
          <div style="background-color: #1749D2; color: white; padding: 16px 20px; border-radius: 6px; text-align: center;">
            <h1 style="margin: 0; font-size: 20px; font-weight: 700;">LAPORKITO</h1>
            <p style="margin: 4px 0 0; font-size: 13px; opacity: 0.9;">Pengaturan Ulang Kata Sandi Petugas</p>
          </div>

          <div style="padding: 20px 0;">
            <p style="font-size: 15px; line-height: 1.5;">Halo <strong>${fullName}</strong>,</p>
            <p style="font-size: 14px; line-height: 1.6; color: #475569;">
              Permintaan pengaturan ulang kata sandi telah diterima untuk akun dinas Anda pada sistem operasional LAPORKITO Kota Palembang.
            </p>

            <div style="text-align: center; margin: 26px 0;">
              <a href="${resetUrl}" style="background-color: #1749D2; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; display: inline-block;">
                Atur Ulang Kata Sandi
              </a>
            </div>

            <p style="font-size: 13px; color: #64748b; line-height: 1.5;">
              Jika tombol di atas tidak dapat diklik, salin dan buka tautan berikut di peramban Anda:
            </p>
            <p style="font-size: 12px; color: #1749D2; word-break: break-all; background-color: #f1f5f9; padding: 10px; border-radius: 4px;">
              ${resetUrl}
            </p>

            <p style="font-size: 12px; color: #94a3b8; line-height: 1.5; margin-top: 20px;">
              Tautan ini hanya berlaku untuk waktu terbatas demi alasan keamanan. Jika Anda tidak merasa melakukan permintaan ini, segera abaikan surel ini dan hubungi Administrator TI.
            </p>
          </div>

          <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 11px; color: #94a3b8; text-align: center;">
            <p style="margin: 0;">LAPORKITO — Platform Manajemen Laporan Sipil Terpadu Kota Palembang</p>
          </div>
        </div>
      `,
    })

    if (error) {
      console.error('Error sending password reset email via Resend:', error)
      return { success: false, error }
    }

    return { success: true, data }
  } catch (err) {
    console.error('Unexpected error sending password reset email:', err)
    return { success: false, error: err }
  }
}

