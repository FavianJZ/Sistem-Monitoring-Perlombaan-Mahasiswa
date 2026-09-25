import { useEffect, useId, useRef, useState } from 'react'
import { CircleAlert, FileText, Image as ImageIcon, Trash2, Upload } from 'lucide-react'
import { cn } from '@/lib/cn'
import { formatUkuran, potongNamaBerkas } from '@/lib/format'
import { Button } from './Button'
import {
  UNGGAH_EKSTENSI_LABEL,
  UNGGAH_MAKS_BYTE,
  UNGGAH_TIPE_DIIZINKAN,
} from '@/config/domain'

/**
 * Memeriksa satu berkas terhadap batas PRD: PDF/JPG/PNG maksimal 5MB.
 * Dipisah sebagai fungsi murni supaya bisa diuji langsung.
 *
 * Catatan keamanan: pemeriksaan ini hanya membantu pengguna. Ukuran dan
 * tipe berkas wajib divalidasi ulang di server karena keduanya mudah
 * dimanipulasi dari sisi klien.
 */
export function validasiBerkas(
  file,
  { maksByte = UNGGAH_MAKS_BYTE, tipeDiizinkan = UNGGAH_TIPE_DIIZINKAN } = {},
) {
  if (!file) return { valid: false, pesan: 'Tidak ada berkas yang dipilih.' }

  if (!tipeDiizinkan.includes(file.type)) {
    return {
      valid: false,
      pesan: `Tipe berkas tidak didukung. Gunakan ${UNGGAH_EKSTENSI_LABEL.toLowerCase()}.`,
    }
  }

  if (file.size > maksByte) {
    return {
      valid: false,
      pesan: `Ukuran berkas ${formatUkuran(file.size)} melebihi batas ${formatUkuran(maksByte)}.`,
    }
  }

  return { valid: true, pesan: null }
}

/** Metadata berkas yang disimpan pada draft. Isi binernya tidak ikut disimpan. */
export function metadataBerkas(file) {
  return {
    namaFile: file.name,
    mimeType: file.type,
    size: file.size,
  }
}

function buatPratinjau(file) {
  // jsdom dan sebagian peramban lama tidak menyediakan createObjectURL.
  if (!file.type.startsWith('image/')) return null
  if (typeof URL?.createObjectURL !== 'function') return null

  try {
    return URL.createObjectURL(file)
  } catch {
    return null
  }
}

/**
 * Unggah satu berkas dengan dropzone, pratinjau, dan validasi tipe serta ukuran.
 *
 * Pada prototipe ini hanya metadata berkas yang disimpan. Saat tersambung ke
 * backend, objek File dikirim sebagai multipart/form-data.
 */
export function FileUpload({
  label,
  hint,
  berkas,
  onPilih,
  error,
  required,
  maksByte = UNGGAH_MAKS_BYTE,
  tipeDiizinkan = UNGGAH_TIPE_DIIZINKAN,
  id,
}) {
  const autoId = useId()
  const inputId = id ?? autoId
  const hintId = `${inputId}-hint`
  const errorId = `${inputId}-error`

  const inputRef = useRef(null)
  const [seret, setSeret] = useState(false)
  const [galatLokal, setGalatLokal] = useState(null)
  const [pratinjau, setPratinjau] = useState(null)

  // Bebaskan URL pratinjau agar tidak menahan memori.
  useEffect(() => {
    return () => {
      if (pratinjau && typeof URL?.revokeObjectURL === 'function') {
        URL.revokeObjectURL(pratinjau)
      }
    }
  }, [pratinjau])

  const pesanGalat = error ?? galatLokal

  function terima(file) {
    const hasil = validasiBerkas(file, { maksByte, tipeDiizinkan })

    if (!hasil.valid) {
      setGalatLokal(hasil.pesan)
      return
    }

    setGalatLokal(null)
    setPratinjau(buatPratinjau(file))
    onPilih(metadataBerkas(file), file)
  }

  function handleInput(event) {
    const file = event.target.files?.[0]
    if (file) terima(file)
    // Direset agar memilih berkas yang sama dua kali tetap memicu perubahan.
    event.target.value = ''
  }

  function handleDrop(event) {
    event.preventDefault()
    setSeret(false)

    const file = event.dataTransfer?.files?.[0]
    if (file) terima(file)
  }

  function hapus() {
    setGalatLokal(null)
    setPratinjau(null)
    onPilih(null, null)
  }

  const Ikon = berkas?.mimeType?.startsWith('image/') ? ImageIcon : FileText

  return (
    <div>
      <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
        {required && (
          <>
            <span aria-hidden="true" className="ml-0.5 text-danger-600">
              *
            </span>
            <span className="sr-only"> (wajib diisi)</span>
          </>
        )}
      </label>

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={tipeDiizinkan.join(',')}
        onChange={handleInput}
        aria-invalid={pesanGalat ? 'true' : undefined}
        aria-describedby={pesanGalat ? errorId : hint ? hintId : undefined}
        className="sr-only"
      />

      {berkas ? (
        <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-3.5 shadow-card">
          {pratinjau ? (
            <img
              src={pratinjau}
              alt={`Pratinjau ${berkas.namaFile}`}
              className="size-16 shrink-0 rounded-md border border-slate-200 object-cover"
            />
          ) : (
            <span className="grid size-16 shrink-0 place-items-center rounded-md bg-slate-100 text-slate-500">
              <Ikon className="size-6" aria-hidden="true" />
            </span>
          )}

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900">
              {potongNamaBerkas(berkas.namaFile)}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              {formatUkuran(berkas.size)}
              {berkas.mimeType ? ` - ${berkas.mimeType}` : ''}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => inputRef.current?.click()}>
                Ganti berkas
              </Button>
              <Button size="sm" variant="ghost" leadingIcon={Trash2} onClick={hapus}>
                Hapus
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(event) => {
            event.preventDefault()
            setSeret(true)
          }}
          onDragLeave={() => setSeret(false)}
          onDrop={handleDrop}
          className={cn(
            'rounded-lg border-2 border-dashed p-6 text-center transition-colors',
            'focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-200',
            seret && 'border-primary-500 bg-primary-50',
            !seret && pesanGalat && 'border-danger-300 bg-danger-50/40',
            !seret && !pesanGalat && 'border-slate-300 bg-slate-50/60',
          )}
        >
          <span className="mx-auto grid size-10 place-items-center rounded-full bg-white text-slate-500 shadow-card">
            <Upload className="size-5" aria-hidden="true" />
          </span>
          <p className="mt-3 text-sm text-slate-700">
            Tarik berkas ke sini atau pilih dari perangkat
          </p>
          <p className="mt-0.5 text-xs text-slate-500">{UNGGAH_EKSTENSI_LABEL}</p>

          <Button
            size="sm"
            variant="outline"
            className="mt-3"
            onClick={() => inputRef.current?.click()}
          >
            Pilih berkas
          </Button>
        </div>
      )}

      {hint && !pesanGalat && (
        <p id={hintId} className="mt-1.5 text-xs text-slate-500">
          {hint}
        </p>
      )}

      {pesanGalat && (
        <p id={errorId} className="mt-1.5 flex items-start gap-1.5 text-xs text-danger-700">
          <CircleAlert className="mt-px size-3.5 shrink-0" aria-hidden="true" />
          <span>{pesanGalat}</span>
        </p>
      )}
    </div>
  )
}
