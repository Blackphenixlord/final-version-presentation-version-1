import { useEffect, useRef } from "react";

type Options = {
  enabled: boolean;
  onScan: (value: string) => void;
  minLength?: number;
  maxDelayMs?: number;
};

export function useKeyboardWedgeScan({
  enabled,
  onScan,
  minLength = 6,
  maxDelayMs = 35,
}: Options) {
  const bufRef = useRef("");
  const lastTsRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) return;

    function reset() {
      bufRef.current = "";
      lastTsRef.current = null;
    }

    function onKeyDown(e: KeyboardEvent) {
      const now = performance.now();

      // big pause => new scan
      if (lastTsRef.current != null && now - lastTsRef.current > maxDelayMs) {
        reset();
      }
      lastTsRef.current = now;

      // most wedges end with Enter
      if (e.key === "Enter") {
        const value = bufRef.current.trim();
        reset();
        if (value.length >= minLength) onScan(value);
        return;
      }

      // only accept real characters
      if (e.key.length !== 1) return;

      bufRef.current += e.key;
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled, onScan, minLength, maxDelayMs]);
}
