import type { HarmonyRule } from "./harmony";

const KEY = "palette-studio:v1";

export type Saved = {
  baseHex: string;
  rule: HarmonyRule;
  fontPairId: string;
};

export function loadSaved(): Saved | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Saved;
  } catch {
    return null;
  }
}

export function saveState(s: Saved) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}
