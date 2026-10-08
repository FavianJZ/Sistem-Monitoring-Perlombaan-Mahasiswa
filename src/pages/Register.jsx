import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import {
  Check,
  CircleAlert,
  Eye,
  EyeOff,
  GraduationCap,
  Mail,
  Presentation,
  ShieldCheck,
  UserPlus,
} from 'lucide-react'
import { ModalVerifikasiOtp } from '@/components/auth/ModalVerifikasiOtp'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { useToast } from '@/components/ui/Toast'
import { useAuth } from '@/auth/AuthContext'
import { berandaRole } from '@/auth/sesi'
import {
  DOMAIN_KAMPUS,
  FIELD_PER_LANGKAH,
  PERAN_REGISTRASI,
  kekuatanSandi,
  validasiRegistrasi,
} from '@/auth/validasiRegistrasi'
import { emailTerpakai, nimTerpakai, KODE_ADMIN_DEMO } from '@/services/userService'
import { MODE_DEMO } from '@/config/mode'
import { PROGRAM_STUDI } from '@/config/domain'
import { cn } from '@/lib/cn'

const IKON_PERAN = { mahasiswa: GraduationCap, dosen: Presentation, admin: ShieldCheck }

const TAHUN_INI = new Date().getFullYear()
const PILIHAN_ANGKATAN = Array.from({ length: 8 }, (_, i) => String(TAHUN_INI - i))

const FORM_AWAL = {
  nama: '',
  email: '',
  nim: '',
  angkatan: String(TAHUN_INI),
  prodi: '',
  kodeAdmin: '',
  password: '',
  konfirmasi: '',
}

const LABEL_KEKUATAN = ['Belum diisi', 'Lemah', 'Cukup', 'Kuat']
const WARNA_KEKUATAN = ['bg-slate-200', 'bg-danger-500', 'bg-warning-500', 'bg-success-500']

function DaftarLangkah({ langkah }) {
  const aktif = langkah.findIndex((item) => !item.selesai)

  return (
    <ol
      className="divide-y divide-slate-200 rounded-md border border-slate-200 bg-white"
      aria-label="Progres pendaftaran"
    >
      {langkah.map((item, indeks) => {
        const sedangAktif = indeks === aktif
        return (
          <li
            key={item.judul}
            className={cn(
              'flex items-center gap-3.5 border-l-[3px] px-4 py-3 transition-colors',
              sedangAktif ? 'border-l-accent-500' : 'border-l-transparent',
            )}
          >
            <span
              className={cn(
                'grid size-8 shrink-0 place-items-center rounded-full text-xs font-bold transition-colors',
                item.selesai && 'bg-success-600 text-white',
                sedangAktif && 'bg-primary-600 text-white',
                !item.selesai && !sedangAktif && 'bg-slate-100 text-slate-500',
              )}
            >
              {item.selesai ? <Check className="size-4" aria-hidden="true" /> : indeks + 1}
            </span>
            <div className="min-w-0">
              <p
                className={cn(
                  'text-sm font-semibold',
                  item.selesai || sedangAktif ? 'text-slate-800' : 'text-slate-500',
                )}
              >
                {item.judul}
                <span className="sr-only">{item.selesai ? ' (selesai)' : ''}</span>
              </p>
              <p className="truncate text-xs text-slate-500">{item.keterangan}</p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}

function PilihanPeran({ nilai, onChange }) {
  return (
    <fieldset>
      <legend className="mb-1.5 block text-sm font-medium text-slate-700">Daftar sebagai</legend>
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        {PERAN_REGISTRASI.map((peran) => {
          const Icon = IKON_PERAN[peran.value]
          const dipilih = nilai === peran.value
          return (
            <label
              key={peran.value}
              className={cn(
                'relative flex cursor-pointer gap-3 rounded-lg border bg-white p-3 transition-all sm:flex-col sm:gap-2',
                'has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary-600',
                dipilih
                  ? 'border-primary-500 bg-primary-50/60 shadow-card ring-1 ring-primary-500'
                  : 'border-slate-200 hover:border-primary-300 hover:bg-slate-50',
              )}
            >
              <input
                type="radio"
                name="role"
                value={peran.value}
                checked={dipilih}
                onChange={() => onChange(peran.value)}
                className="sr-only"
              />
              <span
                className={cn(
                  'grid size-9 shrink-0 place-items-center rounded-md transition-colors',
                  dipilih ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-500',
                )}
              >
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span
                  className={cn(
                    'block text-sm font-semibold',
                    dipilih ? 'text-primary-800' : 'text-slate-900',
                  )}
                >
                  {peran.label}
                </span>
                <span className="block text-xs leading-snug text-slate-500">{peran.deskripsi}</span>
              </span>
              {dipilih && (
                <Check
                  className="absolute right-2.5 top-2.5 size-4 text-primary-600"
                  aria-hidden="true"
                />
              )}
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}

function MeteranSandi({ sandi }) {
  const { syarat, skor } = kekuatanSandi(sandi)

  return (
    <div className="mt-2.5" aria-live="polite">
      <div className="flex items-center gap-1.5">
        {[1, 2, 3].map((tingkat) => (
          <span
            key={tingkat}
            className={cn(
              'h-1.5 flex-1 rounded-full transition-colors',
              tingkat <= skor ? WARNA_KEKUATAN[skor] : 'bg-slate-200',
            )}
          />
        ))}
        <span className="w-14 text-right text-xs font-semibold text-slate-600">
          {LABEL_KEKUATAN[skor]}
        </span>
      </div>
      <ul className="mt-2 grid gap-x-3 gap-y-1 sm:grid-cols-3">
        {syarat.map((item) => (
          <li
            key={item.id}
            className={cn(
              'flex items-center gap-1.5 text-xs',
              item.ok ? 'text-success-700' : 'text-slate-500',
            )}
          >
            {item.ok ? (
              <Check className="size-3.5 shrink-0" aria-hidden="true" />
            ) : (
              <span aria-hidden="true" className="mx-1 size-1.5 shrink-0 rounded-full bg-slate-300" />
            )}
            {item.label}
            <span className="sr-only">{item.ok ? ' terpenuhi' : ' belum terpenuhi'}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function JudulBagian({ children }) {
  return (
    <p className="border-t border-slate-200 pt-5 text-xs font-bold uppercase tracking-wider text-slate-500">
      {children}
    </p>
  )
}

export default function Register() {
  const { user, daftar, memproses } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const lokasi = useLocation()
  const formRef = useRef(null)

  const [role, setRole] = useState('mahasiswa')
  const [form, setForm] = useState(FORM_AWAL)
  const [setuju, setSetuju] = useState(false)
  const [lihatSandi, setLihatSandi] = useState(false)
  const [disentuh, setDisentuh] = useState({})
  const [percobaan, setPercobaan] = useState(0)
  const [galatServer, setGalatServer] = useState(null)
  const [modalOtpTerbuka, setModalOtpTerbuka] = useState(false)
  const [emailTerverifikasi, setEmailTerverifikasi] = useState(false)

  const tujuan = lokasi.state?.dari

  const galat = useMemo(
    () => validasiRegistrasi({ ...form, role, setuju }, { emailTerpakai, nimTerpakai }),
    [form, role, setuju],
  )

  useEffect(() => {
    if (percobaan === 0) return
    formRef.current?.querySelector('[aria-invalid="true"]')?.focus()
  }, [percobaan])

  if (user) {
    return <Navigate to={tujuan ?? berandaRole(user.role)} replace />
  }

  const tampilkan = (field) => (percobaan > 0 || disentuh[field] ? galat[field] : undefined)

  function ubah(field) {
    return (event) => {
      const nilai = field === 'nim' ? event.target.value.replace(/\D/g, '') : event.target.value
      setForm((sebelum) => ({ ...sebelum, [field]: nilai }))
      setGalatServer(null)
    }
  }

  function sentuh(field) {
    return () => setDisentuh((sebelum) => ({ ...sebelum, [field]: true }))
  }

  function gantiPeran(peranBaru) {
    setRole(peranBaru)
    setGalatServer(null)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setGalatServer(null)

    if (Object.keys(galat).length > 0) {
      setPercobaan((n) => n + 1)
      return
    }

    try {
      const pengguna = await daftar({ ...form, role })
      toast({
        variant: 'success',
        title: 'Akun berhasil dibuat',
        description: `Selamat datang, ${pengguna.nama}.`,
      })
      navigate(tujuan ?? berandaRole(pengguna.role), { replace: true })
    } catch (error) {
      setGalatServer(error.message)
    }
  }

  const isian = FIELD_PER_LANGKAH.dataDiri.filter((field) => {
    if (field === 'nim' || field === 'angkatan') return role === 'mahasiswa'
    if (field === 'kodeAdmin') return role === 'admin'
    return true
  })
  const isianLengkap = isian.filter((field) => !galat[field]).length
  const skorSandi = kekuatanSandi(form.password).skor
  const labelPeran = PERAN_REGISTRASI.find((item) => item.value === role)?.label

  const langkah = [
    { judul: 'Pilih peran', keterangan: `Mendaftar sebagai ${labelPeran}`, selesai: true },
    {
      judul: 'Lengkapi data diri',
      keterangan: `${isianLengkap} dari ${isian.length} isian lengkap`,
      selesai: isianLengkap === isian.length,
    },
    {
      judul: 'Buat kata sandi',
      keterangan: form.password ? `Kekuatan: ${LABEL_KEKUATAN[skorSandi]}` : 'Belum diisi',
      selesai: !galat.password && !galat.konfirmasi,
    },
  ]

  const tombolLihat = (
    <button
      type="button"
      onClick={() => setLihatSandi((v) => !v)}
      aria-label={lihatSandi ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
      aria-pressed={lihatSandi}
      className="rounded-md p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
    >
      {lihatSandi ? (
        <EyeOff className="size-4" aria-hidden="true" />
      ) : (
        <Eye className="size-4" aria-hidden="true" />
      )}
    </button>
  )

  return (
    <AuthLayout
      judul="Mulai catat dan pantau perlombaan dari satu akun."
      deskripsi="Pilih peran Anda, lengkapi data singkat, lalu langsung masuk ke dasbor yang sesuai."
      catatan="Prototipe antarmuka. Akun disimpan lokal di peramban ini saja."
      panel={<DaftarLangkah langkah={langkah} />}
      lebarForm="lg:w-[34rem]"
    >
      <h2 className="text-2xl font-bold text-slate-800">Buat akun</h2>
      <p className="mt-1 text-sm text-slate-600">
        Sudah punya akun?{' '}
        <Link
          to="/login"
          state={lokasi.state}
          className="font-semibold text-primary-700 hover:text-primary-800 hover:underline"
        >
          Masuk
        </Link>
      </p>

      {galatServer && (
        <div
          role="alert"
          className="mt-5 flex items-start gap-2.5 rounded-md border border-danger-200 bg-danger-50 p-3.5 text-sm text-danger-800"
        >
          <CircleAlert className="mt-px size-4 shrink-0" aria-hidden="true" />
          <span>{galatServer}</span>
        </div>
      )}

      <div className="mt-4 mb-2 rounded-lg border border-accent-200 bg-accent-50/70 p-3 text-xs text-accent-900 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-4 shrink-0 text-accent-600" />
          <span>Pendaftaran Dosen Pembimbing & Admin Prodi dipisahkan untuk keamanan institusi.</span>
        </div>
        <Link to="/daftar-staf" className="font-bold underline text-accent-800 hover:text-accent-950 shrink-0">
          Portal Staf →
        </Link>
      </div>

      <form ref={formRef} onSubmit={handleSubmit} noValidate className="mt-6 space-y-5">
        <PilihanPeran nilai={role} onChange={gantiPeran} />

        <JudulBagian>Data diri</JudulBagian>

        <Input
          label="Nama lengkap"
          name="nama"
          autoComplete="name"
          placeholder="Nama sesuai identitas"
          value={form.nama}
          onChange={ubah('nama')}
          onBlur={sentuh('nama')}
          error={tampilkan('nama')}
          required
        />

        <div>
          <Input
            label="Email kampus"
            type="email"
            name="email"
            autoComplete="email"
            placeholder={`nama${DOMAIN_KAMPUS}`}
            hint={`Gunakan email berakhiran ${DOMAIN_KAMPUS}.`}
            value={form.email}
            onChange={ubah('email')}
            onBlur={sentuh('email')}
            error={tampilkan('email')}
            required
          />

          {role === 'mahasiswa' && form.email.endsWith(DOMAIN_KAMPUS) && (
            <div className="mt-2 flex items-center justify-between gap-2">
              {emailTerverifikasi ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-success-700 bg-success-50 border border-success-200 px-2.5 py-1 rounded-md">
                  <Check className="size-3.5" /> Email Terverifikasi (Kode OTP Valid)
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setModalOtpTerbuka(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-primary-700 hover:text-primary-800 hover:underline"
                >
                  <Mail className="size-3.5" />
                  Verifikasi Email dengan Kode OTP (Aktivasi Bot)
                </button>
              )}
            </div>
          )}
        </div>

        {role === 'mahasiswa' && (
          <div className="grid gap-5 sm:grid-cols-[1.4fr_1fr]">
            <Input
              label="NIM"
              name="nim"
              inputMode="numeric"
              maxLength={10}
              placeholder="10 digit angka"
              value={form.nim}
              onChange={ubah('nim')}
              onBlur={sentuh('nim')}
              error={tampilkan('nim')}
              suffix={`${form.nim.length}/10`}
              required
            />
            <Select
              label="Angkatan"
              name="angkatan"
              value={form.angkatan}
              onChange={ubah('angkatan')}
              onBlur={sentuh('angkatan')}
              error={tampilkan('angkatan')}
              options={PILIHAN_ANGKATAN}
              required
            />
          </div>
        )}

        <Select
          label="Program studi"
          name="prodi"
          placeholder="Pilih program studi"
          value={form.prodi}
          onChange={ubah('prodi')}
          onBlur={sentuh('prodi')}
          error={tampilkan('prodi')}
          options={PROGRAM_STUDI}
          required
        />

        {role === 'admin' && (
          <Input
            label="Kode verifikasi Admin Prodi"
            name="kodeAdmin"
            autoComplete="off"
            placeholder="Masukkan kode dari pengelola sistem"
            hint={
              MODE_DEMO
                ? `Kode diberikan oleh pengelola sistem. Untuk demo: ${KODE_ADMIN_DEMO}.`
                : 'Kode diberikan oleh pengelola sistem.'
            }
            value={form.kodeAdmin}
            onChange={ubah('kodeAdmin')}
            onBlur={sentuh('kodeAdmin')}
            error={tampilkan('kodeAdmin')}
            required
          />
        )}

        <JudulBagian>Keamanan akun</JudulBagian>

        <div>
          <Input
            label="Kata sandi"
            type={lihatSandi ? 'text' : 'password'}
            name="password"
            autoComplete="new-password"
            placeholder="Buat kata sandi"
            value={form.password}
            onChange={ubah('password')}
            onBlur={sentuh('password')}
            error={tampilkan('password')}
            trailingAction={tombolLihat}
            required
          />
          {form.password && <MeteranSandi sandi={form.password} />}
        </div>

        <Input
          label="Konfirmasi kata sandi"
          type={lihatSandi ? 'text' : 'password'}
          name="konfirmasi"
          autoComplete="new-password"
          placeholder="Ulangi kata sandi"
          value={form.konfirmasi}
          onChange={ubah('konfirmasi')}
          onBlur={sentuh('konfirmasi')}
          error={tampilkan('konfirmasi')}
          required
        />

        <div>
          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 bg-white p-3.5 text-sm text-slate-600 transition-colors hover:border-slate-300">
            <input
              type="checkbox"
              name="setuju"
              checked={setuju}
              onChange={(event) => {
                setSetuju(event.target.checked)
                sentuh('setuju')()
              }}
              aria-invalid={tampilkan('setuju') ? 'true' : undefined}
              aria-describedby={tampilkan('setuju') ? 'setuju-error' : undefined}
              className="mt-0.5 size-4 shrink-0 accent-primary-600"
            />
            <span>
              Saya menyetujui ketentuan penggunaan dan kebijakan data SiMonLomba.
            </span>
          </label>
          {tampilkan('setuju') && (
            <p id="setuju-error" className="mt-1.5 flex items-start gap-1.5 text-xs text-danger-700">
              <CircleAlert className="mt-px size-3.5 shrink-0" aria-hidden="true" />
              <span>{galat.setuju}</span>
            </p>
          )}
        </div>

        <Button type="submit" size="lg" fullWidth loading={memproses} leadingIcon={UserPlus}>
          {memproses ? 'Membuat akun...' : 'Buat akun'}
        </Button>
      </form>

      <ModalVerifikasiOtp
        terbuka={modalOtpTerbuka}
        email={form.email}
        onClose={() => setModalOtpTerbuka(false)}
        onSukses={async () => {
          setEmailTerverifikasi(true)
          setModalOtpTerbuka(false)
          toast({
            variant: 'success',
            title: 'Email Terverifikasi',
            description: 'Kode OTP valid. Email kampus Anda telah diaktifkan.',
          })
        }}
      />
    </AuthLayout>
  )
}
