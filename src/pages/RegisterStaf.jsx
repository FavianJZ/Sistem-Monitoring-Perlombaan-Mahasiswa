import { useMemo, useRef, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Check,
  CircleAlert,
  Eye,
  EyeOff,
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
  KODE_DOSEN_DEMO,
  cekKetersediaanAkun,
  cekKodePeran,
  emailTerpakai,
} from '@/services/userService'
import { MODE_DEMO } from '@/config/mode'
import { PROGRAM_STUDI } from '@/config/domain'
import { cn } from '@/lib/cn'

// Pendaftaran staf hanya untuk dosen pembimbing. Peran admin tetap ada di
// database, tetapi tidak lagi bisa dipilih dari halaman ini.
const ROLE = 'dosen'

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
  const { toast } = useToast()
  const navigate = useNavigate()
  const lokasi = useLocation()
  const formRef = useRef(null)

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
      setGalatServer('Kode otorisasi dosen wajib diisi.')
      return
    }

    // Mode lokal membandingkan dengan kode demo; mode Supabase dicek di server.
    if (!modeSupabase) {
      if (form.kodeOtorisasi.trim() !== KODE_DOSEN_DEMO) {
        setGalatServer('Kode otorisasi dosen tidak valid. Minta kode yang benar ke program studi.')
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
          cekKodePeran(ROLE, form.kodeOtorisasi),
          cekKetersediaanAkun({ email }),
        ])
        if (cek.emailTerpakai) {
          setGalatServer('Email ini sudah terdaftar. Silakan masuk.')
          return
        }
        if (!kodeValid) {
          setGalatServer('Kode otorisasi tidak valid. Minta kode yang benar ke program studi.')
          return
        }
      } finally {
        setMengecek(false)
      }
    }

    try {
      const payload = {
        nama: form.nama,
        email: form.email,
        prodi: form.prodi,
        role: ROLE,
        kodeDosen: form.kodeOtorisasi,
        password: form.password,
        konfirmasi: form.konfirmasi,
        setuju: true,
      }

      const pengguna = await daftar(payload)
      toast({
        variant: 'success',
        title: 'Akun dosen berhasil dibuat',
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
      judul="Pendaftaran akun dosen pembimbing"
      deskripsi="Akun dosen dipakai untuk memantau lomba mahasiswa bimbingan dan memverifikasi berkasnya."
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
          <h2 className="text-2xl font-bold text-slate-800">Daftar Akun Dosen</h2>
          <p className="text-xs text-slate-500">Khusus dosen pembimbing</p>
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


        <p className="border-t border-slate-200 pt-4 text-xs font-bold uppercase tracking-wider text-slate-500">
          Data Identitas & Otorisasi
        </p>

        <Input
          label="Nama lengkap beserta gelar"
          name="nama"
          placeholder="Contoh: Nama Lengkap, S.Kom., M.T."
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
          label="Kode otorisasi dosen"
          name="kodeOtorisasi"
          autoComplete="off"
          placeholder="Masukkan kode dari program studi"
          hint={
            MODE_DEMO
              ? `Untuk demo: ${KODE_DOSEN_DEMO}.`
              : 'Kode ini dibagikan oleh program studi kepada dosen dan staf.'
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
          Daftarkan Akun Dosen
        </Button>

        <p className="text-center text-xs text-slate-500 pt-2">
          Sudah punya akun?{' '}
          <Link to="/login" className="font-semibold text-primary-700 hover:underline">
            Masuk di sini
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}
