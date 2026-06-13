import type { HarmonyRule, Vibrancy } from "./harmony";

const KEY = "palette-studio:v1";

export type Saved = {
  baseHex: string;
  rule: HarmonyRule;
  vibrancy: Vibrancy;
  fontPairId: string;
};

export function loadSaved(): Saved | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Saved>;
    if (!parsed.baseHex || !parsed.rule || !parsed.fontPairId) return null;
    // vibrancy was added later — default older saves to "balanced".
    return { vibrancy: "balanced", ...parsed } as Saved;
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
