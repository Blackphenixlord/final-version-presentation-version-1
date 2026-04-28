#!/usr/bin/env bash
set -euo pipefail

PORT="${1:-8080}"

echo "== Network Preflight =="
echo "Target Port: ${PORT}"

if ss -ltn "sport = :${PORT}" 2>/dev/null | grep -q LISTEN; then
  PIDS="$(lsof -t -iTCP:"${PORT}" -sTCP:LISTEN 2>/dev/null | tr '\n' ',' | sed 's/,$//')"
  if [[ -n "$PIDS" ]]; then
    echo "Listening on ${PORT} by PID(s): ${PIDS}"
  else
    echo "Listening on ${PORT}"
  fi
else
  echo "No listener detected on port ${PORT}"
fi

if curl -fsS --max-time 5 "http://localhost:${PORT}/api/health" >/dev/null 2>&1; then
  echo "Local health: OK"
else
  echo "Local health: FAIL"
fi

TS_IP=""
if command -v tailscale >/dev/null 2>&1; then
  if tailscale status >/dev/null 2>&1; then
    echo "Tailscale: Running"
  else
    echo "Tailscale: Not running"
  fi
  TS_IP="$(tailscale ip -4 2>/dev/null | head -n1 || true)"
fi

if [[ -n "$TS_IP" ]]; then
  echo "Tailnet IP: ${TS_IP}"
  if curl -fsS --max-time 5 "http://${TS_IP}:${PORT}/api/health" >/dev/null 2>&1; then
    echo "Tailnet health: OK"
  else
    echo "Tailnet health: FAIL"
  fi
fi

echo "== Preflight Complete =="
