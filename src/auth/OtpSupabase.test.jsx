import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { alamatSekarang, renderApp } from '@/test/utils'
import { AuthProvider, EMAIL_BELUM_TERVERIFIKASI, useAuth } from './AuthContext'
import { validasiSandiBaru } from '@/pages/LupaSandi'
import { sinkronFotoGoogle } from '@/services/userService'

const auth = vi.hoisted(() => ({
  getSession: vi.fn(),
  onAuthStateChange: vi.fn(),
  signInWithPassword: vi.fn(),
  signUp: vi.fn(),
  verifyOtp: vi.fn(),
  resend: vi.fn(),
  resetPasswordForEmail: vi.fn(),
  updateUser: vi.fn(),
  signOut: vi.fn(),
}))

vi.mock('@/lib/supabase', () => ({
  supabase: { auth },
  apakahSupabaseAktif: () => true,
}))

vi.mock('@/services/userService', async (asli) => ({
  ...(await asli()),
  ambilProfil: vi.fn(async (id) => ({
    id,
    nama: 'User-Mahasiswa(1)',
    email: 'user.mahasiswa1@binus.ac.id',
    role: 'mahasiswa',
  })),
  muatProfil: vi.fn(),
  sinkronFotoGoogle: vi.fn(async () => null),
}))

const EMAIL = 'user.mahasiswa1@binus.ac.id'
const SESI_SB = { access_token: 'token-uji', user: { id: 'uid-1', email: EMAIL } }

function pakaiAuth() {
  return renderHook(() => useAuth(), { wrapper: AuthProvider })
}

beforeEach(() => {
  Object.values(auth).forEach((fn) => fn.mockReset())
  auth.getSession.mockResolvedValue({ data: { session: null } })
  auth.onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: () => {} } } })
  auth.resend.mockResolvedValue({ error: null })
})

describe('OTP Supabase di AuthContext', () => {
  it('daftar meminta verifikasi saat Supabase tidak memberi sesi', async () => {
    auth.signUp.mockResolvedValue({
      data: { user: { id: 'uid-1', identities: [{}] }, session: null },
      error: null,
    })
    const { result } = pakaiAuth()
    await waitFor(() => expect(result.current.siap).toBe(true))

    let hasil
    await act(async () => {
      hasil = await result.current.daftar({ email: ' User.Mahasiswa1@binus.ac.id ', password: 'x', role: 'mahasiswa' })
    })

    expect(hasil).toEqual({ perluVerifikasi: true, email: EMAIL })
  })

  it('verifikasi email memakai kode dari email dan langsung masuk', async () => {
    auth.verifyOtp.mockResolvedValue({ data: { session: SESI_SB }, error: null })
    const { result } = pakaiAuth()
    await waitFor(() => expect(result.current.siap).toBe(true))

    await act(async () => {
      await result.current.verifikasiEmail({ email: EMAIL, kode: '1234 5678', role: 'mahasiswa' })
    })

    expect(auth.verifyOtp).toHaveBeenCalledWith({ email: EMAIL, token: '12345678', type: 'email' })
    expect(result.current.sudahMasuk).toBe(true)
  })

  it('menolak kode yang bukan 6-8 angka tanpa menghubungi server', async () => {
    const { result } = pakaiAuth()
    await waitFor(() => expect(result.current.siap).toBe(true))

    for (const kode of ['12345', '123456789', 'abcdef', '']) {
      await expect(result.current.verifikasiEmail({ email: EMAIL, kode })).rejects.toThrow(
        /6 sampai 8 angka/,
      )
    }
    expect(auth.verifyOtp).not.toHaveBeenCalled()
  })

  it('menerjemahkan kode salah atau kedaluwarsa', async () => {
    auth.verifyOtp.mockResolvedValue({
      data: { session: null },
      error: { code: 'otp_expired', message: 'Token has expired or is invalid' },
    })
    const { result } = pakaiAuth()
    await waitFor(() => expect(result.current.siap).toBe(true))

    await expect(result.current.verifikasiEmail({ email: EMAIL, kode: '123456' })).rejects.toThrow(
      'Kode verifikasi salah atau sudah kedaluwarsa. Minta kode baru.',
    )
  })

  it('masuk dengan email yang belum diverifikasi memberi kode galat khusus', async () => {
    auth.signInWithPassword.mockResolvedValue({
      data: { session: null },
      error: { code: 'email_not_confirmed', message: 'Email not confirmed' },
    })
    const { result } = pakaiAuth()
    await waitFor(() => expect(result.current.siap).toBe(true))

    const galat = await result.current.masuk({ email: EMAIL, password: 'Rahasia123' }).catch((e) => e)
    expect(galat.kode).toBe(EMAIL_BELUM_TERVERIFIKASI)
    expect(galat.email).toBe(EMAIL)
  })

  it('atur ulang sandi memverifikasi kode recovery lalu menyimpan sandi baru', async () => {
    auth.verifyOtp.mockResolvedValue({ data: { session: SESI_SB }, error: null })
    auth.updateUser.mockResolvedValue({ error: null })
    const { result } = pakaiAuth()
    await waitFor(() => expect(result.current.siap).toBe(true))

    await act(async () => {
      await result.current.aturUlangSandi({ email: EMAIL, kode: '87654321', password: 'SandiBaru123' })
    })

    expect(auth.verifyOtp).toHaveBeenCalledWith({ email: EMAIL, token: '87654321', type: 'recovery' })
    expect(auth.updateUser).toHaveBeenCalledWith({ password: 'SandiBaru123' })
  })

  it('tidak menyimpan sandi bila kode recovery salah', async () => {
    auth.verifyOtp.mockResolvedValue({
      data: { session: null },
      error: { code: 'otp_expired', message: 'Token has expired or is invalid' },
    })
    const { result } = pakaiAuth()
    await waitFor(() => expect(result.current.siap).toBe(true))

    await expect(
      result.current.aturUlangSandi({ email: EMAIL, kode: '87654321', password: 'SandiBaru123' }),
    ).rejects.toThrow(/salah atau sudah kedaluwarsa/)
    expect(auth.updateUser).not.toHaveBeenCalled()
  })

  it('mencoba ulang simpan sandi tanpa kode baru bila sesi email itu sudah aktif', async () => {
    auth.getSession.mockResolvedValue({ data: { session: SESI_SB } })
    auth.updateUser.mockResolvedValue({ error: null })
    const { result } = pakaiAuth()
    await waitFor(() => expect(result.current.siap).toBe(true))

    await act(async () => {
      await result.current.aturUlangSandi({ email: EMAIL, kode: '87654321', password: 'SandiBaru123' })
    })

    expect(auth.verifyOtp).not.toHaveBeenCalled()
    expect(auth.updateUser).toHaveBeenCalledWith({ password: 'SandiBaru123' })
  })
})

describe('foto Google', () => {
  it('menyinkronkan foto Google untuk akun tanpa foto', async () => {
    sinkronFotoGoogle.mockClear()
    const foto = 'https://lh3.googleusercontent.com/a/ABC=s96-c'
    auth.verifyOtp.mockResolvedValue({
      data: { session: { ...SESI_SB, user: { ...SESI_SB.user, user_metadata: { avatar_url: foto } } } },
      error: null,
    })
    const { result } = pakaiAuth()
    await waitFor(() => expect(result.current.siap).toBe(true))
    await act(async () => {
      await result.current.verifikasiEmail({ email: EMAIL, kode: '12345678' })
    })
    expect(sinkronFotoGoogle).toHaveBeenCalledWith('uid-1', foto)
  })

  it('tidak memasang lagi foto Google yang sudah dihapus pengguna', async () => {
    sinkronFotoGoogle.mockClear()
    auth.verifyOtp.mockResolvedValue({
      data: {
        session: {
          ...SESI_SB,
          user: {
            ...SESI_SB.user,
            user_metadata: { avatar_url: 'https://lh3.googleusercontent.com/a/ABC=s96-c', foto_google_dimatikan: true },
          },
        },
      },
      error: null,
    })
    const { result } = pakaiAuth()
    await waitFor(() => expect(result.current.siap).toBe(true))
    await act(async () => {
      await result.current.verifikasiEmail({ email: EMAIL, kode: '12345678' })
    })
    expect(sinkronFotoGoogle).not.toHaveBeenCalled()
  })
})

describe('masuk dengan Google', () => {
  it('mengalihkan ke Google lewat Supabase dan kembali ke situs ini', async () => {
    auth.signInWithOAuth = vi.fn().mockResolvedValue({ data: {}, error: null })
    const { result } = pakaiAuth()
    await waitFor(() => expect(result.current.siap).toBe(true))

    await result.current.masukDenganGoogle()

    expect(auth.signInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/` },
    })
  })

  it('meneruskan galat bila provider Google belum aktif', async () => {
    auth.signInWithOAuth = vi.fn().mockResolvedValue({
      data: {},
      error: { message: 'Unsupported provider: provider is not enabled' },
    })
    const { result } = pakaiAuth()
    await waitFor(() => expect(result.current.siap).toBe(true))

    await expect(result.current.masukDenganGoogle()).rejects.toThrow(/provider is not enabled/)
  })
})

describe('validasiSandiBaru', () => {
  it('menerima kode dan sandi yang sah', () => {
    expect(validasiSandiBaru({ kode: '12345678', password: 'SandiBaru123', konfirmasi: 'SandiBaru123' })).toEqual({})
  })

  it('menolak kode, sandi lemah, dan konfirmasi yang berbeda', () => {
    const galat = validasiSandiBaru({ kode: '12ab', password: 'pendek', konfirmasi: 'lain' })
    expect(Object.keys(galat).sort()).toEqual(['kode', 'konfirmasi', 'password'])
  })
})

describe('halaman masuk dengan akun yang belum diverifikasi', () => {
  it('mengirim ulang kode, menampilkan dialog, lalu masuk setelah kode benar', async () => {
    const pengguna = userEvent.setup()
    auth.signInWithPassword.mockResolvedValue({
      data: { session: null },
      error: { code: 'email_not_confirmed', message: 'Email not confirmed' },
    })
    auth.verifyOtp.mockResolvedValue({ data: { session: SESI_SB }, error: null })
    renderApp('/login')

    await pengguna.type(await screen.findByLabelText(/^email/i), EMAIL)
    await pengguna.type(screen.getByLabelText(/kata sandi/i), 'Rahasia123')
    await pengguna.click(screen.getByRole('button', { name: /^masuk$/i }))

    const dialog = await screen.findByRole('dialog', { name: /verifikasi email/i })
    expect(auth.resend).toHaveBeenCalledWith({ type: 'signup', email: EMAIL })
    expect(dialog).toHaveTextContent(EMAIL)

    await pengguna.type(screen.getByLabelText(/kode verifikasi/i), '12345678')
    await pengguna.click(screen.getByRole('button', { name: /^verifikasi$/i }))

    await waitFor(() => expect(alamatSekarang(screen)).toBe('/'))
  })
})
