import { jeda } from './delay'
import { ServiceError } from './competitionService'
import { SANDI_DEMO, SEMUA_PENGGUNA } from '@/data/users'
import { validasiRegistrasi } from '@/auth/validasiRegistrasi'
import { buatJwt } from '@/auth/jwt'
import { MODE_DEMO } from '@/config/mode'
import { supabase, apakahSupabaseAktif } from '@/lib/supabase'
import { beriTahuPerubahan } from './perubahanData'
import { ambilSemuaHalaman } from './supabaseStore'
import { blobKeDataUrl } from '@/lib/fotoProfil'

const PENGGUNA_BAWAAN = MODE_DEMO ? SEMUA_PENGGUNA : []

export const KUNCI_AKUN = 'simonlomba.akun'

export const KUNCI_FOTO = 'simonlomba.foto'

const BUCKET_FOTO = 'avatar'

export const KODE_ADMIN_DEMO = MODE_DEMO ? 'PRODI2026' : null

export const KODE_DOSEN_DEMO = MODE_DEMO ? 'DOSEN2026' : null

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

function bacaFotoMock() {
  try {
    const mentah = window.localStorage.getItem(KUNCI_FOTO)
    const peta = mentah ? JSON.parse(mentah) : {}
    return peta && typeof peta === 'object' ? peta : {}
  } catch {
    return {}
  }
}

function simpanFotoMock(peta) {
  try {
    window.localStorage.setItem(KUNCI_FOTO, JSON.stringify(peta))
  } catch {
    throw new ServiceError('Penyimpanan peramban penuh. Foto tidak bisa disimpan.', { status: 507 })
  }
}

function denganFotoMock(pengguna) {
  const foto = bacaFotoMock()[pengguna.id]
  return foto ? { ...pengguna, avatarUrl: foto } : pengguna
}

function semuaPengguna() {
  if (apakahSupabaseAktif()) return [...PENGGUNA_BAWAAN, ...cacheProfil.values()]
  return [...PENGGUNA_BAWAAN, ...bacaAkun().map((item) => item.user)].map(denganFotoMock)
}

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
    ...(baris.avatar_url ? { avatarUrl: baris.avatar_url } : {}),
  }
}

export function muatProfil() {
  if (!apakahSupabaseAktif()) return Promise.resolve()
  if (!pemuatanProfil) {
    pemuatanProfil = (async () => {
      const { data, error } = await ambilSemuaHalaman(() =>
        supabase
          .from('profiles')
          .select('id, nama, email, role, nim, angkatan, prodi, avatar_url')
          .order('id'),
      )
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

export async function ambilProfil(id) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, nama, email, role, nim, angkatan, prodi, avatar_url')
    .eq('id', id)
    .maybeSingle()
  if (error) throw new ServiceError(`Gagal memuat profil: ${error.message}`, { status: 500 })
  if (!data) return null
  const profil = barisKeProfil(data)
  cacheProfil.set(profil.id, profil)
  return profil
}

function penggunaDenganRole(role) {
  const sumber = apakahSupabaseAktif() ? [...cacheProfil.values()] : semuaPengguna()
  return sumber
    .filter((item) => item.role === role)
    .map((item) => ({ ...item }))
}

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

  return { user: denganFotoMock({ ...pengguna }), token: buatToken(pengguna) }
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

  const sisa = bacaAkun().filter(
    (item) =>
      item.user.email.toLowerCase() !== user.email && !(user.nim && item.user.nim === user.nim),
  )
  simpanAkun([...sisa, { user, password: data.password }])

  return { user: { ...user }, token: buatToken(user) }
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

export const PERAN_AKUN = ['mahasiswa', 'dosen', 'admin']

export async function daftarSemuaPengguna(opsi = {}) {
  await jeda(opsi.jeda)
  await muatProfil()
  const sumber = apakahSupabaseAktif() ? [...cacheProfil.values()] : semuaPengguna()
  return sumber
    .map((item) => ({ ...item, demo: !apakahSupabaseAktif() && !bacaAkun().some((a) => a.user.id === item.id) }))
    .sort((a, b) => a.nama.localeCompare(b.nama, 'id-ID'))
}

function ubahAkunMock(id, ubah) {
  const daftar = bacaAkun()
  const indeks = daftar.findIndex((item) => item.user.id === id)
  if (indeks === -1) {
    throw new ServiceError('Akun demo bawaan tidak bisa diubah.', { status: 403 })
  }
  daftar[indeks] = { ...daftar[indeks], user: ubah({ ...daftar[indeks].user }) }
  simpanAkun(daftar)
  beriTahuPerubahan('profil')
}

async function panggilRpcAdmin(nama, args) {
  const { error } = await supabase.rpc(nama, args)
  if (error) throw new ServiceError(error.message, { status: error.code === '42501' ? 403 : 400 })
  const { data } = await supabase
    .from('profiles')
    .select('id, nama, email, role, nim, angkatan, prodi, avatar_url')
    .eq('id', args.p_pengguna)
    .maybeSingle()
  if (data) cacheProfil.set(data.id, barisKeProfil(data))
  beriTahuPerubahan('profil')
}

export async function ubahPeranAkun(admin, id, peran) {
  if (admin?.role !== 'admin') {
    throw new ServiceError('Hanya admin yang boleh mengubah peran akun.', { status: 403 })
  }
  if (!PERAN_AKUN.includes(peran)) throw new ServiceError('Peran tidak dikenal.', { status: 400 })
  if (admin.id === id) {
    throw new ServiceError('Admin tidak bisa mengubah perannya sendiri.', { status: 403 })
  }
  if (apakahSupabaseAktif()) {
    await panggilRpcAdmin('admin_ubah_peran', { p_pengguna: id, p_peran: peran })
    return
  }
  ubahAkunMock(id, (user) => {
    const { nim, angkatan, ...lain } = user
    return peran === 'mahasiswa' ? { ...user, role: peran } : { ...lain, role: peran }
  })
}

export async function kosongkanNimAkun(admin, id) {
  if (admin?.role !== 'admin') {
    throw new ServiceError('Hanya admin yang boleh mengosongkan NIM.', { status: 403 })
  }
  if (apakahSupabaseAktif()) {
    await panggilRpcAdmin('admin_kosongkan_nim', { p_pengguna: id })
    return
  }
  ubahAkunMock(id, (user) => {
    const { nim, angkatan, ...lain } = user
    return lain
  })
}

export function namaPengguna(id) {
  return semuaPengguna().find((item) => item.id === id)?.nama ?? '-'
}

export function penggunaSinkron(id) {
  const pengguna = semuaPengguna().find((item) => item.id === id)
  return pengguna ? { ...pengguna } : null
}

async function hapusFotoLamaSupabase(userId, kecuali) {
  const { data, error } = await supabase.storage.from(BUCKET_FOTO).list(userId)
  if (error) return
  const lama = (data ?? []).map((item) => `${userId}/${item.name}`).filter((jalur) => jalur !== kecuali)
  if (lama.length) await supabase.storage.from(BUCKET_FOTO).remove(lama)
}

export async function simpanFotoProfil(userId, blob) {
  if (!apakahSupabaseAktif()) {
    const peta = bacaFotoMock()
    peta[userId] = await blobKeDataUrl(blob)
    simpanFotoMock(peta)
    beriTahuPerubahan('profil')
    return peta[userId]
  }

  const jalur = `${userId}/${Date.now().toString(36)}.webp`
  const unggah = await supabase.storage
    .from(BUCKET_FOTO)
    .upload(jalur, blob, { contentType: 'image/webp', cacheControl: '31536000' })
  if (unggah.error) {
    throw new ServiceError(`Foto gagal diunggah: ${unggah.error.message}`, { status: 500 })
  }

  const url = supabase.storage.from(BUCKET_FOTO).getPublicUrl(jalur).data.publicUrl
  const { error } = await supabase.from('profiles').update({ avatar_url: url }).eq('id', userId)
  if (error) {
    await supabase.storage.from(BUCKET_FOTO).remove([jalur])
    throw new ServiceError(`Foto gagal disimpan: ${error.message}`, { status: 500 })
  }

  await hapusFotoLamaSupabase(userId, jalur)
  const lama = cacheProfil.get(userId)
  if (lama) cacheProfil.set(userId, { ...lama, avatarUrl: url })
  beriTahuPerubahan('profil')
  return url
}

export async function hapusFotoProfil(userId) {
  if (!apakahSupabaseAktif()) {
    const peta = bacaFotoMock()
    delete peta[userId]
    simpanFotoMock(peta)
    beriTahuPerubahan('profil')
    return
  }

  const { error } = await supabase.from('profiles').update({ avatar_url: null }).eq('id', userId)
  if (error) throw new ServiceError(`Foto gagal dihapus: ${error.message}`, { status: 500 })

  await hapusFotoLamaSupabase(userId, null)
  const lama = cacheProfil.get(userId)
  if (lama) {
    const { avatarUrl: _, ...tanpaFoto } = lama
    cacheProfil.set(userId, tanpaFoto)
  }
  beriTahuPerubahan('profil')
}

const POLA_FOTO_GOOGLE = /^https:\/\/lh3\.googleusercontent\.com\/[A-Za-z0-9._~/=-]+$/

export function fotoGoogleSah(url) {
  return typeof url === 'string' && POLA_FOTO_GOOGLE.test(url)
}

export async function sinkronFotoGoogle(userId, url) {
  if (!apakahSupabaseAktif() || !fotoGoogleSah(url)) return null
  const { error } = await supabase
    .from('profiles')
    .update({ avatar_url: url })
    .eq('id', userId)
    .is('avatar_url', null)
  if (error) {
    console.warn('[SiMonLomba] gagal menyimpan foto Google:', error.message)
    return null
  }
  const lama = cacheProfil.get(userId)
  if (lama && !lama.avatarUrl) cacheProfil.set(userId, { ...lama, avatarUrl: url })
  return url
}

export function validasiLengkapiProfil({ nim, angkatan, prodi }) {
  const galat = {}
  const tahunIni = new Date().getFullYear()
  if (!/^\d{10}$/.test(String(nim ?? ''))) galat.nim = 'NIM harus 10 digit angka.'
  const tahun = Number(angkatan)
  if (!Number.isInteger(tahun) || tahun < 2000 || tahun > tahunIni) galat.angkatan = 'Angkatan tidak valid.'
  if (!String(prodi ?? '').trim()) galat.prodi = 'Program studi wajib dipilih.'
  return galat
}

export async function lengkapiProfil(userId, data) {
  const galat = validasiLengkapiProfil(data)
  const pertama = Object.values(galat)[0]
  if (pertama) throw new ServiceError(pertama, { status: 422, kode: 'DATA_TIDAK_VALID' })

  const nim = String(data.nim).trim()
  const angkatan = Number(data.angkatan)
  const prodi = String(data.prodi).trim()

  if (!apakahSupabaseAktif()) {
    if (nimTerpakai(nim)) throw new ServiceError('NIM ini sudah dipakai akun lain. Bila ini NIM Anda, hubungi admin program studi.', { status: 409 })
    const daftar = bacaAkun()
    const akun = daftar.find((item) => item.user.id === userId)
    if (akun) {
      akun.user = { ...akun.user, nim, angkatan, prodi }
      simpanAkun(daftar)
    }
    return { nim, angkatan, prodi }
  }

  const { error } = await supabase.rpc('lengkapi_profil', {
    p_nim: nim,
    p_angkatan: angkatan,
    p_prodi: prodi,
  })
  if (error) {
    const duplikat = error.code === '23505' || /sudah terdaftar/i.test(error.message)
    throw new ServiceError(duplikat ? 'NIM ini sudah dipakai akun lain. Bila ini NIM Anda, hubungi admin program studi.' : error.message, {
      status: duplikat ? 409 : 422,
    })
  }
  const lama = cacheProfil.get(userId)
  if (lama) cacheProfil.set(userId, { ...lama, nim, angkatan, prodi })
  return { nim, angkatan, prodi }
}
