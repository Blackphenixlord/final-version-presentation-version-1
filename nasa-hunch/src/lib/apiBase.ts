const ENV_API_BASE = import.meta.env.VITE_API_BASE as string | undefined;
const DEFAULT_BASE = "http://desktop-66cuacm.tail0de5a5.ts.net:8080/api";
const STORAGE_KEY = "dslm_api_base";

function readStored(): string | null {
  try { return localStorage.getItem(STORAGE_KEY); } catch { return null; }
}

/** Current API base — reactive at call-time via apiUrl(). */
let _base = ENV_API_BASE ?? readStored() ?? DEFAULT_BASE;

/** Read the current API base. */
export function getApiBase(): string { return _base; }

/** Persist a new API base URL (e.g. "http://192.168.1.50:8080/api"). */
export function setApiBase(url: string) {
  _base = url;
  try { localStorage.setItem(STORAGE_KEY, url); } catch { /* private mode */ }
}

/** Reset to the default relative /api path. */
export function clearApiBase() {
  _base = DEFAULT_BASE;
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* ok */ }
}

/** Backward compat — prefer getApiBase() in new code. */
export const API_BASE = _base;

export function apiUrl(path: string) {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${_base}${p}`;
}
