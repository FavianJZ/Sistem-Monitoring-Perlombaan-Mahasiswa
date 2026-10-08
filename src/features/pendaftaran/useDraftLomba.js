import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  anggotaKosong,
  bacaDraft,
  draftAwal,
  draftTerisi,
  hapusDraft,
  kunciDraft,
  simpanDraft,
} from './draft'

export function useDraftLomba(pengguna) {
  const kunci = useMemo(() => kunciDraft(pengguna.id), [pengguna.id])

  const [draft, setDraft] = useState(() => {
    const tersimpan = bacaDraft(kunci)
    return tersimpan ? { ...draftAwal(pengguna), ...tersimpan } : draftAwal(pengguna)
  })

  const adaDraftTersimpanRef = useRef(draftTerisi(bacaDraft(kunci), pengguna))
  const [pulihkan, setPulihkan] = useState(adaDraftTersimpanRef.current)

  const draftRef = useRef(draft)
  draftRef.current = draft

  const dibuangRef = useRef(false)

  useEffect(() => {
    if (dibuangRef.current) return undefined

    const timer = setTimeout(() => simpanDraft(kunci, draft), 250)
    return () => clearTimeout(timer)
  }, [kunci, draft])

  useEffect(() => {
    return () => {
      if (dibuangRef.current) return
      simpanDraft(kunci, draftRef.current)
    }
  }, [kunci])

  const ubah = useCallback((patch) => {
    dibuangRef.current = false
    setDraft((sebelum) => ({
      ...sebelum,
      ...(typeof patch === 'function' ? patch(sebelum) : patch),
    }))
  }, [])

  const ubahAnggota = useCallback((indeks, patch) => {
    setDraft((sebelum) => ({
      ...sebelum,
      anggota: sebelum.anggota.map((item, posisi) =>
        posisi === indeks ? { ...item, ...patch } : item,
      ),
    }))
  }, [])

  const tambahAnggota = useCallback(() => {
    setDraft((sebelum) => ({ ...sebelum, anggota: [...sebelum.anggota, anggotaKosong()] }))
  }, [])

  const hapusAnggota = useCallback((indeks) => {
    setDraft((sebelum) => ({
      ...sebelum,

      anggota: sebelum.anggota.filter((item, posisi) => posisi === 0 || posisi !== indeks),
    }))
  }, [])

  const ubahTahapan = useCallback((indeks, patch) => {
    setDraft((sebelum) => ({
      ...sebelum,
      tahapan: sebelum.tahapan.map((item, posisi) =>
        posisi === indeks ? { ...item, ...patch } : item,
      ),
    }))
  }, [])

  const tambahTahapan = useCallback((tahap) => {
    setDraft((sebelum) => ({ ...sebelum, tahapan: [...sebelum.tahapan, tahap] }))
  }, [])

  const hapusTahapan = useCallback((indeks) => {
    setDraft((sebelum) => ({
      ...sebelum,
      tahapan: sebelum.tahapan.filter((_, posisi) => posisi !== indeks),
    }))
  }, [])

  const setBerkas = useCallback((tipe, berkas) => {
    setDraft((sebelum) => {
      const berikutnya = { ...sebelum.berkas }
      if (berkas) berikutnya[tipe] = berkas
      else delete berikutnya[tipe]
      return { ...sebelum, berkas: berikutnya }
    })
  }, [])

  const kosongkan = useCallback(() => {
    dibuangRef.current = true
    hapusDraft(kunci)
    setDraft(draftAwal(pengguna))
    setPulihkan(false)
  }, [kunci, pengguna])

  const tutupPemberitahuan = useCallback(() => setPulihkan(false), [])

  return {
    draft,
    ubah,
    ubahAnggota,
    tambahAnggota,
    hapusAnggota,
    ubahTahapan,
    tambahTahapan,
    hapusTahapan,
    setBerkas,
    kosongkan,
    draftDipulihkan: pulihkan,
    tutupPemberitahuan,
  }
}
