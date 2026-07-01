import { useState } from "react"
import { api, AppError } from "../../lib/api.js"
import { Button } from "../../components/ui/Button.js"
import { Input } from "../../components/ui/Input.js"
import { Modal } from "../../components/ui/Modal.js"

interface AddContactModalProps {
  open: boolean
  onClose: () => void
  customerId: string
  onSuccess: () => void
}

interface FieldErrors {
  name?: string
  form?: string
}

function validate(name: string): FieldErrors {
  const errors: FieldErrors = {}
  if (!name.trim()) errors.name = "El nombre es obligatorio"
  return errors
}

export default function AddContactModal({
  open,
  onClose,
  customerId,
  onSuccess,
}: AddContactModalProps) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [position, setPosition] = useState("")
  const [errors, setErrors] = useState<FieldErrors>({})
  const [loading, setLoading] = useState(false)

  const resetForm = () => {
    setName("")
    setEmail("")
    setPhone("")
    setPosition("")
    setErrors({})
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    const fieldErrors = validate(name)
    setErrors(fieldErrors)
    if (Object.keys(fieldErrors).length > 0) return

    setLoading(true)
    try {
      await api(`/customers/${customerId}/contacts`, {
        method: "POST",
        body: JSON.stringify({
          name,
          email: email || undefined,
          phone: phone || undefined,
          position: position || undefined,
        }),
      })
      resetForm()
      onSuccess()
      onClose()
    } catch (err) {
      if (err instanceof AppError) {
        setErrors({ form: err.message })
      } else {
        setErrors({ form: "Error al agregar el contacto" })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Agregar Contacto">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nombre *"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
          placeholder="Nombre del contacto"
        />

        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="contacto@email.com"
        />

        <Input
          label="Teléfono"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+54 11 1234-5678"
        />

        <Input
          label="Cargo"
          value={position}
          onChange={(e) => setPosition(e.target.value)}
          placeholder="Ej: Gerente de ventas"
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
