import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { api, AppError } from "../../lib/api.js"
import { Button } from "../../components/ui/Button.js"
import { Input } from "../../components/ui/Input.js"
import type { Customer } from "../../types/customer.js"

interface CustomerInfoCardProps {
  customer: Customer
  onUpdate: () => void
}

export default function CustomerInfoCard({ customer, onUpdate }: CustomerInfoCardProps) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ ...customer })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const updateMutation = useMutation({
    mutationFn: (data: Partial<Customer>) =>
      api(`/customers/${customer.id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      onUpdate()
      setEditing(false)
      setErrors({})
    },
    onError: (err) => {
      if (err instanceof AppError) {
        setErrors({ form: err.message })
      } else {
        setErrors({ form: "Error al actualizar el cliente" })
      }
    },
  })

  const handleSave = () => {
    const changed: Partial<Customer> = {}
    for (const key of Object.keys(form) as (keyof Customer)[]) {
      if (form[key] !== customer[key]) {
        ;(changed as Record<string, unknown>)[key] = form[key]
      }
    }
    if (Object.keys(changed).length === 0) {
      setEditing(false)
      return
    }
    updateMutation.mutate(changed)
  }

  const handleCancel = () => {
    setForm({ ...customer })
    setEditing(false)
    setErrors({})
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("es-AR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const renderField = (
    label: string,
    value: string | null | undefined,
    key: keyof Customer,
    type: "text" | "email" = "text",
  ) => {
    if (editing) {
      return (
        <Input
          label={label}
          type={type}
          value={String(form[key] ?? "")}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        />
      )
    }
    return (
      <div>
        <span className="block text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</span>
        <span className="block text-sm text-gray-900 mt-0.5">{value ?? "—"}</span>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Información del Cliente</h2>
        {!editing ? (
          <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
            Editar
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleCancel} disabled={updateMutation.isPending}>
              Cancelar
            </Button>
            <Button size="sm" loading={updateMutation.isPending} onClick={handleSave}>
              Guardar
            </Button>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="px-6 py-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {renderField("Nombre", customer.name, "name")}
          {renderField("Email", customer.email, "email", "email")}
          {renderField("Teléfono", customer.phone, "phone")}
          {editing ? (
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Tipo de documento</label>
              <select
                value={form.documentType}
                onChange={(e) => setForm({ ...form, documentType: e.target.value })}
                className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="DNI">DNI</option>
                <option value="CUIT">CUIT</option>
                <option value="PASSPORT">PASSPORT</option>
              </select>
            </div>
          ) : (
            <div>
              <span className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo de documento</span>
              <span className="block text-sm text-gray-900 mt-0.5">{customer.documentType}</span>
            </div>
          )}
          {renderField("Número de documento", customer.documentNumber, "documentNumber")}
          {renderField("Dirección", customer.address, "address")}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
          <div>
            <span className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</span>
            <span className={`inline-block text-sm font-medium mt-0.5 px-2 py-0.5 rounded-full ${
              customer.active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
            }`}>
              {customer.active ? "Activo" : "Inactivo"}
            </span>
          </div>
          <div>
            <span className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha de creación</span>
            <span className="block text-sm text-gray-900 mt-0.5">{formatDate(customer.createdAt)}</span>
          </div>
        </div>

        {errors.form && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {errors.form}
          </p>
        )}
      </div>
    </div>
  )
}
