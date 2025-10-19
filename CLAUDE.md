# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a reverse-engineered proxy that transforms the GitHub Copilot API into OpenAI and Anthropic-compatible endpoints. It enables using GitHub Copilot with any tool that supports OpenAI Chat Completions or Anthropic Messages APIs.

**Runtime:** Bun (>= 1.2.x)
**Primary framework:** Hono (web server)
**CLI framework:** citty (command definitions)

## Development Commands

```bash
# Development (watch mode)
bun run dev

# Production build
bun run build

# Production start
bun run start

# Linting
bun run lint       # Lint staged files
bun run lint:all   # Lint entire codebase

# Type checking
bun run typecheck

# Testing
bun test                                    # Run all tests
bun test tests/example.test.ts              # Run single test

# Release
bun run release    # Bumps version and publishes
```

## Architecture

### Command Structure

The CLI uses a subcommand architecture defined in `src/main.ts`:

- **`start`** (`src/start.ts`): Main server command. Handles GitHub auth, Copilot token management, and starts the Hono server
- **`auth`** (`src/auth.ts`): Standalone GitHub authentication flow
- **`check-usage`** (`src/check-usage.ts`): Display Copilot usage/quota in terminal
- **`debug`** (`src/debug.ts`): Display diagnostic information

### Server Layer (`src/server.ts`)

Hono app with the following routes:

```
/v1/chat/completions    → OpenAI-compatible chat completions
/v1/models              → List available Copilot models
/v1/embeddings          → OpenAI-compatible embeddings
/v1/messages            → Anthropic-compatible messages endpoint
/v1/messages/count_tokens → Token counting
/usage                  → Usage/quota monitoring
/token                  → Current Copilot token
```

Routes without `/v1` prefix are also exposed for compatibility.

### Core Flow

1. **Token Management** (`src/lib/token.ts`):
   - GitHub OAuth device flow → GitHub token → stored in `~/.local/share/copilot-api/github-token`
   - GitHub token → Copilot token (via `services/github/get-copilot-token.ts`)
   - Copilot token auto-refreshes on interval

2. **Request Translation** (`src/routes/`):
   - **Anthropic → OpenAI**: `routes/messages/handler.ts` translates Anthropic Messages API to OpenAI format before calling Copilot
   - **Direct OpenAI**: `routes/chat-completions/handler.ts` passes through with minimal modification

3. **Copilot API Calls** (`src/services/copilot/`):
   - All Copilot API calls go through `create-chat-completions.ts`
   - Headers include auth token, VSCode version, account type, and X-Initiator (user vs agent)

### State Management (`src/lib/state.ts`)

Global singleton state object holds:
- `githubToken`, `copilotToken`: Authentication tokens
- `accountType`: "individual" | "business" | "enterprise"
- `models`, `vsCodeVersion`: Cached from Copilot API
- `manualApprove`, `rateLimitSeconds`, `rateLimitWait`: User-configured behavior

### Key Modules

- **`lib/approval.ts`**: Manual request approval flow (when `--manual` flag used)
- **`lib/rate-limit.ts`**: Rate limiting enforcement
- **`lib/tokenizer.ts`**: Token counting using `gpt-tokenizer`
- **`lib/api-config.ts`**: Constructs headers and base URLs for Copilot API (varies by account type)
- **`lib/proxy.ts`**: Proxy configuration from environment variables

### Translation Layers

**Anthropic → OpenAI** (`routes/messages/`):
- `non-stream-translation.ts`: Bidirectional translation for non-streaming requests/responses
- `stream-translation.ts`: Translates OpenAI SSE chunks to Anthropic event stream format
- `anthropic-types.ts`: Type definitions for Anthropic Messages API

### GitHub Services (`services/github/`)

- `get-device-code.ts`: Initiates OAuth device flow
- `poll-access-token.ts`: Polls for user authorization
- `get-copilot-token.ts`: Exchanges GitHub token for Copilot token
- `get-copilot-usage.ts`: Fetches usage/quota data

## TypeScript Configuration

- **Module system**: ESNext with `"type": "module"` in package.json
- **Path aliases**: `~/*` maps to `src/*`
- **Strict mode**: Enabled with `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`
- **No emit**: Type checking only; build handled by tsdown

## Testing

Uses Bun's built-in test runner. Place tests in `tests/` directory with `*.test.ts` naming.

## Account Type Behavior

The `--account-type` flag changes the Copilot API endpoint:
- **individual**: `api.githubcopilot.com`
- **business/enterprise**: `api.individual.githubcopilot.com`

See `lib/api-config.ts` for implementation details.

## Important Context

- **Security warning**: This is a reverse-engineered proxy. Excessive automated use may trigger GitHub abuse detection
- **Token persistence**: GitHub token stored in `~/.local/share/copilot-api/` (use `lib/paths.ts` for path logic)
- **VSCode version**: The proxy mimics VSCode to authenticate with Copilot (`services/get-vscode-version.ts`)
- **Streaming**: Both streaming and non-streaming are supported. Response type determined by `stream` parameter in request
