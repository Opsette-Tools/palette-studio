import { hexToHsl, hslToHex, rotateHue, withHsl, buildScale, buildNeutralRamp, type Scale } from "./color";

export type HarmonyRule =
  | "complementary"
  | "analogous"
  | "triadic"
  | "split"
  | "monochromatic";

export const HARMONY_OPTIONS: { value: HarmonyRule; label: string; caption: string }[] = [
  { value: "complementary", label: "Complementary", caption: "Opposites on the wheel — high contrast and energetic." },
  { value: "analogous", label: "Analogous", caption: "Neighbors on the wheel — calm and cohesive." },
  { value: "triadic", label: "Triadic", caption: "Three evenly-spaced hues — playful and balanced." },
  { value: "split", label: "Split-complementary", caption: "Softer than complementary, still vibrant." },
  { value: "monochromatic", label: "Monochromatic", caption: "One hue, different lightness — minimal and refined." },
];

export type HarmonyResult = {
  primary: string;
  secondary: string;
  accent: string;
};

export function harmonize(baseHex: string, rule: HarmonyRule): HarmonyResult {
  const hsl = hexToHsl(baseHex);
  // Nudge base toward usable saturation/lightness for UI primary.
  const primary = hslToHex({
    h: hsl.h,
    s: Math.max(0.35, Math.min(0.75, hsl.s || 0.5)),
    l: Math.max(0.3, Math.min(0.55, hsl.l || 0.45)),
  });
  switch (rule) {
    case "complementary":
      return { primary, secondary: rotateHue(primary, 180), accent: rotateHue(primary, 180) };
    case "analogous":
      return { primary, secondary: rotateHue(primary, -30), accent: rotateHue(primary, 30) };
    case "triadic":
      return { primary, secondary: rotateHue(primary, 120), accent: rotateHue(primary, -120) };
    case "split":
      return { primary, secondary: rotateHue(primary, 150), accent: rotateHue(primary, 210) };
    case "monochromatic": {
      const h = hexToHsl(primary).h;
      return {
        primary,
        secondary: hslToHex({ h, s: 0.5, l: 0.65 }),
        accent: hslToHex({ h, s: 0.7, l: 0.4 }),
      };
    }
  }
}

export type Palette = {
  base: string;
  rule: HarmonyRule;
  primary: string;
  secondary: string;
  accent: string;
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

export function buildPalette(base: string, rule: HarmonyRule): Palette {
  const { primary, secondary, accent } = harmonize(base, rule);
  const neutrals = buildNeutralRamp(primary);
  return {
    base,
    rule,
    primary,
    secondary,
    accent,
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
