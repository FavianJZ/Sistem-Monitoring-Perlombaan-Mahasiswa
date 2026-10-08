import { useState } from 'react'
import { cn } from '@/lib/cn'

export const LOGO_BINUS = '/brand/logo-binus.svg'
export const MOTIF_BINUS = '/brand/logo-pita-biru.svg'

function WordmarkCadangan({ className }) {
  return (
    <span className={cn('inline-flex flex-col leading-none', className)}>
      <span className="text-xl font-extrabold tracking-tight text-slate-800">BINUS</span>
      <span className="text-[0.7rem] font-bold tracking-[0.18em] text-primary-500">
        UNIVERSITY
      </span>
    </span>
  )
}

export function BinusLogo({ className }) {
  const [gagal, setGagal] = useState(false)

  if (gagal) return <WordmarkCadangan className={className} />

  return (
    <img
      src={LOGO_BINUS}
      alt="BINUS University"
      onError={() => setGagal(true)}
      className={cn('h-12 w-auto', className)}
    />
  )
}

function MotifCadangan({ className }) {

  const kotak = [
    [0, 0, 1], [8, 0, 0.85], [16, 0, 0.6], [24, 0, 0.35],
    [0, 8, 0.9], [8, 8, 0.7], [16, 8, 0.45],
    [0, 16, 0.75], [8, 16, 0.5], [16, 16, 0.25],
    [0, 24, 0.55], [8, 24, 0.3],
    [0, 32, 0.35], [8, 32, 0.15],
    [0, 40, 0.2],
  ]

  return (
    <svg viewBox="0 0 32 48" aria-hidden="true" className={className}>
      {kotak.map(([x, y, o]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width="7" height="7" fill="#0096d6" opacity={o} />
      ))}
    </svg>
  )
}

export function BinusMotif({ className }) {
  const [gagal, setGagal] = useState(false)

  if (gagal) return <MotifCadangan className={className} />

  return (
    <img
      src={MOTIF_BINUS}
      alt=""
      aria-hidden="true"
      onError={() => setGagal(true)}
      className={className}
    />
  )
}
