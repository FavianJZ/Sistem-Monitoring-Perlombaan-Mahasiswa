import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { Button } from './Button'

describe('Button', () => {
  it('memakai type="button" secara bawaan agar tidak mengirim form tanpa sengaja', () => {
    render(<Button>Simpan</Button>)
    expect(screen.getByRole('button', { name: 'Simpan' })).toHaveAttribute('type', 'button')
  })

  it('menghormati type yang diberikan', () => {
    render(<Button type="submit">Kirim</Button>)
    expect(screen.getByRole('button', { name: 'Kirim' })).toHaveAttribute('type', 'submit')
  })

  it('memanggil onClick saat diklik', async () => {
    const onClick = vi.fn()
    const user = userEvent.setup()
    render(<Button onClick={onClick}>Klik</Button>)

    await user.click(screen.getByRole('button', { name: 'Klik' }))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('tidak bisa diklik saat disabled', async () => {
    const onClick = vi.fn()
    const user = userEvent.setup()
    render(
      <Button disabled onClick={onClick}>
        Nonaktif
      </Button>,
    )

    const button = screen.getByRole('button', { name: 'Nonaktif' })
    expect(button).toBeDisabled()
    await user.click(button)
    expect(onClick).not.toHaveBeenCalled()
  })

  it('menandai aria-busy dan nonaktif saat loading', () => {
    render(<Button loading>Menyimpan</Button>)

    const button = screen.getByRole('button', { name: 'Menyimpan' })
    expect(button).toHaveAttribute('aria-busy', 'true')
    expect(button).toBeDisabled()
  })

  it('menyembunyikan ikon dari pembaca layar', () => {
    render(<Button leadingIcon={Plus}>Tambah</Button>)

    const icon = screen.getByRole('button', { name: 'Tambah' }).querySelector('svg')
    expect(icon).toHaveAttribute('aria-hidden', 'true')
  })

  it('dapat dirender sebagai tautan lewat prop as', () => {
    render(
      <MemoryRouter>
        <Button as={Link} to="/lomba-saya">
          Lihat lomba
        </Button>
      </MemoryRouter>,
    )

    const link = screen.getByRole('link', { name: 'Lihat lomba' })
    expect(link).toHaveAttribute('href', '/lomba-saya')
    expect(link).not.toHaveAttribute('type')
  })

  it('menandai tautan nonaktif dengan aria-disabled karena atribut disabled tidak berlaku', () => {
    render(
      <MemoryRouter>
        <Button as={Link} to="/x" disabled>
          Nonaktif
        </Button>
      </MemoryRouter>,
    )

    expect(screen.getByRole('link', { name: 'Nonaktif' })).toHaveAttribute('aria-disabled', 'true')
  })
})
