// Perceptual color core. All harmony + scale math lives in OKLCH, a
// perceptually-uniform space where L = perceived lightness, C = chroma
// (vividness), H = hue in degrees. Rotating H while holding L and C produces
// harmony members that genuinely read as a family — unlike HSL hue rotation,
// where equal steps look unevenly spaced and equal "lightness" drifts wildly
// across hues. culori handles conversion + sRGB gamut clamping.

import { converter, formatHex, clampChroma } from "culori";

export type Oklch = { l: number; c: number; h: number }; // l 0..1, c 0..~0.4, h 0..360

const toOklch = converter("oklch");

export function hexToOklch(hex: string): Oklch {
  const o = toOklch(hex);
  if (!o) return { l: 0, c: 0, h: 0 };
  // culori leaves h undefined for achromatic (grey) colors — default to 0.
  return { l: o.l, c: o.c, h: o.h ?? 0 };
}

// Convert back to hex, clamping into the sRGB gamut on the way out. Many
// (L,C,H) triples — especially high-chroma ones — fall outside sRGB and would
// otherwise produce garbage hexes; clampChroma pulls chroma down just enough
// to land on a displayable color while preserving L and H.
export function oklchToHex({ l, c, h }: Oklch): string {
  const clamped = clampChroma({ mode: "oklch", l, c, h }, "oklch");
  return formatHex(clamped) ?? "#000000";
}

export function rotateHueOklch(o: Oklch, deg: number): Oklch {
  return { ...o, h: ((o.h + deg) % 360 + 360) % 360 };
}

export const rotateHexOklch = (hex: string, deg: number): string =>
  oklchToHex(rotateHueOklch(hexToOklch(hex), deg));

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

export const withOklch = (o: Oklch, patch: Partial<Oklch>): Oklch => ({ ...o, ...patch });

export const clampL = (l: number) => clamp(l, 0, 1);
export const clampC = (c: number) => clamp(c, 0, 0.4);
