import {
  Archive,
  CalendarDays,
  CirclePlus,
  Database,
  LayoutDashboard,
  ListFilter,
  Palette,
  Trophy,
  UserRound,
} from 'lucide-react'

export const NAV_ITEMS = {
  mahasiswa: [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/lomba-saya', label: 'Lomba Saya', icon: Trophy, end: true },
    { to: '/lomba-saya/baru', label: 'Daftarkan Lomba', icon: CirclePlus },
    { to: '/profil', label: 'Profil', icon: UserRound },
  ],
  dosen: [
    { to: '/monitoring', label: 'Dashboard Monitoring', icon: LayoutDashboard, end: true },
    { to: '/monitoring/lomba', label: 'Monitoring Lomba', icon: ListFilter },
    { to: '/monitoring/kalender', label: 'Kalender Agenda', icon: CalendarDays },
    { to: '/monitoring/arsip', label: 'Arsip & Prestasi', icon: Archive },
    { to: '/profil', label: 'Profil', icon: UserRound },
  ],
}

NAV_ITEMS.admin = NAV_ITEMS.dosen

export const DEV_NAV_ITEMS = [
  { to: '/styleguide', label: 'Style Guide', icon: Palette },
  { to: '/data-mock', label: 'Data Mock', icon: Database },
]

export function getNavItems(role) {
  return NAV_ITEMS[role] ?? NAV_ITEMS.mahasiswa
}

export const ROLE_LABELS = {
  mahasiswa: 'Mahasiswa',
  dosen: 'Dosen Pembimbing',
  admin: 'Admin Program Studi',
}
