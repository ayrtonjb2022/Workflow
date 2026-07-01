import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "../../lib/api.js"
import { Button } from "../../components/ui/Button.js"
import { Modal } from "../../components/ui/Modal.js"
import { Table, type Column } from "../../components/ui/Table.js"
import type { Contact } from "../../types/customer.js"
import AddContactModal from "./AddContactModal.js"

interface ContactsTableProps {
  contacts: Contact[]
  loading: boolean
  customerId: string
  onUpdate: () => void
}

export default function ContactsTable({
  contacts,
  loading,
  customerId,
  onUpdate,
}: ContactsTableProps) {
  const [showAdd, setShowAdd] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const deleteMutation = useMutation({
    mutationFn: (contactId: string) =>
      api(`/customers/${customerId}/contacts/${contactId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers", customerId, "contacts"] })
      onUpdate()
      setDeletingId(null)
    },
  })

  const columns: Column<Contact>[] = [
    { key: "name", header: "Nombre", render: (c) => c.name },
    { key: "email", header: "Email", render: (c) => c.email ?? "—" },
    { key: "phone", header: "Teléfono", render: (c) => c.phone ?? "—" },
    { key: "position", header: "Cargo", render: (c) => c.position ?? "—" },
    {
      key: "actions",
      header: "",
      render: (c) => (
        <button
          onClick={(e) => {
            e.stopPropagation()
            setDeletingId(c.id)
          }}
          className="text-red-600 hover:text-red-800 text-sm font-medium"
        >
          Eliminar
        </button>
      ),
    },
  ]

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Contactos</h2>
        <Button size="sm" onClick={() => setShowAdd(true)}>
          Agregar Contacto
        </Button>
      </div>

      {/* Table */}
      <div className="p-0">
        <Table
          columns={columns}
          data={contacts}
          loading={loading}
          emptyMessage="No hay contactos registrados"
        />
      </div>

      {/* Add contact modal */}
      {showAdd && (
        <AddContactModal
          open={showAdd}
          onClose={() => setShowAdd(false)}
          customerId={customerId}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["customers", customerId, "contacts"] })
            setShowAdd(false)
          }}
        />
      )}

      {/* Delete confirmation modal */}
      <Modal
        open={!!deletingId}
        onClose={() => setDeletingId(null)}
        title="Eliminar contacto"
      >
        <p className="text-sm text-gray-600 mb-6">
          ¿Estás seguro de que querés eliminar este contacto? Esta acción no se
          puede deshacer.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeletingId(null)}>
            Cancelar
          </Button>
          <Button
            variant="danger"
            loading={deleteMutation.isPending}
            onClick={() => {
              if (deletingId) deleteMutation.mutate(deletingId)
            }}
          >
            Eliminar
          </Button>
        </div>
      </Modal>
    </div>
  )
}
