#!/bin/sh

# Use PORT from Railway if available, otherwise default to 4141
PORT="${PORT:-4141}"

if [ "$1" = "--auth" ]; then
  # Run auth command
  exec bun run dist/main.js auth
else
  # Default command - use GH_TOKEN if provided
  if [ -n "$GH_TOKEN" ]; then
    exec bun run dist/main.js start -g "$GH_TOKEN" -p "$PORT" "$@"
  else
    exec bun run dist/main.js start -p "$PORT" "$@"
  fi
fi

