/**
 * Mengunggah template email & setelan OTP ke proyek Supabase HOSTED
 * lewat Management API, supaya email verifikasi berisi KODE, bukan tautan.
 *
 * Pemakaian (PowerShell):
 *   $env:SUPABASE_ACCESS_TOKEN = "sbp_..."   # dari https://supabase.com/dashboard/account/tokens
 *   $env:SITE_URL = "https://domain-anda.vercel.app"   # opsional
 *   node supabase/push-auth-templates.mjs
 *
 * Token pribadi ini setara akses penuh ke akun Supabase Anda.
 * Jangan disimpan di file atau di-commit; hapus setelah dipakai bila perlu.
 */
import { readFile } from 'node:fs/promises'
import path from 'node:path'

const PROJECT_REF = process.env.SUPABASE_PROJECT_REF ?? 'rpmqmocvnhhlfcraczrf'
const TOKEN = process.env.SUPABASE_ACCESS_TOKEN
const SITE_URL = process.env.SITE_URL?.replace(/\/+$/, '')

if (!TOKEN) {
  console.error('SUPABASE_ACCESS_TOKEN belum diisi. Buat di https://supabase.com/dashboard/account/tokens')
  process.exit(1)
}

const dir = path.join(import.meta.dirname, 'templates')
const baca = (nama) => readFile(path.join(dir, nama), 'utf8')

const body = {
  // Harus sama dengan input 6 digit di ModalVerifikasiOtp.jsx.
  mailer_otp_length: 6,
  mailer_subjects_confirmation: 'Kode verifikasi akun SiMonLomba',
  mailer_templates_confirmation_content: await baca('confirmation.html'),
  mailer_subjects_magic_link: 'Kode verifikasi SiMonLomba',
  mailer_templates_magic_link_content: await baca('magic_link.html'),
  mailer_subjects_recovery: 'Atur ulang kata sandi SiMonLomba',
  mailer_templates_recovery_content: await baca('recovery.html'),
}

if (SITE_URL) {
  body.site_url = SITE_URL
  body.uri_allow_list = `${SITE_URL}/**,http://localhost:5173/**`
}

const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`, {
  method: 'PATCH',
  headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
})

if (!res.ok) {
  console.error(`Gagal (${res.status}):`, await res.text())
  process.exit(1)
}

const hasil = await res.json()
console.log('Berhasil diperbarui untuk proyek', PROJECT_REF)
console.log('  OTP length :', hasil.mailer_otp_length)
console.log('  Site URL   :', hasil.site_url)
console.log('  Template konfirmasi memuat {{ .Token }}:',
  String(hasil.mailer_templates_confirmation_content).includes('{{ .Token }}'))
