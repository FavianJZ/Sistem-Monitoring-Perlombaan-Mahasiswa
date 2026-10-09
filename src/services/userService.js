import { jeda } from './delay'
import { ServiceError } from './competitionService'
import { SANDI_DEMO, SEMUA_PENGGUNA } from '@/data/users'
import { validasiRegistrasi } from '@/auth/validasiRegistrasi'
import { buatJwt } from '@/auth/jwt'
import { MODE_DEMO } from '@/config/mode'
import { supabase, apakahSupabaseAktif } from '@/lib/supabase'
import { beriTahuPerubahan } from './perubahanData'

const PENGGUNA_BAWAAN = MODE_DEMO ? SEMUA_PENGGUNA : []

export const KUNCI_AKUN = 'simonlomba.akun'

export const KODE_ADMIN_DEMO = 'PRODI2026'

export const KODE_DOSEN_DEMO = 'DOSEN2026'

function bacaAkun() {
  try {
    const mentah = window.localStorage.getItem(KUNCI_AKUN)
    const daftar = mentah ? JSON.parse(mentah) : []
    return Array.isArray(daftar) ? daftar.filter((item) => item?.user?.id) : []
  } catch {
    return []
  }
}

function simpanAkun(daftar) {
  try {
    window.localStorage.setItem(KUNCI_AKUN, JSON.stringify(daftar))
  } catch {

  }
}

function semuaPengguna() {
  if (apakahSupabaseAktif()) return [...PENGGUNA_BAWAAN, ...cacheProfil.values()]
  return [...PENGGUNA_BAWAAN, ...bacaAkun().map((item) => item.user)]
}

/** Cek kode otorisasi staf di server (RPC cek_kode_peran). Kodenya tidak pernah dikirim ke klien. */
export async function cekKodePeran(role, kode) {
  if (!apakahSupabaseAktif()) {
    return String(kode ?? '').trim() === (role === 'dosen' ? KODE_DOSEN_DEMO : KODE_ADMIN_DEMO)
  }
  const { data, error } = await supabase.rpc('cek_kode_peran', {
    p_role: role,
    p_kode: String(kode ?? ''),
  })
  if (error) throw new ServiceError(`Gagal memeriksa kode otorisasi: ${error.message}`)
  return data === true
}

/* ------------------------- profil dari Supabase ------------------------- */

let cacheProfil = new Map()
let pemuatanProfil = null
let kanalProfil = null

export function barisKeProfil(baris) {
  return {
    id: baris.id,
    nama: baris.nama,
    email: baris.email,
    role: baris.role,
    prodi: baris.prodi,
    ...(baris.nim ? { nim: baris.nim } : {}),
    ...(baris.angkatan ? { angkatan: baris.angkatan } : {}),
  }
}

/**
 * Muat semua profil yang boleh dibaca (RLS: pengguna yang sudah login),
 * lalu dengarkan perubahan via Realtime. Dipakai namaPengguna() & daftar dosen.
 */
export function muatProfil() {
  if (!apakahSupabaseAktif()) return Promise.resolve()
  if (!pemuatanProfil) {
    pemuatanProfil = (async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, nama, email, role, nim, angkatan, prodi')
      if (error) {
        pemuatanProfil = null
        console.warn('[SiMonLomba] gagal memuat profil:', error.message)
        return
      }
      cacheProfil = new Map((data ?? []).map((b) => [b.id, barisKeProfil(b)]))
      beriTahuPerubahan('profil')

      if (!kanalProfil) {
        kanalProfil = supabase
          .channel('simonlomba-profiles')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, (p) => {
            if (p.eventType === 'DELETE') cacheProfil.delete(p.old?.id)
            else cacheProfil.set(p.new.id, barisKeProfil(p.new))
            beriTahuPerubahan('profil')
          })
          .subscribe()
      }
    })()
  }
  return pemuatanProfil
}

export function resetCacheProfil() {
  cacheProfil = new Map()
  pemuatanProfil = null
  if (kanalProfil) {
    supabase.removeChannel(kanalProfil)
    kanalProfil = null
  }
}

/** Profil satu pengguna langsung dari database (dipakai AuthContext). */
export async function ambilProfil(id) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, nama, email, role, nim, angkatan, prodi')
    .eq('id', id)
    .maybeSingle()
  if (error) throw new ServiceError(`Gagal memuat profil: ${error.message}`, { status: 500 })
  if (!data) return null
  const profil = barisKeProfil(data)
  cacheProfil.set(profil.id, profil)
  return profil
}

function penggunaDenganRole(role) {
  return semuaPengguna()
    .filter((item) => item.role === role)
    .map((item) => ({ ...item }))
}

/*
 * Saat Supabase aktif, sumber kebenaran adalah database, bukan cache akun di
 * localStorage. Cache itu tidak ikut terhapus saat data dihapus di Supabase,
 * sehingga dulu menimbulkan "Email/NIM sudah terdaftar" palsu.
 * Pengecekan ke database dilakukan async lewat cekKetersediaanAkun().
 */
function penggunaUntukCekDuplikat() {
  return apakahSupabaseAktif() ? PENGGUNA_BAWAAN : semuaPengguna()
}

export function emailTerpakai(email) {
  const alamat = String(email ?? '').trim().toLowerCase()
  return penggunaUntukCekDuplikat().some((item) => item.email.toLowerCase() === alamat)
}

export function nimTerpakai(nim) {
  return penggunaUntukCekDuplikat().some((item) => item.nim && item.nim === nim)
}

/**
 * Cek email & NIM ke database Supabase lewat fungsi RPC
 * public.cek_ketersediaan_akun (lihat supabase/migrations).
 * Mengembalikan { emailTerpakai, nimTerpakai }. Bila RPC belum dipasang,
 * dianggap tersedia; signUp tetap menolak email ganda.
 */
export async function cekKetersediaanAkun({ email, nim }) {
  if (!apakahSupabaseAktif()) {
    return { emailTerpakai: emailTerpakai(email), nimTerpakai: nim ? nimTerpakai(nim) : false }
  }

  const { data, error } = await supabase.rpc('cek_ketersediaan_akun', {
    p_email: String(email ?? '').trim().toLowerCase(),
    p_nim: nim || null,
  })
  if (error) {
    console.warn('[SiMonLomba] cek_ketersediaan_akun gagal:', error.message)
    return { emailTerpakai: false, nimTerpakai: false }
  }
  const baris = Array.isArray(data) ? data[0] : data
  return {
    emailTerpakai: Boolean(baris?.email_terpakai),
    nimTerpakai: Boolean(baris?.nim_terpakai),
  }
}

function buatToken(pengguna) {

  return buatJwt(pengguna)
}

export async function login({ email, password } = {}, opsi = {}) {
  await jeda(opsi.jeda)

  const alamat = String(email ?? '').trim().toLowerCase()
  if (!alamat) {
    throw new ServiceError('Email wajib diisi.', { kode: 'EMAIL_KOSONG' })
  }
  if (!password) {
    throw new ServiceError('Kata sandi wajib diisi.', { kode: 'SANDI_KOSONG' })
  }

  const terdaftar = bacaAkun().find((item) => item.user.email.toLowerCase() === alamat)
  const demo = PENGGUNA_BAWAAN.find((item) => item.email.toLowerCase() === alamat)

  let pengguna = null
  if (terdaftar && terdaftar.password === password) pengguna = terdaftar.user
  else if (demo && password === SANDI_DEMO) pengguna = demo

  if (!pengguna) {
    throw new ServiceError('Email atau kata sandi tidak cocok.', {
      status: 401,
      kode: 'KREDENSIAL_SALAH',
    })
  }

  return { user: { ...pengguna }, token: buatToken(pengguna) }
}

export async function registrasi(data = {}, opsi = {}) {
  await jeda(opsi.jeda ?? 500)

  const galat = validasiRegistrasi({ ...data, setuju: true }, { emailTerpakai, nimTerpakai })
  const pertama = Object.values(galat)[0]
  if (pertama) {
    const duplikat = galat.email?.includes('terdaftar') || galat.nim?.includes('terdaftar')
    throw new ServiceError(pertama, {
      status: duplikat ? 409 : 422,
      kode: duplikat ? 'AKUN_SUDAH_ADA' : 'DATA_TIDAK_VALID',
    })
  }

  if (data.role === 'admin' && data.kodeAdmin?.trim() !== KODE_ADMIN_DEMO) {
    throw new ServiceError('Kode verifikasi Admin Prodi tidak valid.', {
      status: 403,
      kode: 'KODE_ADMIN_SALAH',
    })
  }

  if (data.role === 'dosen' && data.kodeDosen && data.kodeDosen.trim() !== KODE_DOSEN_DEMO) {
    throw new ServiceError('Kode otorisasi Dosen tidak valid.', {
      status: 403,
      kode: 'KODE_DOSEN_SALAH',
    })
  }

  const user = {
    id: `usr-${Date.now().toString(36)}`,
    nama: data.nama.trim().replace(/\s+/g, ' '),
    email: data.email.trim().toLowerCase(),
    role: data.role,
    prodi: data.prodi,
    ...(data.role === 'mahasiswa' ? { nim: data.nim, angkatan: Number(data.angkatan) } : {}),
  }

  // Ganti entri lama dengan email/NIM yang sama (sisa akun yang sudah dihapus di database).
  const sisa = bacaAkun().filter(
    (item) =>
      item.user.email.toLowerCase() !== user.email && !(user.nim && item.user.nim === user.nim),
  )
  simpanAkun([...sisa, { user, password: data.password }])

  if (apakahSupabaseAktif()) {
    try {
      // Akun Supabase sudah dibuat oleh signUp di modal OTP dan sesi aktif
      // setelah verifyOtp. Memanggil signUp lagi hanya mengirim email ganda.
      const { data: sesiData } = await supabase.auth.getUser()
      const sbUserId = sesiData?.user?.id
      if (sbUserId) {
        await supabase.from('profiles').upsert({
          id: sbUserId,
          nama: user.nama,
          email: user.email,
          role: user.role,
          nim: user.nim ?? null,
          angkatan: user.angkatan ?? null,
          prodi: user.prodi,
        })
      }
    } catch {
    }
  }

  return { user: { ...user }, token: buatToken(user) }
}

export async function perbaruiSandiPengguna({ email, passwordBaru }, opsi = {}) {
  await jeda(opsi.jeda ?? 300)
  const target = String(email ?? '').trim().toLowerCase()
  if (!target) throw new ServiceError('Email wajib diisi.', { kode: 'EMAIL_KOSONG' })
  if (!passwordBaru) throw new ServiceError('Kata sandi baru wajib diisi.', { kode: 'SANDI_KOSONG' })

  // Saat Supabase aktif, sandi diganti lewat supabase.auth.updateUser di
  // halaman ResetPassword. Fungsi ini hanya mengurus akun mock lokal.
  const daftar = bacaAkun()
  const indeks = daftar.findIndex((item) => item.user.email.toLowerCase() === target)

  if (indeks !== -1) {
    daftar[indeks].password = passwordBaru
    simpanAkun(daftar)
    return { ok: true, email: target }
  }

  const demo = PENGGUNA_BAWAAN.find((item) => item.email.toLowerCase() === target)
  if (demo) {
    simpanAkun([...daftar, { user: { ...demo }, password: passwordBaru }])
    return { ok: true, email: target }
  }

  throw new ServiceError('Akun dengan email tersebut tidak ditemukan.', {
    status: 404,
    kode: 'PENGGUNA_TIDAK_ADA',
  })
}

export async function penggunaBerdasarkanId(id, opsi = {}) {
  await jeda(opsi.jeda)

  const pengguna = semuaPengguna().find((item) => item.id === id)
  if (!pengguna) {
    throw new ServiceError(`Pengguna ${id} tidak ditemukan.`, {
      status: 404,
      kode: 'PENGGUNA_TIDAK_ADA',
    })
  }

  return { ...pengguna }
}

export async function daftarDosen(opsi = {}) {
  await jeda(opsi.jeda)
  await muatProfil()
  return penggunaDenganRole('dosen')
}

export async function daftarMahasiswa(opsi = {}) {
  await jeda(opsi.jeda)
  await muatProfil()
  return penggunaDenganRole('mahasiswa')
}

export async function daftarAdmin(opsi = {}) {
  await jeda(opsi.jeda)
  await muatProfil()
  return penggunaDenganRole('admin')
}

export function namaPengguna(id) {
  return semuaPengguna().find((item) => item.id === id)?.nama ?? '-'
}

export function penggunaSinkron(id) {
  const pengguna = semuaPengguna().find((item) => item.id === id)
  return pengguna ? { ...pengguna } : null
}
