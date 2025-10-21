import { Hono } from "hono"

import { forwardError } from "~/lib/error"
import { apiKeyAuth } from "~/middleware/auth"

import { handleResponses } from "./handler"

export const responsesRoutes = new Hono()

responsesRoutes.post("/", apiKeyAuth, async (c) => {
  try {
    return await handleResponses(c)
  } catch (error) {
    return await forwardError(c, error)
  }
})
