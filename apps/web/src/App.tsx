import { createBrowserRouter, RouterProvider } from "react-router"
import RootLayout from "./layouts/RootLayout.js"
import Welcome from "./pages/Welcome.js"
import NotFound from "./pages/NotFound.js"

const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { index: true, element: <Welcome /> },
      { path: "*", element: <NotFound /> },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
