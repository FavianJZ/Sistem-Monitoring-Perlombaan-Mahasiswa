import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Trophy } from 'lucide-react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './Card'
import { EmptyState } from './EmptyState'
import { Skeleton, SkeletonTable, SkeletonText } from './Skeleton'
import { Button } from './Button'

describe('Card', () => {
  it('merender header, isi, dan footer', () => {
    render(
      <Card>
        <CardHeader actions={<span>aksi</span>}>
          <CardTitle as="h3">GEMASTIK XVIII</CardTitle>
          <CardDescription>Tingkat Nasional</CardDescription>
        </CardHeader>
        <CardContent>Isi kartu</CardContent>
        <CardFooter>Footer kartu</CardFooter>
      </Card>,
    )

    expect(screen.getByRole('heading', { level: 3, name: 'GEMASTIK XVIII' })).toBeInTheDocument()
    expect(screen.getByText('Tingkat Nasional')).toBeInTheDocument()
    expect(screen.getByText('aksi')).toBeInTheDocument()
    expect(screen.getByText('Isi kartu')).toBeInTheDocument()
    expect(screen.getByText('Footer kartu')).toBeInTheDocument()
  })

  it('memakai heading level 2 secara bawaan', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Judul bawaan</CardTitle>
        </CardHeader>
      </Card>,
    )

    expect(screen.getByRole('heading', { level: 2, name: 'Judul bawaan' })).toBeInTheDocument()
  })
})

describe('EmptyState', () => {
  it('menampilkan judul, deskripsi, dan aksi', () => {
    render(
      <EmptyState
        icon={Trophy}
        title="Belum ada lomba terdaftar"
        description="Mulai catat keikutsertaanmu."
        action={<Button>Daftarkan Lomba</Button>}
      />,
    )

    expect(screen.getByText('Belum ada lomba terdaftar')).toBeInTheDocument()
    expect(screen.getByText('Mulai catat keikutsertaanmu.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Daftarkan Lomba' })).toBeInTheDocument()
  })

  it('menyembunyikan ikon dari pembaca layar', () => {
    const { container } = render(<EmptyState title="Kosong" />)
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
  })
})

describe('Skeleton', () => {
  it('disembunyikan dari pembaca layar', () => {
    render(<Skeleton className="h-4 w-20" />)
    expect(screen.getByTestId('skeleton')).toHaveAttribute('aria-hidden', 'true')
  })

  it('merender baris sebanyak yang diminta', () => {
    render(<SkeletonText lines={4} />)
    expect(screen.getAllByTestId('skeleton')).toHaveLength(4)
  })

  it('mengumumkan status memuat pada kerangka tabel', () => {
    render(<SkeletonTable rows={3} columns={2} />)

    expect(screen.getByRole('status', { name: 'Memuat data' })).toBeInTheDocument()
    expect(screen.getAllByTestId('skeleton')).toHaveLength(6)
  })
})
