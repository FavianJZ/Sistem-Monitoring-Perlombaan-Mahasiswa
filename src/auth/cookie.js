

export const COOKIE_TOKEN_NAME = 'simonlomba_jwt'
export const COOKIE_SID_NAME = 'simonlomba_sid'

export function simpanCookie(nama, nilai, opsi = {}) {
  try {
    if (typeof document === 'undefined') return
    const { maxAgeDetik = 86400, path = '/', sameSite = 'Strict' } = opsi
    const protokolAman =
      typeof window !== 'undefined' && window.location?.protocol === 'https:' ? '; Secure' : ''

    const entri = `${encodeURIComponent(nama)}=${encodeURIComponent(nilai)}; path=${path}; max-age=${maxAgeDetik}; SameSite=${sameSite}${protokolAman}`
    document.cookie = entri
  } catch {

  }
}

export function bacaCookie(nama) {
  try {
    if (typeof document === 'undefined' || !document.cookie) return null
    const target = `${encodeURIComponent(nama)}=`
    const bagian = document.cookie.split(';')

    for (let item of bagian) {
      item = item.trim()
      if (item.startsWith(target)) {
        return decodeURIComponent(item.substring(target.length))
      }
    }
    return null
  } catch {
    return null
  }
}

export function hapusCookie(nama, opsi = {}) {
  try {
    if (typeof document === 'undefined') return
    const { path = '/' } = opsi
    document.cookie = `${encodeURIComponent(nama)}=; path=${path}; max-age=0; SameSite=Strict`
  } catch {

  }
}
