import { Component, StrictMode } from "react";
import type { ReactNode, ErrorInfo } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./styles/global.css";
import { ParamsProvider } from "./lib/ParamsContext";
import { ThemeProvider } from "./lib/theme";

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state: { error: Error | null } = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error("[ErrorBoundary]", error, info); }
  render() {
    if (this.state.error) {
      return (
        <div style={{ minHeight: "100vh", background: "#1a1a2e", color: "#e6edf3", fontFamily: "monospace", padding: "2rem" }}>
          <h2 style={{ color: "#bf616a", margin: "0 0 1rem" }}>React crashed</h2>
          <pre style={{ whiteSpace: "pre-wrap", fontSize: "0.85rem", color: "#d08770" }}>{this.state.error.message}{"\n"}{this.state.error.stack}</pre>
          <button onClick={() => { localStorage.clear(); sessionStorage.clear(); window.location.href = "/"; }}
            style={{ marginTop: "1.5rem", padding: "0.6rem 1.2rem", background: "#d08770", color: "#fff", border: "none", borderRadius: "0.5rem", cursor: "pointer", fontSize: "0.9rem" }}>
            Clear session &amp; reload
          </button>
        </div>
      );
    }
    return this.state.error ? null : this.props.children;
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <ParamsProvider>
          <App />
        </ParamsProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>
);