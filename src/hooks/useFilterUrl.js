import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

/**
 * Menyimpan state filter di query string alamat halaman.
 *
 * Dengan begitu hasil filter bisa dibagikan lewat tautan dan tetap sama
 * setelah halaman dimuat ulang atau dibuka di tab lain.
 *
 * Kunci pendek dipakai di URL (`q` untuk pencarian, `tahap` untuk jenis
 * tahapan) supaya alamatnya tetap mudah dibaca.
 */

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

          // Perubahan kriteria selalu kembali ke halaman pertama.
          if (!('page' in patch)) berikutnya.delete('page')

          return berikutnya
        },
        { replace: true },
      )
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [setParams],
  )

  const reset = useCallback(() => {
    setParams(new URLSearchParams(), { replace: true })
  }, [setParams])

  /** Benar bila ada kriteria yang berbeda dari nilai bawaan. */
  const adaFilter = useMemo(
    () => Object.keys(bawaan).some((nama) => params.has(keKunciUrl(nama)) && nama !== 'page'),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [params],
  )

  return { filter, ubah, reset, adaFilter }
}
