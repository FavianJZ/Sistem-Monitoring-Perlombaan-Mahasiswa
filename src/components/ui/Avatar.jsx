import { useState } from 'react'
import { cn } from '@/lib/cn'

const SIZES = {
  sm: 'size-8 text-xs',
  md: 'size-10 text-sm',
  lg: 'size-16 text-xl',
  xl: 'size-24 text-3xl',
}

export function inisialNama(nama = '') {
  return nama
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((bagian) => bagian[0])
    .join('')
    .toUpperCase()
}

export function Avatar({ nama, src, size = 'md', className }) {
  const [gagalMuat, setGagalMuat] = useState(null)
  const kelas = cn('shrink-0 rounded-full', SIZES[size] ?? SIZES.md, className)

  if (src && gagalMuat !== src) {
    return (
      <img
        src={src}
        alt={`Foto profil ${nama ?? ''}`.trim()}
        className={cn(kelas, 'bg-slate-100 object-cover')}
        onError={() => setGagalMuat(src)}
      />
    )
  }

  return (
    <span
      aria-hidden="true"
      className={cn(kelas, 'grid place-items-center bg-primary-100 font-bold text-primary-700')}
    >
      {inisialNama(nama)}
    </span>
  )
}
