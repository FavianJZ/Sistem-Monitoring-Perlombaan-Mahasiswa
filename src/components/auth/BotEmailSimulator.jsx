import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, Check, Copy, ExternalLink, Mail, X } from 'lucide-react'
import { langgananBotEmail } from '@/services/otpService'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/cn'

export function BotEmailSimulator() {
  const [pesanTerbaru, setPesanTerbaru] = useState(null)
  const [disalin, setDisalin] = useState(false)
  const [ditutup, setDitutup] = useState(false)

  useEffect(() => {
    const unsub = langgananBotEmail((pesan) => {
      setPesanTerbaru(pesan)
      setDitutup(false)
      setDisalin(false)
    })
    return unsub
  }, [])

  if (!pesanTerbaru || ditutup) return null

  function salinTeks(teks) {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(teks)
    }
    setDisalin(true)
    setTimeout(() => setDisalin(false), 2000)
  }

  return (
    <div
      role="region"
      aria-label="Kotak Masuk Email Simulator"
      className={cn(
        'fixed bottom-5 right-5 z-50 max-w-md w-[calc(100vw-2.5rem)] rounded-xl border border-primary-200 bg-white/95 p-4 shadow-2xl backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-5',
      )}
    >
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-lg bg-primary-600 text-white shadow-sm">
            <Mail className="size-4" aria-hidden="true" />
          </span>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-800">
                {pesanTerbaru.namaPengirim || 'Bot SiMonLomba'}
              </span>
              <span className="rounded bg-primary-100 px-1.5 py-0.5 text-[10px] font-semibold text-primary-800">
                Email Masuk
              </span>
            </div>
            <p className="text-[11px] text-slate-500">Ke: {pesanTerbaru.penerima}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setDitutup(true)}
          aria-label="Tutup notifikasi email"
          className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="mt-3">
        <p className="text-xs font-semibold text-slate-800">{pesanTerbaru.subjek}</p>
        <p className="mt-1 whitespace-pre-line text-xs text-slate-600 leading-relaxed font-sans">
          {pesanTerbaru.pesan}
        </p>

        {pesanTerbaru.kodeOtp && (
          <div className="mt-3 flex items-center justify-between rounded-lg border border-primary-200 bg-primary-50/80 p-2.5">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-primary-700">
                Kode OTP Verifikasi
              </p>
              <p className="font-mono text-xl font-extrabold tracking-widest text-primary-900">
                {pesanTerbaru.kodeOtp}
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => salinTeks(pesanTerbaru.kodeOtp)}
              leadingIcon={disalin ? Check : Copy}
              className="bg-white text-xs hover:bg-primary-50"
            >
              {disalin ? 'Tersalin' : 'Salin Kode'}
            </Button>
          </div>
        )}

        {pesanTerbaru.tautanReset && (
          <div className="mt-3 pt-2 border-t border-slate-100">
            <Link
              to={pesanTerbaru.tautanReset}
              onClick={() => setDitutup(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-primary-700 transition-colors"
            >
              <ExternalLink className="size-3.5" />
              Buka Tautan Reset Password
            </Link>
          </div>
        )}
      </div>

      <p className="mt-3 text-[10px] text-slate-400 italic text-right">
        Simulasi Bot Email Otentikasi (100% Gratis - Kampus Demo)
      </p>
    </div>
  )
}
