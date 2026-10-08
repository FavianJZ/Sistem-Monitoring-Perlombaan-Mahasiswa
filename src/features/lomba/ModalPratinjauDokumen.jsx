import { useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  FileCheck,
  FileText,
  Image as ImageIcon,
  ShieldCheck,
  XCircle,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { formatTanggal } from '@/lib/date'
import { formatUkuran } from '@/lib/format'
import { JENIS_BERKAS } from '@/config/domain'

export function ModalPratinjauDokumen({
  open,
  onClose,
  berkas,
  lomba,
  role = 'mahasiswa',
  onSetujui,
  onTolak,
  onUnggahUlang,
  memproses = false,
}) {
  const [zoom, setZoom] = useState(1)

  if (!berkas) return null

  const isDosenAtauAdmin = role === 'dosen' || role === 'admin'
  const namaJenis = JENIS_BERKAS[berkas.tipe]?.label ?? berkas.tipe
  const gambar =
    berkas.mimeType?.startsWith('image/') ||
    berkas.tipe === 'poster' ||
    (berkas.url && berkas.url.startsWith('data:image'))

  const urlAktif = berkas.url || (berkas.tipe === 'poster' ? lomba?.posterUrl : null)
  const statusVerifikasi = berkas.statusVerifikasi ?? 'menunggu'

  function bukaDiTabBaru() {
    if (urlAktif) {
      const tab = window.open()
      if (tab) {
        if (gambar) {
          tab.document.write(
            `<html><head><title>${berkas.namaFile}</title></head><body style="margin:0;background:#1e293b;display:grid;place-items:center;min-height:100vh;"><img src="${urlAktif}" style="max-width:95vw;max-height:95vh;object-fit:contain;box-shadow:0 10px 25px rgba(0,0,0,0.5);border-radius:8px;"/></body></html>`,
          )
        } else {
          tab.location.href = urlAktif
        }
      }
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        setZoom(1)
        onClose()
      }}
      title={`Pratinjau Dokumen: ${namaJenis}`}
      description={`${berkas.namaFile ?? 'Dokumen'} • ${formatUkuran(berkas.size)} • Diunggah ${formatTanggal(berkas.diunggahPada, { panjang: true })}`}
      size="xl"
      footer={
        <div className="flex w-full flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {urlAktif && (
              <Button
                variant="outline"
                size="sm"
                leadingIcon={ExternalLink}
                onClick={bukaDiTabBaru}
              >
                Buka Penuh
              </Button>
            )}
            {gambar && urlAktif && (
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setZoom((z) => Math.max(0.6, z - 0.2))}
                  aria-label="Perkecil"
                >
                  <ZoomOut className="size-4" />
                </Button>
                <span className="text-xs text-slate-500">{Math.round(zoom * 100)}%</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setZoom((z) => Math.min(2.5, z + 0.2))}
                  aria-label="Perbesar"
                >
                  <ZoomIn className="size-4" />
                </Button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isDosenAtauAdmin ? (
              <>
                <Button
                  variant="danger"
                  leadingIcon={XCircle}
                  onClick={() => onTolak?.(berkas)}
                  disabled={memproses}
                >
                  Tolak Dokumen
                </Button>
                <Button
                  variant="primary"
                  leadingIcon={CheckCircle2}
                  onClick={() => onSetujui?.(berkas)}
                  disabled={memproses}
                >
                  Setujui Dokumen
                </Button>
              </>
            ) : (
              <>
                {statusVerifikasi === 'ditolak' && (
                  <Button
                    variant="primary"
                    leadingIcon={FileCheck}
                    onClick={() => {
                      onClose()
                      onUnggahUlang?.(berkas)
                    }}
                  >
                    Unggah Ulang Dokumen
                  </Button>
                )}
                <Button variant="outline" onClick={onClose}>
                  Tutup
                </Button>
              </>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-4">

        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600">Status Dokumen:</span>
            {statusVerifikasi === 'diterima' && (
              <Badge tone="success" dot>
                Terverifikasi & Diterima
              </Badge>
            )}
            {statusVerifikasi === 'ditolak' && (
              <Badge tone="danger" dot>
                Ditolak / Perlu Perbaikan
              </Badge>
            )}
            {statusVerifikasi === 'menunggu' && (
              <Badge tone="warning" dot>
                Menunggu Pemeriksaan
              </Badge>
            )}
          </div>

          {berkas.diverifikasiPada && (
            <span className="text-xs text-slate-500">
              Diverifikasi: {formatTanggal(berkas.diverifikasiPada)}
              {berkas.diverifikasiOleh ? ` oleh ${berkas.diverifikasiOleh}` : ''}
            </span>
          )}
        </div>

        {statusVerifikasi === 'ditolak' && berkas.catatanPenolakan && (
          <div className="flex items-start gap-2.5 rounded-lg border border-danger-200 bg-danger-50 p-3 text-sm text-danger-800">
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-danger-600" aria-hidden="true" />
            <div>
              <p className="font-semibold text-danger-900">Catatan Penolakan Verifikator:</p>
              <p className="mt-0.5">{berkas.catatanPenolakan}</p>
            </div>
          </div>
        )}

        <div className="relative min-h-[380px] overflow-hidden rounded-lg border border-slate-200 bg-slate-100 flex items-center justify-center p-4">
          {urlAktif && gambar ? (
            <div className="max-h-[500px] overflow-auto">
              <img
                src={urlAktif}
                alt={berkas.namaFile ?? namaJenis}
                style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}
                className="max-h-[480px] w-auto max-w-full rounded-md object-contain shadow-sm transition-transform duration-150"
              />
            </div>
          ) : urlAktif && berkas.mimeType === 'application/pdf' ? (
            <iframe
              src={urlAktif}
              title={berkas.namaFile ?? namaJenis}
              className="h-[480px] w-full rounded-md border-0 bg-white"
            />
          ) : (

            <div className="w-full max-w-xl rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <div className="border-b border-slate-200 pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="grid size-10 place-items-center rounded-lg bg-primary-50 text-primary-600">
                      <ShieldCheck className="size-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">
                        SISTEM MONITORING PERLOMBAAN
                      </h4>
                      <p className="text-xs text-slate-500">BINUS UNIVERSITY - Berkas Dokumen Resmi</p>
                    </div>
                  </div>
                  <Badge tone={statusVerifikasi === 'diterima' ? 'success' : 'primary'}>
                    {JENIS_BERKAS[berkas.tipe]?.wajib ? 'Dokumen Wajib' : 'Dokumen Pendukung'}
                  </Badge>
                </div>
              </div>

              <div className="my-5 grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-500">Jenis Dokumen:</span>
                  <p className="font-semibold text-slate-800">{namaJenis}</p>
                </div>
                <div>
                  <span className="text-slate-500">Nama File:</span>
                  <p className="truncate font-semibold text-slate-800">
                    {berkas.namaFile ?? 'dokumen_resmi.pdf'}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500">Ukuran Berkas:</span>
                  <p className="font-semibold text-slate-800">{formatUkuran(berkas.size)}</p>
                </div>
                <div>
                  <span className="text-slate-500">Format:</span>
                  <p className="font-semibold text-slate-800">
                    {berkas.mimeType ?? 'Dokumen Digital (PDF/Gambar)'}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500">Perlombaan:</span>
                  <p className="truncate font-semibold text-slate-800">
                    {lomba?.nama ?? 'Perlombaan Mahasiswa'}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500">Tanggal Unggah:</span>
                  <p className="font-semibold text-slate-800">
                    {formatTanggal(berkas.diunggahPada, { panjang: true })}
                  </p>
                </div>
              </div>

              <div className="rounded-md border border-dashed border-slate-200 bg-slate-50/80 p-4 text-center">
                <FileText className="mx-auto size-8 text-primary-500/70" />
                <p className="mt-2 text-xs font-semibold text-slate-700">
                  Dokumen Digital Terverifikasi di Sistem Kampus
                </p>
                <p className="mt-1 text-[11px] text-slate-500">
                  ID Dokumen: <code className="text-slate-600">{berkas.id}</code>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
