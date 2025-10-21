import { expect, test, beforeEach, afterEach } from "bun:test"
import { Hono } from "hono"

import { apiKeyAuth } from "../src/middleware/auth"

// Helper to create test app
function createTestApp() {
  const app = new Hono()
  app.use("*", apiKeyAuth)
  app.post("/test", (c) => c.json({ success: true }))
  return app
}

// Store original env
let originalEnv: string | undefined

beforeEach(() => {
  originalEnv = process.env.API_KEY
})

afterEach(() => {
  if (originalEnv !== undefined) {
    process.env.API_KEY = originalEnv
  } else {
    delete process.env.API_KEY
  }
})

test("allows request when no API_KEY is set in env", async () => {
  delete process.env.API_KEY
  const app = createTestApp()

  const res = await app.request("/test", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  })

  expect(res.status).toBe(200)
  const data = await res.json()
  expect(data).toEqual({ success: true })
})

test("allows request with valid Bearer token (OpenAI format)", async () => {
  process.env.API_KEY = "test-secret-key"
  const app = createTestApp()

  const res = await app.request("/test", {
    method: "POST",
    headers: {
      Authorization: "Bearer test-secret-key",
      "Content-Type": "application/json",
    },
  })

  expect(res.status).toBe(200)
  const data = await res.json()
  expect(data).toEqual({ success: true })
})

test("allows request with valid x-api-key header (Anthropic format)", async () => {
  process.env.API_KEY = "test-secret-key"
  const app = createTestApp()

  const res = await app.request("/test", {
    method: "POST",
    headers: {
      "x-api-key": "test-secret-key",
      "Content-Type": "application/json",
    },
  })

  expect(res.status).toBe(200)
  const data = await res.json()
  expect(data).toEqual({ success: true })
})

test("handles case-insensitive Bearer prefix", async () => {
  process.env.API_KEY = "test-secret-key"
  const app = createTestApp()

  const res = await app.request("/test", {
    method: "POST",
    headers: {
      Authorization: "bearer test-secret-key",
      "Content-Type": "application/json",
    },
  })

  expect(res.status).toBe(200)
  const data = await res.json()
  expect(data).toEqual({ success: true })
})

test("rejects request with invalid Bearer token", async () => {
  process.env.API_KEY = "test-secret-key"
  const app = createTestApp()

  const res = await app.request("/test", {
    method: "POST",
    headers: {
      Authorization: "Bearer wrong-key",
      "Content-Type": "application/json",
    },
  })

  expect(res.status).toBe(401)
  const text = await res.text()
  expect(text).toContain("Unauthorized")
})

test("rejects request with invalid x-api-key", async () => {
  process.env.API_KEY = "test-secret-key"
  const app = createTestApp()

  const res = await app.request("/test", {
    method: "POST",
    headers: {
      "x-api-key": "wrong-key",
      "Content-Type": "application/json",
    },
  })

  expect(res.status).toBe(401)
  const text = await res.text()
  expect(text).toContain("Unauthorized")
})

test("rejects request with no auth headers when API_KEY is set", async () => {
  process.env.API_KEY = "test-secret-key"
  const app = createTestApp()

  const res = await app.request("/test", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  })

  expect(res.status).toBe(401)
  const text = await res.text()
  expect(text).toContain("Unauthorized")
})

test("accepts Authorization header over x-api-key when both are valid", async () => {
  process.env.API_KEY = "test-secret-key"
  const app = createTestApp()

  const res = await app.request("/test", {
    method: "POST",
    headers: {
      Authorization: "Bearer test-secret-key",
      "x-api-key": "test-secret-key",
      "Content-Type": "application/json",
    },
  })

  expect(res.status).toBe(200)
  const data = await res.json()
  expect(data).toEqual({ success: true })
})

test("accepts x-api-key when Authorization is invalid", async () => {
  process.env.API_KEY = "test-secret-key"
  const app = createTestApp()

  const res = await app.request("/test", {
    method: "POST",
    headers: {
      Authorization: "Bearer wrong-key",
      "x-api-key": "test-secret-key",
      "Content-Type": "application/json",
    },
  })

  // x-api-key should be checked as fallback, so it should succeed
  expect(res.status).toBe(200)
  const data = await res.json()
  expect(data).toEqual({ success: true })
})
