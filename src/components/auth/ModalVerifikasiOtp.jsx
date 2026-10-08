import { useEffect, useRef, useState } from 'react'
import { Check, CircleAlert, Mail, RefreshCw, ShieldCheck } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { kirimOtpAktivasi, verifikasiOtpAktivasi } from '@/services/otpService'

export function ModalVerifikasiOtp({ terbuka, onClose, email, onSukses }) {
  const [kodeOtp, setKodeOtp] = useState('')
  const [memproses, setMemproses] = useState(false)
  const [galat, setGalat] = useState(null)
  const [hitungMundur, setHitungMundur] = useState(60)
  const inputRef = useRef(null)

  useEffect(() => {
    if (terbuka && email) {
      setKodeOtp('')
      setGalat(null)
      setHitungMundur(60)

      try {
        kirimOtpAktivasi(email)
      } catch (e) {
        setGalat(e.message)
      }
      setTimeout(() => inputRef.current?.focus(), 150)
    }
  }, [terbuka, email])

  useEffect(() => {
    if (!terbuka || hitungMundur <= 0) return
    const timer = setInterval(() => {
      setHitungMundur((detik) => detik - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [terbuka, hitungMundur])

  function handleKirimUlang() {
    try {
      setGalat(null)
      kirimOtpAktivasi(email)
      setHitungMundur(60)
    } catch (e) {
      setGalat(e.message)
    }
  }

  async function handleVerifikasi(event) {
    event?.preventDefault()
    setGalat(null)

    if (kodeOtp.trim().length !== 6) {
      setGalat('Masukkan 6 digit kode verifikasi yang terkirim.')
      return
    }

    setMemproses(true)
    try {
      verifikasiOtpAktivasi({ email, kode: kodeOtp.trim() })
      await onSukses?.(kodeOtp.trim())
    } catch (e) {
      setGalat(e.message)
    } finally {
      setMemproses(false)
    }
  }

  return (
    <Modal
      open={terbuka}
      onClose={onClose}
      title="Verifikasi Email Akun Mahasiswa"
      description={`Kode verifikasi 6-digit telah dikirimkan ke ${email}`}
      size="sm"
    >
      <form onSubmit={handleVerifikasi} className="space-y-4">
        <div className="flex flex-col items-center justify-center rounded-xl bg-primary-50/70 p-4 text-center border border-primary-100">
          <div className="grid size-12 place-items-center rounded-full bg-primary-600 text-white shadow-sm">
            <Mail className="size-6" />
          </div>
          <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-primary-800">
            Aktivasi Keamanan Akun
          </p>
          <p className="text-xs text-slate-600 mt-1 max-w-xs">
            Masukkan kode yang dikirimkan oleh Bot SiMonLomba ke email kampus Anda untuk mengaktifkan akun.
          </p>
        </div>

        {galat && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-md border border-danger-200 bg-danger-50 p-3 text-xs text-danger-800"
          >
            <CircleAlert className="size-4 shrink-0 mt-0.5" />
            <span>{galat}</span>
          </div>
        )}

        <div>
          <label htmlFor="input-otp" className="block text-xs font-semibold text-slate-700 mb-1.5">
            Kode Verifikasi OTP (6 Digit)
          </label>
          <input
            id="input-otp"
            ref={inputRef}
            type="text"
            inputMode="numeric"
            maxLength={6}
            autoComplete="one-time-code"
            placeholder="Contoh: 849201"
            value={kodeOtp}
            onChange={(e) => setKodeOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            className="w-full text-center font-mono text-2xl tracking-[0.35em] font-bold rounded-lg border border-slate-300 py-2.5 px-3 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          />
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>Tidak menerima email?</span>
          {hitungMundur > 0 ? (
            <span className="font-medium text-slate-400">Kirim ulang ({hitungMundur}s)</span>
          ) : (
            <button
              type="button"
              onClick={handleKirimUlang}
              className="font-semibold text-primary-600 hover:text-primary-800 hover:underline"
            >
              Kirim ulang kode
            </button>
          )}
        </div>

        <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose} disabled={memproses}>
            Batal
          </Button>
          <Button
            type="submit"
            loading={memproses}
            leadingIcon={ShieldCheck}
            disabled={kodeOtp.length !== 6}
          >
            Verifikasi & Masuk
          </Button>
        </div>
      </form>
    </Modal>
  )
}
