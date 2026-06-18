import {
  hslToHex,
  withHsl,
  buildScale,
  buildNeutralRamp,
  normalizeHex,
  readableOn,
  type Scale,
} from "./color";
import {
  hexToOklch,
  oklchToHex,
  rotateHueOklch,
  withOklch,
  clampL,
  clampC,
  type Oklch,
} from "./oklch";

export type HarmonyRule =
  | "exact"
  | "complementary"
  | "analogous"
  | "triadic"
  | "split"
  | "tetradic"
  | "monochromatic"
  | "custom";

export const HARMONY_OPTIONS: { value: HarmonyRule; label: string; caption: string }[] = [
  {
    value: "exact",
    label: "My exact color",
    caption:
      "Builds the whole palette around the color you picked — lighter and darker shades of it. Vibrancy and temperature still tune it.",
  },
  {
    value: "complementary",
    label: "Complementary",
    caption: "Opposites on the wheel — high contrast and energetic.",
  },
  {
    value: "analogous",
    label: "Analogous",
    caption: "Neighbors on the wheel — calm and cohesive.",
  },
  {
    value: "triadic",
    label: "Triadic",
    caption: "Three evenly-spaced hues — playful and balanced.",
  },
  {
    value: "split",
    label: "Split-complementary",
    caption: "Softer than complementary, still vibrant.",
  },
  { value: "tetradic", label: "Tetradic", caption: "Four hues in two pairs — rich and versatile." },
  {
    value: "monochromatic",
    label: "Monochromatic",
    caption: "One hue, different lightness — minimal and refined.",
  },
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
  const h = (((o.h + TEMPERATURE_SHIFT[temperature]) % 360) + 360) % 360;
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
    // "custom" never reaches harmonize via the generated path (buildCustomPalette
    // owns it), but sharing the monochromatic body means a stray single-color
    // custom input still falls back to a sensible "shades of your one color" set.
    case "monochromatic":
    case "custom": {
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
  /** Present only for "My own colors" palettes — the exact colors the user
   *  supplied, with their assigned role and optional custom name. When set, the
   *  palette grid and brand kit show ONLY these (no derived swatches). */
  custom?: CustomColor[];
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

// The role each supplied color can be assigned to, in PLAIN LANGUAGE that matches
// how people actually label their own colors ("page background", "buttons") —
// not design-system jargon. Each maps onto an internal Palette key (see
// buildCustomPalette) so the grid, contrast report, preview, brand kit, and
// export all keep working with no derivation.
export type CustomRole =
  | "pageBg"
  | "sectionBg"
  | "bodyText"
  | "button"
  | "accent"
  | "secondaryText"
  | "border";

export type CustomColor = {
  hex: string;
  role: CustomRole;
  /** User's own label for this color, e.g. "Paper" — optional. */
  name?: string;
};

export const CUSTOM_ROLE_OPTIONS: { value: CustomRole; label: string; hint: string }[] = [
  {
    value: "button",
    label: "Buttons / CTA",
    hint: "Your main buttons, calls-to-action, headings, and links.",
  },
  { value: "accent", label: "Accent", hint: "Highlights, badges, and small details." },
  { value: "pageBg", label: "Page background", hint: "The color behind your whole page." },
  {
    value: "sectionBg",
    label: "Card background",
    hint: "Cards and panels that sit on top of the page.",
  },
  { value: "bodyText", label: "Body text", hint: "Your paragraphs and headings." },
  { value: "secondaryText", label: "Muted text", hint: "Captions and quieter labels." },
  { value: "border", label: "Border", hint: "Lines, dividers, and input outlines." },
];

// Suggest a default role for a color purely from its lightness/chroma, so the
// rows start with a sensible guess the user can override. Lightest → page
// background, next-lightest → section background, darkest → body text, colorful
// mid-tones → buttons then accent, low-chroma mid → secondary text.
export function suggestRole(hex: string, index: number): CustomRole {
  const { l, c } = hexToOklch(hex);
  if (l >= 0.9) return index === 0 ? "pageBg" : "sectionBg";
  if (l <= 0.28) return "bodyText";
  if (c >= 0.05) return index <= 3 ? "button" : "accent";
  return "secondaryText";
}

// Build a palette from colors the user assigns to roles directly. We show ONLY
// the colors she typed — nothing is invented. Every role that drives the app
// (primary/secondary/accent + the roles map) is filled from her assignments;
// the scale strips are built from her primary/accent so the export stays
// complete, but no extra *swatches* are conjured. Any role she leaves unassigned
// falls back to a readable default derived from the colors she DID give, never a
// random hue — so a 2-color palette still renders legible text and surfaces.
export function buildCustomPalette(colors: CustomColor[]): Palette {
  const cleaned = colors
    .filter((c) => /^#[0-9a-fA-F]{6}$/.test(normalizeHex(c.hex)))
    .map((c) => ({ ...c, hex: normalizeHex(c.hex) }));

  // First color assigned to each role wins; later duplicates are ignored.
  const byRole = (role: CustomRole): string | undefined =>
    cleaned.find((c) => c.role === role)?.hex;

  // Sort the supplied colors by lightness to pick smart fallbacks for any role
  // the user didn't explicitly assign.
  const byLight = [...cleaned].sort((a, b) => hexToOklch(a.hex).l - hexToOklch(b.hex).l);
  const lightest = byLight[byLight.length - 1]?.hex ?? "#ffffff";
  const darkest = byLight[0]?.hex ?? "#111111";

  // Map the plain-language roles onto the internal Palette keys the whole app
  // reads. "Buttons / CTA" is the app's `primary` (it's what drives the button
  // preview + the white/dark-on-button contrast check).
  const background = byRole("pageBg") ?? lightest;
  const surface = byRole("sectionBg") ?? background;
  const text = byRole("bodyText") ?? (readableOn(background) === "#ffffff" ? "#ffffff" : darkest);
  const button = byRole("button") ?? byRole("accent") ?? darkest;
  const accent = byRole("accent") ?? button;

  return {
    base: button,
    rule: "custom",
    vibrancy: "balanced",
    temperature: "neutral",
    primary: button,
    // The "Secondary" button in previews is an outline of the button color, so
    // internal `secondary` just tracks the button color.
    secondary: button,
    accent,
    accent2: undefined,
    // Scales/neutrals power the export and brand-kit ramps; they're built from
    // the user's own button/accent colors so they stay faithful to her palette.
    neutrals: buildNeutralRamp(button),
    primaryScale: buildScale(button),
    accentScale: buildScale(accent),
    roles: {
      background,
      surface,
      text,
      // Secondary text falls back to a readable softer tone, never an invented hue.
      mutedText:
        byRole("secondaryText") ?? (readableOn(background) === "#ffffff" ? "#cbd5e1" : "#64748b"),
      border: byRole("border") ?? (readableOn(background) === "#ffffff" ? "#334155" : "#e2e8f0"),
    },
    custom: cleaned,
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
