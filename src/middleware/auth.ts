import type { Context, Next } from "hono"

import { HTTPException } from "hono/http-exception"

/**
 * Middleware untuk autentikasi API key
 * Mendukung dua format:
 * - OpenAI format: Authorization: Bearer <api_key>
 * - Anthropic format: x-api-key: <api_key>
 */
export async function apiKeyAuth(c: Context, next: Next) {
  const apiKey = process.env.API_KEY

  // Jika tidak ada API_KEY di env, skip autentikasi
  if (!apiKey) {
    await next()
    return
  }

  let isAuthenticated = false

  // Cek Authorization header (OpenAI format)
  const authHeader = c.req.header("Authorization")
  if (authHeader) {
    const token = authHeader.replace(/^Bearer\s+/i, "")
    if (token === apiKey) {
      isAuthenticated = true
    }
  }

  // Cek x-api-key header (Anthropic format) jika belum authenticated
  if (!isAuthenticated) {
    const xApiKey = c.req.header("x-api-key")
    if (xApiKey === apiKey) {
      isAuthenticated = true
    }
  }

  if (isAuthenticated) {
    await next()
    return
  }

  // Jika tidak ada header yang valid atau tidak match
  throw new HTTPException(401, {
    message: "Unauthorized: Invalid or missing API key",
  })
}
