import { supabase } from '@/lib/supabase'
import { beriTahuPerubahan } from './perubahanData'

/**
 * Penyimpanan lomba di Supabase (tabel public.data_lomba) dengan antarmuka
 * yang sama seperti mockStore, tapi async.
 *
 * - Semua baris yang boleh dibaca (diatur RLS) di-cache di memori.
 * - Perubahan dari pengguna lain masuk lewat Realtime lalu memicu
 *   beriTahuPerubahan(), sehingga halaman memuat ulang sendiri.
 * - Berkas (data: URL dari FileUpload) diunggah ke bucket privat
 *   'berkas-lomba'; record hanya menyimpan path, URL bertanda tangan
 *   dibuat saat data dimuat.
 */

const TABEL = 'data_lomba'
const BUCKET = 'berkas-lomba'
const MASA_URL_DETIK = 60 * 60
const POLA_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

let cache = new Map()
let pemuatan = null
let kanal = null

function salin(nilai) {
  return structuredClone(nilai)
}

/* ------------------------------ berkas ------------------------------ */

function dataUrlKeBlob(dataUrl) {
  const [kepala, isi] = dataUrl.split(',')
  const mime = kepala.match(/data:([^;]+)/)?.[1] ?? 'application/octet-stream'
  const biner = atob(isi)
  const bytes = new Uint8Array(biner.length)
  for (let i = 0; i < biner.length; i += 1) bytes[i] = biner.charCodeAt(i)
  return new Blob([bytes], { type: mime })
}

function namaAman(nama = 'berkas') {
  return nama.normalize('NFKD').replace(/[^\w.-]+/g, '_').slice(-80)
}

async function idPenggunaAktif() {
  const { data } = await supabase.auth.getUser()
  if (!data?.user) throw new Error('Sesi berakhir. Silakan masuk kembali.')
  return data.user.id
}

/** Unggah satu data: URL, kembalikan path di bucket. */
async function unggah(dataUrl, { pemilik, lombaId, nama }) {
  const blob = dataUrlKeBlob(dataUrl)
  const path = `${pemilik}/${lombaId}/${Date.now().toString(36)}-${namaAman(nama)}`
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, { contentType: blob.type, upsert: false })
  if (error) throw new Error(`Gagal mengunggah ${nama ?? 'berkas'}: ${error.message}`)
  return path
}

/** Ubah semua data: URL di record menjadi path Storage sebelum disimpan. */
async function siapkanUntukDisimpan(record, pemilik) {
  const hasil = salin(record)

  hasil.berkas = await Promise.all(
    (hasil.berkas ?? []).map(async (item) => {
      if (typeof item.url === 'string' && item.url.startsWith('data:')) {
        const path = await unggah(item.url, { pemilik, lombaId: hasil.id, nama: item.namaFile })
        return { ...item, path, url: null }
      }
      // URL bertanda tangan bersifat sementara; yang disimpan cukup path-nya.
      return item.path ? { ...item, url: null } : item
    }),
  )

  if (typeof hasil.posterUrl === 'string' && hasil.posterUrl.startsWith('data:')) {
    hasil.posterPath = await unggah(hasil.posterUrl, { pemilik, lombaId: hasil.id, nama: 'poster' })
    hasil.posterUrl = null
  } else if (hasil.posterPath) {
    hasil.posterUrl = null
  }

  return hasil
}

/** Isi url/posterUrl dengan URL bertanda tangan untuk path yang tersimpan. */
async function lengkapiUrl(records) {
  const paths = new Set()
  for (const r of records) {
    if (r.posterPath) paths.add(r.posterPath)
    for (const b of r.berkas ?? []) if (b.path) paths.add(b.path)
  }
  if (paths.size === 0) return records

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrls([...paths], MASA_URL_DETIK)
  if (error) {
    console.warn('[SiMonLomba] gagal membuat URL berkas:', error.message)
    return records
  }
  const peta = new Map((data ?? []).map((d) => [d.path, d.signedUrl]))

  return records.map((r) => ({
    ...r,
    posterUrl: r.posterPath ? (peta.get(r.posterPath) ?? null) : r.posterUrl,
    berkas: (r.berkas ?? []).map((b) => (b.path ? { ...b, url: peta.get(b.path) ?? null } : b)),
  }))
}

/* --------------------------- baris <-> record --------------------------- */

function barisKeRecord(baris) {
  return {
    ...baris.data,
    id: baris.id,
    createdBy: baris.created_by,
    dosenPembimbingId: baris.dosen_pembimbing_id ?? baris.data?.dosenPembimbingId ?? null,
  }
}

function recordKeBaris(record) {
  // eslint-disable-next-line no-unused-vars
  const { id, createdBy, ...data } = record
  const pembimbing = POLA_UUID.test(record.dosenPembimbingId ?? '') ? record.dosenPembimbingId : null
  return { id, dosen_pembimbing_id: pembimbing, data: { ...data, dosenPembimbingId: pembimbing } }
}

async function ambilBaris(id) {
  const { data, error } = await supabase.from(TABEL).select('*').eq('id', id).maybeSingle()
  if (error) throw new Error(error.message)
  return data
}

/* ------------------------------ realtime ------------------------------ */

function pasangRealtime() {
  if (kanal) return
  kanal = supabase
    .channel('simonlomba-data-lomba')
    .on('postgres_changes', { event: '*', schema: 'public', table: TABEL }, async (payload) => {
      try {
        if (payload.eventType === 'DELETE') {
          cache.delete(payload.old?.id)
        } else {
          // Ambil ulang baris lengkap: payload Realtime bisa terpotong untuk jsonb besar.
          const baris = await ambilBaris(payload.new.id)
          if (baris) {
            const [record] = await lengkapiUrl([barisKeRecord(baris)])
            cache.set(record.id, record)
          } else {
            cache.delete(payload.new.id)
          }
        }
        beriTahuPerubahan('realtime')
      } catch (e) {
        console.warn('[SiMonLomba] gagal memproses event realtime:', e.message)
      }
    })
    .subscribe()
}

/** Dipanggil saat login/logout agar cache tidak bocor antar pengguna. */
export function resetCache() {
  cache = new Map()
  pemuatan = null
  if (kanal) {
    supabase.removeChannel(kanal)
    kanal = null
  }
}

async function muat() {
  if (!pemuatan) {
    pemuatan = (async () => {
      const { data, error } = await supabase
        .from(TABEL)
        .select('*')
        .order('dibuat_pada', { ascending: true })
      if (error) {
        pemuatan = null
        throw new Error(`Gagal memuat data lomba: ${error.message}`)
      }
      const records = await lengkapiUrl((data ?? []).map(barisKeRecord))
      cache = new Map(records.map((r) => [r.id, r]))
      pasangRealtime()
    })()
  }
  return pemuatan
}

/* ------------------------------ antarmuka ------------------------------ */

export async function bacaSemua() {
  await muat()
  return salin([...cache.values()])
}

export async function bacaSatu(id) {
  await muat()
  if (!cache.has(id)) {
    // Bisa saja baris baru belum sempat masuk lewat Realtime.
    const baris = await ambilBaris(id)
    if (!baris) return null
    const [record] = await lengkapiUrl([barisKeRecord(baris)])
    cache.set(id, record)
  }
  return salin(cache.get(id))
}

export async function idLombaBaru() {
  const acak = crypto.getRandomValues(new Uint32Array(1))[0].toString(36)
  return `lomba-${Date.now().toString(36)}${acak}`
}

async function simpanKeServer(record, { baru }) {
  // Berkas selalu diunggah ke folder milik pengunggah (syarat policy Storage).
  const uid = await idPenggunaAktif()
  const siap = await siapkanUntukDisimpan(record, uid)
  const baris = recordKeBaris(siap)

  const kueri = baru
    ? supabase.from(TABEL).insert({ ...baris, created_by: uid })
    : supabase.from(TABEL).update({ dosen_pembimbing_id: baris.dosen_pembimbing_id, data: baris.data }).eq('id', siap.id)

  const { data, error } = await kueri.select('*').single()
  if (error) {
    const pesan = error.code === '42501' || /row-level security/i.test(error.message)
      ? 'Anda tidak punya izin untuk menyimpan data lomba ini.'
      : error.message
    throw new Error(`Gagal menyimpan lomba: ${pesan}`)
  }

  const [hasil] = await lengkapiUrl([barisKeRecord(data)])
  cache.set(hasil.id, hasil)
  beriTahuPerubahan('lokal')
  return salin(hasil)
}

export async function tambah(record) {
  await muat()
  return simpanKeServer(record, { baru: true })
}

export async function perbarui(id, pengubah) {
  const lama = await bacaSatu(id)
  if (!lama) return null
  return simpanKeServer({ ...pengubah(lama), id, createdBy: lama.createdBy }, { baru: false })
}

export async function hapus(id) {
  const lama = await bacaSatu(id)
  if (!lama) return false

  const { error, count } = await supabase.from(TABEL).delete({ count: 'exact' }).eq('id', id)
  if (error) throw new Error(`Gagal menghapus lomba: ${error.message}`)
  if (!count) return false

  const paths = [lama.posterPath, ...(lama.berkas ?? []).map((b) => b.path)].filter(Boolean)
  if (paths.length) await supabase.storage.from(BUCKET).remove(paths)

  cache.delete(id)
  beriTahuPerubahan('lokal')
  return true
}
