

export const RAHASIA_JWT_DEFAULT = 'simonlomba-jwt-secret-key-2026-binus-secure'

function rightRotate(value, amount) {
  return (value >>> amount) | (value << (32 - amount))
}

export function sha256Bytes(bytes) {
  const mathPow = Math.pow
  const maxWord = mathPow(2, 32)
  let i, j
  let words = []
  let bitLength = bytes.length * 8
  let hash = []
  let k = []
  let primeCounter = 0

  function isPrime(n) {
    for (let factor = 2; factor * factor <= n; factor++) {
      if (n % factor === 0) return false
    }
    return true
  }

  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (isPrime(candidate)) {
      if (primeCounter < 8) hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0
      k[primeCounter] = (mathPow(candidate, 1 / 3) * maxWord) | 0
      primeCounter++
    }
  }

  let padded = Array.from(bytes)
  padded.push(0x80)
  while (padded.length % 64 !== 56) padded.push(0)
  for (i = 0; i < padded.length; i++) {
    words[i >> 2] |= padded[i] << ((3 - (i % 4)) * 8)
  }
  words.push((bitLength / maxWord) | 0)
  words.push(bitLength | 0)

  for (j = 0; j < words.length; j += 16) {
    let w = words.slice(j, j + 16)
    let oldHash = hash.slice(0)
    for (i = 0; i < 64; i++) {
      let w15 = w[i - 15]
      let w2 = w[i - 2]
      let s0 = rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)
      let s1 = rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10)
      let ch = (hash[4] & hash[5]) ^ (~hash[4] & hash[6])
      let maj = (hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2])
      let temp1 =
        hash[7] +
        (rightRotate(hash[4], 6) ^ rightRotate(hash[4], 11) ^ rightRotate(hash[4], 25)) +
        ch +
        k[i] +
        (w[i] = i < 16 ? w[i] : (w[i - 16] + s0 + w[i - 7] + s1) | 0)
      let temp2 = (rightRotate(hash[0], 2) ^ rightRotate(hash[0], 13) ^ rightRotate(hash[0], 22)) + maj
      hash = [
        (temp1 + temp2) | 0,
        hash[0],
        hash[1],
        hash[2],
        (hash[3] + temp1) | 0,
        hash[4],
        hash[5],
        hash[6],
      ]
    }
    for (i = 0; i < 8; i++) hash[i] = (hash[i] + oldHash[i]) | 0
  }

  let out = []
  for (i = 0; i < 8; i++) {
    for (let b = 3; b >= 0; b--) {
      out.push((hash[i] >> (b * 8)) & 255)
    }
  }
  return out
}

export function stringKeByteUtf8(str) {
  let utf8 = []
  const text = String(str ?? '')
  for (let i = 0; i < text.length; i++) {
    let charcode = text.charCodeAt(i)
    if (charcode < 0x80) {
      utf8.push(charcode)
    } else if (charcode < 0x800) {
      utf8.push(0xc0 | (charcode >> 6), 0x80 | (charcode & 0x3f))
    } else if (charcode < 0xd800 || charcode >= 0xe000) {
      utf8.push(0xe0 | (charcode >> 12), 0x80 | ((charcode >> 6) & 0x3f), 0x80 | (charcode & 0x3f))
    } else {
      i++
      charcode = 0x10000 + (((charcode & 0x3ff) << 10) | (text.charCodeAt(i) & 0x3ff))
      utf8.push(
        0xf0 | (charcode >> 18),
        0x80 | ((charcode >> 12) & 0x3f),
        0x80 | ((charcode >> 6) & 0x3f),
        0x80 | (charcode & 0x3f),
      )
    }
  }
  return utf8
}

export function byteUtf8KeString(bytes) {
  let res = ''
  for (let i = 0; i < bytes.length; i++) {
    let b = bytes[i]
    if (b < 128) {
      res += String.fromCharCode(b)
    } else if (b < 224) {
      res += String.fromCharCode(((b & 31) << 6) | (bytes[++i] & 63))
    } else if (b < 240) {
      res += String.fromCharCode(
        ((b & 15) << 12) | ((bytes[++i] & 63) << 6) | (bytes[++i] & 63),
      )
    }
  }
  return res
}

export function hmacSha256(keyStr, messageStr) {
  let key = stringKeByteUtf8(keyStr)
  let message = stringKeByteUtf8(messageStr)
  const blockSize = 64
  if (key.length > blockSize) {
    key = sha256Bytes(key)
  }
  while (key.length < blockSize) {
    key.push(0)
  }
  let oKeyPad = key.map((b) => b ^ 0x5c)
  let iKeyPad = key.map((b) => b ^ 0x36)
  let inner = sha256Bytes(iKeyPad.concat(message))
  return sha256Bytes(oKeyPad.concat(inner))
}

export function bytesKeBase64Url(bytes) {
  const base64Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
  let result = ''
  let i = 0
  for (; i + 2 < bytes.length; i += 3) {
    result += base64Chars[bytes[i] >> 2]
    result += base64Chars[((bytes[i] & 3) << 4) | (bytes[i + 1] >> 4)]
    result += base64Chars[((bytes[i + 1] & 15) << 2) | (bytes[i + 2] >> 6)]
    result += base64Chars[bytes[i + 2] & 63]
  }
  if (i < bytes.length) {
    result += base64Chars[bytes[i] >> 2]
    if (i + 1 < bytes.length) {
      result += base64Chars[((bytes[i] & 3) << 4) | (bytes[i + 1] >> 4)]
      result += base64Chars[(bytes[i + 1] & 15) << 2]
    } else {
      result += base64Chars[(bytes[i] & 3) << 4]
    }
  }
  return result.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function encodeBase64Url(str) {
  return bytesKeBase64Url(stringKeByteUtf8(str))
}

export function decodeBase64Url(str) {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/')
  while (base64.length % 4) base64 += '='
  const base64Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
  let bytes = []
  for (let i = 0; i < base64.length; i += 4) {
    let b0 = base64Chars.indexOf(base64[i])
    let b1 = base64Chars.indexOf(base64[i + 1])
    let b2 = base64[i + 2] === '=' ? -1 : base64Chars.indexOf(base64[i + 2])
    let b3 = base64[i + 3] === '=' ? -1 : base64Chars.indexOf(base64[i + 3])

    if (b0 < 0 || b1 < 0) continue
    bytes.push((b0 << 2) | (b1 >> 4))
    if (b2 >= 0) bytes.push(((b1 & 15) << 4) | (b2 >> 2))
    if (b3 >= 0) bytes.push(((b2 & 3) << 6) | b3)
  }
  return byteUtf8KeString(bytes)
}

export function buatJwt(user, opsi = {}) {
  const { durasiDetik = 86400, rahasia = RAHASIA_JWT_DEFAULT } = opsi
  const now = Math.floor(Date.now() / 1000)

  const header = {
    alg: 'HS256',
    typ: 'JWT',
  }

  const payload = {
    sub: user.id,
    id: user.id,
    nama: user.nama,
    email: user.email,
    role: user.role,
    prodi: user.prodi || null,
    nim: user.nim || null,
    angkatan: user.angkatan || null,
    iat: now,
    exp: now + durasiDetik,
  }

  const headerB64 = encodeBase64Url(JSON.stringify(header))
  const payloadB64 = encodeBase64Url(JSON.stringify(payload))
  const rawSig = hmacSha256(rahasia, `${headerB64}.${payloadB64}`)
  const sigB64 = bytesKeBase64Url(rawSig)

  const signatureSegment = `${sigB64}-${user.id}`

  return `${headerB64}.${payloadB64}.${signatureSegment}`
}

export function dekodeJwt(token) {
  if (typeof token !== 'string') return null
  const parts = token.split('.')
  if (parts.length !== 3) return null

  try {
    const header = JSON.parse(decodeBase64Url(parts[0]))
    const payload = JSON.parse(decodeBase64Url(parts[1]))
    return { header, payload }
  } catch {
    return null
  }
}

export function verifikasiJwt(token, opsi = {}) {
  if (typeof token !== 'string') {
    throw new Error('Token JWT harus berupa teks (string).')
  }

  const parts = token.split('.')
  if (parts.length !== 3) {
    throw new Error('Format JWT tidak valid: harus terdiri dari 3 bagian yang dipisahkan titik.')
  }

  const [headerB64, payloadB64, sigPart] = parts

  let header, payload
  try {
    header = JSON.parse(decodeBase64Url(headerB64))
    payload = JSON.parse(decodeBase64Url(payloadB64))
  } catch {
    throw new Error('Gagal membaca data Base64 pada segmen token JWT.')
  }

  if (header?.alg !== 'HS256' || header?.typ !== 'JWT') {
    throw new Error('Header JWT tidak didukung (harus HS256 / JWT).')
  }

  const now = Math.floor(Date.now() / 1000)
  const toleransi = opsi.toleransiWaktu ?? 5
  if (payload.exp && now > payload.exp + toleransi) {
    throw new Error('Sesi telah kedaluwarsa (Token JWT Expired). Silakan login kembali.')
  }

  const rahasia = opsi.rahasia ?? RAHASIA_JWT_DEFAULT
  const rawExpected = hmacSha256(rahasia, `${headerB64}.${payloadB64}`)
  const expectedSigB64 = bytesKeBase64Url(rawExpected)

  const userSuffix = payload?.id ? `-${payload.id}` : ''
  const expectedWithSuffix = `${expectedSigB64}${userSuffix}`

  if (sigPart !== expectedWithSuffix && sigPart !== expectedSigB64) {
    throw new Error('Tanda tangan (signature) JWT tidak valid atau token telah dimanipulasi!')
  }

  return payload
}

export function apakahJwtValid(token, opsi = {}) {
  try {
    verifikasiJwt(token, opsi)
    return true
  } catch {
    return false
  }
}
