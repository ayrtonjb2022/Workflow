import type { ButtonHTMLAttributes, ReactNode } from "react"

type Variant = "primary" | "secondary" | "danger" | "ghost"
type Size = "sm" | "md" | "lg"

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  children: ReactNode
}

const variantStyles: Record<Variant, string> = {
  primary:
    "bg-wave text-white hover:bg-wave/90 focus:ring-wave/50 disabled:bg-wave/40",
  secondary:
    "bg-ink/30 text-muted hover:bg-ink/50 hover:text-dark focus:ring-ink/40 disabled:bg-ink/20 disabled:text-muted/50",
  danger:
    "bg-seal text-white hover:bg-seal/90 focus:ring-seal/50 disabled:bg-seal/40",
  ghost:
    "bg-transparent text-muted hover:bg-ink/30 hover:text-dark focus:ring-ink/30 disabled:text-muted/40",
}

const sizeStyles: Record<Size, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  children,
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
      )}
      {children}
    </button>
  )
}
