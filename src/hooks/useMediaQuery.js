import { useEffect, useState } from 'react'

function cocok(query) {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  return window.matchMedia(query).matches
}

export function useMediaQuery(query) {
  const [sesuai, setSesuai] = useState(() => cocok(query))

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return undefined
    const media = window.matchMedia(query)
    const perbarui = () => setSesuai(media.matches)
    perbarui()
    media.addEventListener('change', perbarui)
    return () => media.removeEventListener('change', perbarui)
  }, [query])

  return sesuai
}
