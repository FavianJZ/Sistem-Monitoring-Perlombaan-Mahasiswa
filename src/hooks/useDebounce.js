import { useEffect, useState } from 'react'

/**
 * Menunda perubahan nilai, dipakai agar pencarian tidak memanggil
 * service pada setiap ketikan.
 */
export function useDebounce(nilai, jeda = 300) {
  const [tertunda, setTertunda] = useState(nilai)

  useEffect(() => {
    const timer = setTimeout(() => setTertunda(nilai), jeda)
    return () => clearTimeout(timer)
  }, [nilai, jeda])

  return tertunda
}
