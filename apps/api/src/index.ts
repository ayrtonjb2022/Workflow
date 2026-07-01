import { buildApp } from "./app.js"

const PORT = parseInt(process.env.PORT || "3000", 10)
const HOST = process.env.HOST || "0.0.0.0"

const REQUIRED_ENV_VARS = ["DATABASE_URL", "JWT_SECRET"] as const

function validateEnv(): void {
  // Only enforce required vars in production (Docker).
  // Dev mode falls back to defaults in each module (e.g. auth.service.ts).
  if (process.env.NODE_ENV !== "production") return

  const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key])
  if (missing.length > 0) {
    console.error(
      `FATAL: Missing required environment variables:\n` +
        missing.map((k) => `  • ${k}`).join("\n")
    )
    process.exit(1)
  }
}

async function main() {
  validateEnv()
  const app = await buildApp()

  try {
    await app.listen({ port: PORT, host: HOST })
    console.log(`API server running at http://${HOST}:${PORT}`)
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

// Graceful shutdown
process.on("SIGINT", async () => {
  const app = await buildApp()
  await app.close()
  process.exit(0)
})

main()
