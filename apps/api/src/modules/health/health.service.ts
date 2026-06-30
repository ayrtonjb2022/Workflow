import { healthRepository } from "./health.repository.js"

export const healthService = {
  async check() {
    const dbOk = await healthRepository.ping()
    return {
      status: dbOk ? "ok" : "degraded",
      database: dbOk ? "connected" : "disconnected",
    }
  },
}
