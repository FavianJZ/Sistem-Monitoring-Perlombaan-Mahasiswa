import { supabase } from '@/lib/supabase'
import { beriTahuPerubahan } from './perubahanData'

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

export function dataUrlKeBlob(dataUrl) {
  const pemisah = dataUrl.indexOf(',')
  const kepala = dataUrl.slice(0, pemisah)
  const isi = dataUrl.slice(pemisah + 1)
  const mime = kepala.match(/data:([^;,]+)/)?.[1] ?? 'application/octet-stream'

  if (!kepala.includes(';base64')) {
    return new Blob([decodeURIComponent(isi)], { type: mime })
  }

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

async function unggah(dataUrl, { pemilik, lombaId, nama }) {
  const blob = dataUrlKeBlob(dataUrl)
  const path = `${pemilik}/${lombaId}/${Date.now().toString(36)}-${namaAman(nama)}`
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, { contentType: blob.type, upsert: false })
  if (error) throw new Error(`Gagal mengunggah ${nama ?? 'berkas'}: ${error.message}`)
  return path
}

async function siapkanUntukDisimpan(record, pemilik) {
  const hasil = salin(record)
  const pathPerDataUrl = new Map()

  hasil.berkas = await Promise.all(
    (hasil.berkas ?? []).map(async (item) => {
      if (typeof item.url === 'string' && item.url.startsWith('data:')) {
        const path = await unggah(item.url, { pemilik, lombaId: hasil.id, nama: item.namaFile })
        pathPerDataUrl.set(item.url, path)
        return { ...item, path, url: null }
      }
      return item.path ? { ...item, url: null } : item
    }),
  )

  if (typeof hasil.posterUrl === 'string' && hasil.posterUrl.startsWith('data:')) {
    hasil.posterPath =
      pathPerDataUrl.get(hasil.posterUrl) ??
      (await unggah(hasil.posterUrl, { pemilik, lombaId: hasil.id, nama: 'poster' }))
    hasil.posterUrl = null
  } else if (hasil.posterPath) {
    hasil.posterUrl = null
  }

  return hasil
}

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

function barisKeRecord(baris) {
  return {
    ...baris.data,
    id: baris.id,
    createdBy: baris.created_by,
    dosenPembimbingId: baris.dosen_pembimbing_id ?? baris.data?.dosenPembimbingId ?? null,
  }
}

function recordKeBaris(record) {
  const { id, createdBy, ...data } = record
  const pembimbing = POLA_UUID.test(record.dosenPembimbingId ?? '') ? record.dosenPembimbingId : null
  return { id, dosen_pembimbing_id: pembimbing, data: { ...data, dosenPembimbingId: pembimbing } }
}

async function ambilBaris(id) {
  const { data, error } = await supabase.from(TABEL).select('*').eq('id', id).maybeSingle()
  if (error) throw new Error(error.message)
  return data
}

function pasangRealtime() {
  if (kanal) return
  kanal = supabase
    .channel('simonlomba-data-lomba')
    .on('postgres_changes', { event: '*', schema: 'public', table: TABEL }, async (payload) => {
      try {
        if (payload.eventType === 'DELETE') {
          cache.delete(payload.old?.id)
        } else {
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

export function resetCache() {
  cache = new Map()
  pemuatan = null
  if (kanal) {
    supabase.removeChannel(kanal)
    kanal = null
  }
}

export const UKURAN_HALAMAN_SERVER = 1000

export async function ambilSemuaHalaman(buatKueri, ukuran = UKURAN_HALAMAN_SERVER) {
  const semua = []
  for (let dari = 0; ; dari += ukuran) {
    const { data, error } = await buatKueri().range(dari, dari + ukuran - 1)
    if (error) return { data: null, error }
    semua.push(...(data ?? []))
    if (!data || data.length < ukuran) return { data: semua, error: null }
  }
}

async function muat() {
  if (!pemuatan) {
    pemuatan = (async () => {
      const { data, error } = await ambilSemuaHalaman(() =>
        supabase.from(TABEL).select('*').order('dibuat_pada', { ascending: true }).order('id'),
      )
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

export async function bacaSemua() {
  await muat()
  return salin([...cache.values()])
}

export async function bacaSatu(id) {
  await muat()
  if (!cache.has(id)) {
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

export function pesanGalatSimpan(error) {
  if (error?.code === 'PGRST116') {
    return 'Anda tidak punya izin mengubah lomba ini. Hanya pemilik dan dosen pembimbingnya yang bisa.'
  }
  if (error?.code === '42501') {
    return /row-level security/i.test(error.message ?? '')
      ? 'Anda tidak punya izin untuk menyimpan data lomba ini.'
      : error.message
  }
  return error?.message ?? 'Terjadi kesalahan tak dikenal.'
}

export const GALAT_BENTROK = 'BENTROK'

function pathBerkas(record) {
  return [record?.posterPath, ...(record?.berkas ?? []).map((b) => b.path)].filter(Boolean)
}

async function hapusBerkasStorage(paths) {
  if (!paths.length) return
  const { error } = await supabase.storage.from(BUCKET).remove(paths)
  if (error) console.warn('[SiMonLomba] gagal menghapus berkas lama:', error.message)
}

async function simpanKeServer(record, { baru, versi = null }) {
  const uid = await idPenggunaAktif()
  const siap = await siapkanUntukDisimpan(record, uid)
  const baris = recordKeBaris(siap)

  let kueri
  if (baru) {
    kueri = supabase.from(TABEL).insert({ ...baris, created_by: uid })
  } else {
    kueri = supabase
      .from(TABEL)
      .update({ dosen_pembimbing_id: baris.dosen_pembimbing_id, data: baris.data })
      .eq('id', siap.id)
    if (versi) kueri = kueri.eq('diperbarui_pada', versi)
  }

  const { data, error } = await kueri.select('*').maybeSingle()
  if (error) throw new Error(`Gagal menyimpan lomba: ${pesanGalatSimpan(error)}`)
  if (!data) {
    if (versi) {
      const galat = new Error('Data lomba baru saja diubah orang lain.')
      galat.kode = GALAT_BENTROK
      throw galat
    }
    throw new Error(`Gagal menyimpan lomba: ${pesanGalatSimpan({ code: 'PGRST116' })}`)
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

const PERCOBAAN_SIMPAN = 3

export async function perbarui(id, pengubah) {
  await muat()
  for (let percobaan = 1; ; percobaan += 1) {
    const baris = await ambilBaris(id)
    if (!baris) {
      cache.delete(id)
      return null
    }
    const lama = barisKeRecord(baris)
    try {
      const hasil = await simpanKeServer(
        { ...pengubah(salin(lama)), id, createdBy: lama.createdBy },
        { baru: false, versi: baris.diperbarui_pada },
      )
      const sisa = new Set(pathBerkas(hasil))
      await hapusBerkasStorage(pathBerkas(lama).filter((p) => !sisa.has(p)))
      return hasil
    } catch (galat) {
      if (galat.kode !== GALAT_BENTROK || percobaan >= PERCOBAAN_SIMPAN) {
        if (galat.kode === GALAT_BENTROK) {
          throw new Error(
            'Gagal menyimpan lomba: data ini sedang diubah orang lain. Muat ulang halaman lalu coba lagi.',
          )
        }
        throw galat
      }
    }
  }
}

export async function hapus(id) {
  const lama = await bacaSatu(id)
  if (!lama) return false

  const { error, count } = await supabase.from(TABEL).delete({ count: 'exact' }).eq('id', id)
  if (error) throw new Error(`Gagal menghapus lomba: ${error.message}`)
  if (!count) return false

  await hapusBerkasStorage(pathBerkas(lama))

  cache.delete(id)
  beriTahuPerubahan('lokal')
  return true
}
