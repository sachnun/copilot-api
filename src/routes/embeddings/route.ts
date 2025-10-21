import { Hono } from "hono"

import { forwardError } from "~/lib/error"
import { apiKeyAuth } from "~/middleware/auth"
import {
  createEmbeddings,
  type EmbeddingRequest,
} from "~/services/copilot/create-embeddings"

export const embeddingRoutes = new Hono()

embeddingRoutes.post("/", apiKeyAuth, async (c) => {
  try {
    const paylod = await c.req.json<EmbeddingRequest>()
    const response = await createEmbeddings(paylod)

    return c.json(response)
  } catch (error) {
    return await forwardError(c, error)
  }
})
