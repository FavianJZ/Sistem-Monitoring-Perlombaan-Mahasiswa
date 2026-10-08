import { ExternalLink } from 'lucide-react'
import { formatTanggal } from '@/lib/date'
import { JENIS_KEIKUTSERTAAN } from '@/config/domain'
import { namaPengguna } from '@/services/userService'

export function BarisInfo({ label, nilai }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-slate-100 py-3 last:border-0 sm:flex-row sm:gap-4">
      <dt className="w-48 shrink-0 text-sm text-slate-500">{label}</dt>
      <dd className="min-w-0 text-sm font-medium text-slate-900">{nilai ?? '-'}</dd>
    </div>
  )
}

export function TautanLuar({ href, children }) {
  if (!href) return null

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      className="inline-flex items-center gap-1.5 text-primary-700 hover:underline"
    >
      <span className="truncate">{children ?? href}</span>
      <ExternalLink className="size-3.5 shrink-0" aria-hidden="true" />
    </a>
  )
}

export function InfoLomba({ lomba }) {
  const labelJenis = JENIS_KEIKUTSERTAAN.find((item) => item.value === lomba.jenis)?.label

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <dl className="lg:col-span-2">
        <BarisInfo label="Penyelenggara" nilai={lomba.penyelenggara} />
        <BarisInfo label="Bidang lomba" nilai={lomba.bidang} />
        <BarisInfo label="Tingkat" nilai={lomba.tingkat} />
        <BarisInfo label="Jenis keikutsertaan" nilai={labelJenis} />
        {lomba.namaTim && <BarisInfo label="Nama tim" nilai={lomba.namaTim} />}
        <BarisInfo label="Dosen pembimbing" nilai={namaPengguna(lomba.dosenPembimbingId)} />
        <BarisInfo
          label="Didaftarkan pada"
          nilai={formatTanggal(lomba.createdAt, { panjang: true })}
        />
        <BarisInfo
          label="Tautan publikasi"
          nilai={lomba.linkPublikasi ? <TautanLuar href={lomba.linkPublikasi} /> : null}
        />
      </dl>

      <div>
        <p className="mb-2 text-sm font-semibold text-slate-900">Poster lomba</p>
        {lomba.posterUrl ? (
          <img
            src={lomba.posterUrl}
            alt={`Poster ${lomba.nama}`}
            className="w-full rounded-lg border border-slate-200"
          />
        ) : (
          <p className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500">
            Belum ada poster yang diunggah.
          </p>
        )}
      </div>
    </div>
  )
}
