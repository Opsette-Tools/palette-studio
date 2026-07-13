export type Vibe = { id: string; label: string; description: string; hex: string };

export const VIBES: Vibe[] = [
  { id: "calm", label: "Calm & trustworthy", description: "Cool blues — good for finance, health, SaaS.", hex: "#2f6f8f" },
  { id: "bold", label: "Bold & energetic", description: "High-saturation reds — startups, fitness, food.", hex: "#e2483d" },
  { id: "warm", label: "Warm & friendly", description: "Sunset orange — community, hospitality.", hex: "#e8884a" },
  { id: "elegant", label: "Elegant & premium", description: "Deep plum — fashion, luxury, editorial.", hex: "#3a2f4f" },
  { id: "fresh", label: "Fresh & natural", description: "Garden greens — wellness, food, eco.", hex: "#4f8f5a" },
  { id: "professional", label: "Professional", description: "Steady forest green — agencies, consulting.", hex: "#2f4f46" },
];

// ─────────────────────────────────────────────────────────────────────────
//  FONTS — now derived from the shared Opsette font library (single source of
//  truth). See `src/lib/shared-fonts.ts` (vendored from `_shared/fonts/`) and
//  the family-wide spec `FONTS_AND_PAIRING.md`. This module keeps the flat
//  `FontPair` shape Palette Studio's components expect, but every pair,
//  weight, and Google Fonts href now comes from the library — no more local
//  font list to drift out of sync with Brand Board / Icon Kit.
// ─────────────────────────────────────────────────────────────────────────
import {
  FONT_PAIRINGS,
  cssFamily,
  googleHref,
  pairingLabel,
  getPairing,
  type FontPairing,
} from "./shared-fonts";

// Re-export the library's heading-first pairing API so components can build a
// "choose a heading → suggest a body" picker without importing shared-fonts
// directly.
export {
  suggestBodyFonts,
  defaultBodyFor,
  HEADING_FONTS,
  loadPairing,
  loadPairings,
  type BodySuggestion,
  type HeadingOption,
} from "./shared-fonts";

export type FontPair = {
  id: string;
  label: string;
  heading: string;
  body: string;
  headingFamily: string;
  bodyFamily: string;
  googleHref: string;
};

/** Adapt a shared-library pairing to the flat FontPair shape used in-app. */
export function toFontPair(p: FontPairing): FontPair {
  return {
    id: p.id,
    label: pairingLabel(p),
    heading: p.heading.family,
    body: p.body.family,
    headingFamily: cssFamily(p.heading),
    bodyFamily: cssFamily(p.body),
    googleHref: googleHref(p),
  };
}

export const FONT_PAIRS: FontPair[] = FONT_PAIRINGS.map(toFontPair);

/** Resolve a saved font id to a FontPair (falls back to the first pair). */
export function getFontPair(id: string): FontPair {
  return toFontPair(getPairing(id));
}

const loaded = new Set<string>();
export function loadFontPair(pair: FontPair) {
  if (typeof document === "undefined" || loaded.has(pair.id)) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = pair.googleHref;
  document.head.appendChild(link);
  loaded.add(pair.id);
}
