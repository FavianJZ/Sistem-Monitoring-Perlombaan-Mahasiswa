import { CircleAlert, Trash2, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { PROGRAM_STUDI } from '@/config/domain'

/**
 * Langkah 2: susunan anggota tim.
 * Ketua tim terisi otomatis dari akun yang sedang masuk dan tidak bisa diubah
 * karena dialah pemilik data pendaftaran ini.
 */
export function LangkahAnggotaTim({
  draft,
  ubahAnggota,
  tambahAnggota,
  hapusAnggota,
  error = {},
  errorAnggota = [],
}) {
  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-600">
        Cantumkan seluruh anggota tim beserta NIM dan program studinya. Data ini dipakai program
        studi untuk mengenali siapa saja yang berkompetisi.
      </p>

      {error.umum && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-md border border-danger-200 bg-danger-50 p-3.5 text-sm text-danger-800"
        >
          <CircleAlert className="mt-px size-4 shrink-0" aria-hidden="true" />
          <span>{error.umum}</span>
        </div>
      )}

      <ul aria-label="Susunan anggota tim" className="space-y-4">
        {draft.anggota.map((anggota, indeks) => {
          const ketua = indeks === 0
          const galat = errorAnggota[indeks] ?? {}

          return (
            <li
              key={indeks}
              className="rounded-lg border border-slate-200 bg-white p-4 shadow-card"
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <Badge tone={ketua ? 'primary' : 'neutral'}>
                  {ketua ? 'Ketua Tim' : `Anggota ${indeks}`}
                </Badge>

                {!ketua && (
                  <Button
                    variant="ghost"
                    size="sm"
                    leadingIcon={Trash2}
                    onClick={() => hapusAnggota(indeks)}
                    aria-label={`Hapus anggota ${indeks}`}
                  >
                    Hapus
                  </Button>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <Input
                  label="NIM"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="10 angka"
                  value={anggota.nim}
                  onChange={(event) =>
                    ubahAnggota(indeks, { nim: event.target.value.replace(/\D/g, '') })
                  }
                  error={galat.nim}
                  disabled={ketua}
                  required={!ketua}
                />
                <Input
                  label="Nama Lengkap"
                  placeholder="Nama sesuai data kampus"
                  value={anggota.nama}
                  onChange={(event) => ubahAnggota(indeks, { nama: event.target.value })}
                  error={galat.nama}
                  disabled={ketua}
                  required={!ketua}
                />
                <Select
                  label="Program Studi"
                  placeholder="Pilih program studi"
                  options={PROGRAM_STUDI}
                  value={anggota.prodi}
                  onChange={(event) => ubahAnggota(indeks, { prodi: event.target.value })}
                  error={galat.prodi}
                  disabled={ketua}
                  required={!ketua}
                />
              </div>

              {ketua && (
                <p className="mt-3 text-xs text-slate-500">
                  Data ketua tim diambil dari akunmu dan tidak dapat diubah di sini.
                </p>
              )}
            </li>
          )
        })}
      </ul>

      <Button variant="outline" leadingIcon={UserPlus} onClick={tambahAnggota}>
        Tambah anggota
      </Button>
    </div>
  )
}
