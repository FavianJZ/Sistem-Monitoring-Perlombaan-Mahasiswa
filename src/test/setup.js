import '@testing-library/jest-dom/vitest'
import { cleanup, configure } from '@testing-library/react'
import { afterEach, beforeEach } from 'vitest'

configure({ asyncUtilTimeout: 5000 })

class MemoryStorage {
  #entries = new Map()

  get length() {
    return this.#entries.size
  }

  key(index) {
    return [...this.#entries.keys()][index] ?? null
  }

  getItem(key) {
    const name = String(key)
    return this.#entries.has(name) ? this.#entries.get(name) : null
  }

  setItem(key, value) {
    this.#entries.set(String(key), String(value))
  }

  removeItem(key) {
    this.#entries.delete(String(key))
  }

  clear() {
    this.#entries.clear()
  }
}

function installStorage(name) {
  const storage = new MemoryStorage()
  const descriptor = { value: storage, configurable: true, writable: true }
  Object.defineProperty(window, name, descriptor)
  Object.defineProperty(globalThis, name, descriptor)
}

function clearCookies() {
  if (typeof document === 'undefined' || !document.cookie) return
  const cookies = document.cookie.split(';')
  for (const cookie of cookies) {
    const eqPos = cookie.indexOf('=')
    const name = eqPos > -1 ? cookie.substring(0, eqPos).trim() : cookie.trim()
    if (name) {
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
    }
  }
}

beforeEach(() => {
  installStorage('localStorage')
  installStorage('sessionStorage')
  clearCookies()
})

afterEach(() => {
  cleanup()
})
