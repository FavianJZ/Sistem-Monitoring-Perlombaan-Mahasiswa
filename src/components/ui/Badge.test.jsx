import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Badge } from './Badge'
import { CapaianBadge, KelengkapanBadge, StatusBadge } from './StatusBadge'

describe('Badge', () => {
  it('menampilkan isi dan menerapkan tone', () => {
    render(<Badge tone="success">Selesai</Badge>)

    const badge = screen.getByText('Selesai')
    expect(badge).toBeInTheDocument()
    expect(badge.className).toContain('text-success-700')
  })

  it('kembali ke tone netral bila tone tidak dikenal', () => {
    render(<Badge tone="entahapa">Netral</Badge>)
    expect(screen.getByText('Netral').className).toContain('text-slate-700')
  })
})

describe('StatusBadge', () => {
  it.each([
    ['terdaftar', 'Terdaftar'],
    ['berlangsung', 'Berlangsung'],
    ['selesai', 'Selesai'],
  ])('menerjemahkan status %s menjadi label %s', (status, label) => {
    render(<StatusBadge status={status} />)
    expect(screen.getByText(label)).toBeInTheDocument()
  })

  it('menampilkan tanda hubung untuk status yang tidak dikenal', () => {
    render(<StatusBadge status="tidak_ada" />)
    expect(screen.getByText('-')).toBeInTheDocument()
  })
})

describe('CapaianBadge', () => {
  it.each([
    ['juara_1', 'Juara 1'],
    ['harapan', 'Juara Harapan'],
    ['finalis', 'Finalis'],
    ['peserta', 'Peserta'],
  ])('menerjemahkan capaian %s menjadi label %s', (capaian, label) => {
    render(<CapaianBadge capaian={capaian} />)
    expect(screen.getByText(label)).toBeInTheDocument()
  })

  it('tidak merender apa pun bila capaian belum dilaporkan', () => {
    const { container } = render(<CapaianBadge capaian={undefined} />)
    expect(container).toBeEmptyDOMElement()
  })
})

describe('KelengkapanBadge', () => {
  it('membedakan dokumen lengkap dan belum lengkap', () => {
    const { rerender } = render(<KelengkapanBadge lengkap />)
    expect(screen.getByText('Dokumen Lengkap')).toBeInTheDocument()

    rerender(<KelengkapanBadge lengkap={false} />)
    expect(screen.getByText('Dokumen Belum Lengkap')).toBeInTheDocument()
  })
})
