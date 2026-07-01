import { Outlet } from "react-router"

export default function AuthLayout() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">CrmErp</h1>
          <p className="text-gray-600 mt-2">Panel de gestión empresarial</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
