import { CircleAlert, RotateCcw } from 'lucide-react'
import { Button } from './Button'
import { EmptyState } from './EmptyState'

/**
 * Tampilan seragam saat pengambilan data gagal.
 * Dipakai di seluruh halaman supaya pesan kegagalan tidak berbeda-beda bentuk.
 */
export function GalatMuat({ judul = 'Gagal memuat data', error, onCoba }) {
  return (
    <div role="alert">
      <EmptyState
        tone="danger"
        icon={CircleAlert}
        title={judul}
        description={
          error?.message ??
          'Terjadi kendala saat mengambil data. Periksa koneksi lalu coba lagi.'
        }
        action={
          onCoba ? (
            <Button variant="outline" leadingIcon={RotateCcw} onClick={onCoba}>
              Coba lagi
            </Button>
          ) : null
        }
      />
    </div>
  )
}
