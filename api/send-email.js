/**
 * Supabase Send Email Hook.
 *
 * Supabase hanya memberi waktu 5 detik untuk hook, sedangkan SMTP Office 365
 * butuh ~10 detik per email. Karena itu fungsi ini langsung membalas 200 dan
 * mengirim email di latar belakang lewat waitUntil.
 *
 * Variabel lingkungan (Vercel → Settings → Environment Variables):
 *   SEND_EMAIL_HOOK_SECRET  rahasia hook dari Supabase, format "v1,whsec_..."
 *   SMTP_USER / SMTP_PASS   akun pengirim, mis. akun @binus.ac.id
 *   SMTP_HOST / SMTP_PORT   opsional, bawaan smtp.office365.com:587
 *   SMTP_FROM_NAME          opsional, bawaan "SiMonLomba"
 */
import { waitUntil } from '@vercel/functions'
import nodemailer from 'nodemailer'
import { verifikasiTandaTangan, susunEmail } from './_lib/emailHook.js'

let transporter

const smtpUser = () => (process.env.SMTP_USER ?? '').trim()

function ambilTransporter() {
  transporter ??= nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.office365.com',
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT || 587) === 465,
    requireTLS: true,
    auth: { user: smtpUser(), pass: process.env.SMTP_PASS },
    connectionTimeout: 20_000,
    greetingTimeout: 20_000,
    socketTimeout: 40_000,
  })
  return transporter
}

async function kirim(email) {
  const mulai = Date.now()
  try {
    const info = await ambilTransporter().sendMail({
      from: { name: process.env.SMTP_FROM_NAME || 'SiMonLomba', address: smtpUser() },
      to: email.ke,
      subject: email.subjek,
      html: email.html,
      text: email.teks,
    })
    console.log(`[send-email] terkirim ke ${email.ke} dalam ${Date.now() - mulai} ms`, info.response)
  } catch (err) {
    console.error(`[send-email] GAGAL ke ${email.ke} setelah ${Date.now() - mulai} ms:`, err.message)
    if (err.responseCode === 535) {
      // Membantu melacak salah ketik tanpa mencatat isi kata sandi.
      const pass = process.env.SMTP_PASS ?? ''
      console.error(
        `[send-email] cek kredensial: user="${smtpUser()}" panjangSandi=${pass.length}` +
          ` spasiDiTepi=${pass !== pass.trim()} adaTandaKutip=${/^["']|["']$/.test(pass)}`,
      )
    }
  }
}

const json = (data, status = 200) => Response.json(data, { status })

export default {
  async fetch(request) {
    if (request.method !== 'POST') return json({ ok: true, info: 'Supabase Send Email Hook' })

    const body = await request.text()
    const sah = verifikasiTandaTangan({
      rahasia: process.env.SEND_EMAIL_HOOK_SECRET,
      body,
      headers: Object.fromEntries(request.headers),
    })
    if (!sah) {
      return json({ error: { http_code: 401, message: 'Tanda tangan webhook tidak valid.' } }, 401)
    }

    if (!smtpUser() || !process.env.SMTP_PASS) {
      return json({ error: { http_code: 500, message: 'SMTP_USER/SMTP_PASS belum diisi di Vercel.' } }, 500)
    }

    let email
    try {
      email = susunEmail(JSON.parse(body))
    } catch (err) {
      console.error('[send-email] payload tidak bisa diproses:', err.message)
      return json({ error: { http_code: 500, message: 'Payload hook tidak valid.' } }, 500)
    }

    if (email) waitUntil(kirim(email))
    return json({})
  },
}
