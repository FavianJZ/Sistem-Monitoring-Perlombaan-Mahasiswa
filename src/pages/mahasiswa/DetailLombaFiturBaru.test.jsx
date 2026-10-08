import { beforeEach, describe, expect, it } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ACUAN_UJI, SESI_DOSEN, SESI_MAHASISWA, renderApp } from '@/test/utils'
import { resetDataMock } from '@/services/competitionService'

beforeEach(() => {
  resetDataMock(ACUAN_UJI)
})

describe('Fitur Baru Detail Lomba: Edit, View Dokumen, Reject, dan Re-upload', () => {
  it('mahasiswa dapat membuka modal edit lomba dan menyimpan perubahan nama', async () => {
    const user = userEvent.setup()
    renderApp('/lomba-saya/lomba-01', { sesi: SESI_MAHASISWA() })

    await screen.findByRole('heading', { level: 1, name: /GEMASTIK XIX Divisi Pemrograman/i })

    const tombolEdit = screen.getByRole('button', { name: /Edit Lomba/i })
    await user.click(tombolEdit)

    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Edit Data Perlombaan')).toBeInTheDocument()

    const inputNama = screen.getByLabelText(/Nama Perlombaan/i)
    await user.clear(inputNama)
    await user.type(inputNama, 'Google Solution Challenge 2026 Updated')

    await user.click(screen.getByRole('button', { name: /Simpan Perubahan/i }))

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
    expect(
      screen.getByRole('heading', { level: 1, name: 'Google Solution Challenge 2026 Updated' }),
    ).toBeInTheDocument()
  })

  it('mahasiswa dan dosen dapat membuka pratinjau dokumen (View Dokumen)', async () => {
    const user = userEvent.setup()
    renderApp('/lomba-saya/lomba-01', { sesi: SESI_MAHASISWA() })

    await screen.findByRole('heading', { level: 1, name: /GEMASTIK XIX Divisi Pemrograman/i })

    const tabDokumen = screen.getByRole('tab', { name: /Dokumen/i })
    await user.click(tabDokumen)

    const tombolLihatList = screen.getAllByRole('button', { name: /Lihat Dokumen/i })
    expect(tombolLihatList.length).toBeGreaterThan(0)

    await user.click(tombolLihatList[0])

    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText(/Pratinjau Dokumen:/i)).toBeInTheDocument()

    await user.keyboard('{Escape}')
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })

  it('dosen dapat menolak dokumen dan mahasiswa dapat mengunggah ulang', async () => {
    const user = userEvent.setup()

    renderApp('/monitoring/lomba/lomba-01', { sesi: SESI_DOSEN() })
    await screen.findByRole('heading', { level: 1, name: /GEMASTIK XIX Divisi Pemrograman/i })

    await user.click(screen.getByRole('tab', { name: /Dokumen/i }))

    const tombolTolakList = screen.getAllByRole('button', { name: /^Tolak$/i })
    expect(tombolTolakList.length).toBeGreaterThan(0)
    await user.click(tombolTolakList[0])

    expect(await screen.findByText('Tolak Dokumen')).toBeInTheDocument()

    const inputCatatan = screen.getByLabelText(/Catatan Alasan Penolakan/i)
    await user.type(inputCatatan, 'Kuitansi pembayaran tidak mencantumkan stempel basah.')

    await user.click(screen.getByRole('button', { name: /Konfirmasi Tolak/i }))

    await waitFor(() => {
      expect(screen.queryByText('Tolak Dokumen')).not.toBeInTheDocument()
    })
    expect(screen.getByText('Ditolak')).toBeInTheDocument()
    expect(
      screen.getAllByText(/Kuitansi pembayaran tidak mencantumkan stempel basah./i).length,
    ).toBeGreaterThan(0)
  })
})
