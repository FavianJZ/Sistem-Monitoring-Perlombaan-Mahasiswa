import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SESI_MAHASISWA, renderApp } from '@/test/utils'

function renderStyleGuide() {
  return renderApp('/styleguide', { sesi: SESI_MAHASISWA() })
}

describe('Halaman Style Guide', () => {
  it('menampilkan seluruh bagian katalog komponen', () => {
    renderStyleGuide()

    expect(screen.getByRole('heading', { level: 1, name: 'Style Guide' })).toBeInTheDocument()
    for (const section of [
      'Warna',
      'Tipografi',
      'Button',
      'Kontrol Form',
      'Badge',
      'Card',
      'Modal dan Toast',
      'Stat Card',
      'Data Table',
      'File Upload',
      'Tabs, Progress, dan Timeline',
      'Empty State dan Skeleton',
    ]) {
      expect(screen.getByRole('heading', { level: 2, name: section })).toBeInTheDocument()
    }
  })

  it('modal dan toast berfungsi langsung dari style guide', async () => {
    const user = userEvent.setup()
    renderStyleGuide()

    await user.click(screen.getByRole('button', { name: 'Buka Modal' }))
    expect(screen.getByRole('dialog')).toHaveAccessibleName('Hapus data lomba')

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Toast sukses' }))
    expect(screen.getByRole('status')).toHaveTextContent('Data tersimpan')
  })
})
