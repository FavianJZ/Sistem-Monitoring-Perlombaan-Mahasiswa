import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, CircleAlert, ExternalLink, Mail, Send } from 'lucide-react'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { DOMAIN_KAMPUS } from '@/auth/validasiRegistrasi'
import { emailTerpakai } from '@/services/userService'
import { apakahSupabaseAktif, kirimPermintaanResetPassword } from '@/lib/supabase'

export default function LupaPassword() {
  const [email, setEmail] = useState('')
  const [memproses, setMemproses] = useState(false)
  const [galat, setGalat] = useState(null)
  const [terkirim, setTerkirim] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setGalat(null)

    const alamat = email.trim().toLowerCase()
    if (!alamat) {
      setGalat('Email wajib diisi.')
      return
    }

    if (!alamat.endsWith(DOMAIN_KAMPUS)) {
      setGalat(`Gunakan email kampus resmi (${DOMAIN_KAMPUS}).`)
      return
    }

    // Daftar akun lokal hanya ada di peramban ini; saat Supabase aktif,
    // pengguna yang mendaftar di perangkat lain tidak boleh ditolak di sini.
    if (!apakahSupabaseAktif() && !emailTerpakai(alamat)) {
      setGalat('Email belum terdaftar di sistem SiMonLomba. Silakan daftar terlebih dahulu.')
      return
    }

    setMemproses(true)
    try {
      await kirimPermintaanResetPassword({ email: alamat })
      setTerkirim(true)
    } catch (e) {
      setGalat(e.message)
    } finally {
      setMemproses(false)
    }
  }

  return (
    <AuthLayout
      judul="Pemulihan Akses Akun SiMonLomba"
      deskripsi="Lupa kata sandi? Masukkan email kampus Anda dan kami akan mengirimkan tautan untuk mengatur ulang kata sandi."
      catatan="Layanan pemulihan kata sandi resmi SiMonLomba."
    >
      <div className="flex items-center gap-2 mb-2">
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-primary-600 transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          Kembali ke halaman Masuk
        </Link>
      </div>

      <h2 className="text-2xl font-bold text-slate-800">Lupa kata sandi</h2>
      <p className="mt-1 text-sm text-slate-600">
        Kami akan mengirimkan instruksi reset kata sandi ke email Anda.
      </p>

      {galat && (
        <div
          role="alert"
          className="mt-5 flex items-start gap-2.5 rounded-md border border-danger-200 bg-danger-50 p-3.5 text-sm text-danger-800"
        >
          <CircleAlert className="mt-px size-4 shrink-0" aria-hidden="true" />
          <span>{galat}</span>
        </div>
      )}

      {terkirim ? (
        <div className="mt-6 rounded-xl border border-success-200 bg-success-50/60 p-5 text-center">
          <div className="mx-auto grid size-12 place-items-center rounded-full bg-success-600 text-white shadow-sm">
            <Mail className="size-6" />
          </div>
          <h3 className="mt-3 text-base font-bold text-slate-800">Periksa Email Outlook Anda</h3>
          <p className="mt-1.5 text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
            Tautan reset kata sandi telah dikirim ke{' '}
            <strong className="text-slate-900">{email}</strong>. Silakan buka pesan masuk di email Outlook kampus Anda (periksa juga folder Spam/Junk), lalu klik tautan di dalamnya untuk mengatur ulang kata sandi.
          </p>

          <div className="mt-5 flex flex-col sm:flex-row gap-2.5 justify-center">
            <a
              href="https://outlook.office.com/mail/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 rounded-md bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 shadow-sm"
            >
              <ExternalLink className="size-4" />
              Buka Outlook Webmail
            </a>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setTerkirim(false)
                setEmail('')
              }}
            >
              Kirim Ulang Email
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
          <Input
            label="Email kampus terdaftar"
            type="email"
            name="email"
            autoComplete="email"
            placeholder={`nama${DOMAIN_KAMPUS}`}
            hint={`Tautan reset akan dikirim ke alamat ${DOMAIN_KAMPUS}.`}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              setGalat(null)
            }}
            required
          />

          <Button
            type="submit"
            size="lg"
            fullWidth
            loading={memproses}
            leadingIcon={Send}
            disabled={!email.trim()}
          >
            Kirim Tautan Reset Sandi
          </Button>

          <p className="text-center text-xs text-slate-500 pt-2">
            Ingat kata sandi Anda?{' '}
            <Link to="/login" className="font-semibold text-primary-700 hover:underline">
              Masuk di sini
            </Link>
          </p>
        </form>
      )}
    </AuthLayout>
  )
}
