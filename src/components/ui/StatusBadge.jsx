import { CircleCheck, CircleDashed, FileWarning, Loader, Medal } from 'lucide-react'
import { Badge } from './Badge'
import { CAPAIAN_LOMBA, STATUS_LOMBA } from '@/config/domain'

const STATUS_ICONS = {
  terdaftar: CircleDashed,
  berlangsung: Loader,
  selesai: CircleCheck,
}

export function StatusBadge({ status, size = 'md', withIcon = true }) {
  const meta = STATUS_LOMBA[status]
  if (!meta) return <Badge size={size}>-</Badge>

  return (
    <Badge tone={meta.tone} size={size} icon={withIcon ? STATUS_ICONS[status] : undefined}>
      {meta.label}
    </Badge>
  )
}

export function CapaianBadge({ capaian, size = 'md', withIcon = true }) {
  const meta = CAPAIAN_LOMBA[capaian]
  if (!meta) return null

  const isPodium = ['juara_1', 'juara_2', 'juara_3'].includes(capaian)

  return (
    <Badge tone={meta.tone} size={size} icon={withIcon && isPodium ? Medal : undefined}>
      {meta.label}
    </Badge>
  )
}

export function KelengkapanBadge({ lengkap, size = 'md' }) {
  return lengkap ? (
    <Badge tone="success" size={size} icon={CircleCheck}>
      Dokumen Lengkap
    </Badge>
  ) : (
    <Badge tone="warning" size={size} icon={FileWarning}>
      Dokumen Belum Lengkap
    </Badge>
  )
}
