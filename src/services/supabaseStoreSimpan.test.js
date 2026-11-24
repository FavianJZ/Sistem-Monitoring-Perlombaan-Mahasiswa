import { beforeEach, describe, expect, it, vi } from 'vitest'

const palsu = vi.hoisted(() => {
  const db = { baris: new Map(), sebelumUpdate: [], versi: 0 }
  const dihapus = []
  const diunggah = []

  function kueri() {
    const st = { filter: [], op: 'select', isi: null, rentang: null }
    const cocok = (r) => st.filter.every(([k, v]) => r[k] === v)
    function jalan(tunggal) {
      if (st.op === 'update') {
        const kait = db.sebelumUpdate.shift()
        if (kait) kait(db)
        const kena = [...db.baris.values()].filter(cocok)
        for (const r of kena) {
          Object.assign(r, structuredClone(st.isi))
          db.versi += 1
          r.diperbarui_pada = `v${db.versi}`
        }
        return { data: tunggal ? (kena[0] ? structuredClone(kena[0]) : null) : kena, error: null }
      }
      let hasil = [...db.baris.values()].filter(cocok)
      if (st.rentang) hasil = hasil.slice(st.rentang[0], st.rentang[1] + 1)
      return {
        data: tunggal ? (hasil[0] ? structuredClone(hasil[0]) : null) : structuredClone(hasil),
        error: null,
      }
    }
    const b = {
      select: () => b,
      order: () => b,
      eq: (k, v) => (st.filter.push([k, v]), b),
      range: (a, z) => ((st.rentang = [a, z]), b),
      update: (isi) => ((st.op = 'update'), (st.isi = isi), b),
      maybeSingle: () => Promise.resolve(jalan(true)),
      then: (ok, gagal) => Promise.resolve(jalan(false)).then(ok, gagal),
    }
    return b
  }

  const supabase = {
    from: () => kueri(),
    auth: { getUser: async () => ({ data: { user: { id: 'uid-1' } } }) },
    storage: {
      from: () => ({
        upload: async (path) => (diunggah.push(path), { error: null }),
        remove: async (paths) => (dihapus.push(...paths), { error: null }),
        createSignedUrls: async (paths) => ({
          data: paths.map((path) => ({ path, signedUrl: `https://tanda/${path}` })),
          error: null,
        }),
      }),
    },
    channel: () => ({ on: function () { return this }, subscribe: () => ({}) }),
    removeChannel: () => {},
  }
  return { db, dihapus, diunggah, supabase }
})

vi.mock('@/lib/supabase', () => ({ supabase: palsu.supabase, apakahSupabaseAktif: () => true }))

const { ambilSemuaHalaman, bacaSemua, perbarui, resetCache } = await import('./supabaseStore')

function isiBaris(data) {
  palsu.db.baris.set('lomba-1', {
    id: 'lomba-1',
    created_by: 'uid-1',
    dosen_pembimbing_id: null,
    dibuat_pada: '2026-11-01',
    diperbarui_pada: 'v0',
    data,
  })
}

const BERKAS_AWAL = {
  id: 'b1',
  tipe: 'bukti_daftar',
  path: 'uid-1/lomba-1/lama.pdf',
  url: null,
  statusVerifikasi: 'menunggu',
}

beforeEach(() => {
  resetCache()
  palsu.db.baris.clear()
  palsu.db.sebelumUpdate.length = 0
  palsu.dihapus.length = 0
  palsu.diunggah.length = 0
  isiBaris({ nama: 'Lomba A', berkas: [BERKAS_AWAL] })
})

describe('perbarui lomba di Supabase', () => {
  it('memakai data segar dari server, bukan cache lama, sehingga verifikasi dosen tidak tertimpa', async () => {
    await bacaSemua()
    palsu.db.baris.get('lomba-1').data.berkas[0].statusVerifikasi = 'diterima'
    palsu.db.baris.get('lomba-1').diperbarui_pada = 'v-dosen'

    const hasil = await perbarui('lomba-1', (r) => ({ ...r, nama: 'Lomba B' }))

    expect(hasil.nama).toBe('Lomba B')
    expect(hasil.berkas[0].statusVerifikasi).toBe('diterima')
  })

  it('mengulang perubahan bila baris diubah orang lain di tengah penyimpanan', async () => {
    palsu.db.sebelumUpdate.push((db) => {
      const r = db.baris.get('lomba-1')
      r.data = { ...r.data, berkas: [{ ...BERKAS_AWAL, statusVerifikasi: 'diterima' }] }
      r.diperbarui_pada = 'v-dosen'
    })
    const pengubah = vi.fn((r) => ({ ...r, nama: 'Lomba B' }))

    const hasil = await perbarui('lomba-1', pengubah)

    expect(pengubah).toHaveBeenCalledTimes(2)
    expect(hasil.nama).toBe('Lomba B')
    expect(hasil.berkas[0].statusVerifikasi).toBe('diterima')
  })

  it('menyerah dengan pesan jelas bila bentrok terus terjadi', async () => {
    const ubahLagi = (db) => {
      db.baris.get('lomba-1').diperbarui_pada = `lain-${Math.random()}`
    }
    palsu.db.sebelumUpdate.push(ubahLagi, ubahLagi, ubahLagi)

    await expect(perbarui('lomba-1', (r) => ({ ...r, nama: 'X' }))).rejects.toThrow(
      /sedang diubah orang lain/,
    )
    expect(palsu.db.baris.get('lomba-1').data.nama).toBe('Lomba A')
  })

  it('menghapus berkas lama dari storage setelah diganti unggahan baru', async () => {
    const hasil = await perbarui('lomba-1', (r) => ({
      ...r,
      berkas: [{ ...r.berkas[0], path: undefined, url: 'data:application/pdf;base64,SGFsbw==' }],
    }))

    expect(palsu.diunggah).toHaveLength(1)
    expect(hasil.berkas[0].path).toBe(palsu.diunggah[0])
    expect(palsu.dihapus).toEqual(['uid-1/lomba-1/lama.pdf'])
  })

  it('tidak menghapus berkas apa pun bila hanya data teks yang berubah', async () => {
    await perbarui('lomba-1', (r) => ({ ...r, nama: 'Lomba B' }))
    expect(palsu.dihapus).toEqual([])
  })

  it('mengembalikan null bila lomba sudah dihapus di server', async () => {
    palsu.db.baris.clear()
    expect(await perbarui('lomba-1', (r) => r)).toBeNull()
  })
})

describe('ambilSemuaHalaman', () => {
  function sumber(jumlah, galatPada = null) {
    const data = Array.from({ length: jumlah }, (_, i) => ({ i }))
    return () => ({
      range: async (a, z) =>
        galatPada !== null && a >= galatPada
          ? { data: null, error: { message: 'putus' } }
          : { data: data.slice(a, z + 1), error: null },
    })
  }

  it('mengambil lebih dari satu halaman sampai habis', async () => {
    const { data, error } = await ambilSemuaHalaman(sumber(2500), 1000)
    expect(error).toBeNull()
    expect(data).toHaveLength(2500)
    expect(data.at(-1)).toEqual({ i: 2499 })
  })

  it('tetap benar saat jumlah baris pas kelipatan ukuran halaman', async () => {
    const { data } = await ambilSemuaHalaman(sumber(2000), 1000)
    expect(data).toHaveLength(2000)
  })

  it('meneruskan galat dari halaman berikutnya, bukan data setengah', async () => {
    const { data, error } = await ambilSemuaHalaman(sumber(2500, 1000), 1000)
    expect(data).toBeNull()
    expect(error.message).toBe('putus')
  })
})
