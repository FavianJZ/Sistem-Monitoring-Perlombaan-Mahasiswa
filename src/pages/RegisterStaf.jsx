import { useMemo, useRef, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Check,
  CircleAlert,
  Eye,
  EyeOff,
  GraduationCap,
  Presentation,
  ShieldCheck,
  UserPlus,
} from 'lucide-react'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { useToast } from '@/components/ui/Toast'
import { useAuth } from '@/auth/AuthContext'
import { berandaRole } from '@/auth/sesi'
import { DOMAIN_KAMPUS, kekuatanSandi } from '@/auth/validasiRegistrasi'
import {
  KODE_ADMIN_DEMO,
  KODE_DOSEN_DEMO,
  cekKetersediaanAkun,
  cekKodePeran,
  emailTerpakai,
} from '@/services/userService'
import { ModalVerifikasiOtp } from '@/components/auth/ModalVerifikasiOtp'
import { MODE_DEMO } from '@/config/mode'
import { PROGRAM_STUDI } from '@/config/domain'
import { cn } from '@/lib/cn'

const IKON_PERAN = { dosen: Presentation, admin: ShieldCheck }

const PERAN_STAF = [
  {
    value: 'dosen',
    label: 'Dosen Pembimbing',
    deskripsi: 'Pantau kemajuan & verifikasi berkas lomba mahasiswa',
  },
  {
    value: 'admin',
    label: 'Admin Program Studi',
    deskripsi: 'Kelola arsip prestasi, pemeringkatan, & ekspor laporan',
  },
]

const FORM_AWAL = {
  nama: '',
  email: '',
  prodi: '',
  kodeOtorisasi: '',
  password: '',
  konfirmasi: '',
}

const LABEL_KEKUATAN = ['Belum diisi', 'Lemah', 'Cukup', 'Kuat']
const WARNA_KEKUATAN = ['bg-slate-200', 'bg-danger-500', 'bg-warning-500', 'bg-success-500']

export default function RegisterStaf() {
  const { user, daftar, memproses, modeSupabase } = useAuth()
  const [mengecek, setMengecek] = useState(false)
  const [modalOtpTerbuka, setModalOtpTerbuka] = useState(false)
  const { toast } = useToast()
  const navigate = useNavigate()
  const lokasi = useLocation()
  const formRef = useRef(null)

  const [role, setRole] = useState('dosen')
  const [form, setForm] = useState(FORM_AWAL)
  const [setuju, setSetuju] = useState(false)
  const [lihatSandi, setLihatSandi] = useState(false)
  const [galatServer, setGalatServer] = useState(null)

  const tujuan = lokasi.state?.dari

  if (user) {
    return <Navigate to={tujuan ?? berandaRole(user.role)} replace />
  }

  function ubah(field) {
    return (event) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }))
      setGalatServer(null)
    }
  }

  const { syarat, skor: skorSandi } = kekuatanSandi(form.password)

  async function handleSubmit(event) {
    event.preventDefault()
    setGalatServer(null)

    if (form.nama.trim().length < 3) {
      setGalatServer('Nama lengkap minimal 3 karakter.')
      return
    }

    const email = form.email.trim().toLowerCase()
    if (!email) {
      setGalatServer('Email kampus wajib diisi.')
      return
    }

    if (!email.endsWith(DOMAIN_KAMPUS) && !email.endsWith('@binus.edu')) {
      setGalatServer(`Gunakan domain email resmi institusi/dosen (${DOMAIN_KAMPUS} atau @binus.edu).`)
      return
    }

    if (!modeSupabase && emailTerpakai(email)) {
      setGalatServer('Email ini sudah terdaftar. Silakan masuk.')
      return
    }

    if (!form.prodi) {
      setGalatServer('Pilih program studi tempat Anda bertugas.')
      return
    }

    if (!form.kodeOtorisasi.trim()) {
      setGalatServer(
        role === 'dosen'
          ? 'Kode otorisasi Dosen Pembimbing wajib diisi.'
          : 'Kode verifikasi Admin Prodi wajib diisi.',
      )
      return
    }

    // Mode lokal membandingkan dengan kode demo; mode Supabase dicek di server.
    if (!modeSupabase) {
      const kodeBenar = role === 'dosen' ? KODE_DOSEN_DEMO : KODE_ADMIN_DEMO
      if (form.kodeOtorisasi.trim() !== kodeBenar) {
        setGalatServer(
          role === 'dosen'
            ? 'Kode otorisasi Dosen tidak valid. Hubungi admin fakultas.'
            : 'Kode verifikasi Admin Prodi tidak valid.',
        )
        return
      }
    }

    if (skorSandi < 3) {
      setGalatServer('Kata sandi belum memenuhi seluruh syarat keamanan.')
      return
    }

    if (form.password !== form.konfirmasi) {
      setGalatServer('Konfirmasi kata sandi tidak cocok.')
      return
    }

    if (!setuju) {
      setGalatServer('Anda perlu menyetujui ketentuan penggunaan.')
      return
    }

    if (modeSupabase) {
      setMengecek(true)
      try {
        const [kodeValid, cek] = await Promise.all([
          cekKodePeran(role, form.kodeOtorisasi),
          cekKetersediaanAkun({ email }),
        ])
        if (cek.emailTerpakai) {
          setGalatServer('Email ini sudah terdaftar. Silakan masuk atau gunakan Lupa Kata Sandi.')
          return
        }
        if (!kodeValid) {
          setGalatServer('Kode otorisasi tidak valid. Hubungi Ketua Jurusan atau Dekanat.')
          return
        }
      } finally {
        setMengecek(false)
      }
      // Akun dibuat lewat signUp + OTP; trigger database memberi peran sesuai kode.
      setModalOtpTerbuka(true)
      return
    }

    try {
      const payload = {
        nama: form.nama,
        email: form.email,
        prodi: form.prodi,
        role,
        kodeAdmin: role === 'admin' ? form.kodeOtorisasi : undefined,
        kodeDosen: role === 'dosen' ? form.kodeOtorisasi : undefined,
        password: form.password,
        konfirmasi: form.konfirmasi,
        setuju: true,
      }

      const pengguna = await daftar(payload)
      toast({
        variant: 'success',
        title: 'Akun staf berhasil dibuat',
        description: `Selamat datang, ${pengguna.nama}.`,
      })
      navigate(tujuan ?? berandaRole(pengguna.role), { replace: true })
    } catch (error) {
      setGalatServer(error.message)
    }
  }

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
      judul="Portal Pendaftaran Dosen & Staf Akademik"
      deskripsi="Akses pemantauan perlombaan mahasiswa khusus untuk Dosen Pembimbing dan Pengelola Program Studi."
      catatan="Pendaftaran staf dilindungi oleh kode otorisasi institusi resmi."
      lebarForm="lg:w-[34rem]"
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <Link
          to="/daftar"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-700 hover:text-primary-800 transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          Bukan Dosen? Daftar sebagai Mahasiswa
        </Link>
      </div>

      <div className="flex items-center gap-2.5">
        <span className="grid size-9 place-items-center rounded-lg bg-accent-600 text-white shadow-sm">
          <ShieldCheck className="size-5" />
        </span>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Daftar Akun Staf</h2>
          <p className="text-xs text-slate-500">Khusus Dosen Pembimbing & Admin Prodi</p>
        </div>
      </div>

      {galatServer && (
        <div
          role="alert"
          className="mt-5 flex items-start gap-2.5 rounded-md border border-danger-200 bg-danger-50 p-3.5 text-sm text-danger-800"
        >
          <CircleAlert className="mt-px size-4 shrink-0" aria-hidden="true" />
          <span>{galatServer}</span>
        </div>
      )}

      <form ref={formRef} onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">

        <fieldset>
          <legend className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
            Peran Akademik
          </legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {PERAN_STAF.map((item) => {
              const Icon = IKON_PERAN[item.value]
              const dipilih = role === item.value
              return (
                <label
                  key={item.value}
                  className={cn(
                    'relative flex cursor-pointer gap-3 rounded-lg border bg-white p-3 transition-all',
                    dipilih
                      ? 'border-accent-500 bg-accent-50/60 shadow-card ring-1 ring-accent-500'
                      : 'border-slate-200 hover:border-accent-300 hover:bg-slate-50',
                  )}
                >
                  <input
                    type="radio"
                    name="role"
                    value={item.value}
                    checked={dipilih}
                    onChange={() => setRole(item.value)}
                    className="sr-only"
                  />
                  <span
                    className={cn(
                      'grid size-8 shrink-0 place-items-center rounded-md transition-colors',
                      dipilih ? 'bg-accent-600 text-white' : 'bg-slate-100 text-slate-500',
                    )}
                  >
                    <Icon className="size-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-slate-900">{item.label}</span>
                    <span className="block text-xs text-slate-500 line-clamp-2 mt-0.5">
                      {item.deskripsi}
                    </span>
                  </span>
                </label>
              )
            })}
          </div>
        </fieldset>

        <p className="border-t border-slate-200 pt-4 text-xs font-bold uppercase tracking-wider text-slate-500">
          Data Identitas & Otorisasi
        </p>

        <Input
          label="Nama lengkap beserta gelar"
          name="nama"
          placeholder="Contoh: Dr. Budi Wicaksono, S.Kom., M.T."
          value={form.nama}
          onChange={ubah('nama')}
          required
        />

        <Input
          label="Email resmi institusi"
          type="email"
          name="email"
          placeholder={`nama${DOMAIN_KAMPUS} atau @binus.edu`}
          hint="Gunakan email resmi institusi untuk verifikasi status pengajar."
          value={form.email}
          onChange={ubah('email')}
          required
        />

        <Select
          label="Program studi penugasan"
          name="prodi"
          placeholder="Pilih program studi"
          value={form.prodi}
          onChange={ubah('prodi')}
          options={PROGRAM_STUDI}
          required
        />

        <Input
          label={
            role === 'dosen'
              ? 'Kode Otorisasi Dosen (NIDN / Akses Dekanat)'
              : 'Kode Verifikasi Admin Program Studi'
          }
          name="kodeOtorisasi"
          autoComplete="off"
          placeholder={role === 'dosen' ? 'Contoh: DOSEN2026' : 'Contoh: PRODI2026'}
          hint={
            MODE_DEMO
              ? `Kode khusus otorisasi staf. Untuk demo: ${role === 'dosen' ? KODE_DOSEN_DEMO : KODE_ADMIN_DEMO}.`
              : 'Dapatkan kode resmi dari Ketua Jurusan atau Dekanat.'
          }
          value={form.kodeOtorisasi}
          onChange={ubah('kodeOtorisasi')}
          required
        />

        <p className="border-t border-slate-200 pt-4 text-xs font-bold uppercase tracking-wider text-slate-500">
          Keamanan Akun
        </p>

        <div>
          <Input
            label="Kata sandi baru"
            type={lihatSandi ? 'text' : 'password'}
            name="password"
            autoComplete="new-password"
            placeholder="Buat kata sandi minimal 8 karakter"
            value={form.password}
            onChange={ubah('password')}
            trailingAction={tombolLihat}
            required
          />

          <div className="mt-2" aria-live="polite">
            <div className="flex items-center gap-1.5">
              {[1, 2, 3].map((tingkat) => (
                <span
                  key={tingkat}
                  className={cn(
                    'h-1.5 flex-1 rounded-full transition-colors',
                    tingkat <= skorSandi ? WARNA_KEKUATAN[skorSandi] : 'bg-slate-200',
                  )}
                />
              ))}
              <span className="w-14 text-right text-xs font-semibold text-slate-600">
                {LABEL_KEKUATAN[skorSandi]}
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
                    <span
                      aria-hidden="true"
                      className="mx-1 size-1.5 shrink-0 rounded-full bg-slate-300"
                    />
                  )}
                  {item.label}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Input
          label="Konfirmasi kata sandi"
          type={lihatSandi ? 'text' : 'password'}
          name="konfirmasi"
          autoComplete="new-password"
          placeholder="Ulangi kata sandi"
          value={form.konfirmasi}
          onChange={ubah('konfirmasi')}
          required
        />

        <label className="flex items-start gap-2.5 text-xs text-slate-600 pt-1">
          <input
            type="checkbox"
            checked={setuju}
            onChange={(e) => setSetuju(e.target.checked)}
            className="mt-0.5 size-4 rounded border-slate-300 text-accent-600 focus:ring-accent-500"
          />
          <span>Saya menyatakan data pengajar/staf ini valid dan menyetujui kebijakan akses akademik.</span>
        </label>

        <Button
          type="submit"
          size="lg"
          fullWidth
          loading={memproses || mengecek}
          leadingIcon={UserPlus}
          className="bg-accent-600 hover:bg-accent-700 text-white"
        >
          Daftarkan Akun Staf
        </Button>

        <p className="text-center text-xs text-slate-500 pt-2">
          Sudah memiliki akun staf?{' '}
          <Link to="/login" className="font-semibold text-primary-700 hover:underline">
            Masuk di sini
          </Link>
        </p>
      </form>

      {modeSupabase && (
        <ModalVerifikasiOtp
          terbuka={modalOtpTerbuka}
          judul="Verifikasi Email Akun Staf"
          email={form.email.trim().toLowerCase()}
          password={form.password}
          metadata={{
            nama: form.nama.trim(),
            role,
            prodi: form.prodi,
            // Diperiksa & dihapus oleh trigger database; tidak pernah dipercaya di klien.
            kode_peran: form.kodeOtorisasi.trim(),
          }}
          onClose={() => setModalOtpTerbuka(false)}
          onSukses={async () => {
            setModalOtpTerbuka(false)
            try {
              const pengguna = await daftar({ role })
              toast({
                variant: 'success',
                title: 'Akun staf berhasil dibuat',
                description: `Selamat datang, ${pengguna.nama}.`,
              })
              navigate(tujuan ?? berandaRole(pengguna.role), { replace: true })
            } catch (error) {
              setGalatServer(error.message)
            }
          }}
        />
      )}
    </AuthLayout>
  )
}
