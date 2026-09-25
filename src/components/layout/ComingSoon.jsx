import { Hammer } from 'lucide-react'

/**
 * Penanda sementara untuk halaman yang dibangun pada task berikutnya.
 * Dihapus begitu halaman aslinya selesai.
 */
export function ComingSoon({ task, children }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center shadow-card">
      <span className="mx-auto grid size-12 place-items-center rounded-full bg-slate-100 text-slate-500">
        <Hammer className="size-6" aria-hidden="true" />
      </span>
      <p className="mt-4 font-semibold text-slate-900">Halaman ini sedang dibangun</p>
      <p className="mt-1 text-sm text-slate-600">
        Dijadwalkan pada <span className="font-medium text-slate-900">{task}</span>.
      </p>
      {children && <div className="mt-4 text-sm text-slate-600">{children}</div>}
    </div>
  )
}
