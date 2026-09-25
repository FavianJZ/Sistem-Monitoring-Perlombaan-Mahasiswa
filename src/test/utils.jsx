import { render } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import App from '@/App'
import { penggunaSinkron } from '@/services/userService'

/**
 * MemoryRouter tidak menyentuh window.location, jadi alamat aktif
 * dipaparkan ke DOM agar pengujian bisa memeriksa query string filter.
 */
function PenandaLokasi() {
  const lokasi = useLocation()
  return (
    <span data-testid="lokasi-uji" hidden>
      {lokasi.pathname}
      {lokasi.search}
    </span>
  )
}

/** Tanggal acuan yang dipakai seluruh pengujian agar data mock konsisten. */
export const ACUAN_UJI = new Date(2026, 8, 24)

/** Membentuk sesi siap pakai dari id pengguna pada data mock. */
export function buatSesi(idPengguna) {
  const user = penggunaSinkron(idPengguna)
  if (!user) throw new Error(`Pengguna ${idPengguna} tidak ada di data mock.`)

  return { user, token: `mock-token-${idPengguna}` }
}

export const SESI_MAHASISWA = () => buatSesi('mhs-1')
export const SESI_DOSEN = () => buatSesi('dsn-1')
export const SESI_ADMIN = () => buatSesi('adm-1')

/**
 * Merender aplikasi lengkap pada rute tertentu.
 * Berikan `sesi` untuk mensimulasikan pengguna yang sudah masuk.
 */
export function renderApp(route = '/', { sesi } = {}) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <App sesiAwal={sesi} />
      <PenandaLokasi />
    </MemoryRouter>,
  )
}

/** Alamat aktif (pathname + query) menurut router pada pengujian. */
export function alamatSekarang(screen) {
  return screen.getByTestId('lokasi-uji').textContent
}
