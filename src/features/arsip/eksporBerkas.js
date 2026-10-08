import {
  KOLOM_EKSPOR,
  KOLOM_PDF,
  barisEkspor,
  judulKolom,
  keCsv,
  kolomTerpilih,
  namaBerkasLaporan,
  ringkasanLaporan,
} from './eksporData'

export function simpanBlob(blob, namaFile) {
  const url = URL.createObjectURL(blob)
  const tautan = document.createElement('a')

  tautan.href = url
  tautan.download = namaFile
  document.body.appendChild(tautan)
  tautan.click()
  tautan.remove()
  URL.revokeObjectURL(url)
}

export function unduhCsv(items, { nama } = {}) {
  const berkas = nama ?? namaBerkasLaporan('csv')
  const blob = new Blob([keCsv(items)], { type: 'text/csv;charset=utf-8' })

  simpanBlob(blob, berkas)
  return berkas
}

export async function unduhXlsx(items, { nama } = {}) {
  const berkas = nama ?? namaBerkasLaporan('xlsx')

  const { default: writeXlsxFile } = await import('write-excel-file/browser')

  const skema = KOLOM_EKSPOR.map((kolom) => ({
    column: kolom.judul,
    type: String,
    width: kolom.lebar,
    value: (lomba) => String(kolom.ambil(lomba) ?? '-'),
  }))

  const blob = await writeXlsxFile(items, {
    schema: skema,
    sheet: 'Rekap Prestasi',
    headerStyle: { fontWeight: 'bold', backgroundColor: '#EEF4FF' },
  })

  simpanBlob(blob, berkas)
  return berkas
}

export async function unduhPdf(items, { nama, judul = 'Rekapitulasi Prestasi Mahasiswa' } = {}) {
  const berkas = nama ?? namaBerkasLaporan('pdf')
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ])

  const dokumen = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })
  const kolom = kolomTerpilih(KOLOM_PDF)
  const ringkasan = ringkasanLaporan(items)

  dokumen.setFontSize(14)
  dokumen.text(judul, 40, 40)

  dokumen.setFontSize(9)
  dokumen.text(
    `Total ${ringkasan.total} perlombaan - ${ringkasan.berprestasi} meraih prestasi - ${ringkasan.bersertifikat} bersertifikat`,
    40,
    58,
  )

  autoTable(dokumen, {
    startY: 74,
    head: [judulKolom(kolom)],
    body: barisEkspor(items, kolom),
    styles: { fontSize: 8, cellPadding: 4 },
    headStyles: { fillColor: [37, 79, 235] },
    alternateRowStyles: { fillColor: [244, 247, 254] },
  })

  simpanBlob(dokumen.output('blob'), berkas)
  return berkas
}
