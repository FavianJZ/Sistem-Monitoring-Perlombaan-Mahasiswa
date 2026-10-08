import { MODE_DEMO } from '@/config/mode'

const AWALAN = 'simonlomba.'
const KUNCI_VERSI = `${AWALAN}versiData`
const VERSI_DATA = '2'

export function bersihkanDataLama() {
  if (MODE_DEMO) return

  try {
    const storage = window.localStorage
    if (storage.getItem(KUNCI_VERSI) === VERSI_DATA) return

    const kunciLama = []
    for (let i = 0; i < storage.length; i += 1) {
      const kunci = storage.key(i)
      if (kunci?.startsWith(AWALAN)) kunciLama.push(kunci)
    }
    kunciLama.forEach((kunci) => storage.removeItem(kunci))

    storage.setItem(KUNCI_VERSI, VERSI_DATA)
  } catch {

  }
}

bersihkanDataLama()
