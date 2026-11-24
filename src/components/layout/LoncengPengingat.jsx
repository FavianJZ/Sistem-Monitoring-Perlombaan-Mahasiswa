import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, CalendarClock, Mail } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { useAsync } from '@/hooks/useAsync'
import { pengingatJadwal } from '@/services/competitionService'
import { formatTanggalDenganHari } from '@/lib/date'
import { labelTahapan } from '@/config/domain'
import { MODE_DEMO } from '@/config/mode'
import { cn } from '@/lib/cn'
import { isiEmailPengingat } from '../../../supabase/functions/kirim-pengingat/pengingat.js'

export function teksSisaHari(sisaHari) {
  if (sisaHari === 0) return 'Hari ini'
  if (sisaHari === 1) return 'Besok'
  return `${sisaHari} hari lagi`
}

function tautanLomba(role, lombaId) {
  return role === 'mahasiswa' ? `/lomba-saya/${lombaId}` : `/monitoring/lomba/${lombaId}`
}

export function contohEmail(item) {
  const hariIni = item.sisaHari === 0
  const { html } = isiEmailPengingat(
    {
      lombaId: item.lombaId,
      namaLomba: item.namaLomba,
      namaTim: item.namaTim,
      tahap: item.tahap,
      jadwal: {
        kode: hariIni ? 'h0' : 'h3',
        selisihHari: item.sisaHari,
        judul: hariIni ? 'hari ini' : teksSisaHari(item.sisaHari).toLowerCase(),
      },
    },
    window.location.origin,
  )
  return `<!doctype html><html><head><meta charset="utf-8"><base target="_blank"></head><body style="margin:0;padding:16px;background:#f1f5f9">${html}</body></html>`
}

export function LoncengPengingat({ user }) {
  const [terbuka, setTerbuka] = useState(false)
  const [pratinjau, setPratinjau] = useState(null)
  const wadah = useRef(null)
  const idPanel = useId()

  const ambil = useCallback(() => pengingatJadwal(user), [user])
  const { data } = useAsync(ambil, [ambil])
  const daftar = data ?? []

  useEffect(() => {
    if (!terbuka) return undefined
    const tutupBilaDiLuar = (event) => {
      if (!wadah.current?.contains(event.target)) setTerbuka(false)
    }
    const tutupDenganEsc = (event) => {
      if (event.key === 'Escape') setTerbuka(false)
    }
    document.addEventListener('mousedown', tutupBilaDiLuar)
    document.addEventListener('keydown', tutupDenganEsc)
    return () => {
      document.removeEventListener('mousedown', tutupBilaDiLuar)
      document.removeEventListener('keydown', tutupDenganEsc)
    }
  }, [terbuka])

  return (
    <div ref={wadah} className="relative">
      <button
        type="button"
        onClick={() => setTerbuka((v) => !v)}
        aria-expanded={terbuka}
        aria-controls={idPanel}
        aria-label={
          daftar.length
            ? `Pengingat jadwal, ${daftar.length} jadwal dalam 3 hari ke depan`
            : 'Pengingat jadwal, tidak ada jadwal dekat'
        }
        className="relative rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
      >
        <Bell className="size-5" aria-hidden="true" />
        {daftar.length > 0 && (
          <span
            aria-hidden="true"
            className="absolute right-1 top-1 grid min-w-4 place-items-center rounded-full bg-danger-600 px-1 text-[10px] font-bold leading-4 text-white"
          >
            {daftar.length > 9 ? '9+' : daftar.length}
          </span>
        )}
      </button>

      {terbuka && (
        <div
          id={idPanel}
          role="region"
          aria-label="Pengingat jadwal lomba"
          className="fixed inset-x-3 top-16 z-40 rounded-lg border border-slate-200 bg-white shadow-pop sm:absolute sm:inset-x-auto sm:right-0 sm:top-12 sm:w-96"
        >
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="font-semibold text-slate-900">Pengingat jadwal</p>
            <p className="text-xs text-slate-500">Tahapan lomba hari ini sampai 3 hari ke depan</p>
          </div>

          {daftar.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-slate-500">
              Tidak ada jadwal lomba dalam 3 hari ke depan.
            </p>
          ) : (
            <ul className="max-h-80 divide-y divide-slate-100 overflow-y-auto">
              {daftar.map((item) => (
                <li key={`${item.lombaId}-${item.tahap.id ?? item.tahap.tanggalMulai}-${item.tahap.jenis}`}>
                  <div className="flex items-start gap-3 px-4 py-3">
                    <span
                      className={cn(
                        'mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg',
                        item.sisaHari === 0 ? 'bg-danger-50 text-danger-600' : 'bg-primary-50 text-primary-600',
                      )}
                    >
                      <CalendarClock className="size-4" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <Link
                        to={tautanLomba(user.role, item.lombaId)}
                        onClick={() => setTerbuka(false)}
                        className="block font-semibold text-slate-900 hover:text-primary-700 hover:underline"
                      >
                        {item.tahap.jenis === 'kustom' && item.tahap.label
                          ? item.tahap.label
                          : labelTahapan(item.tahap.jenis)}
                      </Link>
                      <p className="truncate text-sm text-slate-600">{item.namaLomba}</p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        <span className={cn('font-semibold', item.sisaHari === 0 ? 'text-danger-700' : 'text-primary-700')}>
                          {teksSisaHari(item.sisaHari)}
                        </span>
                        {' · '}
                        {formatTanggalDenganHari(item.tahap.tanggalMulai)}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setPratinjau(item)
                          setTerbuka(false)
                        }}
                        className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-primary-700 hover:underline"
                      >
                        <Mail className="size-3.5" aria-hidden="true" />
                        Lihat email pengingat
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <p className="border-t border-slate-100 bg-slate-50 px-4 py-2.5 text-xs text-slate-500">
            {MODE_DEMO
              ? 'Mode demo: email tidak dikirim. Di situs utama, pengingat dikirim ke email peserta pukul 07.00 WIB pada H-3 dan hari H.'
              : 'Pengingat juga dikirim ke email peserta pukul 07.00 WIB pada H-3 dan hari H.'}
          </p>
        </div>
      )}

      <Modal
        open={Boolean(pratinjau)}
        onClose={() => setPratinjau(null)}
        title="Pratinjau email pengingat"
        description={
          pratinjau
            ? `Contoh untuk ${labelTahapan(pratinjau.tahap.jenis)} - ${pratinjau.namaLomba}. Email sungguhan dikirim pada H-3 dan hari H pukul 07.00 WIB.`
            : undefined
        }
        size="lg"
      >
        {pratinjau && (
          <iframe
            title="Pratinjau email pengingat"
            srcDoc={contohEmail(pratinjau)}
            sandbox="allow-popups"
            className="h-[26rem] w-full rounded-md border border-slate-200"
          />
        )}
      </Modal>
    </div>
  )
}
