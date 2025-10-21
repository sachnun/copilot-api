import { describe, expect, it, beforeEach } from "bun:test"

import {
  applyInitiatorRotation,
  getAgentRequestCount,
  resetAgentRequestCount,
  setRotationThreshold,
  getRotationThreshold,
} from "~/lib/initiator-rotation"

describe("Initiator Rotation", () => {
  beforeEach(() => {
    // Reset state before each test
    resetAgentRequestCount()
    setRotationThreshold(300) // Reset to default
  })

  it("should return 'user' when original initiator is 'user'", () => {
    const result = applyInitiatorRotation("user")
    expect(result).toBe("user")
    expect(getAgentRequestCount()).toBe(0) // Counter should not increment
  })

  it("should increment counter for agent requests", () => {
    expect(getAgentRequestCount()).toBe(0)

    applyInitiatorRotation("agent")
    expect(getAgentRequestCount()).toBe(1)

    applyInitiatorRotation("agent")
    expect(getAgentRequestCount()).toBe(2)

    applyInitiatorRotation("agent")
    expect(getAgentRequestCount()).toBe(3)
  })

  it("should force 'user' request after threshold is reached", () => {
    setRotationThreshold(3) // Set to small threshold for testing

    // First 3 agent requests should pass through
    expect(applyInitiatorRotation("agent")).toBe("agent")
    expect(getAgentRequestCount()).toBe(1)

    expect(applyInitiatorRotation("agent")).toBe("agent")
    expect(getAgentRequestCount()).toBe(2)

    expect(applyInitiatorRotation("agent")).toBe("agent")
    expect(getAgentRequestCount()).toBe(3)

    // 4th agent request should be forced to 'user' and counter reset
    expect(applyInitiatorRotation("agent")).toBe("user")
    expect(getAgentRequestCount()).toBe(0)

    // Next request should be 'agent' again
    expect(applyInitiatorRotation("agent")).toBe("agent")
    expect(getAgentRequestCount()).toBe(1)
  })

  it("should work with default threshold of 300", () => {
    expect(getRotationThreshold()).toBe(300)

    // Make 299 agent requests
    for (let i = 0; i < 299; i++) {
      expect(applyInitiatorRotation("agent")).toBe("agent")
    }
    expect(getAgentRequestCount()).toBe(299)

    // Make 300th agent request
    expect(applyInitiatorRotation("agent")).toBe("agent")
    expect(getAgentRequestCount()).toBe(300)

    // 301st request should be forced to 'user'
    expect(applyInitiatorRotation("agent")).toBe("user")
    expect(getAgentRequestCount()).toBe(0)
  })

  it("should allow setting custom threshold", () => {
    setRotationThreshold(5)
    expect(getRotationThreshold()).toBe(5)

    for (let i = 0; i < 5; i++) {
      expect(applyInitiatorRotation("agent")).toBe("agent")
    }

    expect(applyInitiatorRotation("agent")).toBe("user")
    expect(getAgentRequestCount()).toBe(0)
  })

  it("should throw error when setting threshold less than 1", () => {
    expect(() => setRotationThreshold(0)).toThrow(
      "Rotation threshold must be at least 1",
    )
    expect(() => setRotationThreshold(-1)).toThrow(
      "Rotation threshold must be at least 1",
    )
  })

  it("should handle mixed 'user' and 'agent' requests correctly", () => {
    setRotationThreshold(3)

    // Agent request #1
    expect(applyInitiatorRotation("agent")).toBe("agent")
    expect(getAgentRequestCount()).toBe(1)

    // User request (should not affect counter)
    expect(applyInitiatorRotation("user")).toBe("user")
    expect(getAgentRequestCount()).toBe(1)

    // Agent request #2
    expect(applyInitiatorRotation("agent")).toBe("agent")
    expect(getAgentRequestCount()).toBe(2)

    // User request (should not affect counter)
    expect(applyInitiatorRotation("user")).toBe("user")
    expect(getAgentRequestCount()).toBe(2)

    // Agent request #3
    expect(applyInitiatorRotation("agent")).toBe("agent")
    expect(getAgentRequestCount()).toBe(3)

    // Agent request #4 (should force to 'user')
    expect(applyInitiatorRotation("agent")).toBe("user")
    expect(getAgentRequestCount()).toBe(0)
  })

  it("should reset counter manually", () => {
    setRotationThreshold(10)

    applyInitiatorRotation("agent")
    applyInitiatorRotation("agent")
    applyInitiatorRotation("agent")
    expect(getAgentRequestCount()).toBe(3)

    resetAgentRequestCount()
    expect(getAgentRequestCount()).toBe(0)
  })
})
