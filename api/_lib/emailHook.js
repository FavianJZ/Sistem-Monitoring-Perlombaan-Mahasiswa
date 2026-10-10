/**
 * Utilitas Send Email Hook Supabase: verifikasi tanda tangan (Standard Webhooks)
 * dan penyusunan email dari template di supabase/templates.
 */
import { createHmac, timingSafeEqual } from 'node:crypto'
import { readFileSync } from 'node:fs'
import path from 'node:path'

const TOLERANSI_DETIK = 5 * 60

/**
 * Memverifikasi header webhook-id, webhook-timestamp, webhook-signature.
 * `rahasia` berformat "v1,whsec_<base64>" seperti yang diberikan dashboard Supabase.
 */
export function verifikasiTandaTangan({ rahasia, body, headers, sekarang = Date.now() }) {
  const id = headers['webhook-id']
  const timestamp = headers['webhook-timestamp']
  const tandaTangan = headers['webhook-signature']
  if (!rahasia || !id || !timestamp || !tandaTangan) return false

  const detik = Number(timestamp)
  if (!Number.isFinite(detik) || Math.abs(sekarang / 1000 - detik) > TOLERANSI_DETIK) return false

  const kunci = Buffer.from(rahasia.replace(/^v1,/, '').replace(/^whsec_/, ''), 'base64')
  const harapan = createHmac('sha256', kunci).update(`${id}.${timestamp}.${body}`).digest()

  return tandaTangan.split(' ').some((bagian) => {
    const [versi, nilai] = bagian.split(',')
    if (versi !== 'v1' || !nilai) return false
    const diterima = Buffer.from(nilai, 'base64')
    return diterima.length === harapan.length && timingSafeEqual(diterima, harapan)
  })
}

const DIR_TEMPLATE = path.join(process.cwd(), 'supabase', 'templates')

const PETA_TEMPLATE = {
  signup: { berkas: 'confirmation.html', subjek: 'Kode pendaftaran SiMonLomba' },
  magiclink: { berkas: 'magic_link.html', subjek: 'Kode masuk SiMonLomba' },
  email: { berkas: 'magic_link.html', subjek: 'Kode masuk SiMonLomba' },
  recovery: { berkas: 'recovery.html', subjek: 'Permintaan ganti kata sandi SiMonLomba' },
}

const TEMPLATE_UMUM = `
<div style="font-family: Arial, Helvetica, sans-serif; max-width: 480px; margin: 0 auto; color: #334155;">
  <div style="border-top: 4px solid #0096d6; padding: 24px; background: #ffffff;">
    <p style="margin: 0; font-size: 13px; font-weight: 700; color: #00557f;">
      SiMonLomba &middot; Sistem Monitoring Perlombaan Mahasiswa
    </p>
    <h2 style="margin: 12px 0 8px; font-size: 20px; color: #1e293b;">Kode verifikasi SiMonLomba</h2>
    <p style="margin: 0 0 16px; font-size: 14px; line-height: 1.6;">
      Halo, ketik kode berikut di halaman SiMonLomba yang masih terbuka untuk akun <strong>{{ .Email }}</strong>:
    </p>
    <p style="margin: 0 0 16px; padding: 16px; text-align: center; font-size: 30px; font-weight: 700;
              letter-spacing: 6px; font-family: 'Courier New', monospace; background: #eaf6fc;
              color: #00557f; border-radius: 6px;">
      {{ .Token }}
    </p>
    <p style="margin: 0; font-size: 12px; color: #64748b; line-height: 1.6;">
      Kode berlaku 1 jam. Bukan Anda yang meminta? Abaikan saja email ini.
    </p>
  </div>
</div>`

const SUBJEK_UMUM = {
  invite: 'Undangan bergabung di SiMonLomba',
  email_change: 'Kode konfirmasi email baru SiMonLomba',
  reauthentication: 'Kode konfirmasi SiMonLomba',
}

const cacheTemplate = new Map()

function bacaTemplate(berkas) {
  if (!cacheTemplate.has(berkas)) {
    const isi = readFileSync(path.join(DIR_TEMPLATE, berkas), 'utf8')
    // Komentar HTML di template berisi catatan internal; tidak ikut dikirim.
    cacheTemplate.set(berkas, isi.replace(/<!--[\s\S]*?-->/g, '').trim())
  }
  return cacheTemplate.get(berkas)
}

const escapeHtml = (teks) =>
  String(teks ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])

function isiVariabel(template, nilai) {
  return template.replace(/\{\{\s*\.(\w+)\s*\}\}/g, (cocok, nama) =>
    nama in nilai ? escapeHtml(nilai[nama]) : cocok,
  )
}

function keTeksBiasa(html) {
  return html
    .replace(/\s+/g, ' ')
    .replace(/<a [^>]*href="([^"]+)"[^>]*>\s*([\s\S]*?)\s*<\/a>/gi, '$2: $1')
    .replace(/<\/(p|h2|div)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&middot;/g, '·')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .split('\n')
    .map((baris) => baris.trim().replace(/\s+/g, ' '))
    .filter(Boolean)
    .join('\n\n')
}

/**
 * Mengubah payload hook menjadi { ke, subjek, html, teks }.
 * Mengembalikan null untuk jenis email yang tidak perlu dikirim (notifikasi keamanan).
 */
export function susunEmail({ user, email_data: data }, { siteUrlCadangan } = {}) {
  const jenis = data?.email_action_type
  if (!jenis || jenis.endsWith('_notification')) return null

  const ke = jenis === 'email_change' && user?.new_email ? user.new_email : user?.email
  if (!ke) return null

  const pilihan = PETA_TEMPLATE[jenis]
  const template = pilihan ? bacaTemplate(pilihan.berkas) : TEMPLATE_UMUM
  const subjek = pilihan?.subjek ?? SUBJEK_UMUM[jenis] ?? 'Kode verifikasi SiMonLomba'

  const html = isiVariabel(template, {
    Email: ke,
    Token: jenis === 'email_change' && data.token_new ? data.token_new : data.token,
    TokenHash: data.token_hash,
    SiteURL: String(data.site_url || siteUrlCadangan || '').replace(/\/+$/, ''),
    RedirectTo: data.redirect_to,
  })

  return { ke, subjek, html, teks: keTeksBiasa(html) }
}
