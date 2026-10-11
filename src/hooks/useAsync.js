import { useCallback, useEffect, useRef, useState } from 'react'
import { langgananPerubahan } from '@/services/perubahanData'

export function useAsync(fungsi, deps = [], { langsung = true, realtime = true } = {}) {
  const [state, setState] = useState({ data: null, loading: langsung, error: null })
  const versi = useRef(0)
  const terpasang = useRef(true)

  useEffect(() => {
    terpasang.current = true
    return () => {
      terpasang.current = false
    }
  }, [])

  const jalankan = useCallback(async ({ diam = false } = {}) => {
    const versiSaya = (versi.current += 1)
    if (!diam) setState((sebelum) => ({ ...sebelum, loading: true, error: null }))

    try {
      const data = await fungsi()
      if (!terpasang.current || versiSaya !== versi.current) return null

      setState({ data, loading: false, error: null })
      return data
    } catch (error) {
      if (!terpasang.current || versiSaya !== versi.current) return null

      setState((sebelum) => (diam && sebelum.data ? sebelum : { data: null, loading: false, error }))
      return null
    }
  }, deps)

  useEffect(() => {
    if (langsung) jalankan()
  }, [jalankan, langsung])

  useEffect(() => {
    if (!realtime) return
    return langgananPerubahan(() => jalankan({ diam: true }))
  }, [jalankan, realtime])

  return { ...state, jalankan }
}
