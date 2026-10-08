import { useEffect, useState } from 'react'
import {
  CalendarDays,
  FileEdit,
  Plus,
  Save,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Tabs } from '@/components/ui/Tabs'
import { Badge } from '@/components/ui/Badge'
import { useToast } from '@/components/ui/Toast'
import {
  BIDANG_LOMBA,
  JENIS_KEIKUTSERTAAN,
  JENIS_TAHAPAN,
  PROGRAM_STUDI,
  TINGKAT_LOMBA,
  labelTahapan,
} from '@/config/domain'
import { daftarDosen } from '@/services/userService'
import { perbaruiLomba } from '@/services/competitionService'

const PILIHAN_BIDANG = BIDANG_LOMBA.map((item) => ({ value: item, label: item }))
const PILIHAN_TINGKAT = TINGKAT_LOMBA.map((item) => ({ value: item, label: item }))
const PILIHAN_PRODI = PROGRAM_STUDI.map((item) => ({ value: item, label: item }))
const PILIHAN_JENIS_TAHAPAN = [
  ...JENIS_TAHAPAN.map((item) => ({ value: item.value, label: item.label })),
  { value: 'kustom', label: 'Tahapan Lainnya (Kustom)' },
]

export function ModalEditLomba({
  open,
  onClose,
  lomba,
  tabAwal = 'info',
  onTersimpan,
}) {
  const { toast } = useToast()
  const [tabAktif, setTabAktif] = useState(tabAwal)
  const [memproses, setMemproses] = useState(false)
  const [dosenList, setDosenList] = useState([])

  const [info, setInfo] = useState({
    nama: '',
    penyelenggara: '',
    bidang: '',
    tingkat: '',
    jenis: 'individu',
    namaTim: '',
    dosenPembimbingId: '',
    linkPublikasi: '',
  })

  const [anggota, setAnggota] = useState([])
  const [anggotaBaru, setAnggotaBaru] = useState({
    nama: '',
    nim: '',
    prodi: '',
    peran: 'anggota',
  })
  const [tambahAnggotaBuka, setTambahAnggotaBuka] = useState(false)

  const [tahapan, setTahapan] = useState([])
  const [tahapBaru, setTahapBaru] = useState({
    jenis: 'penyisihan',
    label: '',
    tanggalMulai: '',
    tanggalSelesai: '',
  })
  const [tambahTahapBuka, setTambahTahapBuka] = useState(false)

  const [galat, setGalat] = useState({})

  useEffect(() => {
    if (!open || !lomba) return

    setTabAktif(tabAwal)
    setInfo({
      nama: lomba.nama ?? '',
      penyelenggara: lomba.penyelenggara ?? '',
      bidang: lomba.bidang ?? BIDANG_LOMBA[0],
      tingkat: lomba.tingkat ?? TINGKAT_LOMBA[0],
      jenis: lomba.jenis ?? 'individu',
      namaTim: lomba.namaTim ?? '',
      dosenPembimbingId: lomba.dosenPembimbingId ?? '',
      linkPublikasi: lomba.linkPublikasi ?? '',
    })

    setAnggota(
      (lomba.anggota ?? []).map((ang, idx) => ({
        id: ang.id ?? `ang-${idx + 1}`,
        nama: ang.nama ?? '',
        nim: ang.nim ?? '',
        prodi: ang.prodi ?? '',
        peran: ang.peran ?? (idx === 0 ? 'ketua' : 'anggota'),
      })),
    )

    setTahapan(
      (lomba.tahapan ?? []).map((thp, idx) => ({
        id: thp.id ?? `thp-${idx + 1}`,
        jenis: thp.jenis ?? 'pendaftaran',
        label: thp.label ?? '',
        tanggalMulai: thp.tanggalMulai ?? '',
        tanggalSelesai: thp.tanggalSelesai ?? '',
      })),
    )

    setGalat({})
    setTambahAnggotaBuka(false)
    setTambahTahapBuka(false)

    daftarDosen()
      .then((data) => setDosenList(data ?? []))
      .catch(() => setDosenList([]))
  }, [open, lomba, tabAwal])

  if (!open || !lomba) return null

  const opsiDosen = [
    { value: '', label: 'Tanpa Dosen Pembimbing' },
    ...dosenList.map((d) => ({
      value: d.id,
      label: `${d.nama} (${d.prodi ?? 'Dosen'})`,
    })),
  ]

  const tabs = [
    { id: 'info', label: 'Informasi Lomba', icon: FileEdit },
    {
      id: 'tim',
      label: 'Anggota Tim',
      icon: Users,
      badge: info.jenis === 'tim' ? anggota.length : 1,
    },
    {
      id: 'timeline',
      label: 'Jadwal & Tahapan',
      icon: CalendarDays,
      badge: tahapan.length,
    },
  ]

  function handleHapusAnggota(indeks) {
    if (anggota.length <= 1) {
      toast({
        title: 'Tidak dapat menghapus',
        description: 'Perlombaan harus memiliki minimal satu anggota/ketua.',
        variant: 'warning',
      })
      return
    }
    setAnggota((prev) => prev.filter((_, i) => i !== indeks))
  }

  function handleJadikanKetua(indeks) {
    setAnggota((prev) =>
      prev.map((ang, i) => ({
        ...ang,
        peran: i === indeks ? 'ketua' : 'anggota',
      })),
    )
  }

  function handleTambahAnggota() {
    if (!anggotaBaru.nama.trim() || !anggotaBaru.nim.trim()) {
      toast({
        title: 'Data belum lengkap',
        description: 'Nama dan NIM anggota wajib diisi.',
        variant: 'danger',
      })
      return
    }

    setAnggota((prev) => [
      ...prev,
      {
        id: `ang-baru-${Date.now()}`,
        nama: anggotaBaru.nama.trim(),
        nim: anggotaBaru.nim.trim(),
        prodi: anggotaBaru.prodi.trim() || null,
        peran: 'anggota',
      },
    ])
    setAnggotaBaru({ nama: '', nim: '', prodi: '', peran: 'anggota' })
    setTambahAnggotaBuka(false)
  }

  function handleHapusTahap(indeks) {
    setTahapan((prev) => prev.filter((_, i) => i !== indeks))
  }

  function handleTambahTahap() {
    if (!tahapBaru.tanggalMulai) {
      toast({
        title: 'Tanggal wajib diisi',
        description: 'Tanggal mulai tahapan tidak boleh kosong.',
        variant: 'danger',
      })
      return
    }

    setTahapan((prev) => [
      ...prev,
      {
        id: `thp-baru-${Date.now()}`,
        jenis: tahapBaru.jenis,
        label: tahapBaru.jenis === 'kustom' ? tahapBaru.label.trim() : null,
        tanggalMulai: tahapBaru.tanggalMulai,
        tanggalSelesai: tahapBaru.tanggalSelesai || null,
      },
    ])
    setTahapBaru({ jenis: 'penyisihan', label: '', tanggalMulai: '', tanggalSelesai: '' })
    setTambahTahapBuka(false)
  }

  function handleUbahTanggalTahap(indeks, field, nilai) {
    setTahapan((prev) =>
      prev.map((thp, i) => (i === indeks ? { ...thp, [field]: nilai } : thp)),
    )
  }

  async function handleSimpan() {
    setGalat({})

    const masalah = {}
    if (!info.nama.trim()) masalah.nama = 'Nama perlombaan wajib diisi.'
    if (!info.penyelenggara.trim()) masalah.penyelenggara = 'Penyelenggara wajib diisi.'
    if (info.jenis === 'tim' && !info.namaTim.trim()) {
      masalah.namaTim = 'Nama tim wajib diisi untuk keikutsertaan tim.'
    }

    if (Object.keys(masalah).length > 0) {
      setGalat(masalah)
      setTabAktif('info')
      toast({
        title: 'Periksa formulir',
        description: 'Ada kolom wajib yang belum terisi dengan benar.',
        variant: 'danger',
      })
      return
    }

    setMemproses(true)
    try {
      const patch = {
        nama: info.nama.trim(),
        penyelenggara: info.penyelenggara.trim(),
        bidang: info.bidang,
        tingkat: info.tingkat,
        jenis: info.jenis,
        namaTim: info.jenis === 'tim' ? info.namaTim.trim() : null,
        dosenPembimbingId: info.dosenPembimbingId || null,
        linkPublikasi: info.linkPublikasi?.trim() || null,
        anggota: anggota.map((ang, i) => ({
          ...ang,
          peran: ang.peran ?? (i === 0 ? 'ketua' : 'anggota'),
        })),
        tahapan: tahapan.filter((thp) => thp.tanggalMulai),
      }

      const hasil = await perbaruiLomba(lomba.id, patch)

      toast({
        title: 'Perubahan berhasil disimpan',
        description: `Data perlombaan "${hasil.nama}" telah diperbarui.`,
        variant: 'success',
      })

      onTersimpan?.(hasil)
      onClose()
    } catch (err) {
      toast({
        title: 'Gagal menyimpan perubahan',
        description: err.message,
        variant: 'danger',
      })
    } finally {
      setMemproses(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit Data Perlombaan"
      description={`Perbarui rincian, anggota tim, atau jadwal tahapan untuk perlombaan "${lomba.nama}".`}
      size="xl"
      footer={
        <div className="flex w-full items-center justify-between gap-3">
          <Button variant="ghost" onClick={onClose} disabled={memproses}>
            Batal
          </Button>
          <Button
            variant="primary"
            leadingIcon={Save}
            onClick={handleSimpan}
            loading={memproses}
          >
            Simpan Perubahan
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <Tabs tabs={tabs} activeTab={tabAktif} onChange={setTabAktif} />

        {tabAktif === 'info' && (
          <div className="space-y-4 pt-2">
            <Input
              label="Nama Perlombaan"
              name="namaLomba"
              value={info.nama}
              onChange={(e) => setInfo({ ...info, nama: e.target.value })}
              error={galat.nama}
              required
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Penyelenggara"
                name="penyelenggara"
                value={info.penyelenggara}
                onChange={(e) => setInfo({ ...info, penyelenggara: e.target.value })}
                error={galat.penyelenggara}
                required
              />
              <Select
                label="Bidang Lomba"
                name="bidang"
                value={info.bidang}
                onChange={(e) => setInfo({ ...info, bidang: e.target.value })}
                options={PILIHAN_BIDANG}
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                label="Tingkat Kompetisi"
                name="tingkat"
                value={info.tingkat}
                onChange={(e) => setInfo({ ...info, tingkat: e.target.value })}
                options={PILIHAN_TINGKAT}
                required
              />
              <Select
                label="Jenis Keikutsertaan"
                name="jenis"
                value={info.jenis}
                onChange={(e) => setInfo({ ...info, jenis: e.target.value })}
                options={JENIS_KEIKUTSERTAAN}
                required
              />
            </div>

            {info.jenis === 'tim' && (
              <Input
                label="Nama Tim"
                name="namaTim"
                placeholder="Masukkan nama tim"
                value={info.namaTim}
                onChange={(e) => setInfo({ ...info, namaTim: e.target.value })}
                error={galat.namaTim}
                required
              />
            )}

            <Select
              label="Dosen Pembimbing"
              name="dosenPembimbingId"
              value={info.dosenPembimbingId}
              onChange={(e) => setInfo({ ...info, dosenPembimbingId: e.target.value })}
              options={opsiDosen}
              hint="Pilih dosen pembimbing yang mendampingi keikutsertaan Anda."
            />

            <Input
              label="Tautan Publikasi / Informasi Resmi (Opsional)"
              name="linkPublikasi"
              type="url"
              placeholder="https://lomba.example.ac.id"
              value={info.linkPublikasi}
              onChange={(e) => setInfo({ ...info, linkPublikasi: e.target.value })}
            />
          </div>
        )}

        {tabAktif === 'tim' && (
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Daftar Anggota & Ketua ({anggota.length})
                </p>
                <p className="text-xs text-slate-500">
                  {info.jenis === 'tim'
                    ? 'Kelola anggota tim yang terdaftar pada kompetisi ini.'
                    : 'Perlombaan perorangan hanya memiliki satu peserta ketua.'}
                </p>
              </div>

              {info.jenis === 'tim' && (
                <Button
                  size="sm"
                  variant="outline"
                  leadingIcon={UserPlus}
                  onClick={() => setTambahAnggotaBuka((v) => !v)}
                >
                  {tambahAnggotaBuka ? 'Tutup Form' : 'Tambah Anggota'}
                </Button>
              )}
            </div>

            {tambahAnggotaBuka && info.jenis === 'tim' && (
              <div className="rounded-lg border border-primary-200 bg-primary-50/50 p-3.5 space-y-3">
                <p className="text-xs font-semibold text-primary-900">
                  Tambah Anggota Baru ke Tim
                </p>
                <div className="grid gap-3 sm:grid-cols-3">
                  <Input
                    label="Nama Anggota"
                    placeholder="Nama lengkap"
                    value={anggotaBaru.nama}
                    onChange={(e) => setAnggotaBaru({ ...anggotaBaru, nama: e.target.value })}
                    required
                  />
                  <Input
                    label="NIM"
                    placeholder="25020..."
                    value={anggotaBaru.nim}
                    onChange={(e) => setAnggotaBaru({ ...anggotaBaru, nim: e.target.value })}
                    required
                  />
                  <Select
                    label="Program Studi"
                    value={anggotaBaru.prodi}
                    onChange={(e) => setAnggotaBaru({ ...anggotaBaru, prodi: e.target.value })}
                    options={PILIHAN_PRODI}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setTambahAnggotaBuka(false)}
                  >
                    Batal
                  </Button>
                  <Button size="sm" variant="primary" onClick={handleTambahAnggota}>
                    Tambahkan ke Tim
                  </Button>
                </div>
              </div>
            )}

            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="p-3">Nama</th>
                    <th className="p-3">NIM</th>
                    <th className="p-3">Program Studi</th>
                    <th className="p-3">Peran</th>
                    {info.jenis === 'tim' && <th className="p-3 text-right">Aksi</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {anggota.map((ang, i) => (
                    <tr key={ang.id ?? i} className="hover:bg-slate-50/60">
                      <td className="p-3 font-medium text-slate-900">{ang.nama}</td>
                      <td className="p-3 text-slate-600 font-mono">{ang.nim}</td>
                      <td className="p-3 text-slate-600">{ang.prodi ?? '-'}</td>
                      <td className="p-3">
                        <Badge tone={ang.peran === 'ketua' ? 'primary' : 'neutral'} size="sm">
                          {ang.peran === 'ketua' ? 'Ketua Tim' : 'Anggota'}
                        </Badge>
                      </td>
                      {info.jenis === 'tim' && (
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {ang.peran !== 'ketua' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                leadingIcon={UserCheck}
                                onClick={() => handleJadikanKetua(i)}
                              >
                                Jadikan Ketua
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-danger-600 hover:text-danger-700"
                              onClick={() => handleHapusAnggota(i)}
                              aria-label={`Hapus ${ang.nama}`}
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tabAktif === 'timeline' && (
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Jadwal & Tahapan Perlombaan ({tahapan.length})
                </p>
                <p className="text-xs text-slate-500">
                  Sesuaikan tanggal mulai dan akhir tahapan agar monitoring selalu akurat.
                </p>
              </div>

              <Button
                size="sm"
                variant="outline"
                leadingIcon={Plus}
                onClick={() => setTambahTahapBuka((v) => !v)}
              >
                {tambahTahapBuka ? 'Tutup Form' : 'Tambah Tahapan'}
              </Button>
            </div>

            {tambahTahapBuka && (
              <div className="rounded-lg border border-primary-200 bg-primary-50/50 p-3.5 space-y-3">
                <p className="text-xs font-semibold text-primary-900">
                  Tambah Tahapan Baru
                </p>
                <div className="grid gap-3 sm:grid-cols-3">
                  <Select
                    label="Jenis Tahapan"
                    value={tahapBaru.jenis}
                    onChange={(e) => setTahapBaru({ ...tahapBaru, jenis: e.target.value })}
                    options={PILIHAN_JENIS_TAHAPAN}
                  />
                  <Input
                    label="Tanggal Mulai"
                    type="date"
                    value={tahapBaru.tanggalMulai}
                    onChange={(e) => setTahapBaru({ ...tahapBaru, tanggalMulai: e.target.value })}
                    required
                  />
                  <Input
                    label="Tanggal Selesai (Opsional)"
                    type="date"
                    value={tahapBaru.tanggalSelesai}
                    onChange={(e) => setTahapBaru({ ...tahapBaru, tanggalSelesai: e.target.value })}
                  />
                </div>
                {tahapBaru.jenis === 'kustom' && (
                  <Input
                    label="Nama Tahapan Kustom"
                    placeholder="Contoh: Boot camp, Pitching Day, dll."
                    value={tahapBaru.label}
                    onChange={(e) => setTahapBaru({ ...tahapBaru, label: e.target.value })}
                    required
                  />
                )}
                <div className="flex justify-end gap-2">
                  <Button size="sm" variant="ghost" onClick={() => setTambahTahapBuka(false)}>
                    Batal
                  </Button>
                  <Button size="sm" variant="primary" onClick={handleTambahTahap}>
                    Tambahkan Tahapan
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-2.5">
              {tahapan.length === 0 ? (
                <p className="p-4 text-center text-xs text-slate-500 rounded-lg border border-dashed border-slate-200">
                  Belum ada tahapan jadwal yang tercatat.
                </p>
              ) : (
                tahapan.map((thp, i) => (
                  <div
                    key={thp.id ?? i}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-slate-900">
                          {thp.jenis === 'kustom'
                            ? thp.label || 'Tahapan Kustom'
                            : labelTahapan(thp.jenis)}
                        </span>
                        <Badge size="sm" tone="neutral">
                          {thp.jenis}
                        </Badge>
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-500">Mulai:</span>
                          <input
                            type="date"
                            value={thp.tanggalMulai}
                            onChange={(e) =>
                              handleUbahTanggalTahap(i, 'tanggalMulai', e.target.value)
                            }
                            className="rounded border border-slate-200 px-2 py-0.5 text-xs text-slate-800"
                          />
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-500">Selesai:</span>
                          <input
                            type="date"
                            value={thp.tanggalSelesai ?? ''}
                            onChange={(e) =>
                              handleUbahTanggalTahap(i, 'tanggalSelesai', e.target.value)
                            }
                            className="rounded border border-slate-200 px-2 py-0.5 text-xs text-slate-800"
                          />
                        </div>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-danger-600 hover:text-danger-700"
                      onClick={() => handleHapusTahap(i)}
                      aria-label="Hapus tahapan ini"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
