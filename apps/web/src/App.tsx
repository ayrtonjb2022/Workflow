import { createBrowserRouter, Navigate, RouterProvider } from "react-router"
import { ProtectedRoute } from "./providers/AuthProvider.js"
import RootLayout from "./components/layout/RootLayout.js"
import AuthLayout from "./components/layout/AuthLayout.js"
import NotFound from "./pages/NotFound.js"
import Login from "./pages/Login.js"
import Register from "./pages/Register.js"
import CustomerList from "./pages/customers/CustomerList.js"
import CustomerDetail from "./pages/customers/CustomerDetail.js"

const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [
      { path: "/login", element: <Login /> },
      { path: "/register", element: <Register /> },
    ],
  },
  {
    element: <ProtectedRoute><RootLayout /></ProtectedRoute>,
    children: [
      { index: true, element: <Navigate to="/customers" replace /> },
      { path: "/customers", element: <CustomerList /> },
      { path: "/customers/:id", element: <CustomerDetail /> },
      { path: "*", element: <NotFound /> },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
