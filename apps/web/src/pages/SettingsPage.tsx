import { useState, useEffect } from "react"
import { api } from "../lib/api.js"
import { Button } from "../components/ui/Button.js"
import { useToast } from "../providers/ToastProvider.js"

interface Settings {
  id: string
  name: string
  slug: string
  logo: string | null
  address: string | null
  phone: string | null
  email: string | null
  taxId: string | null
}

export default function SettingsPage() {
  const { addToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<Settings | null>(null)
  const [form, setForm] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
    taxId: "",
  })

  useEffect(() => {
    api<Settings>("/settings")
      .then((data) => {
        setSettings(data)
        setForm({
          name: data.name ?? "",
          address: data.address ?? "",
          phone: data.phone ?? "",
          email: data.email ?? "",
          taxId: data.taxId ?? "",
        })
      })
      .catch(() => {
        addToast("error", "Error al cargar la configuración")
      })
      .finally(() => setLoading(false))
  }, [addToast])

  const handleChange = (field: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const updated = await api<Settings>("/settings", {
        method: "PUT",
        body: JSON.stringify({
          name: form.name || undefined,
          address: form.address || undefined,
          phone: form.phone || undefined,
          email: form.email || undefined,
          taxId: form.taxId || undefined,
        }),
      })
      setSettings(updated)
      addToast("success", "Configuración guardada correctamente")
    } catch {
      addToast("error", "Error al guardar la configuración")
    } finally {
      setSaving(false)
    }
  }

  const hasChanges =
    settings != null &&
    (form.name !== (settings.name ?? "") ||
      form.address !== (settings.address ?? "") ||
      form.phone !== (settings.phone ?? "") ||
      form.email !== (settings.email ?? "") ||
      form.taxId !== (settings.taxId ?? ""))

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-wave border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-dark">Configuración de la empresa</h1>
        <p className="text-sm text-muted mt-1">
          Administra los datos de tu empresa
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Company Name */}
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-dark mb-1.5"
          >
            Nombre de la empresa
          </label>
          <input
            id="name"
            type="text"
            value={form.name}
            onChange={handleChange("name")}
            className="w-full rounded-xl border border-ink bg-card px-4 py-2.5 text-sm text-dark placeholder-muted/60 focus:outline-none focus:ring-2 focus:ring-wave/40 focus:border-wave transition-all"
            placeholder="Nombre de la empresa"
          />
        </div>

        {/* Address */}
        <div>
          <label
            htmlFor="address"
            className="block text-sm font-medium text-dark mb-1.5"
          >
            Dirección
          </label>
          <input
            id="address"
            type="text"
            value={form.address}
            onChange={handleChange("address")}
            className="w-full rounded-xl border border-ink bg-card px-4 py-2.5 text-sm text-dark placeholder-muted/60 focus:outline-none focus:ring-2 focus:ring-wave/40 focus:border-wave transition-all"
            placeholder="Dirección"
          />
        </div>

        {/* Phone */}
        <div>
          <label
            htmlFor="phone"
            className="block text-sm font-medium text-dark mb-1.5"
          >
            Teléfono
          </label>
          <input
            id="phone"
            type="text"
            value={form.phone}
            onChange={handleChange("phone")}
            className="w-full rounded-xl border border-ink bg-card px-4 py-2.5 text-sm text-dark placeholder-muted/60 focus:outline-none focus:ring-2 focus:ring-wave/40 focus:border-wave transition-all"
            placeholder="Teléfono"
          />
        </div>

        {/* Email */}
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-dark mb-1.5"
          >
            Correo electrónico
          </label>
          <input
            id="email"
            type="email"
            value={form.email}
            onChange={handleChange("email")}
            className="w-full rounded-xl border border-ink bg-card px-4 py-2.5 text-sm text-dark placeholder-muted/60 focus:outline-none focus:ring-2 focus:ring-wave/40 focus:border-wave transition-all"
            placeholder="correo@ejemplo.com"
          />
        </div>

        {/* Tax ID */}
        <div>
          <label
            htmlFor="taxId"
            className="block text-sm font-medium text-dark mb-1.5"
          >
            CUIT / Identificación fiscal
          </label>
          <input
            id="taxId"
            type="text"
            value={form.taxId}
            onChange={handleChange("taxId")}
            className="w-full rounded-xl border border-ink bg-card px-4 py-2.5 text-sm text-dark placeholder-muted/60 focus:outline-none focus:ring-2 focus:ring-wave/40 focus:border-wave transition-all"
            placeholder="XX-XXXXXXXX-X"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <Button type="submit" loading={saving} disabled={!hasChanges}>
            Guardar cambios
          </Button>
          {!hasChanges && settings != null && (
            <span className="text-xs text-muted">Sin cambios pendientes</span>
          )}
        </div>
      </form>
    </div>
  )
}
