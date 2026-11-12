// Single source of truth for the app navigation: used by the sidebar (links)
// and the top bar (current page title). Labels are i18n keys, resolved at render time.

// Stroke icons on a 24x24 grid (Lucide-style, ISC license), drawn with currentColor.
// These are static constants (never user data), so rendering them with v-html is safe.
export const ICONS = {
  dashboard: '<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>',
  package: '<path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"/><path d="M12 22V12"/><path d="m3.3 7 7.7 4.73a2 2 0 0 0 2 0L20.7 7"/>',
  cart: '<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>',
  list: '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4M12 16h4M8 11h.01M8 16h.01"/>',
  wallet: '<path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>',
  trending: '<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>',
  chart: '<path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  close: '<path d="M18 6 6 18M6 6l12 12"/>',
  collapse: '<path d="m11 17-5-5 5-5M18 17l-5-5 5-5"/>'
}

export const NAV_SECTIONS = [
  {
    titleKey: 'nav.sectionOperations',
    items: [
      { to: '/', labelKey: 'nav.overview', icon: ICONS.dashboard, exact: true },
      { to: '/inventory', labelKey: 'nav.inventory', icon: ICONS.package },
      { to: '/orders', labelKey: 'nav.orders', icon: ICONS.cart },
      { to: '/backlog', labelKey: 'nav.backlog', icon: ICONS.list }
    ]
  },
  {
    titleKey: 'nav.sectionAnalytics',
    items: [
      { to: '/spending', labelKey: 'nav.finance', icon: ICONS.wallet },
      { to: '/demand', labelKey: 'nav.demandForecast', icon: ICONS.trending },
      { to: '/reports', labelKey: 'nav.reports', icon: ICONS.chart }
    ]
  }
]

export const NAV_ITEMS = NAV_SECTIONS.flatMap(section => section.items)

// Find the nav item for a route path ('/' only matches exactly).
export function findNavItem(path) {
  return NAV_ITEMS.find(item => (item.exact ? path === item.to : path === item.to || path.startsWith(item.to + '/')))
}
