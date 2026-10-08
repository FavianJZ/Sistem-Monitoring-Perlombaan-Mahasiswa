import { useCallback, useEffect, useRef, useState } from 'react'

export function useAsync(fungsi, deps = [], { langsung = true } = {}) {
  const [state, setState] = useState({ data: null, loading: langsung, error: null })
  const versi = useRef(0)
  const terpasang = useRef(true)

  useEffect(() => {
    terpasang.current = true
    return () => {
      terpasang.current = false
    }
  }, [])

  const jalankan = useCallback(async () => {
    const versiSaya = (versi.current += 1)
    setState((sebelum) => ({ ...sebelum, loading: true, error: null }))

    try {
      const data = await fungsi()
      if (!terpasang.current || versiSaya !== versi.current) return null

      setState({ data, loading: false, error: null })
      return data
    } catch (error) {
      if (!terpasang.current || versiSaya !== versi.current) return null

      setState({ data: null, loading: false, error })
      return null
    }

  }, deps)

  useEffect(() => {
    if (langsung) jalankan()

  }, [jalankan, langsung])

  return { ...state, jalankan }
}
