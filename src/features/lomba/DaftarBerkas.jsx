import { useState } from 'react'
import {
  AlertCircle,
  Check,
  Eye,
  FileText,
  Image as ImageIcon,
  RefreshCw,
  TriangleAlert,
  X,
} from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { useAuth } from '@/auth/AuthContext'
import { formatTanggal } from '@/lib/date'
import { formatUkuran } from '@/lib/format'
import { JENIS_BERKAS } from '@/config/domain'
import { BERKAS_WAJIB } from '@/services/competitionQuery'
import { unggahUlangBerkas, verifikasiBerkas } from '@/services/competitionService'
import { ModalPratinjauDokumen } from './ModalPratinjauDokumen'
import { ModalTolakBerkas } from './ModalTolakBerkas'
import { ModalUnggahUlangBerkas } from './ModalUnggahUlangBerkas'

function KartuBerkas({
  berkas,
  pratinjau,
  role,
  onLihat,
  onSetujui,
  onBukaTolak,
  onBukaUnggahUlang,
}) {
  const gambar = berkas.mimeType?.startsWith('image/') || (berkas.url && berkas.url.startsWith('data:image'))
  const Ikon = gambar ? ImageIcon : FileText
  const status = berkas.statusVerifikasi ?? 'menunggu'
  const isDosenAtauAdmin = role === 'dosen' || role === 'admin'

  return (
    <li className="flex flex-col justify-between rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300">
      <div className="flex items-start gap-3">
        {pratinjau ? (
          <img
            src={pratinjau}
            alt={`Pratinjau ${JENIS_BERKAS[berkas.tipe]?.label ?? berkas.tipe}`}
            className="size-20 shrink-0 rounded-md border border-slate-200 object-cover"
          />
        ) : (
          <span className="grid size-20 shrink-0 place-items-center rounded-md bg-slate-100 text-slate-500">
            <Ikon className="size-7" aria-hidden="true" />
          </span>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-slate-900">
              {JENIS_BERKAS[berkas.tipe]?.label ?? berkas.tipe}
            </p>
            {JENIS_BERKAS[berkas.tipe]?.wajib && (
              <Badge size="sm" tone="primary">
                Wajib
              </Badge>
            )}
            {status === 'diterima' && (
              <Badge size="sm" tone="success">
                Terverifikasi
              </Badge>
            )}
            {status === 'ditolak' && (
              <Badge size="sm" tone="danger">
                Ditolak
              </Badge>
            )}
            {status === 'menunggu' && (
              <Badge size="sm" tone="warning">
                Menunggu Verifikasi
              </Badge>
            )}
          </div>

          <p className="mt-1 truncate text-sm text-slate-700 font-medium">
            {berkas.namaFile ?? 'Berkas dokumen'}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            {formatUkuran(berkas.size)}
            {berkas.diunggahPada ? ` • Diunggah ${formatTanggal(berkas.diunggahPada)}` : ''}
          </p>

          {status === 'ditolak' && berkas.catatanPenolakan && (
            <div className="mt-2.5 rounded-md border border-danger-200 bg-danger-50/80 p-2.5 text-xs text-danger-800">
              <span className="font-semibold block text-danger-900">Catatan Penolakan:</span>
              <p className="mt-0.5">{berkas.catatanPenolakan}</p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 pt-3">
        <Button
          variant="outline"
          size="sm"
          leadingIcon={Eye}
          onClick={() => onLihat(berkas)}
        >
          Lihat Dokumen
        </Button>

        {isDosenAtauAdmin ? (
          <div className="flex items-center gap-1.5">
            <Button
              variant={status === 'ditolak' ? 'danger' : 'ghost'}
              size="sm"
              leadingIcon={X}
              onClick={() => onBukaTolak(berkas)}
            >
              {status === 'ditolak' ? 'Ubah Penolakan' : 'Tolak'}
            </Button>
            <Button
              variant={status === 'diterima' ? 'success' : 'outline'}
              size="sm"
              leadingIcon={Check}
              onClick={() => onSetujui(berkas)}
            >
              {status === 'diterima' ? 'Disetujui' : 'Setujui'}
            </Button>
          </div>
        ) : (
          status === 'ditolak' && (
            <Button
              variant="danger"
              size="sm"
              leadingIcon={RefreshCw}
              onClick={() => onBukaUnggahUlang(berkas)}
            >
              Unggah Ulang
            </Button>
          )
        )}
      </div>
    </li>
  )
}

export function DaftarBerkas({ lomba, onPerbarui }) {
  const { user } = useAuth()
  const { toast } = useToast()

  const [berkasPratinjau, setBerkasPratinjau] = useState(null)
  const [berkasTolak, setBerkasTolak] = useState(null)
  const [berkasUnggahUlang, setBerkasUnggahUlang] = useState(null)
  const [memproses, setMemproses] = useState(false)

  const berkas = lomba?.berkas ?? []
  const tersedia = new Set(berkas.map((item) => item.tipe))
  const kurang = BERKAS_WAJIB.filter((tipe) => !tersedia.has(tipe))
  const ditolak = berkas.filter((item) => item.statusVerifikasi === 'ditolak')

  const role = user?.role ?? 'mahasiswa'

  async function handleSetujui(targetBerkas) {
    setMemproses(true)
    try {
      await verifikasiBerkas(lomba.id, targetBerkas.id, {
        statusVerifikasi: 'diterima',
        diverifikasiOleh: user?.nama ?? 'Dosen/Admin',
      })
      toast({
        title: 'Dokumen disetujui',
        description: `${JENIS_BERKAS[targetBerkas.tipe]?.label ?? targetBerkas.tipe} telah disetujui.`,
        variant: 'success',
      })
      if (berkasPratinjau?.id === targetBerkas.id) {
        setBerkasPratinjau(null)
      }
      onPerbarui?.()
    } catch (err) {
      toast({
        title: 'Gagal memverifikasi',
        description: err.message,
        variant: 'danger',
      })
    } finally {
      setMemproses(false)
    }
  }

  async function handleKonfirmasiTolak(alasan) {
    if (!berkasTolak) return
    setMemproses(true)
    try {
      await verifikasiBerkas(lomba.id, berkasTolak.id, {
        statusVerifikasi: 'ditolak',
        catatanPenolakan: alasan,
        diverifikasiOleh: user?.nama ?? 'Dosen/Admin',
      })
      toast({
        title: 'Dokumen ditolak',
        description: `Catatan penolakan telah diteruskan ke mahasiswa.`,
        variant: 'warning',
      })
      if (berkasPratinjau?.id === berkasTolak.id) {
        setBerkasPratinjau(null)
      }
      setBerkasTolak(null)
      onPerbarui?.()
    } catch (err) {
      toast({
        title: 'Gagal menolak dokumen',
        description: err.message,
        variant: 'danger',
      })
    } finally {
      setMemproses(false)
    }
  }

  async function handleKonfirmasiUnggahUlang(berkasBaru) {
    if (!berkasUnggahUlang) return
    setMemproses(true)
    try {
      await unggahUlangBerkas(lomba.id, berkasUnggahUlang.id, berkasBaru)
      toast({
        title: 'Dokumen berhasil diunggah ulang',
        description: 'Berkas pengganti telah disimpan dan siap diperiksa kembali.',
        variant: 'success',
      })
      setBerkasUnggahUlang(null)
      onPerbarui?.()
    } catch (err) {
      toast({
        title: 'Gagal mengunggah ulang',
        description: err.message,
        variant: 'danger',
      })
    } finally {
      setMemproses(false)
    }
  }

  return (
    <div className="space-y-4">

      {ditolak.length > 0 && (
        <div className="flex items-start gap-2.5 rounded-md border border-danger-200 bg-danger-50 p-4 text-sm text-danger-900">
          <AlertCircle className="mt-0.5 size-5 shrink-0 text-danger-600" aria-hidden="true" />
          <div>
            <p className="font-semibold">
              {role === 'mahasiswa'
                ? 'Terdapat dokumen yang ditolak dan memerlukan perbaikan:'
                : 'Dokumen berikut telah ditolak dan menunggu mahasiswa mengunggah ulang:'}
            </p>
            <ul className="mt-1.5 list-inside list-disc space-y-0.5 text-xs text-danger-800">
              {ditolak.map((item) => (
                <li key={item.id}>
                  <strong>{JENIS_BERKAS[item.tipe]?.label ?? item.tipe}</strong>: {item.catatanPenolakan}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {kurang.length > 0 && (
        <div className="flex items-start gap-2.5 rounded-md border border-warning-200 bg-warning-50 p-3.5 text-sm text-warning-800">
          <TriangleAlert className="mt-px size-4 shrink-0" aria-hidden="true" />
          <span>
            Belum diunggah: {kurang.map((tipe) => JENIS_BERKAS[tipe]?.label ?? tipe).join(' dan ')}.
          </span>
        </div>
      )}

      {berkas.length === 0 ? (
        <p className="text-sm text-slate-600">Belum ada berkas yang diunggah untuk lomba ini.</p>
      ) : (
        <ul aria-label="Berkas pendukung" className="grid gap-3 sm:grid-cols-2">
          {berkas.map((item) => (
            <KartuBerkas
              key={item.id ?? `${item.tipe}-${item.namaFile}`}
              berkas={item}
              pratinjau={item.url || (item.tipe === 'poster' ? lomba.posterUrl : null)}
              role={role}
              onLihat={(b) => setBerkasPratinjau(b)}
              onSetujui={handleSetujui}
              onBukaTolak={(b) => setBerkasTolak(b)}
              onBukaUnggahUlang={(b) => setBerkasUnggahUlang(b)}
            />
          ))}
        </ul>
      )}

      <ModalPratinjauDokumen
        open={Boolean(berkasPratinjau)}
        onClose={() => setBerkasPratinjau(null)}
        berkas={berkasPratinjau}
        lomba={lomba}
        role={role}
        onSetujui={handleSetujui}
        onTolak={(b) => setBerkasTolak(b)}
        onUnggahUlang={(b) => setBerkasUnggahUlang(b)}
        memproses={memproses}
      />

      <ModalTolakBerkas
        open={Boolean(berkasTolak)}
        onClose={() => setBerkasTolak(null)}
        berkas={berkasTolak}
        onKonfirmasi={handleKonfirmasiTolak}
        memproses={memproses}
      />

      <ModalUnggahUlangBerkas
        open={Boolean(berkasUnggahUlang)}
        onClose={() => setBerkasUnggahUlang(null)}
        berkas={berkasUnggahUlang}
        onSimpan={handleKonfirmasiUnggahUlang}
        memproses={memproses}
      />
    </div>
  )
}
