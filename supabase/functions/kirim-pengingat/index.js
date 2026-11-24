import { createClient } from 'npm:@supabase/supabase-js@2.49.4'
import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts'
import {
  daftarPengingat,
  isiEmailPengingat,
  pemanggilSah,
  penerimaPengingat,
  tanggalHariIni,
} from './pengingat.js'

const UKURAN_HALAMAN = 1000

async function ambilSemua(buatKueri) {
  const semua = []
  for (let dari = 0; ; dari += UKURAN_HALAMAN) {
    const { data, error } = await buatKueri().range(dari, dari + UKURAN_HALAMAN - 1)
    if (error) return { data: null, error }
    semua.push(...(data ?? []))
    if (!data || data.length < UKURAN_HALAMAN) return { data: semua, error: null }
  }
}


function jawab(status, isi) {
  return new Response(JSON.stringify(isi), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (!pemanggilSah(req.headers.get('x-cron-secret'), Deno.env.get('CRON_SECRET'))) {
    return jawab(401, { galat: 'Pemanggil tidak dikenal.' })
  }

  const smtpUser = Deno.env.get('SMTP_USER')
  const smtpPass = Deno.env.get('SMTP_PASS')
  const situsUrl = Deno.env.get('SITUS_URL')
  if (!smtpUser || !smtpPass) return jawab(500, { galat: 'SMTP_USER atau SMTP_PASS belum diisi.' })
  if (!situsUrl) return jawab(500, { galat: 'SITUS_URL belum diisi.' })

  const supabase = createClient(Deno.env.get('SUPABASE_URL'), Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false },
  })

  const [lomba, profil] = await Promise.all([
    ambilSemua(() => supabase.from('data_lomba').select('id, created_by, data').order('id')),
    ambilSemua(() => supabase.from('profiles').select('id, email, nim').order('id')),
  ])
  if (lomba.error || profil.error) {
    return jawab(500, { galat: (lomba.error ?? profil.error).message })
  }

  const hariIni = tanggalHariIni()
  const antrean = daftarPengingat(lomba.data, hariIni)
  let smtp = null
  const klienSmtp = () =>
    (smtp ??= new SMTPClient({
      connection: {
        hostname: 'smtp.gmail.com',
        port: 465,
        tls: true,
        auth: { username: smtpUser, password: smtpPass },
      },
    }))

  const ringkasan = { tanggal: hariIni, ditemukan: antrean.length, terkirim: 0, dilewati: 0, gagal: 0 }

  try {
    for (const pengingat of antrean) {
      const penerima = penerimaPengingat(pengingat, profil.data)
      if (penerima.length === 0) {
        ringkasan.dilewati += 1
        continue
      }

      const kunci = {
        lomba_id: pengingat.lombaId,
        kunci_tahap: pengingat.kunciTahap,
        jenis_pengingat: pengingat.jadwal.kode,
      }
      const { data: dicatat, error: galatCatat } = await supabase
        .from('pengingat_terkirim')
        .upsert(kunci, { onConflict: 'lomba_id,kunci_tahap,jenis_pengingat', ignoreDuplicates: true })
        .select('lomba_id')
      if (galatCatat) {
        ringkasan.gagal += 1
        continue
      }
      if (!dicatat?.length) {
        ringkasan.dilewati += 1
        continue
      }

      try {
        const { subjek, teks, html } = isiEmailPengingat(pengingat, situsUrl)
        await klienSmtp().send({
          from: `SiMonLomba <${smtpUser}>`,
          to: smtpUser,
          bcc: penerima,
          subject: subjek,
          content: teks,
          html,
        })
        ringkasan.terkirim += 1
      } catch (galat) {
        console.error('[kirim-pengingat] gagal kirim', pengingat.lombaId, galat?.message)
        await supabase.from('pengingat_terkirim').delete().match(kunci)
        ringkasan.gagal += 1
      }
    }
  } finally {
    await smtp?.close()
  }

  return jawab(200, ringkasan)
})
