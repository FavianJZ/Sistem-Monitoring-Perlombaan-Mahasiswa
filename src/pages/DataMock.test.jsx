import { beforeEach, describe, expect, it } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ACUAN_UJI, SESI_DOSEN, renderApp } from '@/test/utils'
import { resetDataMock } from '@/services/competitionService'

function renderDataMock() {
  return renderApp('/data-mock', { sesi: SESI_DOSEN() })
}

beforeEach(() => {
  resetDataMock(ACUAN_UJI)
})

describe('Halaman Data Mock', () => {
  it('menampilkan ringkasan dan tabel dari layer service', async () => {
    renderDataMock()

    expect(await screen.findByText('Seluruh lomba (20)')).toBeInTheDocument()
    expect(screen.getByText('Total lomba')).toBeInTheDocument()
    // Nama lomba muncul di tabel dan bisa juga muncul di panel agenda.
    expect(screen.getAllByText('GEMASTIK XIX Divisi Pemrograman').length).toBeGreaterThan(0)
    expect(screen.getByText('Agenda enam tahapan terdekat')).toBeInTheDocument()
  })

  it('menampilkan indikator dokumen belum lengkap beserta rinciannya', async () => {
    renderDataMock()
    await screen.findByText('Seluruh lomba (20)')

    expect(screen.getAllByText('Dokumen Belum Lengkap').length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Kurang: Bukti Pembayaran/).length).toBeGreaterThan(0)
  })

  it('tombol setel ulang memuat data kembali', async () => {
    const user = userEvent.setup()
    renderDataMock()
    await screen.findByText('Seluruh lomba (20)')

    await user.click(screen.getByRole('button', { name: 'Setel ulang data' }))

    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent('Data mock disetel ulang'),
    )
    expect(await screen.findByText('Seluruh lomba (20)')).toBeInTheDocument()
  })
})
