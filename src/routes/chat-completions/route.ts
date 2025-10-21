import { Hono } from "hono"

import { forwardError } from "~/lib/error"
import { apiKeyAuth } from "~/middleware/auth"

import { handleCompletion } from "./handler"

export const completionRoutes = new Hono()

completionRoutes.post("/", apiKeyAuth, async (c) => {
  try {
    return await handleCompletion(c)
  } catch (error) {
    return await forwardError(c, error)
  }
})
