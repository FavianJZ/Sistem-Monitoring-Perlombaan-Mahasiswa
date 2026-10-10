import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      })
    : null

export function apakahSupabaseAktif() {
  return Boolean(supabase)
}

if (typeof window !== 'undefined') {
  if (apakahSupabaseAktif()) {
    console.info(`[SiMonLomba] Supabase terhubung: ${supabaseUrl}`)
  } else {
    console.warn('[SiMonLomba] Supabase BELUM terhubung. Variabel VITE_SUPABASE_URL belum ada di peramban.')
  }
}
