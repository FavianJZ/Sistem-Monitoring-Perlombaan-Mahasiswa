import { useCallback, useEffect, useRef, useState } from 'react'
import { langgananPerubahan } from '@/services/perubahanData'

/**
 * Menjalankan fungsi async dan menyimpan { data, loading, error }.
 * Dengan `realtime` (bawaan aktif), data dimuat ulang diam-diam setiap kali
 * service memberi tahu ada perubahan, misalnya event Realtime Supabase.
 */
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
    // Muat ulang diam tidak memunculkan skeleton/loading agar layar tidak berkedip.
    if (!diam) setState((sebelum) => ({ ...sebelum, loading: true, error: null }))

    try {
      const data = await fungsi()
      if (!terpasang.current || versiSaya !== versi.current) return null

      setState({ data, loading: false, error: null })
      return data
    } catch (error) {
      if (!terpasang.current || versiSaya !== versi.current) return null

      // Saat diam, pertahankan data lama bila muat ulang gagal.
      setState((sebelum) => (diam && sebelum.data ? sebelum : { data: null, loading: false, error }))
      return null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
