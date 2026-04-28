// src/lib/api.ts

import { apiUrl } from "./apiBase";

function currentMode(): string | null {
  try {
    const qs = new URLSearchParams(window.location.search);
    return qs.get("mode") || localStorage.getItem("uiMode");
  } catch {
    return null;
  }
}

/* ===================== DTO types ===================== */
export interface ItemDTO {
  id: string;
  sku: string;
  name: string;
  description?: string;
  safetyStock?: number;
  reorderPoint?: number;

  // computed by server
  locQty?: number;
  total?: number;
  status?: string;
}

export interface LocationDTO {
  id: string;
  code: string;
  description?: string;
}

export interface StockDTO {
  itemId: string;
  locationId: string;
  qty: number;
  expiresAt?: string | null;
}

export interface LogDTO {
  id: string;
  timestamp: string;
  itemId: string;
  locationId: string;
  mode: "IN" | "OUT";
  qty: number;
  actor?: string;
  reason?: string;
  workOrder?: string;
}

export interface ConfigDTO {
  ok: boolean;
  params: {
    role: string;
    missionId: string;
    defaultLocationId: string;
    organization?: string;
    uiMode?: string;
  };
}

export type RFIDMode = "IN" | "OUT";

export interface RFIDScanResponse {
  ok: boolean;
  action?: "CHECKIN" | "CHECKOUT";
  itemId?: string;
  itemSku?: string;
  locationId?: string;
  cardHex?: string;
  qty?: number;
  newQty?: number;
  status?: string;
  log?: any;
  error?: string;
}

export interface RFIDUnknownRow {
  id: string;
  timestamp: string;
  cardHex: string;
  mode: RFIDMode;
  qty: number;
  actor: string;
  locationId: string | null;
  error: string;
}

export interface RFIDMappingRow {
  cardHex: string;
  itemId: string;
  lastLocationId: string | null;
}

/* ===================== HTTP helpers ===================== */
async function getJSON<T>(path: string): Promise<T> {
  const res = await fetch(apiUrl(path));
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function postJSON<T>(path: string, body: any): Promise<T> {
  const res = await fetch(apiUrl(path), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });

  if (!res.ok) {
    let msg = "";
    try {
      const data = await res.json();
      msg = data?.error || data?.message || JSON.stringify(data);
    } catch {
      msg = await res.text();
    }
    throw new Error(msg || `HTTP_${res.status}`);
  }
  return res.json();
}

/* ===================== API surface ===================== */
export const api = {
  items: () => getJSON<ItemDTO[]>("/items"),
  locations: () => getJSON<LocationDTO[]>("/locations"),
  stocks: () => getJSON<StockDTO[]>("/stocks"),
  logs: () => getJSON<LogDTO[]>("/logs"),
  config: () => {
    const m = currentMode();
    return getJSON<ConfigDTO>(`/config${m ? `?mode=${encodeURIComponent(m)}` : ""}`);
  },
  checkout: (body: any) => postJSON("/checkout", body),
  checkin: (body: any) => postJSON("/checkin", body),

  // aliases
  getItems: () => getJSON<ItemDTO[]>("/items"),
  getLocations: () => getJSON<LocationDTO[]>("/locations"),
  getStocks: () => getJSON<StockDTO[]>("/stocks"),
  getLogs: () => getJSON<LogDTO[]>("/logs"),
  getConfig: () => {
    const m = currentMode();
    return getJSON<ConfigDTO>(`/config${m ? `?mode=${encodeURIComponent(m)}` : ""}`);
  },
};

/* ===================== RFID helpers ===================== */
export async function rfidScan(body: {
  cardHex: string;
  mode: RFIDMode;
  qty?: number;
  actor?: string;
  reason?: string;
  workOrder?: string;
  locationId?: string;
}): Promise<RFIDScanResponse> {
  return postJSON<RFIDScanResponse>("/rfid/scan", body);
}

export async function rfidMapTag(body: {
  cardHex: string;
  itemId: string;
  locationId: string;
}): Promise<{ ok: boolean; cardHex: string; itemId: string; locationId: string }> {
  return postJSON("/rfid/map", body);
}

export async function rfidUnknown(): Promise<RFIDUnknownRow[]> {
  return getJSON<RFIDUnknownRow[]>("/rfid/unknown");
}

export async function rfidMappings(): Promise<RFIDMappingRow[]> {
  return getJSON<RFIDMappingRow[]>("/rfid/mappings");
}

export async function rfidMove(body: {
  cardHex: string;
  locationId: string;
}): Promise<{ ok: boolean; cardHex: string; locationId: string }> {
  return postJSON("/rfid/move", body);
}
