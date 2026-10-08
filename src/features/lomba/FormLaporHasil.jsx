import { useState } from 'react'
import { CircleAlert, Link2, Save } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { FileUpload } from '@/components/ui/FileUpload'
import { CAPAIAN_LOMBA } from '@/config/domain'
import { laporkanHasil } from '@/services/competitionService'

const OPSI_CAPAIAN = Object.entries(CAPAIAN_LOMBA).map(([value, meta]) => ({
  value,
  label: meta.label,
}))

export function FormLaporHasil({ lomba, onTersimpan }) {
  const [capaian, setCapaian] = useState('')
  const [linkBerita, setLinkBerita] = useState('')
  const [sertifikat, setSertifikat] = useState(null)
  const [foto, setFoto] = useState(null)
  const [error, setError] = useState({})
  const [galatSimpan, setGalatSimpan] = useState(null)
  const [menyimpan, setMenyimpan] = useState(false)

  function validasi() {
    const masalah = {}

    if (!capaian) masalah.capaian = 'Capaian akhir wajib dipilih.'
    if (!sertifikat) masalah.sertifikat = 'Sertifikat wajib diunggah sebagai bukti capaian.'
    if (linkBerita.trim() && !/^https?:\/\/.+/i.test(linkBerita.trim())) {
      masalah.linkBerita = 'Tautan harus dimulai dengan http:// atau https://'
    }

    setError(masalah)
    return Object.keys(masalah).length === 0
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setGalatSimpan(null)

    if (!validasi()) return

    setMenyimpan(true)
    try {
      const berkas = [{ tipe: 'sertifikat', ...sertifikat }]
      if (foto) berkas.push({ tipe: 'foto', ...foto })

      const hasil = await laporkanHasil(lomba.id, { capaian, linkBerita, berkas })
      onTersimpan?.(hasil)
    } catch (kesalahan) {
      setGalatSimpan(kesalahan.message)
    } finally {
      setMenyimpan(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <p className="text-sm text-slate-600">
        Laporkan capaian akhir beserta buktinya. Data ini masuk ke arsip prestasi program studi.
      </p>

      {galatSimpan && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-md border border-danger-200 bg-danger-50 p-3.5 text-sm text-danger-800"
        >
          <CircleAlert className="mt-px size-4 shrink-0" aria-hidden="true" />
          <span>{galatSimpan}</span>
        </div>
      )}

      <Select
        label="Capaian Akhir"
        placeholder="Pilih capaian"
        options={OPSI_CAPAIAN}
        value={capaian}
        onChange={(event) => setCapaian(event.target.value)}
        error={error.capaian}
        required
        wrapperClassName="sm:max-w-sm"
      />

      <FileUpload
        label="Sertifikat"
        hint="Sertifikat juara atau sertifikat keikutsertaan dari penyelenggara."
        berkas={sertifikat}
        onPilih={setSertifikat}
        error={error.sertifikat}
        required
      />

      <FileUpload
        label="Foto Dokumentasi"
        hint="Foto piala, medali, atau momen penyerahan penghargaan. Opsional."
        berkas={foto}
        onPilih={setFoto}
      />

      <Input
        label="Tautan Berita"
        type="url"
        inputMode="url"
        placeholder="https://contoh.id/berita-juara"
        value={linkBerita}
        onChange={(event) => setLinkBerita(event.target.value)}
        hint="Tautan publikasi kejuaraan bila ada. Opsional."
        error={error.linkBerita}
        leadingIcon={Link2}
      />

      <Button type="submit" leadingIcon={Save} loading={menyimpan}>
        Simpan laporan hasil
      </Button>
    </form>
  )
}
