import React, { createContext, useContext, useEffect, useState } from "react";
import { api } from "../lib/api";
import type { ConfigDTO } from "../lib/api";
import Login from "../screens/Login";

export interface ParamsData { role: string; missionId: string; defaultLocationId: string; organization?: string; uiMode?: string; }

const ParamsContext = createContext<ParamsData | null>(null);
export function useParamsSafe() { return useContext(ParamsContext); }
export function useParamsStrict() { const ctx = useContext(ParamsContext); return ctx ?? null; }

export function ParamsProvider({ children }: { children: React.ReactNode }) {
  const [params, setParams] = useState<ParamsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const mode = (() => {
    try {
      const qs = new URLSearchParams(window.location.search);
      return qs.get("mode") || localStorage.getItem("uiMode");
    } catch {
      return null;
    }
  })();

  useEffect(() => {
    if (!mode) return;
    let cancelled = false;
    async function load() {
      try {
        const cfg: ConfigDTO = await api.getConfig();
        if (!cancelled) {
          if (cfg && cfg.params) setParams(cfg.params);
          else setError("Config response missing .params");
        }
      } catch (err: any) {
        console.error("[ParamsProvider] failed to load config", err);
        if (!cancelled) setError(err?.message || "Failed to load mission config");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [mode]);

  if (!mode) return <Login />;
  if (loading) return <div style={{ color: "#9ca3af", backgroundColor: "#0a0a0a", minHeight: "100vh", padding: "1rem" }}>Booting… requesting mission config…</div>;
  if (error) return <div style={{ color: "red", backgroundColor: "#1a1a1a", minHeight: "100vh", padding: "1rem" }}>Failed to load config: {error}</div>;
  if (!params) return <div style={{ color: "yellow", backgroundColor: "#1a1a1a", minHeight: "100vh", padding: "1rem" }}>No params returned from server.</div>;

  return <ParamsContext.Provider value={params}>{children}</ParamsContext.Provider>;
}
