import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderApp } from '@/test/utils'

describe('Fitur Lupa Kata Sandi dan Reset Sandi UI', () => {
  it('dapat diakses dari tautan halaman login', async () => {
    const user = userEvent.setup()
    renderApp('/login')

    const linkLupa = screen.getByRole('link', { name: /Lupa kata sandi/ })
    expect(linkLupa).toBeInTheDocument()

    await user.click(linkLupa)
    expect(await screen.findByRole('heading', { level: 2, name: 'Lupa kata sandi' })).toBeInTheDocument()
  })

  it('mengirimkan tautan reset kata sandi dan menampilkan notifikasi sukses', async () => {
    const user = userEvent.setup()
    renderApp('/lupa-password')

    await user.type(screen.getByLabelText(/Email kampus/), 'aulia.rahmawati@binus.ac.id')
    await user.click(screen.getByRole('button', { name: /Kirim Tautan Reset/ }))

    expect(await screen.findByText('Tautan Berhasil Dikirim')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Buka Halaman Reset Sekarang/ })).toBeInTheDocument()
  })
})
