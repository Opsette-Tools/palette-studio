# Palette Studio — OKLCH harmony rebuild (planning doc)

**Status:** plan — not yet built.
**Author:** drafted with Claude (planning session), 2026-06-13.
**For:** a fresh breakout build session. This is the spec; the build agent should follow it and use its own judgment on the *how*, surfacing only genuine product forks.

---

## Why we're doing this

Ruthnie's read on the current Palette Studio: *"seems a little limited… I wonder what kind of logic the harmony rules use. Is there real color theory in there?"*

That instinct is correct. The color **plumbing** is solid (HSL conversions, WCAG contrast, luminance — all textbook-correct in `src/lib/color.ts`). The **harmony layer is thin**, and it's the source of the "limited" feeling. Three concrete problems, in order of impact:

### 1. It's HSL hue-rotation, not perceptual color theory (the big one)
`harmonize()` in `src/lib/harmony.ts` builds every palette by rotating hue in **HSL**. HSL is *not* perceptually uniform: equal hue steps don't look equally spaced, and equal "lightness" values look wildly different across hues (a yellow at L=0.5 reads far lighter and more vivid than a blue at L=0.5). So:
- "Triadic" (120° apart in HSL) does **not** produce three colors that look evenly spaced or equally vivid.
- Scales built at fixed HSL lightness stops drift in *perceived* brightness from hue to hue.

The fix the whole industry has moved to (Tailwind v4, Radix, Adobe, Leonardo) is **OKLCH** — a perceptually-uniform space where L = perceived lightness, C = chroma (vividness), H = hue. Rotating hue in OKLCH while holding L and C constant gives harmony members that genuinely read as a *family*. This is the single biggest quality jump available, and it needs no UI change.

### 2. "Complementary" collapses to two colors
```ts
case "complementary":
  return { primary, secondary: rotateHue(primary, 180), accent: rotateHue(primary, 180) };
```
`secondary` and `accent` are identical. So "complementary" only ever yields 2 distinct colors padded to 3 — a real reason it feels limited.

### 3. Only 5 rules, fixed saturation/lightness band
- `primary` is always clamped into one narrow S/L band regardless of rule → every palette has a samey mid-tone feel.
- No tetradic/square. No temperature (warm/cool) control. No vibrant-vs-muted mode.

> ⚠️ Note on "split-complementary is wrong": in the **original** review I flagged this, but on close re-read the current code returns +150°/+210°, which **is** correct split-complementary. So *that specific bug does not exist* — don't go "fixing" it. The real issues are the three above. (Documented here so the build session doesn't chase a ghost.)

---

## The contract that keeps this contained

Everything downstream depends on the **`Palette` type** (`src/lib/harmony.ts`) and the **`Scale` type** (`src/lib/color.ts`). Consumers:

- `components/palette/PaletteGrid.tsx` — primary/secondary/accent + roles
- `components/palette/ScaleStrips.tsx` — primaryScale / accentScale / neutrals
- `components/palette/ContrastReport.tsx` — uses `contrastRatio` / `wcagLevel` / role colors
- `components/palette/BrandKitPreview.tsx` — renders a mock UI from roles + scales
- `lib/exporters.ts` — CSS vars / Tailwind / AntD, all keyed off `Palette` fields
- `App.tsx` — orchestrates, persists via `lib/storage.ts`

**Strategy: keep the `Palette` and `Scale` shapes stable.** If the output type is unchanged, the rebuild is confined to `color.ts` + `harmony.ts` and *every consumer keeps working untouched*. New features (tetradic, vibrant/muted, temperature) are added as **new fields/params**, never by changing existing field meanings.

This is the durable, correct path: rewrite the engine behind a stable contract, don't ripple changes through the UI.

---

## Dependency

Add **`culori`** (~tiny, tree-shakeable, the de-facto standard for OKLCH in JS).
- `npm i culori`
- We use it for: hex↔oklch conversion, and **gamut clamping** (`toGamut` / clamp to sRGB) — critical, because many OKLCH (L,C,H) triples fall outside sRGB and must be clamped *back* into displayable range or you get garbage hexes.

Keep our existing `color.ts` WCAG functions (`contrastRatio`, `relativeLuminance`, `wcagLevel`, `readableOn`) — they're correct and culori isn't needed there.

---

## What to build

### A. New OKLCH core (in `color.ts` or a new `oklch.ts`)
```ts
type Oklch = { l: number; c: number; h: number }; // l 0..1, c 0..~0.4, h 0..360
hexToOklch(hex) / oklchToHex(oklch)   // via culori, with sRGB gamut clamp on the way out
rotateHueOklch(oklch, deg)
```
All harmony math moves into OKLCH. HSL helpers can stay for any legacy use but harmony should not call them.

### B. Rewrite `buildScale` / `buildNeutralRamp` in OKLCH
- Keep the **same `Scale` shape** (50→900 keys) so `ScaleStrips` and exporters don't change.
- Build stops by walking **L in OKLCH** (perceptually even) instead of HSL lightness. Hold H constant; taper C slightly at the extremes (very light/dark stops should lose chroma so they don't look neon or muddy — this is what makes Radix/Tailwind ramps look professional).
- Neutral ramp: same idea at very low chroma (a hint of the brand hue), walked in OKLCH L.

### C. Rewrite `harmonize()` in OKLCH — hold L & C, rotate H
For each rule, derive members by rotating **hue only**, keeping the primary's L and C so they read as a family:
- **complementary** → +180. **Fix the collapse:** make `accent` a genuine third color (e.g. the +180 hue at reduced chroma as a "bridge", or a +180 with an L shift). Define it so complementary returns 3 *distinct* usable colors.
- **analogous** → −30 / +30
- **triadic** → +120 / −120 (now actually perceptually even)
- **split-complementary** → +150 / +210 (already correct — port as-is to OKLCH)
- **monochromatic** → same H, step **L** in OKLCH (not the current arbitrary HSL S/L)
- **NEW: tetradic / square** → +90 / +180 / +270 (this adds a 4th member — see product fork below)

### D. New controls (additive — new params, stable defaults)
- **Vibrancy: Muted / Balanced / Vibrant** → scales the base **chroma** before harmonizing. One toggle, big visual range, fixes the "every palette feels mid-tone" problem.
- **(Optional) Temperature nudge** — warm/cool shift. Lower priority; include only if time allows.

### E. UI touch-ups (minimal)
- `HarmonyPicker.tsx`: add the new rule(s) to `HARMONY_OPTIONS` with captions. It already maps over the array, so adding entries is free.
- Add the Vibrancy control near the harmony picker (AntD `Segmented`, 3 options).
- Everything else (`PaletteGrid`, `ScaleStrips`, `ContrastReport`, `BrandKitPreview`, exporters) should need **no changes** if the contract holds. Verify, don't assume.

---

## Product forks to decide (the only things worth asking Ruthnie)

1. **Tetradic = 4 colors, but `Palette` currently has primary/secondary/accent (3).** Options:
   - (a) Add an optional `accent2?: string` field and show a 4th swatch only when present. *(Recommended — additive, no breakage.)*
   - (b) Keep tetradic mapped into 3 visible roles and expose the 4th only in exports.
   Recommend (a).
2. **Vibrancy default** — Balanced is the safe default; confirm.
3. **Temperature control** — include now or defer? Recommend defer to keep scope tight.

Everything else (exact L/C taper curves, stop values, chroma reduction amounts) is taste — the build agent should exercise judgment and tune visually, not ask.

---

## Build order (suggested)

1. `npm i culori`; add `hexToOklch`/`oklchToHex` with gamut clamp; unit-sanity a few round-trips.
2. Rewrite `buildScale` + `buildNeutralRamp` in OKLCH; eyeball `ScaleStrips` — ramps should look smooth and professional.
3. Rewrite `harmonize()` in OKLCH; fix complementary collapse; add tetradic.
4. Add Vibrancy param (chroma scale) threaded from UI → `buildPalette`.
5. Wire `HarmonyPicker` + Vibrancy control.
6. Typecheck continuously (`npx tsc --noEmit`). Verify every consumer renders. Check `ContrastReport` still passes/fails sensibly.
7. Verify in the running app → production build → commit (personal `deebuilt` identity).

## Definition of done
- Palettes visibly look like *coordinated families*, not arithmetic hue spins.
- Triadic/tetradic members read as evenly spaced and equally vivid.
- Complementary returns 3 distinct usable colors.
- Vibrancy toggle produces a clear muted↔vibrant range.
- Scales (50→900) look smooth with no neon/muddy extremes.
- No consumer changed behavior except the additive new field(s).

---

## Completion notes — 2026-06-15 (build session, two split sprints)

**Status: SHIPPED.** Both sprints built, verified in the running app by Ruthnie, built, committed, and pushed to `Opsette-Tools/palette-studio` main (personal `deebuilt` identity, confirmed before each commit).

### Sprint 1 — OKLCH rebuild — commit `24bd6d5`
- **New OKLCH core** in `src/lib/oklch.ts` (new file): `hexToOklch` / `oklchToHex` (with sRGB gamut clamp via culori's `clampChroma`), `rotateHueOklch`, `withOklch`, plus `clampL`/`clampC`. Round-trips verified exact. Added `culori` dependency.
- **Scales rebuilt in OKLCH** (`src/lib/color.ts`): `buildScale` + `buildNeutralRamp` now walk perceived lightness with chroma tapered at the extremes (no neon tints / muddy shades). `Scale` 50→900 shape unchanged.
- **`harmonize()` rebuilt in OKLCH** (`src/lib/harmony.ts`): holds L & C, rotates H, so members read as a family.
  - **Complementary collapse fixed** — `secondary` is the true +180 complement; `accent` is a distinct lighter, lower-chroma "bridge" tone. Returns 3 distinct colors.
  - **Monochromatic** rebuilt as a true OKLCH lightness ramp.
  - Split-complementary ported as-is (it was already correct — did not "fix the ghost").
- **Tetradic added** with additive optional `accent2?` field on `Palette`. Surfaced as an "Accent 2" swatch in `PaletteGrid` (conditional) and in exporters (CSS var `--color-accent-2`, Tailwind `accent2`).
- **Vibrancy control** (Muted / Balanced / Vibrant, default Balanced) — scales base chroma before harmonizing. New `VibrancyPicker.tsx`; threaded through `buildPalette` → App state/reducer → persisted in `storage.ts` (older saves default to balanced).
- Contract held: `Palette`/`Scale` shapes stable, so `ScaleStrips`, `ContrastReport`, `BrandKitPreview` needed no changes. Typecheck clean.

### Sprint 2 — Temperature control — commit `fd2726a`
- **Temperature** (Cooler / Neutral / Warmer, default Neutral) — nudges the base hue ±14° in OKLCH before harmonizing, tilting the whole family warm/cool while keeping harmony. New `TemperaturePicker.tsx`; threaded through `harmonize`/`buildPalette` → App state → storage (older saves default to neutral). New `temperature` field on `Palette`.
- **Also bumped deploy actions** in `.github/workflows/deploy.yml` for GitHub Actions Node-24 runtime compliance: `checkout@v4→v5`, `setup-node@v4→v5`, `upload-pages-artifact@v3→v4`. `node-version` left at `20` (matches sibling Opsette repos; the deprecation was about action *runtimes*, not the build's Node version).

### Product forks (all confirmed by Ruthnie)
1. Tetradic 4th color → **(a) optional `accent2` field** ✓
2. Vibrancy default → **Balanced** ✓
3. Temperature → was deferred in the plan, but **built same day in Sprint 2** ✓

### Discrepancies / notes for future sessions
- The plan said "split-complementary is correct, don't fix it" — confirmed against code, left alone.
- Production build emits a non-blocking "chunks larger than 500 kB" advisory (pre-existing, AntD bundle). Not addressed; candidate for a future code-splitting pass if bundle size matters.
- Process note: the Sprint 2 feature commit shipped *before* this completion entry was written — the doc update should have ridden along in `fd2726a`. Recorded here so the doc stays the source of truth.
