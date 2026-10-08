import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

const PETA_KUNCI = {
  search: 'q',
  jenisTahapan: 'tahap',
  hanyaDokumenBelumLengkap: 'kurang',
}

function keKunciUrl(nama) {
  return PETA_KUNCI[nama] ?? nama
}

export function useFilterUrl(bawaan = {}) {
  const [params, setParams] = useSearchParams()

  const filter = useMemo(() => {
    const hasil = { ...bawaan }

    for (const nama of Object.keys(bawaan)) {
      const nilai = params.get(keKunciUrl(nama))
      if (nilai === null) continue

      if (typeof bawaan[nama] === 'number') {
        const angka = Number(nilai)
        hasil[nama] = Number.isFinite(angka) ? angka : bawaan[nama]
      } else if (typeof bawaan[nama] === 'boolean') {
        hasil[nama] = nilai === '1' || nilai === 'true'
      } else {
        hasil[nama] = nilai
      }
    }

    return hasil

  }, [params])

  const ubah = useCallback(
    (patch) => {
      setParams(
        (sebelum) => {
          const berikutnya = new URLSearchParams(sebelum)

          for (const [nama, nilai] of Object.entries(patch)) {
            const kunci = keKunciUrl(nama)
            const kosong =
              nilai === '' || nilai === null || nilai === undefined || nilai === false

            if (kosong || nilai === bawaan[nama]) berikutnya.delete(kunci)
            else berikutnya.set(kunci, nilai === true ? '1' : String(nilai))
          }

          if (!('page' in patch)) berikutnya.delete('page')

          return berikutnya
        },
        { replace: true },
      )
    },

    [setParams],
  )

  const reset = useCallback(() => {
    setParams(new URLSearchParams(), { replace: true })
  }, [setParams])

  const adaFilter = useMemo(
    () => Object.keys(bawaan).some((nama) => params.has(keKunciUrl(nama)) && nama !== 'page'),

    [params],
  )

  return { filter, ubah, reset, adaFilter }
}
