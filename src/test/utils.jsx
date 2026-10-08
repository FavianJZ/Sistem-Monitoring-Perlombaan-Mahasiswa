import { render } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import App from '@/App'
import { penggunaSinkron } from '@/services/userService'
import { buatJwt } from '@/auth/jwt'

function PenandaLokasi() {
  const lokasi = useLocation()
  return (
    <span data-testid="lokasi-uji" hidden>
      {lokasi.pathname}
      {lokasi.search}
    </span>
  )
}

export const ACUAN_UJI = new Date(2026, 8, 24)

export function buatSesi(idPengguna) {
  const user = penggunaSinkron(idPengguna)
  if (!user) throw new Error(`Pengguna ${idPengguna} tidak ada di data mock.`)

  return { user, token: buatJwt(user) }
}

export const SESI_MAHASISWA = () => buatSesi('mhs-1')
export const SESI_DOSEN = () => buatSesi('dsn-1')
export const SESI_ADMIN = () => buatSesi('adm-1')

export function renderApp(route = '/', { sesi } = {}) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <App sesiAwal={sesi} />
      <PenandaLokasi />
    </MemoryRouter>,
  )
}

export function alamatSekarang(screen) {
  return screen.getByTestId('lokasi-uji').textContent
}
