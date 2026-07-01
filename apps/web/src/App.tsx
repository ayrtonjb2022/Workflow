import { createBrowserRouter, RouterProvider } from "react-router"
import AuthLayout from "./components/layout/AuthLayout.js"
import RootLayout from "./layouts/RootLayout.js"
import Welcome from "./pages/Welcome.js"
import NotFound from "./pages/NotFound.js"
import Login from "./pages/Login.js"
import Register from "./pages/Register.js"
import QuoteList from "./pages/sales/QuoteList.js"
import QuoteForm from "./pages/sales/QuoteForm.js"
import QuoteDetail from "./pages/sales/QuoteDetail.js"
import OrderList from "./pages/sales/OrderList.js"
import OrderForm from "./pages/sales/OrderForm.js"
import OrderDetail from "./pages/sales/OrderDetail.js"
import InvoiceList from "./pages/sales/InvoiceList.js"
import InvoiceForm from "./pages/sales/InvoiceForm.js"
import InvoiceDetail from "./pages/sales/InvoiceDetail.js"
import CustomerList from "./pages/customers/CustomerList.js"
import CustomerDetail from "./pages/customers/CustomerDetail.js"
import ProductList from "./pages/products/ProductList.js"
import ProductForm from "./pages/products/ProductForm.js"
import ProductDetail from "./pages/products/ProductDetail.js"
import SupplierList from "./pages/suppliers/SupplierList.js"
import SupplierDetail from "./pages/suppliers/SupplierDetail.js"
import BranchList from "./pages/settings/BranchList.js"
import WarehouseList from "./pages/settings/WarehouseList.js"
import CashRegisterList from "./pages/cash/CashRegisterList.js"
import CashRegisterDetail from "./pages/cash/CashRegisterDetail.js"
import RoleList from "./pages/admin/RoleList.js"
import RoleDetail from "./pages/admin/RoleDetail.js"
import UserList from "./pages/admin/UserList.js"
import UserDetail from "./pages/admin/UserDetail.js"
import AuditLogPage from "./pages/admin/AuditLogPage.js"
import ReportsPage from "./pages/reports/ReportsPage.js"

const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [
      { path: "/login", element: <Login /> },
      { path: "/register", element: <Register /> },
    ],
  },
  {
    element: <RootLayout />,
    children: [
      { index: true, element: <Welcome /> },
      { path: "/customers", element: <CustomerList /> },
      { path: "/customers/:id", element: <CustomerDetail /> },
      { path: "/sales/quotes", element: <QuoteList /> },
      { path: "/sales/quotes/new", element: <QuoteForm /> },
      { path: "/sales/quotes/:id", element: <QuoteDetail /> },
      { path: "/sales/quotes/:id/edit", element: <QuoteForm /> },
      { path: "/sales/orders", element: <OrderList /> },
      { path: "/sales/orders/new", element: <OrderForm /> },
      { path: "/sales/orders/:id", element: <OrderDetail /> },
      { path: "/sales/orders/:id/edit", element: <OrderForm /> },
      { path: "/sales/invoices", element: <InvoiceList /> },
      { path: "/sales/invoices/new", element: <InvoiceForm /> },
      { path: "/sales/invoices/:id", element: <InvoiceDetail /> },
      { path: "/sales/invoices/:id/edit", element: <InvoiceForm /> },
      { path: "/suppliers", element: <SupplierList /> },
      { path: "/suppliers/:id", element: <SupplierDetail /> },
      { path: "/inventory/products", element: <ProductList /> },
      { path: "/inventory/products/new", element: <ProductForm /> },
      { path: "/inventory/products/:id", element: <ProductDetail /> },
      { path: "/inventory/products/:id/edit", element: <ProductForm /> },
      { path: "/settings/branches", element: <BranchList /> },
      { path: "/settings/warehouses", element: <WarehouseList /> },
      { path: "/cash/registers", element: <CashRegisterList /> },
      { path: "/cash/registers/:id", element: <CashRegisterDetail /> },
      { path: "/admin/roles", element: <RoleList /> },
      { path: "/admin/roles/:id", element: <RoleDetail /> },
      { path: "/admin/users", element: <UserList /> },
      { path: "/admin/users/:id", element: <UserDetail /> },
      { path: "/admin/audit", element: <AuditLogPage /> },
      { path: "/admin/reports", element: <ReportsPage /> },
      { path: "*", element: <NotFound /> },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
