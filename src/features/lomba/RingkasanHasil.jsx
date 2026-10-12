import { CircleAlert, CircleCheck, Hourglass, Medal, Newspaper } from 'lucide-react'
import { CapaianBadge } from '@/components/ui/StatusBadge'
import { useAuth } from '@/auth/AuthContext'
import { cn } from '@/lib/cn'
import { DaftarBerkas } from './DaftarBerkas'
import { BarisInfo, TautanLuar } from './InfoLomba'
import { formatTanggal } from '@/lib/date'

const INFO_VERIFIKASI = {
  menunggu: {
    ikon: Hourglass,
    kelas: 'border-warning-200 bg-warning-50 text-warning-900',
    judul: 'Menunggu verifikasi sertifikat',
    mahasiswa:
      'Capaian ini belum dihitung sebagai prestasi sampai sertifikatnya disetujui dosen pembimbing.',
    dosen: 'Periksa sertifikat di bawah, lalu setujui atau tolak agar capaian ini tercatat di arsip prestasi.',
  },
  ditolak: {
    ikon: CircleAlert,
    kelas: 'border-danger-200 bg-danger-50 text-danger-900',
    judul: 'Sertifikat ditolak',
    mahasiswa: 'Unggah ulang sertifikat yang benar agar capaian bisa dihitung sebagai prestasi.',
    dosen: 'Menunggu mahasiswa mengunggah ulang sertifikat yang benar.',
  },
  terverifikasi: {
    ikon: CircleCheck,
    kelas: 'border-success-200 bg-success-50 text-success-900',
    judul: 'Capaian terverifikasi',
    mahasiswa: 'Sertifikat sudah disetujui dosen pembimbing. Capaian ini tercatat di arsip prestasi.',
    dosen: 'Sertifikat sudah disetujui. Capaian ini tercatat di arsip prestasi.',
  },
}

export function RingkasanHasil({ lomba, onPerbarui }) {
  const { user } = useAuth()
  const buktiPrestasi = (lomba.berkas ?? []).filter((berkas) =>
    ['sertifikat', 'foto'].includes(berkas.tipe),
  )
  const info = INFO_VERIFIKASI[lomba.statusHasil]
  const IkonInfo = info?.ikon

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="grid size-12 place-items-center rounded-full bg-success-50 text-success-600">
          <Medal className="size-6" aria-hidden="true" />
        </span>
        <div>
          <p className="text-sm text-slate-600">Capaian akhir</p>
          <div className="mt-1">
            <CapaianBadge capaian={lomba.hasil.capaian} />
          </div>
        </div>
      </div>

      {info && (
        <div className={cn('flex items-start gap-2.5 rounded-md border p-3.5 text-sm', info.kelas)}>
          <IkonInfo className="mt-px size-4 shrink-0" aria-hidden="true" />
          <div>
            <p className="font-semibold">{info.judul}</p>
            <p className="mt-0.5 text-xs">
              {user?.role === 'mahasiswa' ? info.mahasiswa : info.dosen}
            </p>
          </div>
        </div>
      )}

      <dl>
        <BarisInfo
          label="Dilaporkan pada"
          nilai={formatTanggal(lomba.hasil.dilaporkanPada, { panjang: true })}
        />
        <BarisInfo
          label="Tautan berita"
          nilai={
            lomba.hasil.linkBerita ? (
              <span className="inline-flex items-center gap-1.5">
                <Newspaper className="size-3.5 shrink-0 text-slate-400" aria-hidden="true" />
                <TautanLuar href={lomba.hasil.linkBerita} />
              </span>
            ) : null
          }
        />
      </dl>

      <div>
        <p className="mb-2 text-sm font-semibold text-slate-900">Bukti prestasi</p>
        <DaftarBerkas
          lomba={{ ...lomba, berkas: buktiPrestasi }}
          onPerbarui={onPerbarui}
          tampilkanKelengkapan={false}
        />
      </div>
    </div>
  )
}
