export default function Welcome() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <h2 className="text-3xl font-bold text-gray-900 mb-4">
        CrmErp
      </h2>
      <p className="text-gray-600 text-lg mb-8">
        Modular ERP/CRM system
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl">
        {[
          { title: "CRM", description: "Clientes, prospectos, seguimiento" },
          { title: "Ventas", description: "Presupuestos, pedidos, facturación" },
          { title: "Inventario", description: "Stock, depósitos, movimientos" },
        ].map((module) => (
          <div
            key={module.title}
            className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <h3 className="font-semibold text-gray-900 mb-2">{module.title}</h3>
            <p className="text-gray-600 text-sm">{module.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
