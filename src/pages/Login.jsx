import { useEffect, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { CalendarClock, CircleAlert, FolderCheck, LogIn, Trophy } from 'lucide-react'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuth } from '@/auth/AuthContext'
import { AKUN_DEMO, SANDI_DEMO } from '@/auth/akunDemo'
import { berandaRole } from '@/auth/sesi'
import { MODE_DEMO } from '@/config/mode'
import { adalahTautanPemulihan } from '@/lib/supabase'

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

  useEffect(() => {
    if (adalahTautanPemulihan(window.location)) {
      navigate(`/reset-password${window.location.search}${window.location.hash}`, { replace: true })
    }
  }, [navigate])

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
    <AuthLayout
      judul="Setiap lomba mahasiswa tercatat, terpantau, dan siap dilaporkan."
      deskripsi="Sistem Monitoring Perlombaan Mahasiswa mengumpulkan data keikutsertaan beserta bukti pendukungnya, lalu menyajikannya untuk pemantauan program studi."
      catatan={
        MODE_DEMO
          ? 'Prototipe antarmuka. Data masih tiruan dan belum tersambung ke basis data.'
          : 'Prototipe antarmuka. Akun dan data lomba disimpan lokal di peramban ini.'
      }
      panel={
        <ul className="space-y-5">
          {SOROTAN.map((item) => {
            const Icon = item.icon
            return (
              <li key={item.judul} className="flex gap-4">
                <span className="mt-0.5 grid size-10 shrink-0 place-items-center rounded-md bg-primary-50 text-primary-600">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="font-semibold text-slate-800">{item.judul}</p>
                  <p className="text-sm text-slate-600">{item.teks}</p>
                </div>
              </li>
            )
          })}
        </ul>
      }
    >
          <h2 className="text-2xl font-bold text-slate-800">Masuk</h2>
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

            <div className="flex justify-end -mt-2">
              <Link
                to="/lupa-password"
                className="text-xs font-semibold text-primary-700 hover:text-primary-800 hover:underline"
              >
                Lupa kata sandi?
              </Link>
            </div>

            <Button type="submit" size="lg" fullWidth loading={memproses} leadingIcon={LogIn}>
              Masuk
            </Button>
          </form>

          <div className="mt-5 border-t border-slate-100 pt-4 text-center text-sm text-slate-600">
            <p>
              Belum punya akun?{' '}
              <Link
                to="/daftar"
                state={lokasi.state}
                className="font-semibold text-primary-700 hover:text-primary-800 hover:underline"
              >
                Daftar sekarang
              </Link>
            </p>
          </div>

          {MODE_DEMO && (
            <div className="mt-8 border-t border-slate-200 pt-6">
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
                    className="flex w-full items-center justify-between gap-3 rounded-md border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-left transition-colors hover:border-primary-300 hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-60"
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
          )}
    </AuthLayout>
  )
}
