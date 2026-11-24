import { useMemo, useState } from 'react'
import { IdCard, Search, ShieldCheck, UsersRound } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { GalatMuat } from '@/components/ui/GalatMuat'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { SkeletonText } from '@/components/ui/Skeleton'
import { useToast } from '@/components/ui/Toast'
import { useAuth } from '@/auth/AuthContext'
import { ROLE_LABELS } from '@/config/navigation'
import { useAsync } from '@/hooks/useAsync'
import { useDebounce } from '@/hooks/useDebounce'
import {
  PERAN_AKUN,
  daftarSemuaPengguna,
  kosongkanNimAkun,
  ubahPeranAkun,
} from '@/services/userService'

const OPSI_PERAN = PERAN_AKUN.map((value) => ({ value, label: ROLE_LABELS[value] }))

const TONE_PERAN = { mahasiswa: 'neutral', dosen: 'primary', admin: 'warning' }

function normalkan(teks) {
  return String(teks ?? '').toLowerCase()
}

function KonfirmasiAksi({ aksi, onClose, onKonfirmasi, memproses }) {
  if (!aksi) return null
  const { jenis, pengguna, peran } = aksi
  const judul = jenis === 'nim' ? 'Kosongkan NIM akun ini?' : `Jadikan ${ROLE_LABELS[peran]}?`
  const uraian =
    jenis === 'nim'
      ? `NIM ${pengguna.nim} dilepas dari akun ${pengguna.nama}. Pemilik akun ini akan diminta mengisi NIM lagi saat masuk, dan pemilik NIM yang sah bisa mendaftar dengan NIM tersebut.`
      : peran === 'mahasiswa'
        ? `${pengguna.nama} akan masuk sebagai mahasiswa dan diminta mengisi NIM bila belum ada.`
        : `${pengguna.nama} akan mendapat akses ${ROLE_LABELS[peran]}. NIM dan angkatannya dikosongkan.`

  return (
    <Modal
      open
      onClose={onClose}
      title={judul}
      description={uraian}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={memproses}>
            Batal
          </Button>
          <Button onClick={onKonfirmasi} loading={memproses}>
            {jenis === 'nim' ? 'Kosongkan NIM' : 'Ubah peran'}
          </Button>
        </>
      }
    >
      <p className="text-sm text-slate-600">
        Akun: <strong>{pengguna.email}</strong>
      </p>
    </Modal>
  )
}

export default function KelolaPengguna() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [cari, setCari] = useState('')
  const [peran, setPeran] = useState('')
  const [aksi, setAksi] = useState(null)
  const [memproses, setMemproses] = useState(false)
  const kataKunci = useDebounce(cari)

  const { data, loading, error, jalankan } = useAsync(() => daftarSemuaPengguna(), [])

  const tersaring = useMemo(() => {
    const kunci = normalkan(kataKunci).trim()
    return (data ?? []).filter((item) => {
      if (peran && item.role !== peran) return false
      if (!kunci) return true
      return [item.nama, item.email, item.nim].some((nilai) => normalkan(nilai).includes(kunci))
    })
  }, [data, kataKunci, peran])

  async function jalankanAksi() {
    setMemproses(true)
    try {
      if (aksi.jenis === 'nim') {
        await kosongkanNimAkun(user, aksi.pengguna.id)
        toast({ title: 'NIM dikosongkan', description: aksi.pengguna.nama, variant: 'success' })
      } else {
        await ubahPeranAkun(user, aksi.pengguna.id, aksi.peran)
        toast({
          title: 'Peran diubah',
          description: `${aksi.pengguna.nama} sekarang ${ROLE_LABELS[aksi.peran]}.`,
          variant: 'success',
        })
      }
      setAksi(null)
      await jalankan({ diam: true })
    } catch (galat) {
      toast({ title: 'Gagal menyimpan', description: galat.message, variant: 'danger' })
    } finally {
      setMemproses(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Kelola Pengguna"
        description="Ubah peran akun dan lepaskan NIM yang diklaim akun yang salah."
      />

      <Card>
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-end">
          <Input
            label="Cari akun"
            placeholder="Nama, email, atau NIM"
            leadingIcon={Search}
            value={cari}
            onChange={(event) => setCari(event.target.value)}
            wrapperClassName="sm:max-w-sm"
          />
          <Select
            label="Peran"
            placeholder="Semua peran"
            options={OPSI_PERAN}
            value={peran}
            onChange={(event) => setPeran(event.target.value)}
            wrapperClassName="sm:max-w-48"
          />
        </div>

        {loading ? (
          <div className="p-4">
            <SkeletonText lines={5} />
          </div>
        ) : error ? (
          <div className="p-4">
            <GalatMuat error={error} onCoba={jalankan} />
          </div>
        ) : tersaring.length === 0 ? (
          <EmptyState
            icon={UsersRound}
            title="Tidak ada akun"
            description="Tidak ada akun yang cocok dengan pencarian ini."
          />
        ) : (
          <ul aria-label="Daftar akun" className="divide-y divide-slate-100">
            {tersaring.map((item) => {
              const diriSendiri = item.id === user.id
              const terkunci = diriSendiri || item.demo
              return (
                <li
                  key={item.id}
                  className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar nama={item.nama} src={item.avatarUrl} />
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-2 font-semibold text-slate-900">
                        <span className="truncate">{item.nama}</span>
                        <Badge size="sm" tone={TONE_PERAN[item.role]}>
                          {ROLE_LABELS[item.role] ?? item.role}
                        </Badge>
                        {diriSendiri && <Badge size="sm">Anda</Badge>}
                      </p>
                      <p className="truncate text-sm text-slate-600">{item.email}</p>
                      {item.role === 'mahasiswa' && (
                        <p className="text-xs text-slate-500">
                          NIM {item.nim ?? 'belum diisi'}
                          {item.angkatan ? ` • Angkatan ${item.angkatan}` : ''}
                        </p>
                      )}
                    </div>
                  </div>

                  {terkunci ? (
                    <p className="text-xs text-slate-500">
                      {diriSendiri ? 'Peran sendiri tidak bisa diubah.' : 'Akun demo bawaan.'}
                    </p>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2">
                      <Select
                        aria-label={`Ubah peran ${item.nama}`}
                        options={OPSI_PERAN}
                        value={item.role}
                        onChange={(event) => {
                          if (event.target.value !== item.role) {
                            setAksi({ jenis: 'peran', pengguna: item, peran: event.target.value })
                          }
                        }}
                        wrapperClassName="w-48"
                      />
                      {item.role === 'mahasiswa' && item.nim && (
                        <Button
                          size="sm"
                          variant="outline"
                          leadingIcon={IdCard}
                          onClick={() => setAksi({ jenis: 'nim', pengguna: item })}
                        >
                          Kosongkan NIM
                        </Button>
                      )}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </Card>

      <p className="mt-4 flex items-start gap-2 text-xs text-slate-500">
        <ShieldCheck className="mt-px size-4 shrink-0" aria-hidden="true" />
        Perubahan dijaga di database: hanya akun admin yang bisa menjalankannya, dan admin tidak bisa
        mengubah perannya sendiri.
      </p>

      <KonfirmasiAksi
        aksi={aksi}
        onClose={() => !memproses && setAksi(null)}
        onKonfirmasi={jalankanAksi}
        memproses={memproses}
      />
    </div>
  )
}
