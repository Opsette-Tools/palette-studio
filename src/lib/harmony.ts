import {
  hslToHex,
  withHsl,
  buildScale,
  buildNeutralRamp,
  normalizeHex,
  readableOn,
  contrastRatio,
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
    heading: string;
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
      // Headings share the body ink by default — bigger/bolder, same color — which
      // is how most real sites read. The CTA/brand color stays on buttons & links.
      heading: neutrals[900],
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
  | "heading"
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
  { value: "heading", label: "Heading", hint: "Your titles and section headings." },
  { value: "bodyText", label: "Body text", hint: "Your paragraphs and longer copy." },
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

// Assign roles across a WHOLE list of colors at once so each color gets a
// DISTINCT role — used when we auto-seed from a photo or a pasted hex list.
// suggestRole() alone judges each color in isolation, so two similar colors can
// both land on (say) "Muted text", producing duplicate roles and a confusing kit.
//
// Two stages:
//   1. ASSIGN by fit — score every color for every still-unclaimed role, hand
//      each color the best role no one better-suited has already taken.
//   2. REPAIR by contrast — the assignment above is readability-BLIND, so it
//      happily pairs dark text with a mid-grey card (the Providence-logo bug:
//      body-on-card failed at 2.75:1). Here we check the pairs that actually
//      matter and, when one fails, RESHUFFLE the real logo colors to fix it —
//      never inventing or dropping a color. The classic fix, and the one the
//      user asked for: if the logo has only one workable light surface, let the
//      card reuse the page background and push the leftover grey to a role it
//      passes in (muted text / border). Every original hex survives; nothing is
//      derived. Extra colors beyond the named roles fall back to "Accent".
export function suggestRolesForList(hexes: string[]): CustomRole[] {
  // Priority order we want to fill, best-anchored roles first.
  const ROLE_ORDER: CustomRole[] = [
    "pageBg",
    "bodyText",
    "button",
    "accent",
    "heading",
    "sectionBg",
    "secondaryText",
    "border",
  ];
  // How well a color fits a role, 0..1 — higher is better.
  const fit = (hex: string, role: CustomRole): number => {
    const { l, c } = hexToOklch(hex);
    switch (role) {
      case "pageBg":
        return l; // lightest
      case "sectionBg":
        return l * 0.95; // also light, but yields to pageBg
      case "bodyText":
        return 1 - l; // darkest
      case "heading":
        return (1 - l) * 0.92; // dark, but yields the very darkest to body text
      case "button":
        return c * (l > 0.25 && l < 0.78 ? 1 : 0.4); // colorful mid-tone
      case "accent":
        return c * 0.85; // colorful, secondary to button
      case "secondaryText":
        return (1 - Math.abs(l - 0.5)) * (1 - Math.min(c / 0.1, 1)); // muted mid grey
      case "border":
        return 1 - Math.abs(l - 0.7); // light-ish neutral
    }
  };

  const result: (CustomRole | null)[] = hexes.map(() => null);
  const assignedColors = new Set<number>();

  // Stage 1 — greedily fill roles in priority order: each role grabs the best free color.
  for (const role of ROLE_ORDER) {
    let bestIdx = -1;
    let bestScore = -Infinity;
    hexes.forEach((hex, i) => {
      if (assignedColors.has(i)) return;
      const score = fit(hex, role);
      if (score > bestScore) {
        bestScore = score;
        bestIdx = i;
      }
    });
    if (bestIdx >= 0) {
      result[bestIdx] = role;
      assignedColors.add(bestIdx);
    }
    if (assignedColors.size === hexes.length) break;
  }

  // Any leftover colors (more than the named roles) become accents.
  const roles = result.map((r) => r ?? "accent");

  // Stage 2 — contrast repair. Reshuffle only; never invent or drop a color.
  return repairRolesForContrast(hexes, roles);
}

// Minimum WCAG contrast for a text-on-surface pair to count as "readable" here.
// 4.5:1 is AA for normal body copy — the bar the accessibility panel checks.
const MIN_TEXT_CONTRAST = 4.5;

// Given per-color role assignments, fix the pairs that would render unreadable.
// Strategy, in order of preference (each keeps every color, invents nothing):
//   a. If TEXT-on-CARD fails, first try reusing the page background as the card
//      (the logo simply has one good surface) and re-home the old card color to
//      the best role it still passes in — muted text, border, else accent.
//   b. If TEXT-on-PAGE fails outright, swap which color plays body text for the
//      darkest/most-contrasting color available against the page.
// Anything we can't make pass by reshuffling is left as-is (rare — and the live
// accessibility panel still flags it), because the alternative is dropping or
// fabricating a color, which the product explicitly must not do.
function repairRolesForContrast(hexes: string[], roles: CustomRole[]): CustomRole[] {
  const out = [...roles];
  const idxOf = (role: CustomRole): number => out.indexOf(role);
  const hexOf = (role: CustomRole): string | undefined => {
    const i = idxOf(role);
    return i >= 0 ? hexes[i] : undefined;
  };

  const pageBg = hexOf("pageBg");
  const text = hexOf("bodyText");

  // (b) Body text unreadable on the page background → repoint body text to the
  // color with the strongest contrast against the page, and let the displaced
  // color take over whatever role body text was doing (they swap).
  if (pageBg && text && contrastRatio(pageBg, text) < MIN_TEXT_CONTRAST) {
    let bestIdx = -1;
    let bestRatio = contrastRatio(pageBg, text);
    hexes.forEach((h, i) => {
      const r = contrastRatio(pageBg, h);
      if (r > bestRatio) {
        bestRatio = r;
        bestIdx = i;
      }
    });
    if (bestIdx >= 0) {
      const textIdx = idxOf("bodyText");
      // Swap roles so no role is lost and no color is dropped.
      const displaced = out[bestIdx];
      out[bestIdx] = "bodyText";
      if (textIdx >= 0) out[textIdx] = displaced;
    }
  }

  // (a) Text unreadable on the CARD background → the card is the wrong surface.
  // Reuse the page background for cards (one-surface logo) and re-home the old
  // card color to the best role it still passes in.
  const cardIdx = idxOf("sectionBg");
  const bodyHex = hexOf("bodyText");
  const cardHex = cardIdx >= 0 ? hexes[cardIdx] : undefined;
  const pageBg2 = hexOf("pageBg"); // may have changed above
  if (
    cardIdx >= 0 &&
    cardHex &&
    bodyHex &&
    pageBg2 &&
    contrastRatio(cardHex, bodyHex) < MIN_TEXT_CONTRAST &&
    contrastRatio(pageBg2, bodyHex) >= MIN_TEXT_CONTRAST
  ) {
    // Re-home the color currently on the card to a role it fits AND passes.
    // Prefer muted text (needs contrast on the page), then border (decorative,
    // no hard contrast bar), else accent (always safe to hold a color).
    const { l, c } = hexToOklch(cardHex);
    const passesAsMuted =
      contrastRatio(pageBg2, cardHex) >= 3 && c < 0.08 && l > 0.3 && l < 0.75;
    const rehome: CustomRole = passesAsMuted
      ? "secondaryText"
      : c < 0.06
        ? "border"
        : "accent";
    out[cardIdx] = rehome;
    // The card role itself now collapses onto the page background — represented
    // by simply NOT assigning a distinct card color. buildCustomPalette already
    // falls back sectionBg → pageBg when no card color is assigned, so cards
    // render on the page surface and read correctly. (We free the role rather
    // than duplicate the pageBg color into a second row.)
  }

  return out;
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
  // Headings default to the body ink unless she explicitly assigns a Heading color.
  const heading = byRole("heading") ?? text;
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
      heading,
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
