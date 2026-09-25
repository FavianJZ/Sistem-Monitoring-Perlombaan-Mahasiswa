import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Modal } from './Modal'
import { Button } from './Button'

function Harness({ closeOnOverlay = true }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Buka
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Hapus data lomba"
        description="Tindakan ini tidak bisa dibatalkan."
        closeOnOverlay={closeOnOverlay}
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button variant="danger" onClick={() => setOpen(false)}>
              Hapus
            </Button>
          </>
        }
      >
        <p>Seluruh berkas terkait akan ikut terhapus.</p>
      </Modal>
    </>
  )
}

describe('Modal', () => {
  it('tidak merender apa pun saat tertutup', () => {
    render(<Modal open={false} onClose={vi.fn()} title="Judul" />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('merender dialog dengan label dan deskripsi yang tertaut', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.click(screen.getByRole('button', { name: 'Buka' }))

    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveAccessibleName('Hapus data lomba')
    expect(dialog).toHaveAccessibleDescription('Tindakan ini tidak bisa dibatalkan.')
  })

  it('memindahkan fokus ke dalam dialog saat dibuka', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.click(screen.getByRole('button', { name: 'Buka' }))

    const dialog = screen.getByRole('dialog')
    expect(dialog).toContainElement(document.activeElement)
  })

  it('menutup dialog dengan tombol Escape', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.click(screen.getByRole('button', { name: 'Buka' }))
    await user.keyboard('{Escape}')

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('mengembalikan fokus ke tombol pemicu setelah ditutup', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    const trigger = screen.getByRole('button', { name: 'Buka' })
    await user.click(trigger)
    await user.keyboard('{Escape}')

    expect(trigger).toHaveFocus()
  })

  it('menutup dialog lewat tombol silang', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.click(screen.getByRole('button', { name: 'Buka' }))
    await user.click(screen.getByRole('button', { name: 'Tutup dialog' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('menahan fokus di dalam dialog saat Tab berulang', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.click(screen.getByRole('button', { name: 'Buka' }))

    const dialog = screen.getByRole('dialog')
    for (let index = 0; index < 6; index += 1) {
      await user.tab()
      expect(dialog).toContainElement(document.activeElement)
    }
  })

  it('mengunci gulir halaman selama dialog terbuka', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.click(screen.getByRole('button', { name: 'Buka' }))
    expect(document.body.style.overflow).toBe('hidden')

    await user.keyboard('{Escape}')
    expect(document.body.style.overflow).not.toBe('hidden')
  })
})
