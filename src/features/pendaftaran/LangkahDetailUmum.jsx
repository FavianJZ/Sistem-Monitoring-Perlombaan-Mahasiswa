import { Users, User } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { cn } from '@/lib/cn'
import { BIDANG_LOMBA, JENIS_KEIKUTSERTAAN, TINGKAT_LOMBA } from '@/config/domain'

const IKON_JENIS = { individu: User, tim: Users }

/** Langkah 1: identitas umum perlombaan. */
export function LangkahDetailUmum({ draft, ubah, error = {}, dosen = [], memuatDosen }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <Input
          label="Nama Perlombaan"
          placeholder="Contoh: GEMASTIK XIX Divisi Pemrograman"
          value={draft.nama}
          onChange={(event) => ubah({ nama: event.target.value })}
          error={error.nama}
          required
          wrapperClassName="sm:col-span-2"
        />

        <Input
          label="Instansi Penyelenggara"
          placeholder="Contoh: Pusat Prestasi Nasional"
          value={draft.penyelenggara}
          onChange={(event) => ubah({ penyelenggara: event.target.value })}
          error={error.penyelenggara}
          required
        />

        <Select
          label="Dosen Pembimbing"
          placeholder={memuatDosen ? 'Memuat daftar dosen...' : 'Belum ada pembimbing'}
          options={dosen.map((item) => ({ value: item.id, label: item.nama }))}
          value={draft.dosenPembimbingId}
          onChange={(event) => ubah({ dosenPembimbingId: event.target.value })}
          hint="Boleh dikosongkan bila belum ditentukan."
        />

        <Select
          label="Bidang Lomba"
          placeholder="Pilih bidang"
          options={BIDANG_LOMBA}
          value={draft.bidang}
          onChange={(event) => ubah({ bidang: event.target.value })}
          error={error.bidang}
          required
        />

        <Select
          label="Tingkat Lomba"
          placeholder="Pilih tingkat"
          options={TINGKAT_LOMBA}
          value={draft.tingkat}
          onChange={(event) => ubah({ tingkat: event.target.value })}
          error={error.tingkat}
          required
        />
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-slate-700">
          Jenis Keikutsertaan
          <span aria-hidden="true" className="ml-0.5 text-danger-600">
            *
          </span>
        </legend>

        <div className="grid gap-3 sm:grid-cols-2">
          {JENIS_KEIKUTSERTAAN.map((opsi) => {
            const Icon = IKON_JENIS[opsi.value]
            const terpilih = draft.jenis === opsi.value

            return (
              <label
                key={opsi.value}
                className={cn(
                  'flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors',
                  terpilih
                    ? 'border-primary-500 bg-primary-50/60 ring-1 ring-primary-500'
                    : 'border-slate-300 bg-white hover:border-slate-400',
                )}
              >
                <input
                  type="radio"
                  name="jenis"
                  value={opsi.value}
                  checked={terpilih}
                  onChange={() => ubah({ jenis: opsi.value })}
                  className="mt-1 size-4 accent-primary-600"
                />
                <span>
                  <span className="flex items-center gap-2 font-semibold text-slate-900">
                    <Icon className="size-4 text-slate-500" aria-hidden="true" />
                    {opsi.label}
                  </span>
                  <span className="mt-0.5 block text-xs text-slate-600">
                    {opsi.value === 'tim'
                      ? 'Perlu mengisi susunan anggota tim pada langkah berikutnya.'
                      : 'Hanya kamu yang tercatat sebagai peserta.'}
                  </span>
                </span>
              </label>
            )
          })}
        </div>
      </fieldset>

      {draft.jenis === 'tim' && (
        <Input
          label="Nama Tim"
          placeholder="Contoh: Sanca Digital"
          value={draft.namaTim}
          onChange={(event) => ubah({ namaTim: event.target.value })}
          error={error.namaTim}
          required
          wrapperClassName="sm:max-w-md"
        />
      )}
    </div>
  )
}
