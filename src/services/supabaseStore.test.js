import { describe, expect, it } from 'vitest'
import { dataUrlKeBlob, pesanGalatSimpan } from './supabaseStore'

describe('dataUrlKeBlob', () => {
  it('membaca data URL base64 beserta tipe berkasnya', async () => {
    const blob = dataUrlKeBlob('data:image/png;base64,SGFsbw==')

    expect(blob.type).toBe('image/png')
    expect(await blob.text()).toBe('Halo')
  })

  it('membaca data URL teks yang di-percent-encode tanpa melempar galat', async () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg"><text>A, B & C</text></svg>'
    const blob = dataUrlKeBlob(`data:image/svg+xml;utf8,${encodeURIComponent(svg)}`)

    expect(blob.type).toBe('image/svg+xml')
    expect(await blob.text()).toBe(svg)
  })

  it('menolak isi base64 yang rusak', () => {
    expect(() => dataUrlKeBlob('data:image/png;base64,%%%')).toThrow()
  })
})

describe('pesanGalatSimpan', () => {
  it('menjelaskan update yang disaring RLS, bukan pesan PostgREST mentah', () => {
    const pesan = pesanGalatSimpan({ code: 'PGRST116', message: 'Cannot coerce the result to a single JSON object' })
    expect(pesan).toMatch(/tidak punya izin mengubah lomba ini/)
    expect(pesan).not.toMatch(/coerce/)
  })

  it('meneruskan pesan trigger database dan menerjemahkan pesan RLS bawaan', () => {
    expect(pesanGalatSimpan({ code: '42501', message: 'Dosen hanya boleh memverifikasi berkas lomba.' })).toBe(
      'Dosen hanya boleh memverifikasi berkas lomba.',
    )
    expect(
      pesanGalatSimpan({ code: '42501', message: 'new row violates row-level security policy for table "data_lomba"' }),
    ).toBe('Anda tidak punya izin untuk menyimpan data lomba ini.')
  })
})
