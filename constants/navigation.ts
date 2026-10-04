export interface NavItem {
  title: string
  href: string
  icon?: string
  badge?: string
  description?: string
}

export const PUBLIC_NAV_ITEMS: NavItem[] = [
  {
    title: 'Beranda',
    href: '/',
  },
  {
    title: 'Buat Laporan',
    href: '/lapor',
  },
  {
    title: 'Pantau Aduan',
    href: '/pantau',
  },
]

export const ADMIN_NAV_ITEMS: NavItem[] = [
  {
    title: 'Ringkasan',
    href: '/admin',
    icon: 'LayoutDashboard',
  },
  {
    title: 'Semua Laporan',
    href: '/admin/laporan',
    icon: 'FileText',
  },
  {
    title: 'Triage AI',
    href: '/admin/triage',
    icon: 'Cpu',
  },
  {
    title: 'Peta Sebaran',
    href: '/admin/peta',
    icon: 'MapPin',
  },
]
