/**
 * Menggabungkan className secara kondisional.
 * Menerima string, undefined/null/false, atau objek { kelas: boolean }.
 */
export function cn(...inputs) {
  const classes = []

  for (const input of inputs) {
    if (!input) continue

    if (typeof input === 'string') {
      classes.push(input)
      continue
    }

    if (Array.isArray(input)) {
      const nested = cn(...input)
      if (nested) classes.push(nested)
      continue
    }

    if (typeof input === 'object') {
      for (const [key, value] of Object.entries(input)) {
        if (value) classes.push(key)
      }
    }
  }

  return classes.join(' ')
}
