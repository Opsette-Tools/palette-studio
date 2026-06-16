// Extract colors from a user-uploaded photo, entirely client-side.
// We draw the image to an offscreen canvas (downscaled for speed) and read raw
// pixels — no library, no upload to any server. The photo never leaves the device.

import { rgbToHex, type RGB } from "./color";

// Max edge length we downscale to before reading pixels. Big enough to keep the
// dominant colors faithful, small enough that quantization stays instant on a phone.
const SAMPLE_MAX_EDGE = 240;

export type LoadedImage = {
  el: HTMLImageElement;
  width: number;
  height: number;
};

// Read a File (from <input type=file>) into an <img> we can draw and measure.
export function loadImageFile(file: File): Promise<LoadedImage> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({ el: img, width: img.naturalWidth, height: img.naturalHeight });
      // Keep the object URL alive for on-screen display; the caller revokes it.
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read that image."));
    };
    img.src = url;
  });
}

function drawToSampleCanvas(img: HTMLImageElement): ImageData | null {
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  if (!w || !h) return null;
  const scale = Math.min(1, SAMPLE_MAX_EDGE / Math.max(w, h));
  const cw = Math.max(1, Math.round(w * scale));
  const ch = Math.max(1, Math.round(h * scale));
  const canvas = document.createElement("canvas");
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0, cw, ch);
  try {
    return ctx.getImageData(0, 0, cw, ch);
  } catch {
    // Tainted canvas (cross-origin) — shouldn't happen for local files.
    return null;
  }
}

type Bucket = { r: number; g: number; b: number; count: number };

// Quantize by snapping each pixel into a coarse RGB grid (4 bits/channel = 4096
// cells), accumulating an average color + weight per cell. Then we pick the
// heaviest cells, but de-prioritize near-greys so the swatches read as actual
// brand-candidate hues rather than "the wall behind the subject."
export function extractPalette(img: HTMLImageElement, max = 6): string[] {
  const data = drawToSampleCanvas(img);
  if (!data) return [];
  const px = data.data;
  const buckets = new Map<number, Bucket>();

  for (let i = 0; i < px.length; i += 4) {
    const a = px[i + 3];
    if (a < 125) continue; // skip transparent pixels
    const r = px[i], g = px[i + 1], b = px[i + 2];
    const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
    const existing = buckets.get(key);
    if (existing) {
      existing.r += r; existing.g += g; existing.b += b; existing.count++;
    } else {
      buckets.set(key, { r, g, b, count: 1 });
    }
  }

  const scored = [...buckets.values()].map((bk) => {
    const r = bk.r / bk.count, g = bk.g / bk.count, b = bk.b / bk.count;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    const sat = mx === 0 ? 0 : (mx - mn) / mx; // rough saturation 0..1
    // Weight by popularity, boosted by saturation so colorful regions win ties.
    const weight = bk.count * (1 + sat * 1.8);
    return { hex: rgbToHex({ r, g, b }), r, g, b, weight };
  });

  scored.sort((a, b) => b.weight - a.weight);

  // De-dupe perceptually-near colors so we don't return six near-identical beiges.
  const chosen: typeof scored = [];
  for (const c of scored) {
    if (chosen.every((k) => colorDistance(k, c) > 38)) chosen.push(c);
    if (chosen.length >= max) break;
  }
  return chosen.map((c) => c.hex);
}

function colorDistance(a: RGB, b: RGB): number {
  return Math.sqrt((a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2);
}

// Sample the exact color at a point on the displayed image. Coordinates are the
// fractional position within the rendered image (0..1 on each axis), so the caller
// can convert a tap/click relative to the <img>'s box without worrying about the
// natural resolution.
export function sampleColorAt(img: HTMLImageElement, fx: number, fy: number): string | null {
  const w = img.naturalWidth, h = img.naturalHeight;
  if (!w || !h) return null;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0);
  const x = Math.max(0, Math.min(w - 1, Math.round(fx * w)));
  const y = Math.max(0, Math.min(h - 1, Math.round(fy * h)));
  try {
    const d = ctx.getImageData(x, y, 1, 1).data;
    return rgbToHex({ r: d[0], g: d[1], b: d[2] });
  } catch {
    return null;
  }
}
