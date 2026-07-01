import { useState } from "react"
import { Link, useNavigate } from "react-router"
import { useAuth } from "../providers/AuthProvider.js"
import { Button } from "../components/ui/Button.js"
import { Input } from "../components/ui/Input.js"

interface FieldErrors {
  email?: string
  password?: string
}

function validate(email: string, password: string): FieldErrors {
  const errors: FieldErrors = {}
  if (!email) errors.email = "El email es obligatorio"
  else if (!/\S+@\S+\.\S+/.test(email)) errors.email = "Email inválido"
  if (!password) errors.password = "La contraseña es obligatoria"
  return errors
}

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [errors, setErrors] = useState<FieldErrors>({})
  const [apiError, setApiError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setApiError("")

    const fieldErrors = validate(email, password)
    setErrors(fieldErrors)
    if (Object.keys(fieldErrors).length > 0) return

    setLoading(true)
    try {
      await login({ email, password })
      navigate("/customers")
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al iniciar sesión"
      setApiError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
        placeholder="••••••••"
      />

      {apiError && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {apiError}
        </p>
      )}

      <Button type="submit" loading={loading} className="w-full">
        Iniciar sesión
      </Button>

      <p className="text-center text-sm text-gray-600">
        ¿No tenés cuenta?{" "}
        <Link to="/register" className="text-blue-600 hover:text-blue-700 font-medium">
          Registrate
        </Link>
      </p>
    </form>
  )
}
