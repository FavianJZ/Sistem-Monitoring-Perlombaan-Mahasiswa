import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DataTable } from './DataTable'
import { FilterBar } from '@/features/monitoring/FilterBar'

function aturLebarLayar(lebar) {
  vi.stubGlobal('matchMedia', (query) => {
    const maks = Number(/max-width:\s*(\d+)px/.exec(query)?.[1] ?? Infinity)
    return {
      matches: lebar <= maks,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }
  })
}

afterEach(() => {
  vi.unstubAllGlobals()
})

const KOLOM = [
  { key: 'nama', header: 'Perlombaan' },
  { key: 'bidang', header: 'Bidang' },
  { key: 'aksi', header: 'Aksi', align: 'right', render: () => <button type="button">Detail</button> },
]

const BARIS = [
  { id: 'a', nama: 'GEMASTIK XIX', bidang: 'Programming' },
  { id: 'b', nama: 'Hackathon BI', bidang: 'Bisnis' },
]

describe('DataTable di layar kecil', () => {
  it('menampilkan daftar kartu, bukan tabel', () => {
    aturLebarLayar(375)
    render(<DataTable caption="Daftar lomba" columns={KOLOM} rows={BARIS} />)

    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    const daftar = screen.getByRole('list', { name: 'Daftar lomba' })
    expect(daftar.querySelectorAll('li')).toHaveLength(2)
    expect(screen.getAllByText('Bidang')).toHaveLength(2)
    expect(screen.getByText('Programming')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Detail' })).toHaveLength(2)
  })

  it('tetap menampilkan tabel di layar lebar', () => {
    aturLebarLayar(1280)
    render(<DataTable caption="Daftar lomba" columns={KOLOM} rows={BARIS} />)

    expect(screen.getByRole('table')).toBeInTheDocument()
    expect(screen.queryByRole('list', { name: 'Daftar lomba' })).not.toBeInTheDocument()
  })
})

describe('FilterBar di layar kecil', () => {
  const FILTER = { search: '', mode: 'semua', bidang: '', tingkat: '', status: '', capaian: '' }

  it('menyembunyikan filter rinci sampai tombol dibuka', async () => {
    aturLebarLayar(375)
    render(<FilterBar filter={FILTER} onUbah={() => {}} onReset={() => {}} />)

    expect(screen.getByLabelText('Cari lomba')).toBeInTheDocument()
    expect(screen.queryByLabelText('Bidang')).not.toBeInTheDocument()

    const tombol = screen.getByRole('button', { name: /filter lainnya/i })
    expect(tombol).toHaveAttribute('aria-expanded', 'false')
    await userEvent.click(tombol)

    expect(screen.getByLabelText('Bidang')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sembunyikan filter/i })).toHaveAttribute('aria-expanded', 'true')
  })

  it('menampilkan semua filter tanpa tombol di layar lebar', () => {
    aturLebarLayar(1280)
    render(<FilterBar filter={FILTER} onUbah={() => {}} onReset={() => {}} />)

    expect(screen.getByLabelText('Bidang')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /filter lainnya/i })).not.toBeInTheDocument()
  })
})
