import { CircleAlert, Link2, Upload } from 'lucide-react'
import { FileUpload } from '@/components/ui/FileUpload'
import { Input } from '@/components/ui/Input'
import { cn } from '@/lib/cn'

const MODE = [
  { value: 'unggah', label: 'Unggah poster', icon: Upload },
  { value: 'tautan', label: 'Cantumkan tautan', icon: Link2 },
]

export function LangkahPoster({ draft, ubah, setBerkas, error = {} }) {
  const mode = draft.posterMode ?? 'unggah'

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-600">
        Lampirkan poster resmi perlombaan, atau cukup cantumkan tautan ke situs maupun media sosial
        penyelenggara. Salah satu saja sudah memenuhi syarat.
      </p>

      <div
        role="group"
        aria-label="Cara melampirkan publikasi lomba"
        className="inline-flex rounded-lg border border-slate-300 bg-white p-1"
      >
        {MODE.map((opsi) => {
          const Icon = opsi.icon
          const aktif = mode === opsi.value

          return (
            <button
              key={opsi.value}
              type="button"
              aria-pressed={aktif}
              onClick={() => ubah({ posterMode: opsi.value })}
              className={cn(
                'inline-flex items-center gap-2 rounded-md px-3.5 py-2 text-sm font-semibold transition-colors',
                aktif ? 'bg-primary-600 text-white' : 'text-slate-600 hover:bg-slate-100',
              )}
            >
              <Icon className="size-4" aria-hidden="true" />
              {opsi.label}
            </button>
          )
        })}
      </div>

      {error.umum && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-md border border-danger-200 bg-danger-50 p-3.5 text-sm text-danger-800"
        >
          <CircleAlert className="mt-px size-4 shrink-0" aria-hidden="true" />
          <span>{error.umum}</span>
        </div>
      )}

      {mode === 'unggah' ? (
        <FileUpload
          label="Poster Perlombaan"
          hint="Gambar atau PDF poster resmi. Boleh dilewati bila hanya punya tautan."
          berkas={draft.berkas?.poster ?? null}
          onPilih={(berkas) => setBerkas('poster', berkas)}
        />
      ) : (
        <Input
          label="Tautan Publikasi Lomba"
          type="url"
          inputMode="url"
          placeholder="https://contoh.id/lomba"
          value={draft.linkPublikasi}
          onChange={(event) => ubah({ linkPublikasi: event.target.value })}
          hint="Alamat situs resmi, unggahan Instagram, atau pengumuman penyelenggara."
          error={error.linkPublikasi}
          leadingIcon={Link2}
        />
      )}

      {mode === 'unggah' && draft.linkPublikasi && (
        <p className="text-xs text-slate-500">
          Tautan tersimpan: <span className="font-medium text-slate-700">{draft.linkPublikasi}</span>
        </p>
      )}
      {mode === 'tautan' && draft.berkas?.poster && (
        <p className="text-xs text-slate-500">
          Poster tersimpan:{' '}
          <span className="font-medium text-slate-700">{draft.berkas.poster.namaFile}</span>
        </p>
      )}
    </div>
  )
}
