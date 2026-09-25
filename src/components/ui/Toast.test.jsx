import { describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ToastProvider, useToast } from './Toast'

function Harness() {
  const { toast } = useToast()

  return (
    <div>
      <button type="button" onClick={() => toast({ title: 'Data tersimpan', variant: 'success' })}>
        Sukses
      </button>
      <button
        type="button"
        onClick={() =>
          toast({
            title: 'Gagal mengunggah',
            description: 'Ukuran berkas melebihi 5MB.',
            variant: 'danger',
            duration: 0,
          })
        }
      >
        Error
      </button>
      <button type="button" onClick={() => toast({ title: 'Cepat hilang', duration: 50 })}>
        Singkat
      </button>
    </div>
  )
}

function renderHarness() {
  return render(
    <ToastProvider>
      <Harness />
    </ToastProvider>,
  )
}

describe('Toast', () => {
  it('menampilkan notifikasi saat toast dipanggil', async () => {
    const user = userEvent.setup()
    renderHarness()

    await user.click(screen.getByRole('button', { name: 'Sukses' }))
    expect(screen.getByRole('status')).toHaveTextContent('Data tersimpan')
  })

  it('memakai role alert untuk varian danger agar langsung dibacakan', async () => {
    const user = userEvent.setup()
    renderHarness()

    await user.click(screen.getByRole('button', { name: 'Error' }))

    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent('Gagal mengunggah')
    expect(alert).toHaveTextContent('Ukuran berkas melebihi 5MB.')
  })

  it('bisa ditutup manual', async () => {
    const user = userEvent.setup()
    renderHarness()

    await user.click(screen.getByRole('button', { name: 'Error' }))
    await user.click(screen.getByRole('button', { name: 'Tutup notifikasi' }))

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('menghilang sendiri setelah durasinya lewat', async () => {
    const user = userEvent.setup()
    renderHarness()

    await user.click(screen.getByRole('button', { name: 'Singkat' }))
    expect(screen.getByRole('status')).toHaveTextContent('Cepat hilang')

    await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument())
  })

  it('bertahan bila durasi diatur nol', async () => {
    const user = userEvent.setup()
    renderHarness()

    await user.click(screen.getByRole('button', { name: 'Error' }))
    await new Promise((resolve) => setTimeout(resolve, 120))

    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('menumpuk beberapa notifikasi sekaligus', async () => {
    const user = userEvent.setup()
    renderHarness()

    await user.click(screen.getByRole('button', { name: 'Sukses' }))
    await user.click(screen.getByRole('button', { name: 'Error' }))

    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('melempar error bila useToast dipakai di luar provider', () => {
    function Lepas() {
      useToast()
      return null
    }

    expect(() => render(<Lepas />)).toThrow(/ToastProvider/)
  })
})
