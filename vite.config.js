import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
    include: ['src/**/*.{test,spec}.{js,jsx}'],
    // Merender aplikasi penuh di jsdom dan menirukan pengetikan cukup lambat,
    // jadi batas bawaan 5 detik dinaikkan agar tidak salah dianggap gagal.
    testTimeout: 20000,
  },
})
