import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import {
  CalendarClock,
  CircleAlert,
  FolderCheck,
  GraduationCap,
  LogIn,
  Trophy,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuth } from '@/auth/AuthContext'
import { AKUN_DEMO, SANDI_DEMO } from '@/auth/akunDemo'
import { berandaRole } from '@/auth/sesi'

const SOROTAN = [
  {
    icon: FolderCheck,
    judul: 'Bukti terkumpul di satu tempat',
    teks: 'Bukti pendaftaran, pembayaran, poster, dan susunan tim tersimpan rapi per lomba.',
  },
  {
    icon: CalendarClock,
    judul: 'Timeline yang terpantau',
    teks: 'Dari pendaftaran, technical meeting, penyisihan, sampai pengumuman pemenang.',
  },
  {
    icon: Trophy,
    judul: 'Arsip prestasi siap dilaporkan',
    teks: 'Rekap capaian dan sertifikat untuk kebutuhan akreditasi program studi.',
  },
]

export default function Login() {
  const { user, masuk, masukCepat, memproses } = useAuth()
  const navigate = useNavigate()
  const lokasi = useLocation()

  const [email, setEmail] = useState('')
  const [sandi, setSandi] = useState('')
  const [galat, setGalat] = useState(null)
  const [galatField, setGalatField] = useState({})

  const tujuan = lokasi.state?.dari

  if (user) {
    return <Navigate to={tujuan ?? berandaRole(user.role)} replace />
  }

  function lanjutkan(pengguna) {
    navigate(tujuan ?? berandaRole(pengguna.role), { replace: true })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setGalat(null)
    setGalatField({})

    const masalah = {}
    if (!email.trim()) masalah.email = 'Email wajib diisi.'
    if (!sandi) masalah.sandi = 'Kata sandi wajib diisi.'

    if (Object.keys(masalah).length > 0) {
      setGalatField(masalah)
      return
    }

    try {
      const pengguna = await masuk({ email, password: sandi })
      lanjutkan(pengguna)
    } catch (error) {
      setGalat(error.message)
    }
  }

  async function handleAkunDemo(id) {
    setGalat(null)
    setGalatField({})

    try {
      const pengguna = await masukCepat(id)
      lanjutkan(pengguna)
    } catch (error) {
      setGalat(error.message)
    }
  }

  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.1fr_1fr]">
      {/* Panel kiri: sisi bold dari design system. */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-slate-900 p-10 text-white lg:flex">
        <div
          aria-hidden="true"
          className="absolute -right-24 -top-24 size-96 rounded-full bg-accent-500/25 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-32 -left-20 size-96 rounded-full bg-primary-600/30 blur-3xl"
        />

        <div className="relative">
          <span className="inline-flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-lg bg-accent-500 text-slate-900">
              <GraduationCap className="size-6" aria-hidden="true" />
            </span>
            <span className="text-lg font-extrabold tracking-tight">SiMonLomba</span>
          </span>

          <h1 className="mt-12 max-w-lg text-4xl font-extrabold leading-tight tracking-tight">
            Setiap lomba mahasiswa tercatat, terpantau, dan siap dilaporkan.
          </h1>
          <p className="mt-4 max-w-md text-slate-300">
            Sistem Monitoring Perlombaan Mahasiswa mengumpulkan data keikutsertaan beserta bukti
            pendukungnya, lalu menyajikannya untuk pemantauan program studi.
          </p>
        </div>

        <ul className="relative mt-10 space-y-5">
          {SOROTAN.map((item) => {
            const Icon = item.icon
            return (
              <li key={item.judul} className="flex gap-4">
                <span className="mt-0.5 grid size-10 shrink-0 place-items-center rounded-lg bg-white/10">
                  <Icon className="size-5 text-accent-300" aria-hidden="true" />
                </span>
                <div>
                  <p className="font-semibold">{item.judul}</p>
                  <p className="text-sm text-slate-300">{item.teks}</p>
                </div>
              </li>
            )
          })}
        </ul>

        <p className="relative text-xs text-slate-400">
          Prototipe antarmuka. Data masih tiruan dan belum tersambung ke basis data.
        </p>
      </div>

      {/* Panel kanan: form masuk. */}
      <div className="flex items-center justify-center bg-slate-50 p-6 sm:p-10">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <span className="inline-flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-lg bg-primary-600 text-white">
                <GraduationCap className="size-6" aria-hidden="true" />
              </span>
              <span className="text-lg font-extrabold tracking-tight text-slate-900">
                SiMonLomba
              </span>
            </span>
          </div>

          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">Masuk</h2>
          <p className="mt-1 text-sm text-slate-600">
            Gunakan akun kampus Anda untuk melanjutkan.
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

          <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
            <Input
              label="Email"
              type="email"
              name="email"
              autoComplete="username"
              placeholder="nama@binus.ac.id"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              error={galatField.email}
              required
            />
            <Input
              label="Kata Sandi"
              type="password"
              name="password"
              autoComplete="current-password"
              placeholder="Masukkan kata sandi"
              value={sandi}
              onChange={(event) => setSandi(event.target.value)}
              error={galatField.sandi}
              required
            />

            <Button type="submit" size="lg" fullWidth loading={memproses} leadingIcon={LogIn}>
              Masuk
            </Button>
          </form>

          <div className="mt-8 rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-sm font-semibold text-slate-900">Akun demo</p>
            <p className="mt-0.5 text-xs text-slate-500">
              Kata sandi semua akun demo: <code className="font-semibold">{SANDI_DEMO}</code>
            </p>

            <div className="mt-3 space-y-2">
              {AKUN_DEMO.map((akun) => (
                <button
                  key={akun.id}
                  type="button"
                  onClick={() => handleAkunDemo(akun.id)}
                  disabled={memproses}
                  className="flex w-full items-center justify-between gap-3 rounded-md border border-slate-200 px-3.5 py-2.5 text-left transition-colors hover:border-primary-300 hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-slate-900">{akun.label}</span>
                    <span className="block truncate text-xs text-slate-500">{akun.keterangan}</span>
                  </span>
                  <LogIn className="size-4 shrink-0 text-slate-400" aria-hidden="true" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
