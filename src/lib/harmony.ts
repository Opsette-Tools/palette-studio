import { hslToHex, withHsl, buildScale, buildNeutralRamp, type Scale } from "./color";
import { hexToOklch, oklchToHex, rotateHueOklch, withOklch, clampL, clampC, type Oklch } from "./oklch";

export type HarmonyRule =
  | "exact"
  | "complementary"
  | "analogous"
  | "triadic"
  | "split"
  | "tetradic"
  | "monochromatic";

export const HARMONY_OPTIONS: { value: HarmonyRule; label: string; caption: string }[] = [
  { value: "exact", label: "My exact color", caption: "Builds the whole palette around the color you picked — lighter and darker shades of it. Vibrancy and temperature still tune it." },
  { value: "complementary", label: "Complementary", caption: "Opposites on the wheel — high contrast and energetic." },
  { value: "analogous", label: "Analogous", caption: "Neighbors on the wheel — calm and cohesive." },
  { value: "triadic", label: "Triadic", caption: "Three evenly-spaced hues — playful and balanced." },
  { value: "split", label: "Split-complementary", caption: "Softer than complementary, still vibrant." },
  { value: "tetradic", label: "Tetradic", caption: "Four hues in two pairs — rich and versatile." },
  { value: "monochromatic", label: "Monochromatic", caption: "One hue, different lightness — minimal and refined." },
];

// Vibrancy scales the base chroma before harmonizing — one control with a big
// visual range that fixes the "every palette feels mid-tone" problem.
export type Vibrancy = "muted" | "balanced" | "vibrant";

export const VIBRANCY_OPTIONS: { value: Vibrancy; label: string }[] = [
  { value: "muted", label: "Muted" },
  { value: "balanced", label: "Balanced" },
  { value: "vibrant", label: "Vibrant" },
];

const VIBRANCY_CHROMA: Record<Vibrancy, number> = {
  muted: 0.55,
  balanced: 1.0,
  vibrant: 1.5,
};

// Temperature nudges the base hue warm or cool before harmonizing, so the whole
// family tilts together and stays coherent. Applied in OKLCH degrees; a modest
// shift reads clearly without breaking the harmony relationships.
export type Temperature = "cool" | "neutral" | "warm";

export const TEMPERATURE_OPTIONS: { value: Temperature; label: string }[] = [
  { value: "cool", label: "Cooler" },
  { value: "neutral", label: "Neutral" },
  { value: "warm", label: "Warmer" },
];

// Positive degrees walk hue toward warm (reds/oranges ~30°), negative toward
// cool (blues ~250°).
const TEMPERATURE_SHIFT: Record<Temperature, number> = {
  cool: -14,
  neutral: 0,
  warm: 14,
};

export type HarmonyResult = {
  primary: string;
  secondary: string;
  accent: string;
  accent2?: string; // present only for tetradic (4th member)
};

// Turn the picked color into the family's anchor. The guiding principle: the
// user must SEE their color in the result. So we keep their lightness and chroma
// as-is wherever they're usable, and only pull them back when the color is so
// extreme it can't function as a primary (near-white, near-black, near-grey).
// This is a safety RAIL, not a normalizer — a vivid mid-bright pick like a bright
// yellow passes through essentially untouched, so rotated companions read as
// "their color's opposite/neighbors" rather than a substitute's.
function primaryOklch(baseHex: string, vibrancy: Vibrancy, temperature: Temperature): Oklch {
  const o = hexToOklch(baseHex);
  // Wide usable band: only rescue the unusable extremes. Most picks pass through.
  const l = clampL(Math.max(0.32, Math.min(0.82, o.l || 0.55)));
  // Preserve the picked chroma; only lift a near-grey to a usable baseline so it
  // still yields a colorful family. Vibrancy then scales from the picked chroma.
  const baseC = Math.max(0.05, o.c || 0.05);
  const c = clampC(baseC * VIBRANCY_CHROMA[vibrancy]);
  // Tilt the whole family warm or cool by nudging the anchor hue.
  const h = ((o.h + TEMPERATURE_SHIFT[temperature]) % 360 + 360) % 360;
  return { l, c, h };
}

export function harmonize(
  baseHex: string,
  rule: HarmonyRule,
  vibrancy: Vibrancy = "balanced",
  temperature: Temperature = "neutral",
): HarmonyResult {
  const base = primaryOklch(baseHex, vibrancy, temperature);
  const primary = oklchToHex(base);
  const rot = (deg: number) => oklchToHex(rotateHueOklch(base, deg));

  switch (rule) {
    case "exact": {
      // Single-hue family anchored to the user's color. Unlike the old frozen
      // version, this rides the live `base` anchor, so vibrancy (chroma) and
      // temperature (hue tilt) move it like every other rule — the user sees
      // their color influencing the palette and responding to the controls.
      const lighter = withOklch(base, { l: clampL(base.l + 0.16), c: clampC(base.c * 0.78) });
      const darker = withOklch(base, { l: clampL(base.l - 0.18), c: clampC(base.c * 1.04) });
      return { primary, secondary: oklchToHex(lighter), accent: oklchToHex(darker) };
    }
    case "complementary": {
      // Fix the old collapse (secondary === accent). secondary is the true
      // +180 complement; accent is a third, distinct "bridge" color — the same
      // complement pushed lighter and slightly less saturated so it works as a
      // soft accent rather than a duplicate of secondary.
      const comp = rotateHueOklch(base, 180);
      const bridge = withOklch(comp, {
        l: clampL(comp.l + 0.12),
        c: clampC(comp.c * 0.72),
      });
      return { primary, secondary: oklchToHex(comp), accent: oklchToHex(bridge) };
    }
    case "analogous":
      return { primary, secondary: rot(-30), accent: rot(30) };
    case "triadic":
      return { primary, secondary: rot(120), accent: rot(-120) };
    case "split":
      return { primary, secondary: rot(150), accent: rot(210) };
    case "tetradic":
      return { primary, secondary: rot(90), accent: rot(180), accent2: rot(270) };
    case "monochromatic": {
      // Same hue, step perceived lightness in OKLCH (not arbitrary HSL S/L).
      const lighter = withOklch(base, { l: clampL(base.l + 0.18), c: clampC(base.c * 0.85) });
      const darker = withOklch(base, { l: clampL(base.l - 0.18), c: clampC(base.c * 1.05) });
      return { primary, secondary: oklchToHex(lighter), accent: oklchToHex(darker) };
    }
  }
}

export type Palette = {
  base: string;
  rule: HarmonyRule;
  vibrancy: Vibrancy;
  temperature: Temperature;
  primary: string;
  secondary: string;
  accent: string;
  accent2?: string;
  neutrals: Scale;
  primaryScale: Scale;
  accentScale: Scale;
  roles: {
    background: string;
    surface: string;
    text: string;
    mutedText: string;
    border: string;
  };
};

export function buildPalette(
  base: string,
  rule: HarmonyRule,
  vibrancy: Vibrancy = "balanced",
  temperature: Temperature = "neutral",
): Palette {
  const { primary, secondary, accent, accent2 } = harmonize(base, rule, vibrancy, temperature);
  const neutrals = buildNeutralRamp(primary);
  return {
    base,
    rule,
    vibrancy,
    temperature,
    primary,
    secondary,
    accent,
    accent2,
    neutrals,
    primaryScale: buildScale(primary),
    accentScale: buildScale(accent),
    roles: {
      background: neutrals[50],
      surface: "#ffffff",
      text: neutrals[900],
      mutedText: neutrals[600],
      border: neutrals[200],
    },
  };
}

// Constrained random base color for "Surprise me".
export function randomBase(): string {
  const h = Math.floor(Math.random() * 360);
  const s = 0.45 + Math.random() * 0.3;
  const l = 0.4 + Math.random() * 0.15;
  return hslToHex({ h, s, l });
}

export { withHsl };
