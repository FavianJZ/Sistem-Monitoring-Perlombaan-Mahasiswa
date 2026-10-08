import { FileText, Link2, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { formatRentangTanggal } from '@/lib/date'
import { formatUkuran } from '@/lib/format'
import { JENIS_BERKAS, JENIS_KEIKUTSERTAAN, labelTahapan } from '@/config/domain'

function Bagian({ judul, idLangkah, onUbah, children }) {
  return (
    <section className="border-b border-slate-200 px-5 py-4 last:border-0">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">{judul}</h3>
        {idLangkah && onUbah && (
          <Button size="sm" variant="ghost" leadingIcon={Pencil} onClick={() => onUbah(idLangkah)}>
            Ubah
          </Button>
        )}
      </div>
      {children}
    </section>
  )
}

function Baris({ label, nilai }) {
  return (
    <div className="flex flex-col gap-0.5 py-1.5 sm:flex-row sm:gap-4">
      <dt className="w-48 shrink-0 text-sm text-slate-500">{label}</dt>
      <dd className="text-sm font-medium text-slate-900">{nilai || '-'}</dd>
    </div>
  )
}

export function Tinjauan({ draft, namaDosen, onUbah }) {
  const tim = draft.jenis === 'tim'
  const labelJenis = JENIS_KEIKUTSERTAAN.find((item) => item.value === draft.jenis)?.label
  const tahapanTerisi = (draft.tahapan ?? []).filter((tahap) => tahap.tanggalMulai)
  const berkasTerisi = Object.entries(draft.berkas ?? {}).filter(([, meta]) => Boolean(meta))

  return (
    <div>
      <Bagian judul="Detail Umum" idLangkah="detail" onUbah={onUbah}>
        <dl>
          <Baris label="Nama perlombaan" nilai={draft.nama} />
          <Baris label="Penyelenggara" nilai={draft.penyelenggara} />
          <Baris label="Bidang" nilai={draft.bidang} />
          <Baris label="Tingkat" nilai={draft.tingkat} />
          <Baris label="Jenis keikutsertaan" nilai={labelJenis} />
          {tim && <Baris label="Nama tim" nilai={draft.namaTim} />}
          <Baris label="Dosen pembimbing" nilai={namaDosen} />
        </dl>
      </Bagian>

      {tim && (
        <Bagian judul="Anggota Tim" idLangkah="anggota" onUbah={onUbah}>
          <ul aria-label="Ringkasan anggota tim" className="divide-y divide-slate-100">
            {draft.anggota.map((anggota, indeks) => (
              <li key={indeks} className="flex flex-wrap items-center gap-3 py-2.5">
                <span className="text-sm font-medium text-slate-900">{anggota.nama || '-'}</span>
                <span className="text-sm text-slate-500">{anggota.nim || '-'}</span>
                <span className="text-sm text-slate-500">{anggota.prodi || '-'}</span>
                {indeks === 0 && (
                  <Badge size="sm" tone="primary">
                    Ketua
                  </Badge>
                )}
              </li>
            ))}
          </ul>
        </Bagian>
      )}

      <Bagian judul="Bukti dan Publikasi" idLangkah="bukti" onUbah={onUbah}>
        {berkasTerisi.length === 0 ? (
          <p className="text-sm text-warning-700">Belum ada berkas yang diunggah.</p>
        ) : (
          <ul aria-label="Ringkasan berkas" className="space-y-2">
            {berkasTerisi.map(([tipe, meta]) => (
              <li key={tipe} className="flex items-center gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-md bg-slate-100 text-slate-500">
                  <FileText className="size-4" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-slate-900">
                    {JENIS_BERKAS[tipe]?.label ?? tipe}
                  </span>
                  <span className="block truncate text-xs text-slate-500">
                    {meta.namaFile} - {formatUkuran(meta.size)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}

        {draft.linkPublikasi && (
          <p className="mt-3 flex items-center gap-2 text-sm">
            <Link2 className="size-4 shrink-0 text-slate-400" aria-hidden="true" />
            <span className="truncate text-slate-700">{draft.linkPublikasi}</span>
          </p>
        )}
      </Bagian>

      <Bagian judul="Timeline" idLangkah="timeline" onUbah={onUbah}>
        {tahapanTerisi.length === 0 ? (
          <p className="text-sm text-warning-700">Belum ada tanggal tahapan yang diisi.</p>
        ) : (
          <ol aria-label="Ringkasan timeline" className="space-y-2.5">
            {tahapanTerisi.map((tahap, indeks) => (
              <li key={`${tahap.jenis}-${indeks}`} className="flex flex-wrap items-baseline gap-x-3">
                <span className="text-sm font-medium text-slate-900">
                  {tahap.jenis === 'kustom'
                    ? tahap.label?.trim() || 'Tahapan tambahan'
                    : labelTahapan(tahap.jenis)}
                </span>
                <span className="text-sm text-slate-600">
                  {formatRentangTanggal(tahap.tanggalMulai, tahap.tanggalSelesai)}
                </span>
              </li>
            ))}
          </ol>
        )}
      </Bagian>
    </div>
  )
}
