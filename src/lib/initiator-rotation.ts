/**
 * Initiator Rotation Module
 *
 * Tracks agent request count and forces a "user" initiator every N agent requests
 * to avoid abuse detection while still utilizing premium agent requests.
 */

export interface InitiatorRotationState {
  agentRequestCount: number
  rotationThreshold: number
}

const rotationState: InitiatorRotationState = {
  agentRequestCount: 0,
  rotationThreshold: 300, // Default: force user request every 300 agent requests
}

/**
 * Sets the rotation threshold (how many agent requests before forcing a user request)
 */
export const setRotationThreshold = (threshold: number) => {
  if (threshold < 1) {
    throw new Error("Rotation threshold must be at least 1")
  }
  rotationState.rotationThreshold = threshold
}

/**
 * Gets the current rotation threshold
 */
export const getRotationThreshold = () => rotationState.rotationThreshold

/**
 * Determines if the initiator should be forced to "user" based on rotation logic
 * @param originalInitiator - The original initiator determined by the payload
 * @returns The initiator to use (may be forced to "user")
 */
export const applyInitiatorRotation = (
  originalInitiator: "agent" | "user",
): "agent" | "user" => {
  // If already "user", no need to track
  if (originalInitiator === "user") {
    return "user"
  }

  // Check if we need to force a "user" request
  if (rotationState.agentRequestCount >= rotationState.rotationThreshold) {
    // Force user request and reset counter
    rotationState.agentRequestCount = 0
    return "user"
  }

  // Increment agent request counter
  rotationState.agentRequestCount++
  return "agent"
}

/**
 * Gets current agent request count (for debugging/monitoring)
 */
export const getAgentRequestCount = () => rotationState.agentRequestCount

/**
 * Resets the agent request counter (useful for testing or manual resets)
 */
export const resetAgentRequestCount = () => {
  rotationState.agentRequestCount = 0
}
