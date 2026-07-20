import type {
  HarmonyRule,
  Vibrancy,
  Temperature,
  RoleOverrides,
  CustomColor,
} from "./harmony";

const KEY = "palette-studio:v1";

export type Saved = {
  baseHex: string;
  rule: HarmonyRule;
  vibrancy: Vibrancy;
  temperature: Temperature;
  fontPairId: string;
  roleOverrides: RoleOverrides;
  // The "My own colors" list. Persisted so a refresh never wipes a hand-typed
  // palette — a non-empty list also means the app reopens IN custom mode. Empty
  // = a generated palette (the baseHex/rule/... fields drive it instead).
  customColors: CustomColor[];
};

export function loadSaved(): Saved | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Saved>;
    if (!parsed.baseHex || !parsed.rule || !parsed.fontPairId) return null;
    // vibrancy/temperature/roleOverrides/customColors were added over time —
    // default older saves so a load never leaves a field undefined.
    return {
      vibrancy: "balanced",
      temperature: "neutral",
      roleOverrides: {},
      customColors: [],
      ...parsed,
    } as Saved;
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
