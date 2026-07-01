import { useParams, useNavigate } from "react-router"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "../../lib/api.js"
import type { Customer, Contact } from "../../types/customer.js"
import CustomerInfoCard from "./CustomerInfoCard.js"
import ContactsTable from "./ContactsTable.js"

export default function CustomerDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const {
    data: customer,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["customers", id],
    queryFn: () => api<Customer>(`/customers/${id}`),
    enabled: !!id,
  })

  const { data: contacts, isLoading: contactsLoading } = useQuery({
    queryKey: ["customers", id, "contacts"],
    queryFn: () => api<Contact[]>(`/customers/${id}/contacts`),
    enabled: !!id,
  })

  if (isLoading) {
    return (
      <div className="text-center py-20">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />
        <p className="mt-3 text-sm text-gray-500">Cargando cliente...</p>
      </div>
    )
  }

  if (isError || !customer) {
    return (
      <div className="text-center py-20">
        <p className="text-red-600 mb-4">Error al cargar el cliente</p>
        <button
          onClick={() => navigate("/customers")}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          ← Volver a clientes
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={() => navigate("/customers")}
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Volver a clientes
      </button>

      {/* Info card */}
      <CustomerInfoCard
        customer={customer}
        onUpdate={() =>
          queryClient.invalidateQueries({ queryKey: ["customers", id] })
        }
      />

      {/* Contacts table */}
      <ContactsTable
        contacts={contacts ?? []}
        loading={contactsLoading}
        customerId={id!}
        onUpdate={() =>
          queryClient.invalidateQueries({
            queryKey: ["customers", id, "contacts"],
          })
        }
      />
    </div>
  )
}
