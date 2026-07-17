// Palette Studio's adapter for the shared brand-core seed (Mechanism 1 of
// docs/KIT-SUITE-CONNECT-PLAN.md). Maps a generic BrandCore — the four facts
// that ride in a ?seed= URL — onto Palette Studio's own reducer State, so the
// tool opens pre-filled with the client's brand color + font instead of the
// blank default. Kept out of the vendored module (which stays tool-agnostic).
import type { BrandCore } from "./opsette-kit-link";
import { FONT_PAIRS } from "./presets";

export type SeedState = {
  baseHex: string;
  fontPairId: string;
};

// Normalize a seed hex to the "#rrggbb" the color picker expects.
function normalizeHex(hex: string): string | null {
  let h = hex.trim();
  if (!h) return null;
  if (!h.startsWith("#")) h = `#${h}`;
  // Expand shorthand #abc → #aabbcc.
  if (/^#[0-9a-fA-F]{3}$/.test(h)) {
    h = `#${h[1]}${h[1]}${h[2]}${h[2]}${h[3]}${h[3]}`;
  }
  return /^#[0-9a-fA-F]{6}$/.test(h) ? h.toLowerCase() : null;
}

// Pick the seed color: prefer a color explicitly marked "primary"/"base",
// otherwise the first color in the list. Palette Studio builds a whole harmony
// from one base hex, so a single color is all it needs.
function pickBaseHex(core: BrandCore): string | null {
  const colors = core.colors ?? [];
  if (colors.length === 0) return null;
  const primary =
    colors.find((c) => c.role === "primary" || c.role === "base") ?? colors[0];
  return normalizeHex(primary.hex);
}

// Match the seed's font to a pairing in the shared library, by id first (exact),
// then by heading family name (a seed from a non-library source). Returns null
// when nothing matches, so the reducer keeps its default font.
function pickFontPairId(core: BrandCore): string | null {
  const f = core.fonts;
  if (!f) return null;
  if (f.id && FONT_PAIRS.some((p) => p.id === f.id)) return f.id;
  if (f.heading) {
    const byHeading = FONT_PAIRS.find(
      (p) => p.heading.toLowerCase() === f.heading!.toLowerCase(),
    );
    if (byHeading) return byHeading.id;
  }
  return null;
}

/**
 * Map a decoded brand core onto a partial Palette Studio state. Returns null
 * when the seed carries nothing Palette can use (no usable color and no
 * matching font), so the caller falls back to the saved/default state.
 */
export function seedToState(core: BrandCore): Partial<SeedState> | null {
  const baseHex = pickBaseHex(core);
  const fontPairId = pickFontPairId(core);
  if (!baseHex && !fontPairId) return null;
  const state: Partial<SeedState> = {};
  if (baseHex) state.baseHex = baseHex;
  if (fontPairId) state.fontPairId = fontPairId;
  return state;
}
