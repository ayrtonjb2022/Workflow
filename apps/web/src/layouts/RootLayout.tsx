import { Outlet, NavLink } from "react-router"
import { useQuery } from "@tanstack/react-query"
import { api } from "../lib/api.js"
import { useAuth } from "../providers/AuthProvider.js"
import {
  FontAwesomeIcon,
  type FontAwesomeIconProps,
} from "@fortawesome/react-fontawesome"
import {
  faGauge,
  faUsers,
  faTruck,
  faBox,
  faFileInvoice,
  faCartShopping,
  faReceipt,
  faBuilding,
  faWarehouse,
  faCashRegister,
  faChartBar,
  faUserGear,
  faHistory,
  faBell,
  faGear,
} from "@fortawesome/free-solid-svg-icons"

// ── Types ──

interface DashboardStats {
  monthlyRevenue: number
  monthlyInvoices: number
  pendingOrders: number
  openQuotes: number
  lowStockProducts: number
  recentActivity: unknown[]
  topProducts: unknown[]
}

interface NavItem {
  to: string
  label: string
  icon: FontAwesomeIconProps["icon"]
  badgeKey?: keyof DashboardStats
}

interface NavSection {
  title: string
  items: NavItem[]
}

// ── Navigation data ──

const navSections: NavSection[] = [
  {
    title: "Navegación",
    items: [
      { to: "/", label: "Dashboard", icon: faGauge },
      { to: "/customers", label: "Clientes", icon: faUsers },
      { to: "/suppliers", label: "Proveedores", icon: faTruck },
      {
        to: "/inventory/products",
        label: "Inventario",
        icon: faBox,
        badgeKey: "lowStockProducts",
      },
    ],
  },
  {
    title: "Ventas",
    items: [
      { to: "/sales/quotes", label: "Cotizaciones", icon: faFileInvoice },
      {
        to: "/sales/orders",
        label: "Pedidos",
        icon: faCartShopping,
        badgeKey: "pendingOrders",
      },
      { to: "/sales/invoices", label: "Facturas", icon: faReceipt },
    ],
  },
  {
    title: "Configuración",
    items: [
      { to: "/settings/branches", label: "Sucursales", icon: faBuilding },
      { to: "/settings/warehouses", label: "Depósitos", icon: faWarehouse },
      { to: "/cash/registers", label: "Caja", icon: faCashRegister },
    ],
  },
]

const bottomNav: NavItem[] = [
  { to: "/admin/reports", label: "Reportes", icon: faChartBar },
  { to: "/admin/audit", label: "Auditoría", icon: faHistory },
  { to: "/admin/users", label: "Admin", icon: faUserGear },
]

const allNavItems: NavItem[] = [
  ...navSections.flatMap((s) => s.items),
  ...bottomNav,
]

// ── Helpers ──

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

// ── Shared nav link class ──

function navLinkClass({ isActive }: { isActive: boolean }) {
  return [
    "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all duration-150",
    isActive
      ? "bg-wave/10 text-wave font-medium shadow-sm border-l-[3px] border-wave"
      : "text-muted hover:text-dark hover:bg-ink/20 border-l-[3px] border-transparent",
  ].join(" ")
}

function mobileNavLinkClass({ isActive }: { isActive: boolean }) {
  return [
    "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-all shrink-0",
    isActive
      ? "bg-wave/10 text-wave font-medium"
      : "text-muted hover:text-dark hover:bg-ink/30",
  ].join(" ")
}

// ── Component ──

export default function RootLayout() {
  const { user } = useAuth()

  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ["dashboard-stats"],
    queryFn: () => api("/dashboard/stats"),
    staleTime: 60_000,
  })

  return (
    <div className="h-screen flex flex-col bg-paper text-dark selection:bg-wave/20 selection:text-wave">
      {/* ════════════════════════════════════════════
          Top Bar
          ════════════════════════════════════════════ */}
      <header className="h-16 flex items-center justify-between px-4 sm:px-6 border-b border-ink bg-card/70 backdrop-blur-lg shrink-0 z-20">
        {/* Left — logo & brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-wave to-wave/80 flex items-center justify-center text-white font-bold text-sm shadow-sm">
            C
          </div>
          <span className="text-lg font-semibold tracking-tight">CrmErp</span>
        </div>

        {/* Right — user area */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            className="w-9 h-9 rounded-xl bg-paper/60 flex items-center justify-center text-muted hover:text-dark hover:bg-ink/30 transition-all"
            aria-label="Notificaciones"
          >
            <FontAwesomeIcon icon={faBell} className="text-base" />
          </button>
          <button
            type="button"
            className="w-9 h-9 rounded-xl bg-paper/60 flex items-center justify-center text-muted hover:text-dark hover:bg-ink/30 transition-all"
            aria-label="Configuración"
          >
            <FontAwesomeIcon icon={faGear} className="text-base" />
          </button>
          <div className="flex items-center gap-3 pl-3 sm:pl-4 border-l border-ink/60">
            <div className="w-9 h-9 rounded-full bg-wave flex items-center justify-center text-white font-semibold text-sm shadow-sm">
              {user ? getInitials(user.name) : "U"}
            </div>
            <div className="hidden sm:block leading-tight">
              <p className="text-sm font-medium text-dark">
                {user?.name ?? "Usuario"}
              </p>
              <p className="text-xs text-muted">
                {user?.roles?.[0] ?? "Administrador"}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* ════════════════════════════════════════════
          Body
          ════════════════════════════════════════════ */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── Desktop sidebar ── */}
        <aside className="hidden lg:flex flex-col w-60 border-r border-ink bg-card shrink-0">
          <nav className="flex-1 overflow-y-auto p-3 space-y-6 scrollbar-thin">
            {navSections.map((section) => (
              <div key={section.title}>
                <p className="px-4 pb-1 text-[11px] font-semibold text-muted uppercase tracking-[0.08em]">
                  {section.title}
                </p>
                <div className="space-y-0.5">
                  {section.items.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.to === "/"}
                      className={navLinkClass}
                    >
                      <FontAwesomeIcon
                        icon={item.icon}
                        className="w-4 h-4 shrink-0"
                      />
                      <span className="truncate">{item.label}</span>
                      {item.badgeKey &&
                        stats?.[item.badgeKey] != null &&
                        Number(stats[item.badgeKey]) > 0 && (
                          <span className="ml-auto text-xs font-semibold bg-seal/10 text-seal px-2 py-0.5 rounded-full tabular-nums">
                            {String(stats[item.badgeKey])}
                          </span>
                        )}
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}
          </nav>

          {/* Bottom nav group */}
          <div className="border-t border-ink/60 p-3 space-y-0.5">
            {bottomNav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={navLinkClass}
              >
                <FontAwesomeIcon
                  icon={item.icon}
                  className="w-4 h-4 shrink-0"
                />
                <span className="truncate">{item.label}</span>
              </NavLink>
            ))}
          </div>
        </aside>

        {/* ── Mobile horizontal nav ── */}
        <nav className="lg:hidden flex overflow-x-auto gap-1 px-4 py-2 border-b border-ink bg-card shrink-0 scrollbar-thin">
          {allNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={mobileNavLinkClass}
            >
              <FontAwesomeIcon icon={item.icon} className="w-3.5 h-3.5" />
              <span className="text-[13px]">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* ── Main content area ── */}
        <main className="flex-1 overflow-y-auto bg-paper">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
