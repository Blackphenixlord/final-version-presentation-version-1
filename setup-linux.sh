#!/usr/bin/env bash
set -euo pipefail

ROLE="jetson"
INSTALL_SERVICE=0
RUN_START=0
ASSUME_YES=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --role)
      ROLE="${2:-}"
      shift 2
      ;;
    --install-service)
      INSTALL_SERVICE=1
      shift
      ;;
    --run-start)
      RUN_START=1
      shift
      ;;
    --yes|--non-interactive)
      ASSUME_YES=1
      shift
      ;;
    -h|--help)
      echo "Usage: ./setup-linux.sh [--role jetson|pi] [--install-service] [--run-start] [--yes]"
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      exit 1
      ;;
  esac
done

if [[ "$ROLE" != "jetson" && "$ROLE" != "pi" ]]; then
  echo "Invalid role '$ROLE'. Use --role jetson or --role pi." >&2
  exit 1
fi

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

print_section() {
  echo
  echo "== $1 =="
}

require_cmd() {
  local cmd="$1"
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "Missing required command: $cmd" >&2
    return 1
  fi
  return 0
}

install_missing_packages() {
  local -a missing_cmds=("$@")
  local -a pkg_list=()

  for cmd in "${missing_cmds[@]}"; do
    case "$cmd" in
      node|npm) pkg_list+=("nodejs" "npm") ;;
      git) pkg_list+=("git") ;;
      curl) pkg_list+=("curl") ;;
      ss) pkg_list+=("iproute2") ;;
      lsof) pkg_list+=("lsof") ;;
      tailscale) pkg_list+=("tailscale") ;;
    esac
  done

  if [[ ${#pkg_list[@]} -eq 0 ]]; then
    return 0
  fi

  # Deduplicate package names.
  mapfile -t pkg_list < <(printf '%s\n' "${pkg_list[@]}" | awk '!seen[$0]++')

  if ! command -v apt-get >/dev/null 2>&1; then
    echo "--yes was provided, but apt-get is not available. Install these packages manually: ${pkg_list[*]}" >&2
    return 1
  fi

  echo "Installing missing packages with apt-get: ${pkg_list[*]}"
  if [[ "$EUID" -ne 0 ]]; then
    sudo apt-get update
    sudo apt-get install -y "${pkg_list[@]}"
  else
    apt-get update
    apt-get install -y "${pkg_list[@]}"
  fi

  return 0
}

print_section "Requirements Page"
if [[ -f "$SCRIPT_DIR/SETUP_REQUIREMENTS.md" ]]; then
  cat "$SCRIPT_DIR/SETUP_REQUIREMENTS.md"
else
  echo "SETUP_REQUIREMENTS.md not found."
fi

print_section "Checking Required Commands"
missing=0
missing_cmds=()
for cmd in node npm git curl ss lsof; do
  if require_cmd "$cmd"; then
    echo "ok: $cmd"
  else
    echo "missing: $cmd"
    missing=1
    missing_cmds+=("$cmd")
  fi
done

if command -v tailscale >/dev/null 2>&1; then
  echo "ok: tailscale"
  if tailscale status >/dev/null 2>&1; then
    echo "tailscale status: running"
  else
    echo "tailscale status: not running (continue, but tailnet checks may fail)"
  fi
else
  echo "missing: tailscale"
  missing=1
  missing_cmds+=("tailscale")
fi

if [[ "$missing" -ne 0 ]]; then
  if [[ "$ASSUME_YES" -eq 1 ]]; then
    print_section "Auto-Installing Missing Packages (--yes)"
    install_missing_packages "${missing_cmds[@]}" || {
      echo "Auto-install failed. Install missing requirements manually and rerun setup." >&2
      exit 1
    }

    print_section "Re-checking Required Commands"
    for cmd in "${missing_cmds[@]}"; do
      if require_cmd "$cmd"; then
        echo "ok after install: $cmd"
      else
        echo "still missing: $cmd" >&2
        exit 1
      fi
    done
  else
    echo "One or more requirements are missing. Install them, then rerun setup, or run with --yes for auto-install." >&2
    exit 1
  fi
fi

print_section "Installing npm Dependencies"
(
  cd "$SCRIPT_DIR/dlsm-temp/dlsm-inv-sys-client-main/services/edge-server"
  npm ci || npm install
)

(
  cd "$SCRIPT_DIR/nasa-hunch"
  npm ci || npm install
)

if [[ -d "$SCRIPT_DIR/frontend-dslm" ]]; then
  (
    cd "$SCRIPT_DIR/frontend-dslm"
    npm ci || npm install
  )
fi

print_section "Marking Linux Scripts Executable"
chmod +x "$SCRIPT_DIR/start-server-linux.sh" "$SCRIPT_DIR/network-preflight-linux.sh"

if [[ "$ROLE" == "jetson" ]]; then
  print_section "Jetson Build + Static Deploy"
  (
    cd "$SCRIPT_DIR/nasa-hunch"
    npm run build
  )
  mkdir -p "$SCRIPT_DIR/dlsm-temp/dlsm-inv-sys-client-main/services/edge-server/static"
  cp -r "$SCRIPT_DIR/nasa-hunch/dist/." "$SCRIPT_DIR/dlsm-temp/dlsm-inv-sys-client-main/services/edge-server/static/"
  echo "Deployed frontend build to edge-server/static"
fi

if [[ "$INSTALL_SERVICE" -eq 1 ]]; then
  print_section "Installing systemd Service"
  if ! command -v systemctl >/dev/null 2>&1; then
    echo "systemctl not available on this device; skipping service install." >&2
  elif [[ ! -f "$SCRIPT_DIR/edge-server.service.example" ]]; then
    echo "edge-server.service.example not found; skipping service install." >&2
  else
    TARGET_SERVICE="/etc/systemd/system/edge-server.service"
    if [[ "$EUID" -ne 0 ]]; then
      sudo cp "$SCRIPT_DIR/edge-server.service.example" "$TARGET_SERVICE"
      sudo systemctl daemon-reload
      sudo systemctl enable edge-server
      sudo systemctl restart edge-server
      sudo systemctl --no-pager --full status edge-server || true
    else
      cp "$SCRIPT_DIR/edge-server.service.example" "$TARGET_SERVICE"
      systemctl daemon-reload
      systemctl enable edge-server
      systemctl restart edge-server
      systemctl --no-pager --full status edge-server || true
    fi
    echo "Installed service at $TARGET_SERVICE"
    echo "Edit WorkingDirectory/User in the service file to match your device if needed."
  fi
fi

print_section "Preflight"
"$SCRIPT_DIR/network-preflight-linux.sh" 8080 || true

if [[ "$RUN_START" -eq 1 ]]; then
  print_section "Starting Backend"
  exec "$SCRIPT_DIR/start-server-linux.sh"
fi

print_section "Setup Complete"
echo "Role: $ROLE"
echo "Next steps:"
if [[ "$ROLE" == "jetson" ]]; then
  echo "  ./start-server-linux.sh"
  echo "  ./network-preflight-linux.sh 8080"
else
  echo "  Configure frontend API base to Jetson tailnet IP and run npm run dev -- --host"
fi
