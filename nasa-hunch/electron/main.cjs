// electron/main.js — Electron entry point for DSLM Windows app
const { app, BrowserWindow, shell } = require("electron");
const path = require("node:path");
const { spawn } = require("node:child_process");
const os = require("node:os");

let mainWindow = null;
let serverProcess = null;

// ── Resolve server path ─────────────────────────────────────
function getServerPath() {
  // In packaged app, extraResources lands next to app.asar
  const resourcesBase = app.isPackaged
    ? path.join(process.resourcesPath, "server")
    : path.join(__dirname, "..", "..", "dlsm-temp", "dlsm-inv-sys-client-main", "services", "edge-server");
  return resourcesBase;
}

// ── Start the bundled Fastify backend ──────────────────────
function startBackend() {
  const serverDir = getServerPath();
  const serverEntry = path.join(serverDir, "src", "server.mjs");

  const env = {
    ...process.env,
    NO_DB: "1",
    SERVE_STATIC: "0",
    PORT: "8080",
  };

  serverProcess = spawn(process.execPath, [serverEntry], {
    cwd: serverDir,
    env,
    stdio: "pipe",
  });

  serverProcess.stdout.on("data", (d) => console.log("[server]", d.toString().trim()));
  serverProcess.stderr.on("data", (d) => console.error("[server]", d.toString().trim()));
  serverProcess.on("exit", (code) => console.log("[server] exited", code));
}

// ── Create the main browser window ─────────────────────────
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 360,
    minHeight: 600,
    title: "DSLM — NASA HUNCH",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
    backgroundColor: "#2e3440", // Nord Polar Night dark
    show: false,
  });

  // Load the built app (dist/index.html)
  const indexPath = app.isPackaged
    ? path.join(process.resourcesPath, "app", "dist", "index.html")
    : path.join(__dirname, "..", "dist", "index.html");

  mainWindow.loadFile(indexPath);

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  // Open external links in default browser, not Electron
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });
}

// ── App lifecycle ───────────────────────────────────────────
app.whenReady().then(() => {
  startBackend();
  // Small delay to let backend start before UI loads
  setTimeout(createWindow, 800);

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (serverProcess) serverProcess.kill();
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  if (serverProcess) serverProcess.kill();
});
