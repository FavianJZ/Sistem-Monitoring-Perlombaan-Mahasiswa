import { useEffect, useState } from 'react'
import { MailCheck, RotateCw } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export const JEDA_KIRIM_ULANG = 60

export function ModalVerifikasiOtp({
  open,
  email,
  onVerifikasi,
  onKirimUlang,
  onClose,
  memproses = false,
  judul = 'Verifikasi email',
}) {
  const [kode, setKode] = useState('')
  const [galat, setGalat] = useState(null)
  const [info, setInfo] = useState(null)
  const [sisaDetik, setSisaDetik] = useState(JEDA_KIRIM_ULANG)
  const [mengirim, setMengirim] = useState(false)

  useEffect(() => {
    if (!open) return
    setKode('')
    setGalat(null)
    setInfo(null)
    setSisaDetik(JEDA_KIRIM_ULANG)
  }, [open, email])

  useEffect(() => {
    if (!open || sisaDetik <= 0) return undefined
    const timer = setTimeout(() => setSisaDetik((n) => n - 1), 1000)
    return () => clearTimeout(timer)
  }, [open, sisaDetik])

  async function handleSubmit(event) {
    event.preventDefault()
    setGalat(null)
    setInfo(null)
    if (!/^\d{6,8}$/.test(kode)) {
      setGalat('Masukkan kode 6 sampai 8 angka dari email.')
      return
    }
    try {
      await onVerifikasi(kode)
    } catch (error) {
      setGalat(error.message)
    }
  }

  async function handleKirimUlang() {
    setGalat(null)
    setInfo(null)
    setMengirim(true)
    try {
      await onKirimUlang()
      setKode('')
      setInfo('Kode baru sudah dikirim. Kode lama tidak berlaku lagi.')
      setSisaDetik(JEDA_KIRIM_ULANG)
    } catch (error) {
      setGalat(error.message)
    } finally {
      setMengirim(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={judul}
      description={`Kami mengirim kode verifikasi ke ${email}. Periksa juga folder Spam atau Junk.`}
      size="sm"
      closeOnOverlay={false}
    >
      <form id="form-verifikasi-otp" onSubmit={handleSubmit} noValidate className="space-y-4">
        <Input
          label="Kode verifikasi"
          name="kode"
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="123456"
          maxLength={8}
          leadingIcon={MailCheck}
          value={kode}
          onChange={(event) => setKode(event.target.value.replace(/\D/g, ''))}
          error={galat ?? undefined}
          hint={info ?? 'Kode berlaku selama 1 jam.'}
          className="tracking-[0.3em]"
          required
        />

        <Button type="submit" fullWidth loading={memproses}>
          Verifikasi
        </Button>

        <div className="text-center text-sm text-slate-600">
          {sisaDetik > 0 ? (
            <p>Kirim ulang kode dalam {sisaDetik} detik</p>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              leadingIcon={RotateCw}
              loading={mengirim}
              onClick={handleKirimUlang}
            >
              Kirim ulang kode
            </Button>
          )}
        </div>
      </form>
    </Modal>
  )
}
