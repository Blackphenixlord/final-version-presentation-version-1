# Setup Requirements (Jetson + Raspberry Pi)

This page is used by `setup-linux.sh` during initialization.

## Hardware Topology

- 1x Jetson device hosts the backend API.
- 1-2x Raspberry Pi devices run browser clients or frontend dev servers.
- All devices are connected to the same Tailscale tailnet.

## Required Software

- Linux (Ubuntu/Debian recommended)
- Node.js 20.19+ or 22.12+
- npm
- git
- curl
- Tailscale CLI (`tailscale`)
- `ss` (from `iproute2`)
- `lsof`

## Required Network Conditions

- Jetson and Pis can resolve each other over Tailscale.
- Backend port `8080` reachable from clients.
- Frontend dev port `5173` reachable when running Vite with `--host`.

## Setup Entry Command

Run from repository root:

```bash
chmod +x ./setup-linux.sh
./setup-linux.sh --role jetson
```

For Raspberry Pi client setup:

```bash
./setup-linux.sh --role pi
```

For unattended setup with automatic package install (apt-based systems):

```bash
./setup-linux.sh --role jetson --yes
```

## What Setup Script Does

- Prints this requirements page.
- Checks required commands.
- Installs npm dependencies.
- Marks Linux scripts executable.
- On Jetson role:
  - builds `nasa-hunch`
  - copies built assets into edge-server static directory
- Optional systemd service install with `--install-service`.

## Optional Service Install

```bash
./setup-linux.sh --role jetson --install-service
```

If service is installed, backend starts on boot and auto-restarts after failures.
