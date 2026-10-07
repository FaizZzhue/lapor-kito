import { Resend } from 'resend'

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
