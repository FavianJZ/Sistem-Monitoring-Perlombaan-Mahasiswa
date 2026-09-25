import '@testing-library/jest-dom/vitest'
import { cleanup, configure } from '@testing-library/react'
import { afterEach, beforeEach } from 'vitest'

/*
 * Berkas pengujian dijalankan paralel dan merender aplikasi penuh di jsdom,
 * jadi batas tunggu bawaan 1 detik terlalu pendek saat mesin sedang sibuk.
 */
configure({ asyncUtilTimeout: 5000 })

/*
 * Node 25 mendaftarkan global `localStorage` eksperimental yang menimpa milik
 * jsdom dan tidak punya method `clear`. Supaya pengujian tidak bergantung pada
 * versi Node, storage diganti implementasi in-memory sederhana.
 * Di browser, localStorage asli tetap dipakai.
 */
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

beforeEach(() => {
  installStorage('localStorage')
  installStorage('sessionStorage')
})

afterEach(() => {
  cleanup()
})
