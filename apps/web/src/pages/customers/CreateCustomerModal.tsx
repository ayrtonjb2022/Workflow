import { useState } from "react"
import { api, AppError } from "../../lib/api.js"
import { Button } from "../../components/ui/Button.js"
import { Input } from "../../components/ui/Input.js"
import { Modal } from "../../components/ui/Modal.js"

interface CreateCustomerModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

interface FieldErrors {
  name?: string
  email?: string
  phone?: string
  documentNumber?: string
  address?: string
  form?: string
}

const DOCUMENT_TYPES = ["DNI", "CUIT", "PASSPORT"] as const

function validate(
  name: string,
  documentNumber: string,
): FieldErrors {
  const errors: FieldErrors = {}
  if (!name.trim()) errors.name = "El nombre es obligatorio"
  if (!documentNumber.trim()) errors.documentNumber = "El documento es obligatorio"
  return errors
}

export default function CreateCustomerModal({
  open,
  onClose,
  onSuccess,
}: CreateCustomerModalProps) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [documentType, setDocumentType] = useState<"DNI" | "CUIT" | "PASSPORT">("DNI")
  const [documentNumber, setDocumentNumber] = useState("")
  const [address, setAddress] = useState("")
  const [errors, setErrors] = useState<FieldErrors>({})
  const [loading, setLoading] = useState(false)

  const resetForm = () => {
    setName("")
    setEmail("")
    setPhone("")
    setDocumentType("DNI")
    setDocumentNumber("")
    setAddress("")
    setErrors({})
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    const fieldErrors = validate(name, documentNumber)
    setErrors(fieldErrors)
    if (Object.keys(fieldErrors).length > 0) return

    setLoading(true)
    try {
      await api("/customers", {
        method: "POST",
        body: JSON.stringify({
          name,
          email: email || undefined,
          phone: phone || undefined,
          documentType,
          documentNumber,
          address: address || undefined,
        }),
      })
      resetForm()
      onSuccess()
    } catch (err) {
      if (err instanceof AppError) {
        setErrors({ form: err.message })
      } else {
        setErrors({ form: "Error al crear el cliente" })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Nuevo Cliente">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nombre *"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
          placeholder="Nombre del cliente"
        />

        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          placeholder="cliente@email.com"
        />

        <Input
          label="Teléfono"
          type="text"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          error={errors.phone}
          placeholder="+54 11 1234-5678"
        />

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            Tipo de documento
          </label>
          <select
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value as "DNI" | "CUIT" | "PASSPORT")}
            className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {DOCUMENT_TYPES.map((dt) => (
              <option key={dt} value={dt}>
                {dt}
              </option>
            ))}
          </select>
        </div>

        <Input
          label="Número de documento *"
          value={documentNumber}
          onChange={(e) => setDocumentNumber(e.target.value)}
          error={errors.documentNumber}
          placeholder="Número de documento"
        />

        <Input
          label="Dirección"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          error={errors.address}
          placeholder="Dirección"
        />

        {errors.form && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {errors.form}
          </p>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={loading}>
            Guardar
          </Button>
        </div>
      </form>
    </Modal>
  )
}
