import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  ClipboardCheck,
  History,
  Save,
  Trash2,
} from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Stepper } from '@/components/ui/Stepper'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import { useAuth } from '@/auth/AuthContext'
import { useAsync } from '@/hooks/useAsync'
import { daftarDosen } from '@/services/userService'
import { buatLomba } from '@/services/competitionService'
import { langkahUntuk } from '@/features/pendaftaran/langkah'
import { useDraftLomba } from '@/features/pendaftaran/useDraftLomba'
import { validasiLangkah } from '@/features/pendaftaran/validasi'
import { draftKePayload } from '@/features/pendaftaran/payload'
import { LangkahDetailUmum } from '@/features/pendaftaran/LangkahDetailUmum'
import { LangkahAnggotaTim } from '@/features/pendaftaran/LangkahAnggotaTim'
import { LangkahBukti } from '@/features/pendaftaran/LangkahBukti'
import { LangkahPoster } from '@/features/pendaftaran/LangkahPoster'
import { LangkahTimeline } from '@/features/pendaftaran/LangkahTimeline'
import { Tinjauan } from '@/features/pendaftaran/Tinjauan'

export default function PendaftaranLomba() {
  const { user } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const formDraft = useDraftLomba(user)
  const { draft, ubah } = formDraft

  const [error, setError] = useState({})
  const [errorBaris, setErrorBaris] = useState([])
  const [konfirmasiHapus, setKonfirmasiHapus] = useState(false)
  const [meninjau, setMeninjau] = useState(false)
  const [menyimpan, setMenyimpan] = useState(false)
  const [galatSimpan, setGalatSimpan] = useState(null)

  const langkah = useMemo(() => langkahUntuk(draft.jenis), [draft.jenis])

  const indeks = Math.min(draft.langkah ?? 0, langkah.length - 1)
  const langkahSekarang = langkah[indeks]

  const ambilDosen = useCallback(() => daftarDosen(), [])
  const { data: dosen, loading: memuatDosen } = useAsync(ambilDosen, [ambilDosen])

  useEffect(() => {
    setError({})
    setErrorBaris([])
  }, [indeks])

  function keLangkah(tujuan) {
    setMeninjau(false)
    ubah({ langkah: Math.max(0, Math.min(tujuan, langkah.length - 1)) })
  }

  function keLangkahById(idLangkah) {
    const tujuan = langkah.findIndex((item) => item.id === idLangkah)
    if (tujuan !== -1) keLangkah(tujuan)
  }

  function periksaLangkah(idLangkah) {
    const hasil = validasiLangkah(idLangkah, draft)

    if (!hasil.valid) {
      setError(hasil.error)
      setErrorBaris(hasil.anggota ?? hasil.tahapan ?? [])
      toast({
        title: 'Ada data yang perlu diperbaiki',
        description: 'Periksa bagian yang ditandai merah.',
        variant: 'warning',
      })
      return false
    }

    setError({})
    setErrorBaris([])
    return true
  }

  function lanjut() {
    if (!periksaLangkah(langkahSekarang.id)) return
    keLangkah(indeks + 1)
  }

  function keTinjauan() {
    if (!periksaLangkah(langkahSekarang.id)) return

    const bermasalah = langkah.find((item) => !validasiLangkah(item.id, draft).valid)
    if (bermasalah) {
      keLangkah(langkah.indexOf(bermasalah))
      periksaLangkah(bermasalah.id)
      return
    }

    setGalatSimpan(null)
    setMeninjau(true)
  }

  async function simpan() {
    setMenyimpan(true)
    setGalatSimpan(null)

    try {
      const hasil = await buatLomba(draftKePayload(draft, user))

      formDraft.kosongkan()
      toast({
        title: 'Pendaftaran lomba tersimpan',
        description: `${hasil.nama} sudah masuk ke daftar lombamu.`,
        variant: 'success',
      })
      navigate('/lomba-saya')
    } catch (kesalahan) {
      setGalatSimpan(kesalahan.message)
      toast({ title: 'Gagal menyimpan pendaftaran', variant: 'danger' })
    } finally {
      setMenyimpan(false)
    }
  }

  function hapusDraftSekarang() {
    formDraft.kosongkan()
    setKonfirmasiHapus(false)
    setMeninjau(false)
    setError({})
    setErrorBaris([])
    toast({ title: 'Draft dikosongkan', variant: 'info' })
  }

  const langkahTerakhir = indeks === langkah.length - 1
  const namaDosen = dosen?.find((item) => item.id === draft.dosenPembimbingId)?.nama

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Daftarkan Lomba"
        description="Lengkapi data keikutsertaan dalam beberapa langkah. Isian tersimpan otomatis di peramban."
        actions={
          <Button as={Link} to="/lomba-saya" variant="ghost" leadingIcon={ArrowLeft}>
            Kembali ke daftar
          </Button>
        }
      />

      {formDraft.draftDipulihkan && (
        <div className="mb-6 flex flex-wrap items-start gap-3 rounded-lg border border-primary-200 bg-primary-50 p-4">
          <History className="mt-0.5 size-5 shrink-0 text-primary-600" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-primary-900">Draft sebelumnya dilanjutkan</p>
            <p className="mt-0.5 text-sm text-primary-800">
              Isian yang belum disimpan dipulihkan dari peramban ini.
            </p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={formDraft.tutupPemberitahuan}>
              Mengerti
            </Button>
            <Button
              size="sm"
              variant="outline"
              leadingIcon={Trash2}
              onClick={() => setKonfirmasiHapus(true)}
            >
              Mulai dari awal
            </Button>
          </div>
        </div>
      )}

      <Card className="mb-6">
        <CardContent>
          <Stepper steps={langkah} current={meninjau ? langkah.length : indeks} onStepClick={keLangkah} />
        </CardContent>
      </Card>

      {meninjau ? (
        <Card>
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-base font-bold tracking-tight text-slate-900">
              Tinjau sebelum disimpan
            </h2>
            <p className="mt-0.5 text-sm text-slate-600">
              Periksa kembali seluruh data. Setelah disimpan, lomba ini muncul di daftar lombamu dan
              bisa dipantau program studi.
            </p>
          </div>

          <Tinjauan draft={draft} namaDosen={namaDosen} onUbah={keLangkahById} />

          {galatSimpan && (
            <div
              role="alert"
              className="mx-5 mb-4 rounded-md border border-danger-200 bg-danger-50 p-3.5 text-sm text-danger-800"
            >
              {galatSimpan}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50/60 px-5 py-4">
            <Button
              variant="outline"
              leadingIcon={ArrowLeft}
              onClick={() => setMeninjau(false)}
              disabled={menyimpan}
            >
              Kembali mengubah
            </Button>
            <Button leadingIcon={Save} onClick={simpan} loading={menyimpan}>
              Simpan pendaftaran
            </Button>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-base font-bold tracking-tight text-slate-900">
              Langkah {indeks + 1} dari {langkah.length}: {langkahSekarang.label}
            </h2>
            <p className="mt-0.5 text-sm text-slate-600">{langkahSekarang.keterangan}</p>
          </div>

          <CardContent>
            {langkahSekarang.id === 'detail' && (
              <LangkahDetailUmum
                draft={draft}
                ubah={ubah}
                error={error}
                dosen={dosen ?? []}
                memuatDosen={memuatDosen}
              />
            )}

            {langkahSekarang.id === 'anggota' && (
              <LangkahAnggotaTim
                draft={draft}
                ubahAnggota={formDraft.ubahAnggota}
                tambahAnggota={formDraft.tambahAnggota}
                hapusAnggota={formDraft.hapusAnggota}
                error={error}
                errorAnggota={errorBaris}
              />
            )}

            {langkahSekarang.id === 'bukti' && (
              <LangkahBukti draft={draft} setBerkas={formDraft.setBerkas} error={error} />
            )}

            {langkahSekarang.id === 'poster' && (
              <LangkahPoster
                draft={draft}
                ubah={ubah}
                setBerkas={formDraft.setBerkas}
                error={error}
              />
            )}

            {langkahSekarang.id === 'timeline' && (
              <LangkahTimeline
                draft={draft}
                ubahTahapan={formDraft.ubahTahapan}
                tambahTahapan={formDraft.tambahTahapan}
                hapusTahapan={formDraft.hapusTahapan}
                error={error}
                errorTahapan={errorBaris}
              />
            )}
          </CardContent>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50/60 px-5 py-4">
            <Button
              variant="outline"
              leadingIcon={ArrowLeft}
              onClick={() => keLangkah(indeks - 1)}
              disabled={indeks === 0}
            >
              Sebelumnya
            </Button>

            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={() => setKonfirmasiHapus(true)}>
                Kosongkan draft
              </Button>

              {langkahTerakhir ? (
                <Button leadingIcon={ClipboardCheck} onClick={keTinjauan}>
                  Tinjau & Simpan
                </Button>
              ) : (
                <Button trailingIcon={ArrowRight} onClick={lanjut}>
                  Lanjut
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}

      <Modal
        open={konfirmasiHapus}
        onClose={() => setKonfirmasiHapus(false)}
        title="Kosongkan draft pendaftaran"
        description="Seluruh isian yang belum disimpan akan hilang."
        footer={
          <>
            <Button variant="outline" onClick={() => setKonfirmasiHapus(false)}>
              Batal
            </Button>
            <Button variant="danger" onClick={hapusDraftSekarang}>
              Kosongkan
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          Tindakan ini hanya menghapus draft di peramban. Lomba yang sudah tersimpan tidak
          terpengaruh.
        </p>
      </Modal>
    </div>
  )
}
