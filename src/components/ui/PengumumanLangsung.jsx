
export function PengumumanLangsung({ pesan }) {
  return (
    <div aria-live="polite" aria-atomic="true" className="sr-only">
      {pesan}
    </div>
  )
}
