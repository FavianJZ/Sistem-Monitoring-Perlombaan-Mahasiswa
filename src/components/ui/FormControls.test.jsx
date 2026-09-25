import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Input } from './Input'
import { Select } from './Select'
import { Textarea } from './Textarea'

describe('Input', () => {
  it('menghubungkan label dengan kontrol', () => {
    render(<Input label="Nama Perlombaan" />)
    expect(screen.getByLabelText('Nama Perlombaan')).toBeInTheDocument()
  })

  it('menampilkan teks bantuan dan menautkannya lewat aria-describedby', () => {
    render(<Input label="Instansi" hint="Tulis nama resmi penyelenggara." />)

    const input = screen.getByLabelText('Instansi')
    const hint = screen.getByText('Tulis nama resmi penyelenggara.')
    expect(input).toHaveAttribute('aria-describedby', hint.id)
  })

  it('menandai state error dengan aria-invalid dan menggantikan teks bantuan', () => {
    render(<Input label="NIM" hint="10 angka" error="NIM tidak valid." />)

    const input = screen.getByLabelText('NIM')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByText('NIM tidak valid.')).toBeInTheDocument()
    expect(screen.queryByText('10 angka')).not.toBeInTheDocument()
    expect(input).toHaveAccessibleDescription('NIM tidak valid.')
  })

  it('menyebut field wajib untuk pembaca layar', () => {
    render(<Input label="Nama Perlombaan" required />)

    expect(screen.getByLabelText(/Nama Perlombaan/)).toBeRequired()
    expect(screen.getByText('(wajib diisi)')).toBeInTheDocument()
  })

  it('menerima masukan pengguna', async () => {
    const user = userEvent.setup()
    render(<Input label="Penyelenggara" />)

    const input = screen.getByLabelText('Penyelenggara')
    await user.type(input, 'Kemdikbudristek')
    expect(input).toHaveValue('Kemdikbudristek')
  })

  it('menonaktifkan kontrol saat disabled', () => {
    render(<Input label="Terkunci" disabled />)
    expect(screen.getByLabelText('Terkunci')).toBeDisabled()
  })
})

describe('Select', () => {
  it('merender placeholder dan daftar opsi', () => {
    render(
      <Select
        label="Tingkat"
        placeholder="Pilih tingkat"
        options={['Regional', 'Nasional', 'Internasional']}
      />,
    )

    expect(screen.getByRole('option', { name: 'Pilih tingkat' })).toBeInTheDocument()
    expect(screen.getAllByRole('option')).toHaveLength(4)
  })

  it('mendukung opsi berbentuk objek value/label', async () => {
    const user = userEvent.setup()
    render(
      <Select
        label="Jenis"
        options={[
          { value: 'individu', label: 'Perorangan' },
          { value: 'tim', label: 'Tim / Kelompok' },
        ]}
      />,
    )

    const select = screen.getByLabelText('Jenis')
    await user.selectOptions(select, 'tim')
    expect(select).toHaveValue('tim')
  })

  it('menandai error dengan aria-invalid', () => {
    render(<Select label="Bidang" options={['Programming']} error="Bidang wajib dipilih." />)
    expect(screen.getByLabelText('Bidang')).toHaveAttribute('aria-invalid', 'true')
  })
})

describe('Textarea', () => {
  it('merender label dan jumlah baris', () => {
    render(<Textarea label="Catatan" rows={6} />)

    const textarea = screen.getByLabelText('Catatan')
    expect(textarea).toHaveAttribute('rows', '6')
  })

  it('menandai error dengan aria-invalid', () => {
    render(<Textarea label="Catatan" error="Terlalu panjang." />)
    expect(screen.getByLabelText('Catatan')).toHaveAttribute('aria-invalid', 'true')
  })
})
