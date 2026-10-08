import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Check, CheckCircle2, CircleAlert, Eye, EyeOff, KeyRound, ShieldAlert } from 'lucide-react'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { kekuatanSandi } from '@/auth/validasiRegistrasi'
import { konsumsiTokenReset, verifikasiTokenReset } from '@/services/otpService'
import { perbaruiSandiPengguna } from '@/services/userService'
import { supabase, apakahSupabaseAktif } from '@/lib/supabase'
import { cn } from '@/lib/cn'

const LABEL_KEKUATAN = ['Belum diisi', 'Lemah', 'Cukup', 'Kuat']
const WARNA_KEKUATAN = ['bg-slate-200', 'bg-danger-500', 'bg-warning-500', 'bg-success-500']

export default function ResetPassword() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const token = params.get('token')

  const [dataToken, setDataToken] = useState(null)
  const [tokenError, setTokenError] = useState(null)
  const [password, setPassword] = useState('')
  const [konfirmasi, setKonfirmasi] = useState('')
  const [lihatSandi, setLihatSandi] = useState(false)
  const [memproses, setMemproses] = useState(false)
  const [galatForm, setGalatForm] = useState(null)
  const [sukses, setSukses] = useState(false)

  useEffect(() => {
    if (token) {
      try {
        const data = verifikasiTokenReset(token)
        setDataToken(data)
        setTokenError(null)
      } catch (e) {
        setTokenError(e.message)
      }
      return
    }

    if (apakahSupabaseAktif()) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          setDataToken({ email: session.user.email, tipe: 'supabase' })
          setTokenError(null)
        } else if (!window.location.hash.includes('access_token')) {
          setTokenError('Tautan reset kata sandi tidak valid atau telah kedaluwarsa.')
        }
      })

      const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
        if ((event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') && session?.user) {
          setDataToken({ email: session.user.email, tipe: 'supabase' })
          setTokenError(null)
        }
      })

      return () => {
        authListener?.subscription?.unsubscribe()
      }
    } else {
      setTokenError('Tautan reset kata sandi tidak valid atau telah kedaluwarsa.')
    }
  }, [token])

  const { syarat, skor } = kekuatanSandi(password)

  async function handleSubmit(event) {
    event.preventDefault()
    setGalatForm(null)

    if (skor < 3) {
      setGalatForm('Kata sandi belum memenuhi semua syarat keamanan.')
      return
    }

    if (password !== konfirmasi) {
      setGalatForm('Konfirmasi kata sandi tidak cocok.')
      return
    }

    setMemproses(true)
    try {
      if (dataToken?.tipe === 'supabase' && apakahSupabaseAktif()) {
        const { error } = await supabase.auth.updateUser({ password })
        if (error) throw error
      }
      if (dataToken?.email) {
        await perbaruiSandiPengguna({
          email: dataToken.email,
          passwordBaru: password,
        })
      }
      if (token) {
        konsumsiTokenReset(token)
      }
      setSukses(true)
    } catch (e) {
      setGalatForm(e.message)
    } finally {
      setMemproses(false)
    }
  }

  const tombolLihat = (
    <button
      type="button"
      onClick={() => setLihatSandi((v) => !v)}
      aria-label={lihatSandi ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
      aria-pressed={lihatSandi}
      className="rounded-md p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
    >
      {lihatSandi ? (
        <EyeOff className="size-4" aria-hidden="true" />
      ) : (
        <Eye className="size-4" aria-hidden="true" />
      )}
    </button>
  )

  return (
    <AuthLayout
      judul="Atur Ulang Kata Sandi"
      deskripsi="Buat kata sandi baru yang kuat untuk melindungi akun dan data lomba Anda."
      catatan="Pastikan kata sandi baru tidak dibagikan kepada siapa pun."
    >
      <h2 className="text-2xl font-bold text-slate-800">Kata Sandi Baru</h2>
      <p className="mt-1 text-sm text-slate-600">
        {dataToken?.email
          ? `Mengatur ulang kata sandi untuk akun: ${dataToken.email}`
          : 'Masukkan kata sandi baru Anda.'}
      </p>

      {tokenError && (
        <div
          role="alert"
          className="mt-5 rounded-xl border border-danger-200 bg-danger-50 p-4 text-danger-800"
        >
          <div className="flex items-start gap-2.5">
            <ShieldAlert className="mt-0.5 size-5 shrink-0 text-danger-600" />
            <div>
              <p className="text-sm font-bold text-danger-900">Tautan Tidak Berlaku</p>
              <p className="mt-1 text-xs text-danger-700 leading-relaxed">{tokenError}</p>
              <div className="mt-4">
                <Link
                  to="/lupa-password"
                  className="inline-flex rounded-md bg-danger-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-danger-700"
                >
                  Minta Tautan Reset Baru
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {sukses ? (
        <div className="mt-6 rounded-xl border border-success-200 bg-success-50/60 p-5 text-center">
          <div className="mx-auto grid size-12 place-items-center rounded-full bg-success-600 text-white shadow-sm">
            <CheckCircle2 className="size-6" />
          </div>
          <h3 className="mt-3 text-base font-bold text-slate-800">Kata Sandi Berhasil Diperbarui</h3>
          <p className="mt-1.5 text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
            Kata sandi akun Anda telah berhasil diubah. Anda sekarang dapat masuk menggunakan kata sandi baru.
          </p>

          <div className="mt-5 flex justify-center">
            <Button
              type="button"
              size="lg"
              onClick={() => navigate('/login', { replace: true })}
            >
              Masuk Sekarang
            </Button>
          </div>
        </div>
      ) : (
        !tokenError && (
          <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
            {galatForm && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-md border border-danger-200 bg-danger-50 p-3.5 text-sm text-danger-800"
              >
                <CircleAlert className="mt-px size-4 shrink-0" aria-hidden="true" />
                <span>{galatForm}</span>
              </div>
            )}

            <div>
              <Input
                label="Kata sandi baru"
                type={lihatSandi ? 'text' : 'password'}
                name="password"
                autoComplete="new-password"
                placeholder="Buat kata sandi baru"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                suffix={tombolLihat}
                required
              />

              <div className="mt-2" aria-live="polite">
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3].map((tingkat) => (
                    <span
                      key={tingkat}
                      className={cn(
                        'h-1.5 flex-1 rounded-full transition-colors',
                        tingkat <= skor ? WARNA_KEKUATAN[skor] : 'bg-slate-200',
                      )}
                    />
                  ))}
                  <span className="w-14 text-right text-xs font-semibold text-slate-600">
                    {LABEL_KEKUATAN[skor]}
                  </span>
                </div>
                <ul className="mt-2 grid gap-x-3 gap-y-1 sm:grid-cols-3">
                  {syarat.map((item) => (
                    <li
                      key={item.id}
                      className={cn(
                        'flex items-center gap-1.5 text-xs',
                        item.ok ? 'text-success-700' : 'text-slate-500',
                      )}
                    >
                      {item.ok ? (
                        <Check className="size-3.5 shrink-0" aria-hidden="true" />
                      ) : (
                        <span
                          aria-hidden="true"
                          className="mx-1 size-1.5 shrink-0 rounded-full bg-slate-300"
                        />
                      )}
                      {item.label}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <Input
              label="Konfirmasi kata sandi baru"
              type={lihatSandi ? 'text' : 'password'}
              name="konfirmasi"
              autoComplete="new-password"
              placeholder="Ulangi kata sandi baru"
              value={konfirmasi}
              onChange={(e) => setKonfirmasi(e.target.value)}
              required
            />

            <Button
              type="submit"
              size="lg"
              fullWidth
              loading={memproses}
              leadingIcon={KeyRound}
              disabled={skor < 3 || password !== konfirmasi}
            >
              Simpan Kata Sandi Baru
            </Button>
          </form>
        )
      )}
    </AuthLayout>
  )
}
