export interface Permission {
  id: string
  name: string
  description: string
  resource: string
  action: string
}

export interface Role {
  id: string
  name: string
  description?: string
  isSystem: boolean
  rolePermissions: { permission: Permission }[]
  _count?: { users: number }
}

export interface User {
  id: string
  email: string
  name: string
  active: boolean
  createdAt: string
  roles: { role: { id: string; name: string } }[]
}
