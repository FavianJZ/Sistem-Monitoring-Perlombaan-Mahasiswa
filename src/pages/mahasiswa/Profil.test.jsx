import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderApp, SESI_MAHASISWA } from '@/test/utils'
import { Avatar, inisialNama } from '@/components/ui/Avatar'
import { UKURAN_FOTO_MAKS, validasiFileFoto } from '@/lib/fotoProfil'

vi.mock('@/lib/fotoProfil', async (asli) => ({
  ...(await asli()),
  kecilkanFoto: vi.fn(async () => new Blob(['foto'], { type: 'image/webp' })),
}))

function berkas(nama, tipe, ukuran = 10) {
  const file = new File(['x'], nama, { type: tipe })
  Object.defineProperty(file, 'size', { value: ukuran })
  return file
}

describe('validasiFileFoto', () => {
  it('menerima JPG, PNG, dan WebP', () => {
    expect(validasiFileFoto(berkas('a.jpg', 'image/jpeg'))).toBeNull()
    expect(validasiFileFoto(berkas('a.png', 'image/png'))).toBeNull()
    expect(validasiFileFoto(berkas('a.webp', 'image/webp'))).toBeNull()
  })

  it('menolak berkas kosong, bukan gambar, SVG, dan yang terlalu besar', () => {
    expect(validasiFileFoto(null)).toMatch(/Pilih berkas/)
    expect(validasiFileFoto(berkas('a.pdf', 'application/pdf'))).toMatch(/JPG, PNG, atau WebP/)
    expect(validasiFileFoto(berkas('a.svg', 'image/svg+xml'))).toMatch(/JPG, PNG, atau WebP/)
    expect(validasiFileFoto(berkas('a.jpg', 'image/jpeg', UKURAN_FOTO_MAKS + 1))).toMatch(/5 MB/)
  })
})

describe('Avatar', () => {
  it('menampilkan inisial bila belum ada foto', () => {
    render(<Avatar nama="User Mahasiswa Satu" />)
    expect(screen.getByText('UM')).toBeInTheDocument()
    expect(inisialNama('')).toBe('')
  })

  it('menampilkan foto bila ada', () => {
    render(<Avatar nama="User-Mahasiswa(1)" src="https://contoh.test/foto.webp" />)
    expect(screen.getByRole('img', { name: 'Foto profil User-Mahasiswa(1)' })).toHaveAttribute(
      'src',
      'https://contoh.test/foto.webp',
    )
  })
})

describe('Halaman profil', () => {
  it('mengunggah lalu menghapus foto profil', async () => {
    const pengguna = userEvent.setup()
    renderApp('/profil', { sesi: SESI_MAHASISWA() })

    await pengguna.upload(await screen.findByLabelText('Pilih foto profil'), berkas('saya.png', 'image/png'))
    expect(await screen.findByText('Foto profil diperbarui')).toBeInTheDocument()
    expect(screen.getAllByRole('img', { name: /Foto profil/ }).length).toBeGreaterThan(0)

    await pengguna.click(screen.getByRole('button', { name: /Hapus foto/ }))
    expect(await screen.findByText('Foto profil dihapus')).toBeInTheDocument()
    expect(screen.queryAllByRole('img', { name: /Foto profil/ })).toHaveLength(0)
  })

  it('menolak berkas yang bukan gambar', async () => {
    const pengguna = userEvent.setup({ applyAccept: false })
    renderApp('/profil', { sesi: SESI_MAHASISWA() })

    await pengguna.upload(await screen.findByLabelText('Pilih foto profil'), berkas('catatan.txt', 'text/plain'))
    expect(await screen.findByRole('alert')).toHaveTextContent('Foto harus berformat JPG, PNG, atau WebP.')
  })
})
