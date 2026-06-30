import { Link } from "react-router"

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <h2 className="text-6xl font-bold text-gray-300 mb-4">404</h2>
      <p className="text-gray-600 text-lg mb-8">Página no encontrada</p>
      <Link
        to="/"
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Volver al inicio
      </Link>
    </div>
  )
}
