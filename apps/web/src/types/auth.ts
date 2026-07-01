export interface User {
  id: string
  email: string
  name: string
  tenantId: string
  roles: string[]
  permissions: string[]
}

export interface LoginInput {
  email: string
  password: string
}

export interface RegisterInput {
  email: string
  password: string
  name: string
  companyName: string
}

export interface LoginResponse {
  accessToken: string
  refreshToken: string
  user: { id: string; email: string; name: string }
}
