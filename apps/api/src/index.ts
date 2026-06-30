import { buildApp } from "./app.js"

const PORT = parseInt(process.env.PORT || "3000", 10)
const HOST = process.env.HOST || "0.0.0.0"

async function main() {
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
