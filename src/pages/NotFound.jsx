import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md rounded-lg border border-slate-200 bg-white p-8 text-center shadow-card">
      <span className="mx-auto grid size-12 place-items-center rounded-full bg-slate-100 text-slate-500">
        <Compass className="size-6" aria-hidden="true" />
      </span>
      <h1 className="mt-4 text-xl font-extrabold text-slate-900">Halaman tidak ditemukan</h1>
      <p className="mt-1 text-sm text-slate-600">
        Alamat yang kamu tuju tidak tersedia atau sudah dipindahkan.
      </p>
      <Link
        to="/"
        className="mt-5 inline-flex rounded-md bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700"
      >
        Kembali ke dashboard
      </Link>
    </div>
  )
}
