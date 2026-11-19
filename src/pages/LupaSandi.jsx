import { useEffect, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, CircleAlert, KeyRound, Mail, MailCheck, RotateCw } from 'lucide-react'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'
import { useAuth } from '@/auth/AuthContext'
import { berandaRole } from '@/auth/sesi'
import { kekuatanSandi } from '@/auth/validasiRegistrasi'
import { JEDA_KIRIM_ULANG } from '@/components/auth/ModalVerifikasiOtp'

const POLA_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validasiSandiBaru({ kode, password, konfirmasi }) {
  const galat = {}
  if (!/^\d{6,8}$/.test(kode)) galat.kode = 'Masukkan kode 6 sampai 8 angka dari email.'
  if (!password) galat.password = 'Kata sandi baru wajib diisi.'
  else if (kekuatanSandi(password).skor < 3) {
    galat.password = 'Minimal 8 karakter, berisi huruf dan angka, serta huruf besar-kecil atau simbol.'
  }
  if (!konfirmasi) galat.konfirmasi = 'Ulangi kata sandi baru.'
  else if (konfirmasi !== password) galat.konfirmasi = 'Konfirmasi kata sandi tidak cocok.'
  return galat
}

function KotakGalat({ children }) {
  return (
    <div
      role="alert"
      className="mt-5 flex items-start gap-2.5 rounded-md border border-danger-200 bg-danger-50 p-3.5 text-sm text-danger-800"
    >
      <CircleAlert className="mt-px size-4 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </div>
  )
}

export default function LupaSandi() {
  const { user, modeSupabase, memproses, mintaKodeReset, aturUlangSandi } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const lokasi = useLocation()

  const [langkah, setLangkah] = useState('email')
  const [email, setEmail] = useState(lokasi.state?.email ?? '')
  const [form, setForm] = useState({ kode: '', password: '', konfirmasi: '' })
  const [galat, setGalat] = useState(null)
  const [galatField, setGalatField] = useState({})
  const [mengirim, setMengirim] = useState(false)
  const [sisaDetik, setSisaDetik] = useState(0)
  const [selesai, setSelesai] = useState(false)

  useEffect(() => {
    if (sisaDetik <= 0) return undefined
    const timer = setTimeout(() => setSisaDetik((n) => n - 1), 1000)
    return () => clearTimeout(timer)
  }, [sisaDetik])

  if (user && !selesai) {
    return <Navigate to={berandaRole(user.role)} replace />
  }

  async function kirimKode() {
    setMengirim(true)
    try {
      await mintaKodeReset(email)
      setSisaDetik(JEDA_KIRIM_ULANG)
      return true
    } catch (error) {
      setGalat(error.message)
      return false
    } finally {
      setMengirim(false)
    }
  }

  async function handleMintaKode(event) {
    event.preventDefault()
    setGalat(null)
    setGalatField({})
    if (!POLA_EMAIL.test(email.trim())) {
      setGalatField({ email: 'Masukkan alamat email yang valid.' })
      return
    }
    if (await kirimKode()) setLangkah('kode')
  }

  async function handleKirimUlang() {
    setGalat(null)
    if (await kirimKode()) setForm((f) => ({ ...f, kode: '' }))
  }

  async function handleAturUlang(event) {
    event.preventDefault()
    setGalat(null)
    const masalah = validasiSandiBaru(form)
    setGalatField(masalah)
    if (Object.keys(masalah).length > 0) return

    try {
      setSelesai(true)
      const pengguna = await aturUlangSandi({ email, kode: form.kode, password: form.password })
      toast({
        variant: 'success',
        title: 'Kata sandi diperbarui',
        description: 'Anda sudah masuk dengan kata sandi baru.',
      })
      navigate(berandaRole(pengguna.role), { replace: true })
    } catch (error) {
      setGalat(error.message)
    }
  }

  const ubah = (field) => (event) => {
    const nilai = field === 'kode' ? event.target.value.replace(/\D/g, '') : event.target.value
    setForm((f) => ({ ...f, [field]: nilai }))
  }

  return (
    <AuthLayout
      judul="Atur ulang kata sandi akun SiMonLomba."
      deskripsi="Kami akan mengirim kode verifikasi ke email kampus Anda. Kode itu dipakai untuk membuat kata sandi baru."
    >
      <h2 className="text-2xl font-bold text-slate-800">Lupa kata sandi</h2>

      {!modeSupabase ? (
        <p className="mt-2 text-sm text-slate-600">
          Reset kata sandi lewat email hanya tersedia saat aplikasi tersambung ke server. Hubungi
          admin program studi untuk mengatur ulang kata sandi.
        </p>
      ) : langkah === 'email' ? (
        <>
          <p className="mt-1 text-sm text-slate-600">
            Masukkan email akun Anda. Jika terdaftar, kode verifikasi akan dikirim ke email itu.
          </p>
          {galat && <KotakGalat>{galat}</KotakGalat>}
          <form onSubmit={handleMintaKode} noValidate className="mt-6 space-y-4">
            <Input
              label="Email"
              type="email"
              name="email"
              autoComplete="username"
              placeholder="nama@binus.ac.id"
              leadingIcon={Mail}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              error={galatField.email}
              required
            />
            <Button type="submit" size="lg" fullWidth loading={mengirim} leadingIcon={MailCheck}>
              Kirim kode
            </Button>
          </form>
        </>
      ) : (
        <>
          <p className="mt-1 text-sm text-slate-600">
            Jika <span className="font-semibold text-slate-800">{email.trim()}</span> terdaftar,
            kode verifikasi sudah dikirim ke sana. Periksa juga folder Spam atau Junk.
          </p>
          {galat && <KotakGalat>{galat}</KotakGalat>}
          <form onSubmit={handleAturUlang} noValidate className="mt-6 space-y-4">
            <Input
              label="Kode verifikasi"
              name="kode"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="123456"
              maxLength={8}
              value={form.kode}
              onChange={ubah('kode')}
              error={galatField.kode}
              className="tracking-[0.3em]"
              required
            />
            <Input
              label="Kata sandi baru"
              type="password"
              name="password"
              autoComplete="new-password"
              value={form.password}
              onChange={ubah('password')}
              error={galatField.password}
              hint="Minimal 8 karakter, berisi huruf dan angka, serta huruf besar-kecil atau simbol."
              required
            />
            <Input
              label="Ulangi kata sandi baru"
              type="password"
              name="konfirmasi"
              autoComplete="new-password"
              value={form.konfirmasi}
              onChange={ubah('konfirmasi')}
              error={galatField.konfirmasi}
              required
            />
            <Button type="submit" size="lg" fullWidth loading={memproses} leadingIcon={KeyRound}>
              Simpan kata sandi baru
            </Button>
          </form>

          <div className="mt-4 text-center text-sm text-slate-600">
            {sisaDetik > 0 ? (
              <p>Kirim ulang kode dalam {sisaDetik} detik</p>
            ) : (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                leadingIcon={RotateCw}
                loading={mengirim}
                onClick={handleKirimUlang}
              >
                Kirim ulang kode
              </Button>
            )}
          </div>
        </>
      )}

      <div className="mt-5 border-t border-slate-100 pt-4 text-center text-sm">
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 font-semibold text-primary-700 hover:text-primary-800 hover:underline"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Kembali ke halaman masuk
        </Link>
      </div>
    </AuthLayout>
  )
}
