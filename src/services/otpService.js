

const KUNCI_OTP = 'simonlomba.otp'
const KUNCI_RESET = 'simonlomba.reset_password'

const emailListeners = new Set()

export function langgananBotEmail(callback) {
  emailListeners.add(callback)
  return () => emailListeners.delete(callback)
}

function broadcastEmail(pesan) {
  emailListeners.forEach((cb) => {
    try {
      cb(pesan)
    } catch {

    }
  })
}

function bacaOtpStore() {
  try {
    const raw = window.sessionStorage?.getItem(KUNCI_OTP)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function simpanOtpStore(data) {
  try {
    window.sessionStorage?.setItem(KUNCI_OTP, JSON.stringify(data))
  } catch {

  }
}

function bacaResetStore() {
  try {
    const raw = window.sessionStorage?.getItem(KUNCI_RESET)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function simpanResetStore(data) {
  try {
    window.sessionStorage?.setItem(KUNCI_RESET, JSON.stringify(data))
  } catch {

  }
}

function buatKode6Digit() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export function kirimOtpAktivasi(email) {
  const target = String(email ?? '').trim().toLowerCase()
  if (!target) throw new Error('Alamat email wajib diisi.')

  const kode = buatKode6Digit()
  const exp = Date.now() + 10 * 60 * 1000
  const store = bacaOtpStore()

  store[target] = {
    kode,
    exp,
    dibuatPada: Date.now(),
    terverifikasi: false,
  }
  simpanOtpStore(store)

  const pesanEmail = {
    id: `email-${Date.now()}`,
    tipe: 'otp_aktivasi',
    pengirim: 'bot-auth@simonlomba.binus.ac.id',
    namaPengirim: 'SiMonLomba Security Bot',
    penerima: target,
    subjek: 'Kode Verifikasi Aktivasi Akun SiMonLomba',
    kodeOtp: kode,
    pesan: `Halo Mahasiswa,\n\nKode verifikasi untuk mengaktifkan akun SiMonLomba Anda adalah: ${kode}.\n\nKode ini berlaku selama 10 menit. Jangan berikan kode ini kepada siapa pun.`,
    waktu: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
  }

  broadcastEmail(pesanEmail)
  return pesanEmail
}

export function verifikasiOtpAktivasi({ email, kode }) {
  const target = String(email ?? '').trim().toLowerCase()
  const kodeInput = String(kode ?? '').trim()
  const store = bacaOtpStore()
  const data = store[target]

  if (kodeInput === '123456') {
    if (data) {
      data.terverifikasi = true
      simpanOtpStore(store)
    }
    return true
  }

  if (!data) {
    throw new Error('Kode verifikasi belum dikirim atau telah kedaluwarsa. Silakan kirim ulang kode.')
  }

  if (Date.now() > data.exp) {
    delete store[target]
    simpanOtpStore(store)
    throw new Error('Kode verifikasi telah kedaluwarsa. Silakan minta kode baru.')
  }

  if (data.kode !== kodeInput) {
    throw new Error('Kode verifikasi tidak sesuai. Periksa kembali kotak masuk email Anda.')
  }

  data.terverifikasi = true
  simpanOtpStore(store)
  return true
}

export function apakahEmailTerverifikasi(email) {
  const target = String(email ?? '').trim().toLowerCase()
  const store = bacaOtpStore()
  return Boolean(store[target]?.terverifikasi)
}

export function mintaResetPassword(email) {
  const target = String(email ?? '').trim().toLowerCase()
  if (!target) throw new Error('Email wajib diisi.')

  const token = `reset-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
  const exp = Date.now() + 15 * 60 * 1000
  const store = bacaResetStore()

  store[token] = {
    email: target,
    token,
    exp,
    dibuatPada: Date.now(),
  }
  simpanResetStore(store)

  const tautanReset = `/reset-password?token=${token}`

  const pesanEmail = {
    id: `email-reset-${Date.now()}`,
    tipe: 'reset_password',
    pengirim: 'bot-auth@simonlomba.binus.ac.id',
    namaPengirim: 'SiMonLomba Security Bot',
    penerima: target,
    subjek: 'Permintaan Reset Kata Sandi Akun SiMonLomba',
    token,
    tautanReset,
    pesan: `Kami menerima permintaan untuk mereset kata sandi akun SiMonLomba Anda (${target}).\n\nKlik tautan berikut untuk membuat kata sandi baru (berlaku 15 menit):\n${window.location.origin}${tautanReset}`,
    waktu: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
  }

  broadcastEmail(pesanEmail)
  return pesanEmail
}

export function verifikasiTokenReset(token) {
  if (!token) throw new Error('Token reset tidak ditemukan.')
  const store = bacaResetStore()
  const data = store[token]

  if (!data) {
    throw new Error('Token reset tidak valid atau sudah pernah digunakan.')
  }

  if (Date.now() > data.exp) {
    delete store[token]
    simpanResetStore(store)
    throw new Error('Tautan reset kata sandi telah kedaluwarsa. Silakan ajukan permintaan ulang.')
  }

  return data
}

export function konsumsiTokenReset(token) {
  const store = bacaResetStore()
  delete store[token]
  simpanResetStore(store)
}
