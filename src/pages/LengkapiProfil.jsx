import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { CircleAlert, LogOut, Save } from 'lucide-react'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { useToast } from '@/components/ui/Toast'
import { useAuth } from '@/auth/AuthContext'
import { perluLengkapiProfil } from '@/auth/RequireAuth'
import { berandaRole } from '@/auth/sesi'
import { validasiLengkapiProfil } from '@/services/userService'
import { PROGRAM_STUDI } from '@/config/domain'

const TAHUN_INI = new Date().getFullYear()
const OPSI_ANGKATAN = Array.from({ length: 8 }, (_, i) => String(TAHUN_INI - i))
const OPSI_PRODI = PROGRAM_STUDI.map((prodi) => ({ value: prodi, label: prodi }))

export default function LengkapiProfil() {
  const { user, lengkapiProfil, memproses, keluar } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [form, setForm] = useState({ nim: '', angkatan: String(TAHUN_INI), prodi: '' })
  const [galatField, setGalatField] = useState({})
  const [galat, setGalat] = useState(null)

  if (!perluLengkapiProfil(user)) {
    return <Navigate to={berandaRole(user?.role)} replace />
  }

  const ubah = (field) => (event) => {
    const nilai = field === 'nim' ? event.target.value.replace(/\D/g, '') : event.target.value
    setForm((f) => ({ ...f, [field]: nilai }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setGalat(null)
    const masalah = validasiLengkapiProfil(form)
    setGalatField(masalah)
    if (Object.keys(masalah).length > 0) return

    try {
      const pengguna = await lengkapiProfil(form)
      toast({ variant: 'success', title: 'Profil lengkap', description: `Selamat datang, ${pengguna.nama}.` })
      navigate(berandaRole(pengguna.role), { replace: true })
    } catch (error) {
      setGalat(error.message)
    }
  }

  return (
    <AuthLayout
      judul="Satu langkah lagi sebelum mulai."
      deskripsi="NIM, angkatan, dan program studi dipakai untuk mencatat lomba dan prestasi Anda. NIM hanya bisa diisi sekali."
    >
      <div className="flex items-center gap-3">
        <Avatar nama={user.nama} src={user.avatarUrl} size="lg" />
        <div className="min-w-0">
          <h2 className="text-xl font-bold text-slate-800">Lengkapi profil</h2>
          <p className="truncate text-sm text-slate-600">{user.email}</p>
        </div>
      </div>

      {galat && (
        <div
          role="alert"
          className="mt-5 flex items-start gap-2.5 rounded-md border border-danger-200 bg-danger-50 p-3.5 text-sm text-danger-800"
        >
          <CircleAlert className="mt-px size-4 shrink-0" aria-hidden="true" />
          <span>{galat}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
        <Input
          label="NIM"
          name="nim"
          inputMode="numeric"
          maxLength={10}
          placeholder="10 digit angka"
          value={form.nim}
          onChange={ubah('nim')}
          error={galatField.nim}
          required
        />
        <Select
          label="Angkatan"
          options={OPSI_ANGKATAN}
          value={form.angkatan}
          onChange={ubah('angkatan')}
          error={galatField.angkatan}
          required
        />
        <Select
          label="Program studi"
          placeholder="Pilih program studi"
          options={OPSI_PRODI}
          value={form.prodi}
          onChange={ubah('prodi')}
          error={galatField.prodi}
          required
        />
        <Button type="submit" size="lg" fullWidth loading={memproses} leadingIcon={Save}>
          Simpan dan lanjutkan
        </Button>
      </form>

      <div className="mt-5 border-t border-slate-100 pt-4 text-center">
        <Button variant="ghost" size="sm" leadingIcon={LogOut} onClick={keluar}>
          Bukan akun Anda? Keluar
        </Button>
      </div>
    </AuthLayout>
  )
}
