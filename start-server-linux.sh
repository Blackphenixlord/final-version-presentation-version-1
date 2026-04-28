#!/usr/bin/env bash
set -euo pipefail

PREFERRED_PORT="${PREFERRED_PORT:-8080}"
AUTO_PORT_FALLBACK="${AUTO_PORT_FALLBACK:-1}"
REUSE_IF_HEALTHY="${REUSE_IF_HEALTHY:-1}"

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
SERVER_PATH="$SCRIPT_DIR/dlsm-temp/dlsm-inv-sys-client-main/services/edge-server"
cd "$SERVER_PATH"

export NO_DB="${NO_DB:-1}"
export SERVE_STATIC="${SERVE_STATIC:-1}"

if [[ -f ".env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

api_health_ok() {
  local host="$1"
  local port="$2"
  curl -fsS --max-time 3 "http://${host}:${port}/api/health" >/dev/null 2>&1
}

is_listening() {
  local port="$1"
  ss -ltn "sport = :${port}" 2>/dev/null | grep -q LISTEN
}

get_free_port() {
  local start="$1"
  local end=$((start + 40))
  local p
  for ((p=start; p<=end; p++)); do
    if ! is_listening "$p"; then
      echo "$p"
      return 0
    fi
  done
  return 1
}

get_tailscale_ip() {
  if ! command -v tailscale >/dev/null 2>&1; then
    return 1
  fi
  tailscale ip -4 2>/dev/null | head -n1
}

PORT="${PORT:-$PREFERRED_PORT}"
TS_IP="$(get_tailscale_ip || true)"
if [[ -n "$TS_IP" ]]; then
  export TAILSCALE_HOST="$TS_IP"
fi

if is_listening "$PORT"; then
  if [[ "$REUSE_IF_HEALTHY" == "1" ]] && api_health_ok "localhost" "$PORT"; then
    echo "Backend already healthy on port ${PORT}; reusing existing process."
    echo "URL: http://localhost:${PORT}/"
    [[ -n "$TS_IP" ]] && echo "Tailnet URL: http://${TS_IP}:${PORT}/"
    exit 0
  fi

  if [[ "$AUTO_PORT_FALLBACK" == "1" ]]; then
    NEW_PORT="$(get_free_port "$((PORT + 1))")" || {
      echo "No free port found near ${PORT}." >&2
      exit 1
    }
    echo "Port ${PORT} is busy. Falling back to ${NEW_PORT}."
    PORT="$NEW_PORT"
  else
    echo "Port ${PORT} is already in use." >&2
    exit 1
  fi
fi

export PORT

if [[ -n "$TS_IP" ]]; then
  echo "Tailscale detected: ${TS_IP}"
else
  echo "Tailscale not detected; using localhost/LAN only."
fi

echo "Starting backend server..."
echo "Local URL: http://localhost:${PORT}/"
[[ -n "$TS_IP" ]] && echo "Tailnet URL: http://${TS_IP}:${PORT}/"

exec node src/server.mjs
