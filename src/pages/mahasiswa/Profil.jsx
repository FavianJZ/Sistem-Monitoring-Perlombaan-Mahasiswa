import { useCallback, useRef, useState } from 'react'
import { Camera, LogOut, Mail, ShieldCheck, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { StatCard } from '@/components/ui/StatCard'
import { useToast } from '@/components/ui/Toast'
import { useAuth } from '@/auth/AuthContext'
import { useAsync } from '@/hooks/useAsync'
import { statistikLomba } from '@/services/competitionService'
import { ROLE_LABELS } from '@/config/navigation'
import { TIPE_FOTO, kecilkanFoto, validasiFileFoto } from '@/lib/fotoProfil'

function Baris({ label, nilai }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-slate-100 py-3 last:border-0 sm:flex-row sm:items-center sm:gap-4">
      <dt className="w-40 shrink-0 text-sm text-slate-500">{label}</dt>
      <dd className="min-w-0 break-words text-sm font-medium text-slate-900">{nilai ?? '-'}</dd>
    </div>
  )
}

function RingkasanLomba({ userId }) {
  const ambil = useCallback(() => statistikLomba({ createdBy: userId }), [userId])
  const { data } = useAsync(ambil, [ambil])
  if (!data) return null

  return (
    <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
      <StatCard label="Total lomba" nilai={data.total} />
      <StatCard label="Sedang aktif" nilai={data.perStatus.terdaftar + data.perStatus.berlangsung} />
      <StatCard label="Selesai" nilai={data.perStatus.selesai} />
      <StatCard label="Prestasi" nilai={data.totalPrestasi} tone="success" />
    </div>
  )
}

export default function Profil() {
  const { user, keluar, perbaruiFoto } = useAuth()
  const { toast } = useToast()
  const inputFoto = useRef(null)
  const [memproses, setMemproses] = useState(null)
  const [galat, setGalat] = useState(null)

  async function handlePilihFoto(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    const masalah = validasiFileFoto(file)
    if (masalah) {
      setGalat(masalah)
      return
    }

    setGalat(null)
    setMemproses('unggah')
    try {
      await perbaruiFoto(await kecilkanFoto(file))
      toast({ variant: 'success', title: 'Foto profil diperbarui' })
    } catch (error) {
      setGalat(error.message)
    } finally {
      setMemproses(null)
    }
  }

  async function handleHapusFoto() {
    setGalat(null)
    setMemproses('hapus')
    try {
      await perbaruiFoto(null)
      toast({ variant: 'success', title: 'Foto profil dihapus' })
    } catch (error) {
      setGalat(error.message)
    } finally {
      setMemproses(null)
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Profil"
        description="Identitas yang dipakai pada setiap pendaftaran lomba."
        actions={
          <Button variant="outline" leadingIcon={LogOut} onClick={keluar}>
            Keluar
          </Button>
        }
      />

      <Card>
        <CardContent className="flex flex-col items-center gap-5 text-center sm:flex-row sm:items-center sm:text-left">
          <Avatar nama={user.nama} src={user.avatarUrl} size="xl" />

          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-bold text-slate-900">{user.nama}</h2>
            <p className="mt-1 flex items-center justify-center gap-1.5 break-all text-sm text-slate-600 sm:justify-start">
              <Mail className="size-4 shrink-0 text-slate-400" aria-hidden="true" />
              {user.email}
            </p>
            <div className="mt-2">
              <Badge tone="primary">{ROLE_LABELS[user.role] ?? user.role}</Badge>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-2 sm:flex-col">
            <input
              ref={inputFoto}
              type="file"
              accept={TIPE_FOTO.join(',')}
              className="sr-only"
              aria-label="Pilih foto profil"
              onChange={handlePilihFoto}
            />
            <Button
              size="sm"
              leadingIcon={Camera}
              loading={memproses === 'unggah'}
              disabled={Boolean(memproses)}
              onClick={() => inputFoto.current?.click()}
            >
              {user.avatarUrl ? 'Ganti foto' : 'Unggah foto'}
            </Button>
            {user.avatarUrl && (
              <Button
                size="sm"
                variant="ghost"
                leadingIcon={Trash2}
                loading={memproses === 'hapus'}
                disabled={Boolean(memproses)}
                onClick={handleHapusFoto}
              >
                Hapus foto
              </Button>
            )}
          </div>
        </CardContent>
        {galat && (
          <p role="alert" className="border-t border-danger-100 bg-danger-50 px-5 py-3 text-sm text-danger-800">
            {galat}
          </p>
        )}
      </Card>

      {user.role === 'mahasiswa' && <RingkasanLomba userId={user.id} />}

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Data akun</CardTitle>
        </CardHeader>
        <CardContent>
          <dl>
            <Baris label="Nama lengkap" nilai={user.nama} />
            <Baris label="Email" nilai={user.email} />
            {user.nim && <Baris label="NIM" nilai={user.nim} />}
            <Baris label="Program studi" nilai={user.prodi} />
            {user.angkatan && <Baris label="Angkatan" nilai={user.angkatan} />}
            <Baris label="Peran" nilai={ROLE_LABELS[user.role] ?? user.role} />
          </dl>
        </CardContent>
      </Card>

      <div className="mt-6 flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-4">
        <ShieldCheck className="mt-0.5 size-5 shrink-0 text-slate-400" aria-hidden="true" />
        <p className="text-sm text-slate-600">
          Foto profil terlihat oleh dosen pembimbing dan pengguna lain. Gunakan JPG, PNG, atau WebP
          maksimal 5 MB; foto otomatis dipotong persegi. NIM, email, dan peran tidak bisa diubah
          sendiri; hubungi admin program studi bila ada yang keliru.
        </p>
      </div>
    </div>
  )
}
