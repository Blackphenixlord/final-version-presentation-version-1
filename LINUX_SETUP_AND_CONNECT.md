# Linux Setup: Jetson Host + Raspberry Pi Clients (Tailscale)

This guide assumes:

- Jetson runs the backend server (authoritative API host).
- Two Raspberry Pis run browser clients or frontend dev servers.
- All devices are on the same Tailscale tailnet.

## 1. Prerequisites (Jetson + Pis)

- Node.js (v18+ recommended)
- npm (comes with Node.js)
- git
- Tailscale installed on all devices and joined to the same tailnet
- Linux networking tools: `curl`, `ss`, `lsof` (or equivalent)

## 2. Clone the Repository

```
git clone https://github.com/Blackphenixlord/full-NASA.git
cd full-NASA
```

## 2.1 Initialize Setup (Auto Requirements + Install)

Run this first on each Linux device:

```
chmod +x setup-linux.sh
./setup-linux.sh --role jetson
```

For Raspberry Pi client devices:

```
./setup-linux.sh --role pi
```

For unattended setup:

```
./setup-linux.sh --role jetson --yes
```

This command prints `SETUP_REQUIREMENTS.md`, validates prerequisites, installs dependencies, and prepares runtime scripts automatically.

## 3. Install Dependencies (Backend & Frontend)

If you already ran `./setup-linux.sh`, dependencies are already installed and you can skip this section.

```
# Backend
cd dlsm-temp/dlsm-inv-sys-client-main/services/edge-server
npm install

# Frontend (Ground)
cd ../../../../web
npm install

# Frontend (Crew)
cd ../../../../nasa-hunch
npm install
```

## 4. Configure Backend for Linux

- Edit `.env` in `dlsm-temp/dlsm-inv-sys-client-main/services/edge-server/` if needed.
- Make sure the server listens on all interfaces:
  - In `server.mjs`, the line should be:
    ```js
    await app.listen({ port, host: "0.0.0.0" });
    ```
- For demo data, set `NO_DB=1` in your environment or `.env` file.
- For cross-device frontend access, set CORS origins in `.env`:

```
CORS_ORIGINS=http://localhost:5173,http://<JETSON_TAILSCALE_NAME>:5173,http://<PI1_TAILSCALE_NAME>:5173,http://<PI2_TAILSCALE_NAME>:5173
```

## 5. Start the Backend (Crash-Safe)

```
cd full-NASA
chmod +x start-server-linux.sh network-preflight-linux.sh
./start-server-linux.sh
```

The script will:

- Reuse an already-healthy API process on the same port.
- Auto-fallback to a free port if the preferred port is occupied.
- Print local and Tailnet URLs.

Run health preflight anytime:

```
./network-preflight-linux.sh 8080
```

## 6. Set Frontend API Base URLs

- In both `web/src` (Ground) and `nasa-hunch/src` (Crew), edit the API base:
  - Open `lib/apiBase.ts` in each frontend.
  - Set:
    ```ts
    export const API_BASE = "http://<JETSON_TAILSCALE_IP>:8080/api";
    ```
    Replace `<JETSON_TAILSCALE_IP>` with Jetson Tailnet IP from `tailscale ip -4`.

## 7. Start the Frontends

```
# Ground
cd web
npm run dev -- --host

# Crew
cd nasa-hunch
npm run dev -- --host
```

- The `--host` flag allows access from other devices on the network.

## 8. Access the Apps

- On any device on the same tailnet, open:
  - Ground: `http://<JETSON_TAILSCALE_NAME>:5173/ground`
  - Crew: `http://<JETSON_TAILSCALE_NAME>:5173/crew`

If frontends are served from the Raspberry Pis instead, keep backend API base pointed to the Jetson Tailnet IP.

## 9. Keep Backend Alive (Recommended)

Use systemd on Jetson for auto-restart after crashes/reboots.

1. Copy and edit service template:

```
sudo cp edge-server.service.example /etc/systemd/system/edge-server.service
sudo nano /etc/systemd/system/edge-server.service
```

2. Adjust paths and `User=`.

3. Enable and start:

```
sudo systemctl daemon-reload
sudo systemctl enable edge-server
sudo systemctl start edge-server
sudo systemctl status edge-server
```

4. Tail logs:

```
journalctl -u edge-server -f
```

## 10. Troubleshooting

- If you see CORS errors, make sure the backend always sends CORS headers for all routes.
- If you can't connect, check Tailscale status on all nodes: `tailscale status`.
- Verify Jetson API from each Pi:

```
curl http://<JETSON_TAILSCALE_IP>:8080/api/health
```

- If port 8080 is busy, the Linux startup script auto-falls back. Check output for selected port.

---

This setup ensures the Jetson API remains reachable and resilient for both Raspberry Pi clients over Tailscale.
