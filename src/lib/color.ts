// Pure color math: HSL conversions, hue rotation, WCAG contrast.
// Scale building is done perceptually in OKLCH — see oklch.ts.

import { hexToOklch, oklchToHex } from "./oklch";

export type RGB = { r: number; g: number; b: number };
export type HSL = { h: number; s: number; l: number };

const clamp = (n: number, min = 0, max = 1) => Math.max(min, Math.min(max, n));

export function normalizeHex(input: string): string {
  let h = input.trim().replace(/^#/, "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return "#000000";
  return "#" + h.toLowerCase();
}

export function hexToRgb(hex: string): RGB {
  const h = normalizeHex(hex).slice(1);
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

export function rgbToHex({ r, g, b }: RGB): string {
  const to = (n: number) =>
    Math.round(clamp(n, 0, 255)).toString(16).padStart(2, "0");
  return "#" + to(r) + to(g) + to(b);
}

export function rgbToHsl({ r, g, b }: RGB): HSL {
  const R = r / 255, G = g / 255, B = b / 255;
  const max = Math.max(R, G, B), min = Math.min(R, G, B);
  const l = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case R: h = (G - B) / d + (G < B ? 6 : 0); break;
      case G: h = (B - R) / d + 2; break;
      case B: h = (R - G) / d + 4; break;
    }
    h *= 60;
  }
  return { h, s, l };
}

export function hslToRgb({ h, s, l }: HSL): RGB {
  const H = ((h % 360) + 360) % 360 / 360;
  const S = clamp(s);
  const L = clamp(l);
  if (S === 0) {
    const v = Math.round(L * 255);
    return { r: v, g: v, b: v };
  }
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const q = L < 0.5 ? L * (1 + S) : L + S - L * S;
  const p = 2 * L - q;
  return {
    r: Math.round(hue2rgb(p, q, H + 1 / 3) * 255),
    g: Math.round(hue2rgb(p, q, H) * 255),
    b: Math.round(hue2rgb(p, q, H - 1 / 3) * 255),
  };
}

export const hexToHsl = (hex: string) => rgbToHsl(hexToRgb(hex));
export const hslToHex = (hsl: HSL) => rgbToHex(hslToRgb(hsl));

export function rotateHue(hex: string, degrees: number): string {
  const hsl = hexToHsl(hex);
  return hslToHex({ ...hsl, h: hsl.h + degrees });
}

export function withHsl(hex: string, patch: Partial<HSL>): string {
  return hslToHex({ ...hexToHsl(hex), ...patch });
}

// 50-900 tint/shade scale. Stops are walked along OKLCH lightness (perceptually
// even), holding the brand hue constant. Chroma is tapered toward the extremes
// so the lightest tints don't read as washed-neon and the darkest shades don't
// turn muddy — the multiplier curve is what gives Radix/Tailwind ramps their
// professional, "designed" feel.
const SCALE_STOPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900] as const;
// Perceived lightness per stop, in OKLCH L (0..1).
const SCALE_OKL = [0.97, 0.93, 0.86, 0.78, 0.70, 0.62, 0.53, 0.44, 0.34, 0.25];
// Chroma multiplier per stop — full vividness through the mid stops, eased off
// at the very light and very dark ends.
const SCALE_C_TAPER = [0.35, 0.5, 0.72, 0.88, 0.97, 1.0, 0.96, 0.86, 0.7, 0.55];

export type Scale = Record<(typeof SCALE_STOPS)[number], string>;

// The mid (500) stop anchors chroma for the whole ramp. We give it a healthy
// baseline so even a desaturated input still yields a usable, colorful scale.
function scaleBaseChroma(c: number): number {
  return Math.max(0.08, Math.min(0.22, c));
}

export function buildScale(hex: string): Scale {
  const { h, c } = hexToOklch(hex);
  const baseC = scaleBaseChroma(c);
  const out = {} as Scale;
  SCALE_STOPS.forEach((stop, i) => {
    out[stop] = oklchToHex({ l: SCALE_OKL[i], c: baseC * SCALE_C_TAPER[i], h });
  });
  return out;
}

const NEUTRAL_OKL = [0.985, 0.96, 0.92, 0.85, 0.74, 0.62, 0.5, 0.39, 0.28, 0.18];

// Near-grey ramp carrying just a hint of the brand hue, so neutrals feel like
// they belong to the palette rather than being flat greys.
export function buildNeutralRamp(primaryHex: string): Scale {
  const { h } = hexToOklch(primaryHex);
  const out = {} as Scale;
  SCALE_STOPS.forEach((stop, i) => {
    out[stop] = oklchToHex({ l: NEUTRAL_OKL[i], c: 0.008, h });
  });
  return out;
}

// WCAG relative luminance
function channel(c: number) {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}
export function relativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrastRatio(a: string, b: string): number {
  const L1 = relativeLuminance(a);
  const L2 = relativeLuminance(b);
  const [hi, lo] = L1 > L2 ? [L1, L2] : [L2, L1];
  return (hi + 0.05) / (lo + 0.05);
}

export type WcagLevel = "AAA" | "AA" | "AA Large" | "Fail";
export function wcagLevel(ratio: number, large = false): WcagLevel {
  if (ratio >= 7) return "AAA";
  if (ratio >= 4.5) return "AA";
  if (ratio >= 3 && large) return "AA Large";
  return "Fail";
}

// Pick readable text color (black or white) for a given background.
export function readableOn(bg: string): string {
  return contrastRatio(bg, "#ffffff") >= contrastRatio(bg, "#111111")
    ? "#ffffff"
    : "#111111";
}
