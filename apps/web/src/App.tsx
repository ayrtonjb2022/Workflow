import { createBrowserRouter, RouterProvider } from "react-router"
import RootLayout from "./layouts/RootLayout.js"
import Welcome from "./pages/Welcome.js"
import NotFound from "./pages/NotFound.js"
import QuoteList from "./pages/sales/QuoteList.js"
import QuoteForm from "./pages/sales/QuoteForm.js"
import QuoteDetail from "./pages/sales/QuoteDetail.js"
import OrderList from "./pages/sales/OrderList.js"
import OrderDetail from "./pages/sales/OrderDetail.js"
import InvoiceList from "./pages/sales/InvoiceList.js"
import InvoiceDetail from "./pages/sales/InvoiceDetail.js"

const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { index: true, element: <Welcome /> },
      { path: "/sales/quotes", element: <QuoteList /> },
      { path: "/sales/quotes/new", element: <QuoteForm /> },
      { path: "/sales/quotes/:id", element: <QuoteDetail /> },
      { path: "/sales/quotes/:id/edit", element: <QuoteForm /> },
      { path: "/sales/orders", element: <OrderList /> },
      { path: "/sales/orders/:id", element: <OrderDetail /> },
      { path: "/sales/invoices", element: <InvoiceList /> },
      { path: "/sales/invoices/:id", element: <InvoiceDetail /> },
      { path: "*", element: <NotFound /> },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
