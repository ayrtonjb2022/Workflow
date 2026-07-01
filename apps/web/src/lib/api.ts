export class AppError extends Error {
  constructor(public status: number, message: string, public code?: string) {
    super(message)
    this.name = "AppError"
  }
}

const BASE = import.meta.env.VITE_API_URL ?? "/api"

export async function api<T = unknown>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: "include",
    headers: options?.body ? { "Content-Type": "application/json" } : undefined,
    ...options,
  })

  if (!res.ok) {
    if (
      res.status === 401
      && !window.location.pathname.startsWith("/login")
      && !window.location.pathname.startsWith("/register")
    ) {
      window.location.href = "/login"
    }
    const body = await res.json().catch(() => ({ message: res.statusText }))
    throw new AppError(res.status, body.message ?? "Request failed", body.code)
  }

  if (res.status === 204) return undefined as T
  return res.json()
}
