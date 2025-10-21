import { Hono } from "hono"

import { forwardError } from "~/lib/error"
import { apiKeyAuth } from "~/middleware/auth"

import { handleCountTokens } from "./count-tokens-handler"
import { handleCompletion } from "./handler"

export const messageRoutes = new Hono()

messageRoutes.post("/", apiKeyAuth, async (c) => {
  try {
    return await handleCompletion(c)
  } catch (error) {
    return await forwardError(c, error)
  }
})

messageRoutes.post("/count_tokens", apiKeyAuth, async (c) => {
  try {
    return await handleCountTokens(c)
  } catch (error) {
    return await forwardError(c, error)
  }
})
