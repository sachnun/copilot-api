import { randomUUID } from "node:crypto"

import type { State } from "./state"

export type CopilotHeaderOptions = {
  vision?: boolean
  initiator?: "agent" | "user"
}

export type ChatInitiatorPayload = {
  model: string
  messages: Array<{ role?: string | null }>
}

export const resolveChatInitiator = (
  payload: ChatInitiatorPayload,
): "agent" | "user" => {
  const hasAgentRole = payload.messages.some((message) => {
    const role =
      typeof message.role === "string" ? message.role.toLowerCase() : ""
    return role === "assistant" || role === "tool"
  })

  const isClaudeModel = payload.model.startsWith("claude-")
  const isGpt5Codex = payload.model === "gpt-5-codex"

  return hasAgentRole || isClaudeModel || isGpt5Codex ? "agent" : "user"
}

export const standardHeaders = () => ({
  "content-type": "application/json",
  accept: "application/json",
})

const COPILOT_VERSION = "0.26.7"
const EDITOR_PLUGIN_VERSION = `copilot-chat/${COPILOT_VERSION}`
const USER_AGENT = `GitHubCopilotChat/${COPILOT_VERSION}`

const API_VERSION = "2025-04-01"

export const copilotBaseUrl = (state: State) =>
  state.accountType === "individual" ?
    "https://api.githubcopilot.com"
  : `https://api.${state.accountType}.githubcopilot.com`
export const copilotHeaders = (
  state: State,
  options: CopilotHeaderOptions = {},
) => {
  const { vision = false, initiator } = options

  const headers: Record<string, string> = {
    Authorization: `Bearer ${state.copilotToken}`,
    "content-type": standardHeaders()["content-type"],
    "copilot-integration-id": "vscode-chat",
    "editor-version": `vscode/${state.vsCodeVersion}`,
    "editor-plugin-version": EDITOR_PLUGIN_VERSION,
    "user-agent": USER_AGENT,
    "openai-intent": "conversation-panel",
    "x-github-api-version": API_VERSION,
    "x-request-id": randomUUID(),
    "x-vscode-user-agent-library-version": "electron-fetch",
  }

  if (vision) headers["copilot-vision-request"] = "true"
  if (initiator) headers["X-Initiator"] = initiator

  return headers
}

export const GITHUB_API_BASE_URL = "https://api.github.com"
export const githubHeaders = (state: State) => ({
  ...standardHeaders(),
  authorization: `token ${state.githubToken}`,
  "editor-version": `vscode/${state.vsCodeVersion}`,
  "editor-plugin-version": EDITOR_PLUGIN_VERSION,
  "user-agent": USER_AGENT,
  "x-github-api-version": API_VERSION,
  "x-vscode-user-agent-library-version": "electron-fetch",
})

export const GITHUB_BASE_URL = "https://github.com"
export const GITHUB_CLIENT_ID = "Iv1.b507a08c87ecfe98"
export const GITHUB_APP_SCOPES = ["read:user"].join(" ")
