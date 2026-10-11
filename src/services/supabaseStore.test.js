import { describe, expect, it } from 'vitest'
import { dataUrlKeBlob } from './supabaseStore'

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
