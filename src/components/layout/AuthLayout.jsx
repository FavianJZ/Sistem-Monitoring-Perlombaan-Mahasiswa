import { cn } from '@/lib/cn'
import { BinusLogo, BinusMotif } from '@/components/brand/BinusLogo'

export function AuthLayout({
  label = 'Sistem Monitoring Perlombaan Mahasiswa',
  judul,
  deskripsi,
  panel,
  catatan,
  lebarForm = 'lg:w-[28rem]',
  children,
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-slate-50">
      <header className="relative border-b border-slate-200 bg-white">
        <BinusMotif className="absolute left-0 top-0 h-full w-auto" />

        <div className="mx-auto flex h-20 max-w-6xl items-center gap-4 pl-16 pr-6 sm:pl-20">
          <BinusLogo className="h-11" />
          <span aria-hidden="true" className="hidden h-9 w-px bg-slate-200 sm:block" />
          <div className="hidden min-w-0 sm:block">
            <p className="text-sm font-bold uppercase tracking-wide text-slate-700">SiMonLomba</p>
            <p className="truncate text-xs text-slate-500">{label}</p>
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-6xl flex-1 items-start gap-10 px-5 py-8 sm:px-6 lg:grid-cols-[1fr_auto] lg:gap-16 lg:py-14">
        <section className="hidden lg:sticky lg:top-10 lg:block">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent-700">{label}</p>
          <h1 className="mt-3 max-w-lg text-3xl font-light leading-snug text-slate-700 xl:text-4xl">
            {judul}
          </h1>
          <span aria-hidden="true" className="mt-5 block h-1 w-14 bg-accent-500" />
          {deskripsi && (
            <p className="mt-5 max-w-md leading-relaxed text-slate-600">{deskripsi}</p>
          )}
          {panel && <div className="mt-10 max-w-md">{panel}</div>}
        </section>

        <main
          className={cn(
            'w-full rounded-md border border-slate-200 border-t-4 border-t-primary-500 bg-white p-6 shadow-card sm:p-8',
            'mx-auto max-w-lg lg:mx-0',
            lebarForm,
          )}
        >
          {children}
        </main>
      </div>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-1 px-5 py-4 text-xs text-slate-500 sm:flex-row sm:justify-between sm:px-6">
          <p>SiMonLomba - BINUS University</p>
          {catatan && <p>{catatan}</p>}
        </div>
      </footer>
    </div>
  )
}
