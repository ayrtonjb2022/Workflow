import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import { Navigate } from "react-router"
import { api } from "../lib/api"
import type { User, LoginInput, RegisterInput } from "../types/auth"

interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (input: LoginInput) => Promise<void>
  logout: () => Promise<void>
  register: (input: RegisterInput) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    api<User>("/auth/me")
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false))
  }, [])

  const login = useCallback(async (input: LoginInput) => {
    await api("/auth/login", {
      method: "POST",
      body: JSON.stringify(input),
    })
    const profile = await api<User>("/auth/me")
    setUser(profile)
  }, [])

  const logout = useCallback(async () => {
    await api("/auth/logout", { method: "POST" })
    setUser(null)
    window.location.href = "/login"
  }, [])

  const register = useCallback(async (input: RegisterInput) => {
    await api("/auth/register", {
      method: "POST",
      body: JSON.stringify(input),
    })
    const profile = await api<User>("/auth/me")
    setUser(profile)
  }, [])

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
