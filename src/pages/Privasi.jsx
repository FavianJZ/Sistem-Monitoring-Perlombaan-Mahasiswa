import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { BinusLogo } from '@/components/brand/BinusLogo'

const BAGIAN = [
  {
    judul: 'Data yang kami simpan',
    isi: [
      'Data akun: nama, email, peran, program studi, serta NIM dan angkatan untuk mahasiswa.',
      'Foto profil: foto yang Anda unggah sendiri, atau foto akun Google bila Anda masuk dengan Google.',
      'Data lomba: nama lomba, penyelenggara, jadwal tahapan, susunan tim, hasil, dan berkas pendukung yang Anda unggah.',
    ],
  },
  {
    judul: 'Masuk dengan Google',
    isi: [
      'Bila Anda memilih "Masuk dengan Google", SiMonLomba hanya menerima nama, alamat email, dan foto profil akun Google Anda.',
      'SiMonLomba tidak membaca email, kontak, berkas Drive, atau data Google lain, dan tidak menyimpan kata sandi Google Anda.',
    ],
  },
  {
    judul: 'Untuk apa data dipakai',
    isi: [
      'Mencatat dan memantau keikutsertaan lomba mahasiswa, verifikasi berkas oleh dosen pembimbing, dan arsip prestasi program studi.',
      'Mengirim email yang berkaitan dengan akun dan lomba Anda: kode verifikasi, reset kata sandi, dan pengingat jadwal lomba.',
      'Data tidak dijual, tidak dipakai untuk iklan, dan tidak dibagikan ke pihak luar.',
    ],
  },
  {
    judul: 'Siapa yang bisa melihat',
    isi: [
      'Mahasiswa melihat data lombanya sendiri.',
      'Dosen pembimbing dan admin program studi melihat data lomba yang mereka pantau, termasuk berkas pendukung.',
      'Data disimpan di Supabase (database dan penyimpanan berkas) dan situs dijalankan di Vercel.',
    ],
  },
  {
    judul: 'Hak Anda',
    isi: [
      'Anda dapat mengganti atau menghapus foto profil kapan saja dari halaman Profil.',
      'Untuk memperbaiki data yang tidak bisa diubah sendiri (NIM, email, peran) atau menghapus akun beserta datanya, hubungi admin program studi atau favianjz20@gmail.com.',
    ],
  },
]

export default function Privasi() {
  return (
    <div className="min-h-dvh bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-20 max-w-3xl items-center px-5">
          <BinusLogo className="h-11" />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-10">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent-700">SiMonLomba</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">Kebijakan privasi</h1>
        <p className="mt-2 text-sm text-slate-600">
          Berlaku untuk Sistem Monitoring Perlombaan Mahasiswa (SiMonLomba). Terakhir diperbarui 19
          November 2026.
        </p>

        <div className="mt-8 space-y-8">
          {BAGIAN.map((bagian) => (
            <section key={bagian.judul}>
              <h2 className="text-lg font-bold text-slate-900">{bagian.judul}</h2>
              <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-slate-700">
                {bagian.isi.map((kalimat) => (
                  <li key={kalimat}>{kalimat}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <Link
          to="/login"
          className="mt-10 inline-flex items-center gap-1.5 text-sm font-semibold text-primary-700 hover:text-primary-800 hover:underline"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Kembali ke halaman masuk
        </Link>
      </main>
    </div>
  )
}
