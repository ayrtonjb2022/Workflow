import { useState } from "react"
import { Link, useNavigate } from "react-router"
import { useAuth } from "../providers/AuthProvider.js"
import { Button } from "../components/ui/Button.js"
import { Input } from "../components/ui/Input.js"

interface FieldErrors {
  name?: string
  email?: string
  password?: string
  companyName?: string
}

function validate(name: string, email: string, password: string, companyName: string): FieldErrors {
  const errors: FieldErrors = {}
  if (!name.trim()) errors.name = "El nombre es obligatorio"
  if (!email) errors.email = "El email es obligatorio"
  else if (!/\S+@\S+\.\S+/.test(email)) errors.email = "Email inválido"
  if (!password) errors.password = "La contraseña es obligatoria"
  else if (password.length < 6) errors.password = "Mínimo 6 caracteres"
  if (!companyName.trim()) errors.companyName = "El nombre de la empresa es obligatorio"
  return errors
}

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [companyName, setCompanyName] = useState("")
  const [errors, setErrors] = useState<FieldErrors>({})
  const [apiError, setApiError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setApiError("")

    const fieldErrors = validate(name, email, password, companyName)
    setErrors(fieldErrors)
    if (Object.keys(fieldErrors).length > 0) return

    setLoading(true)
    try {
      await register({ name, email, password, companyName })
      navigate("/customers")
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al registrarse"
      setApiError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Nombre"
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={errors.name}
        placeholder="Tu nombre"
      />

      <Input
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={errors.email}
        placeholder="tu@email.com"
      />

      <Input
        label="Contraseña"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={errors.password}
        placeholder="Mínimo 6 caracteres"
      />

      <Input
        label="Empresa"
        value={companyName}
        onChange={(e) => setCompanyName(e.target.value)}
        error={errors.companyName}
        placeholder="Nombre de tu empresa"
      />

      {apiError && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {apiError}
        </p>
      )}

      <Button type="submit" loading={loading} className="w-full">
        Crear cuenta
      </Button>

      <p className="text-center text-sm text-gray-600">
        ¿Ya tenés cuenta?{" "}
        <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
          Iniciá sesión
        </Link>
      </p>
    </form>
  )
}
