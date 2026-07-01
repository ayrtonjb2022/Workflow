import { Outlet, NavLink } from "react-router"

const salesLinks = [
  { to: "/sales/quotes", label: "Cotizaciones" },
  { to: "/sales/orders", label: "Pedidos" },
  { to: "/sales/invoices", label: "Facturas" },
]

export default function RootLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-xl font-semibold text-gray-900">CrmErp</h1>
        </div>
        <div className="border-t border-gray-200">
          <div className="max-w-7xl mx-auto px-4">
            <nav className="flex items-center gap-6">
              <div className="flex items-center gap-1 py-2">
                <span className="text-sm font-medium text-gray-500 mr-2">
                  Ventas
                </span>
                {salesLinks.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    end
                    className={({ isActive }) =>
                      `px-3 py-1.5 text-sm rounded-md transition-colors ${
                        isActive
                          ? "bg-blue-50 text-blue-700 font-medium"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                      }`
                    }
                  >
                    {link.label}
                  </NavLink>
                ))}
              </div>
            </nav>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
