import { LogOut, ShieldCheck } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { useAuth } from '@/auth/AuthContext'
import { ROLE_LABELS } from '@/config/navigation'

function Baris({ label, nilai }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-slate-100 py-3 last:border-0 sm:flex-row sm:items-center sm:gap-4">
      <dt className="w-52 shrink-0 text-sm text-slate-500">{label}</dt>
      <dd className="text-sm font-medium text-slate-900">{nilai ?? '-'}</dd>
    </div>
  )
}

export default function Profil() {
  const { user, keluar } = useAuth()

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
        <CardHeader actions={<Badge tone="primary">{ROLE_LABELS[user.role] ?? user.role}</Badge>}>
          <CardTitle>{user.nama}</CardTitle>
        </CardHeader>
        <CardContent>
          <dl>
            <Baris label="Email" nilai={user.email} />
            {user.nim && <Baris label="NIM" nilai={user.nim} />}
            <Baris label="Program Studi" nilai={user.prodi} />
            {user.angkatan && <Baris label="Angkatan" nilai={user.angkatan} />}
          </dl>
        </CardContent>
      </Card>

      <div className="mt-6 flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-4">
        <ShieldCheck className="mt-0.5 size-5 shrink-0 text-slate-400" aria-hidden="true" />
        <p className="text-sm text-slate-600">
          Data profil berasal dari akun kampus dan tidak bisa diubah dari halaman ini. Pada tahap
          prototipe, identitas masih diambil dari data tiruan.
        </p>
      </div>
    </div>
  )
}
