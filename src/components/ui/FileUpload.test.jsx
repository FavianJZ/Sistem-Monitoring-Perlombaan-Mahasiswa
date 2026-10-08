import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FileUpload, metadataBerkas, validasiBerkas } from './FileUpload'
import { UNGGAH_MAKS_BYTE } from '@/config/domain'

function buatFile({ nama = 'bukti.pdf', tipe = 'application/pdf', ukuran = 1024 } = {}) {
  const file = new File(['x'], nama, { type: tipe })

  Object.defineProperty(file, 'size', { value: ukuran })
  return file
}

function Harness({ onPilih, ...props }) {
  const [berkas, setBerkas] = useState(null)

  return (
    <FileUpload
      label="Bukti Pembayaran"
      berkas={berkas}
      onPilih={(meta, file) => {
        setBerkas(meta)
        onPilih?.(meta, file)
      }}
      {...props}
    />
  )
}

describe('validasiBerkas', () => {
  it('menerima PDF, JPG, dan PNG di bawah batas', () => {
    for (const tipe of ['application/pdf', 'image/jpeg', 'image/png']) {
      expect(validasiBerkas(buatFile({ tipe })).valid).toBe(true)
    }
  })

  it('menolak tipe berkas yang tidak didukung', () => {
    const hasil = validasiBerkas(buatFile({ nama: 'data.zip', tipe: 'application/zip' }))

    expect(hasil.valid).toBe(false)
    expect(hasil.pesan).toContain('Tipe berkas tidak didukung')
  })

  it('menolak berkas yang melebihi 5MB', () => {
    const hasil = validasiBerkas(buatFile({ ukuran: 10 * 1024 * 1024 }))

    expect(hasil.valid).toBe(false)
    expect(hasil.pesan).toContain('melebihi batas')
  })

  it('menerima berkas yang tepat pada batas maksimum', () => {
    expect(validasiBerkas(buatFile({ ukuran: UNGGAH_MAKS_BYTE })).valid).toBe(true)
  })

  it('menolak bila tidak ada berkas', () => {
    expect(validasiBerkas(null).valid).toBe(false)
  })
})

describe('metadataBerkas', () => {
  it('hanya mengambil data yang bisa disimpan', () => {
    const meta = metadataBerkas(buatFile({ nama: 'poster.png', tipe: 'image/png', ukuran: 2048 }))

    expect(meta).toEqual({ namaFile: 'poster.png', mimeType: 'image/png', size: 2048 })
  })
})

describe('FileUpload', () => {
  it('menampilkan dropzone beserta batasan berkas', () => {
    render(<Harness />)

    expect(screen.getByText('Tarik berkas ke sini atau pilih dari perangkat')).toBeInTheDocument()
    expect(screen.getByText('PDF, JPG, atau PNG maksimal 5MB')).toBeInTheDocument()
  })

  it('input berkas terhubung dengan labelnya', () => {
    render(<Harness required />)

    const input = screen.getByLabelText(/Bukti Pembayaran/)
    expect(input).toHaveAttribute('type', 'file')
    expect(input).toHaveAttribute('accept', 'application/pdf,image/jpeg,image/png')
  })

  it('menerima berkas yang sah dan menampilkan nama serta ukurannya', async () => {
    const onPilih = vi.fn()
    const user = userEvent.setup()
    render(<Harness onPilih={onPilih} />)

    await user.upload(screen.getByLabelText(/Bukti Pembayaran/), buatFile({ ukuran: 2048 }))

    expect(onPilih).toHaveBeenCalledWith(
      { namaFile: 'bukti.pdf', mimeType: 'application/pdf', size: 2048 },
      expect.any(File),
    )
    expect(screen.getByText('bukti.pdf')).toBeInTheDocument()
    expect(screen.getByText(/2 KB/)).toBeInTheDocument()
  })

  it('menolak berkas 10MB dan menampilkan pesan yang jelas', async () => {
    const onPilih = vi.fn()
    const user = userEvent.setup()
    render(<Harness onPilih={onPilih} />)

    await user.upload(
      screen.getByLabelText(/Bukti Pembayaran/),
      buatFile({ ukuran: 10 * 1024 * 1024 }),
    )

    expect(onPilih).not.toHaveBeenCalled()
    expect(screen.getByText(/melebihi batas 5 MB/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Bukti Pembayaran/)).toHaveAttribute('aria-invalid', 'true')
  })

  it('menolak tipe berkas yang tidak didukung', () => {
    const onPilih = vi.fn()
    render(<Harness onPilih={onPilih} />)

    const dropzone = screen.getByText('Tarik berkas ke sini atau pilih dari perangkat')
      .parentElement
    fireEvent.drop(dropzone, {
      dataTransfer: { files: [buatFile({ nama: 'data.zip', tipe: 'application/zip' })] },
    })

    expect(onPilih).not.toHaveBeenCalled()
    expect(screen.getByText(/Tipe berkas tidak didukung/)).toBeInTheDocument()
  })

  it('menerima berkas yang ditarik ke dropzone', () => {
    const onPilih = vi.fn()
    render(<Harness onPilih={onPilih} />)

    const dropzone = screen.getByText('Tarik berkas ke sini atau pilih dari perangkat').parentElement
    const file = buatFile({ nama: 'poster.png', tipe: 'image/png', ukuran: 4096 })

    fireEvent.dragOver(dropzone)
    fireEvent.drop(dropzone, { dataTransfer: { files: [file] } })

    expect(onPilih).toHaveBeenCalledWith(
      { namaFile: 'poster.png', mimeType: 'image/png', size: 4096 },
      expect.any(File),
    )
  })

  it('tombol pilih berkas dapat dioperasikan dengan keyboard', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    const tombol = screen.getByRole('button', { name: 'Pilih berkas' })
    await user.tab()
    await user.tab()

    expect(tombol).toHaveFocus()
  })

  it('menghapus berkas yang sudah dipilih', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.upload(screen.getByLabelText(/Bukti Pembayaran/), buatFile())
    expect(screen.getByText('bukti.pdf')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Hapus/ }))

    expect(screen.queryByText('bukti.pdf')).not.toBeInTheDocument()
    expect(screen.getByText('Tarik berkas ke sini atau pilih dari perangkat')).toBeInTheDocument()
  })

  it('menyediakan tombol ganti berkas setelah ada berkas', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.upload(screen.getByLabelText(/Bukti Pembayaran/), buatFile())

    expect(screen.getByRole('button', { name: 'Ganti berkas' })).toBeInTheDocument()
  })

  it('menampilkan error dari luar komponen', () => {
    render(<Harness error="Bukti pembayaran wajib diunggah." />)

    expect(screen.getByText('Bukti pembayaran wajib diunggah.')).toBeInTheDocument()
  })

  it('menampilkan teks bantuan bila tidak ada error', () => {
    render(<Harness hint="Bukti transfer atau invoice." />)

    expect(screen.getByLabelText(/Bukti Pembayaran/)).toHaveAccessibleDescription(
      'Bukti transfer atau invoice.',
    )
  })
})
