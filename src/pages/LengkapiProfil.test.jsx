import { describe, expect, it } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { alamatSekarang, renderApp, SESI_MAHASISWA, SESI_DOSEN } from '@/test/utils'
import { fotoGoogleSah, validasiLengkapiProfil } from '@/services/userService'

function sesiTanpaNim() {
  const sesi = SESI_MAHASISWA()
  const { nim: _nim, angkatan: _angkatan, ...user } = sesi.user
  return { ...sesi, user: { ...user, id: 'usr-google-1', email: 'user.mahasiswa30@gmail.com' } }
}

describe('validasiLengkapiProfil', () => {
  it('menerima data yang sah', () => {
    expect(validasiLengkapiProfil({ nim: '2502099999', angkatan: '2025', prodi: 'Teknik Informatika' })).toEqual({})
  })

  it('menolak NIM bukan 10 digit, angkatan di luar rentang, dan prodi kosong', () => {
    const galat = validasiLengkapiProfil({ nim: '12345', angkatan: '1999', prodi: ' ' })
    expect(Object.keys(galat).sort()).toEqual(['angkatan', 'nim', 'prodi'])
    expect(validasiLengkapiProfil({ nim: '25020abcde', angkatan: String(new Date().getFullYear() + 1), prodi: 'X' })).toHaveProperty('angkatan')
  })
})

describe('fotoGoogleSah', () => {
  it('hanya menerima foto dari lh3.googleusercontent.com', () => {
    expect(fotoGoogleSah('https://lh3.googleusercontent.com/a/ACg8ocK_abc-123=s96-c')).toBe(true)
    expect(fotoGoogleSah('http://lh3.googleusercontent.com/a/abc')).toBe(false)
    expect(fotoGoogleSah('https://evil.example.com/lh3.googleusercontent.com/a.png')).toBe(false)
    expect(fotoGoogleSah('https://lh3.googleusercontent.com/a/x"onerror=alert(1)')).toBe(false)
    expect(fotoGoogleSah(null)).toBe(false)
  })
})

describe('alur lengkapi profil', () => {
  it('mengarahkan mahasiswa tanpa NIM ke halaman lengkapi profil', async () => {
    renderApp('/lomba-saya', { sesi: sesiTanpaNim() })
    expect(await screen.findByRole('heading', { name: 'Lengkapi profil' })).toBeInTheDocument()
    expect(alamatSekarang(screen)).toBe('/lengkapi-profil')
  })

  it('tidak mengganggu dosen maupun mahasiswa yang sudah punya NIM', async () => {
    renderApp('/lengkapi-profil', { sesi: SESI_MAHASISWA() })
    await waitFor(() => expect(alamatSekarang(screen)).toBe('/'))

    renderApp('/monitoring', { sesi: SESI_DOSEN() })
    expect(await screen.findByRole('heading', { level: 1, name: 'Dashboard Monitoring' })).toBeInTheDocument()
  })

  it('menolak NIM yang salah lalu menyimpan profil yang sah', async () => {
    const pengguna = userEvent.setup()
    renderApp('/lengkapi-profil', { sesi: sesiTanpaNim() })

    await pengguna.type(await screen.findByLabelText(/^NIM/), '12345')
    await pengguna.selectOptions(screen.getByLabelText(/Program studi/), 'Teknik Informatika')
    await pengguna.click(screen.getByRole('button', { name: /Simpan dan lanjutkan/ }))
    expect(await screen.findByText('NIM harus 10 digit angka.')).toBeInTheDocument()
    expect(alamatSekarang(screen)).toBe('/lengkapi-profil')

    await pengguna.clear(screen.getByLabelText(/^NIM/))
    await pengguna.type(screen.getByLabelText(/^NIM/), '2502099999')
    await pengguna.click(screen.getByRole('button', { name: /Simpan dan lanjutkan/ }))
    await waitFor(() => expect(alamatSekarang(screen)).toBe('/'))
  })
})

describe('halaman kebijakan privasi', () => {
  it('bisa dibuka tanpa login dan menjelaskan data Google', async () => {
    renderApp('/privasi')
    expect(await screen.findByRole('heading', { level: 1, name: 'Kebijakan privasi' })).toBeInTheDocument()
    expect(screen.getByText(/hanya menerima nama, alamat email, dan foto profil/)).toBeInTheDocument()
  })
})
