import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { Users } from 'lucide-react'

export function DaftarAnggota({ lomba }) {
  const anggota = lomba.anggota ?? []

  if (anggota.length === 0) {
    return <EmptyState icon={Users} title="Belum ada data anggota" />
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">
          {lomba.namaTim ? `Anggota tim ${lomba.namaTim}` : 'Peserta perlombaan'}
        </caption>
        <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
          <tr>
            <th scope="col" className="px-5 py-3 font-semibold">
              Nama Lengkap
            </th>
            <th scope="col" className="px-5 py-3 font-semibold">
              NIM
            </th>
            <th scope="col" className="px-5 py-3 font-semibold">
              Program Studi
            </th>
            <th scope="col" className="px-5 py-3 font-semibold">
              Peran
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {anggota.map((item) => (
            <tr key={item.id ?? item.nim}>
              <td className="px-5 py-3 font-medium text-slate-900">{item.nama}</td>
              <td className="px-5 py-3 text-slate-600">{item.nim}</td>
              <td className="px-5 py-3 text-slate-600">{item.prodi ?? '-'}</td>
              <td className="px-5 py-3">
                <Badge size="sm" tone={item.peran === 'ketua' ? 'primary' : 'neutral'}>
                  {item.peran === 'ketua' ? 'Ketua Tim' : 'Anggota'}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
