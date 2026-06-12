
# Palette Studio — Implementation Plan

A single-page, client-side palette + brand-kit generator. No backend, no auth. Last result persisted in `localStorage`. Built with Ant Design v5, mobile-first, installable PWA.

## Scope confirmation

- One route: `/` (home is the entire tool).
- No Lovable Cloud, no server functions, no `@tanstack/react-query`.
- All color math implemented in plain TypeScript (HSL ↔ RGB, hue rotation, WCAG luminance/contrast). No color library.
- Brand-kit PNG export included as a nice-to-have using `html-to-image` (tiny, no native deps).

## User experience

Single scrollable page, sticky header `Palette Studio` (Inter, primary `#2f4f46`, bg `#fafafa`). Below it, a vertical stack of AntD `Card` sections:

1. **Start** — three entry points in a `Tabs`:
   - **Pick a color** — `ColorPicker` + hex `Input`.
   - **Pick a vibe** — `Segmented` with 6 presets (Calm & trustworthy → `#2f6f8f`, Bold & energetic → `#e2483d`, Warm & friendly → `#e8884a`, Elegant & premium → `#3a2f4f`, Fresh & natural → `#4f8f5a`, Professional → `#2f4f46`).
   - **Surprise me** — `Button` that picks a random hue with constrained saturation/lightness so results stay harmonious.

2. **Harmony rule** — `Radio.Group` (Complementary, Analogous, Triadic, Split-complementary, Monochromatic). Each option shows a short `Typography.Text type="secondary"` caption. Changing the rule re-derives Secondary + Accent live.

3. **Your palette** — responsive swatch grid (1 col @360px, 2 @sm, 3–4 @md+). Each swatch shows: large color block, role label (Primary / Secondary / Accent / Background / Surface / Text / Muted text), hex (click to copy via `message.success`), `Tooltip` with role usage hint. Below the role swatches, two horizontal **50–900 scales** (Primary and Accent) as small swatch strips.

4. **Neutral ramp** — gray scale derived by desaturating the primary's hue (a slight tint of primary, not pure gray).

5. **Accessibility** — table/cards listing key pairings (Text on Background, Text on Surface, Primary on Background, White on Primary, etc.) with WCAG ratio + AA/AAA `Tag` (green pass, red fail) and a plain-language note when below 4.5.

6. **Typography** — `Radio.Group` of 5 curated Google Font pairings (Inter+Inter, Playfair Display+Source Sans 3, Poppins+Inter, Space Grotesk+Inter, Merriweather+Lato). Live preview card uses generated palette colors + selected fonts. Fonts loaded via injected `<link>` in head when first selected.

7. **Export** — `Tabs` with three code blocks (CSS variables, Tailwind `theme.extend.colors`, AntD theme tokens). Each has a copy button. Plus a "Download brand kit PNG" button that renders a hidden preview card to PNG.

Persistence: on every state change, write `{ baseHex, harmony, fontPair }` to `localStorage["palette-studio:v1"]`; restore on mount.

## Color math (pure TS in `src/lib/color.ts`)

- `hexToHsl`, `hslToHex`, `hexToRgb`, `rgbToHex`.
- `rotateHue(hex, degrees)` — hue rotation in HSL.
- `harmonize(baseHex, rule)` → `{ primary, secondary, accent }` via hue offsets:
  - Complementary: +180.
  - Analogous: ±30.
  - Triadic: ±120.
  - Split-complementary: +150, +210.
  - Monochromatic: same hue, different L/S.
- `buildScale(hex)` → object `{50,100,…,900}` by lightening/darkening L in HSL.
- `buildNeutralRamp(primaryHex)` — same hue, very low saturation, L from 98 → 12.
- `relativeLuminance(rgb)` and `contrastRatio(hex1, hex2)` per WCAG 2.1.
- `wcagLevel(ratio, size)` → `'AAA' | 'AA' | 'AA Large' | 'Fail'`.

Roles are derived deterministically: Background = lightest neutral, Surface = next neutral, Text = darkest neutral, Muted = mid neutral, Primary/Secondary/Accent from harmony.

## Files to add / change

- `package.json` — add: `antd`, `@ant-design/icons`, `vite-plugin-pwa`, `html-to-image`. Remove nothing.
- `vite.config.ts` — add `VitePWA({ registerType: "autoUpdate", manifest: false, workbox: { navigateFallback: "index.html" } })`; set `base: command === "build" ? "/palette-studio/" : "/"`.
- `public/manifest.webmanifest` — name, short_name, `display: standalone`, `theme_color: "#2f4f46"`, `background_color: "#fafafa"`, 192/512 + maskable icons.
- `public/icon-192.png`, `public/icon-512.png`, `public/icon-512-maskable.png` — generated via imagegen.
- `src/lib/color.ts` — color math.
- `src/lib/harmony.ts` — harmony rules + captions metadata.
- `src/lib/presets.ts` — vibe presets + font-pair list.
- `src/lib/exporters.ts` — CSS vars / Tailwind / AntD token serializers.
- `src/lib/storage.ts` — localStorage helpers.
- `src/lib/pwa-register.ts` — guarded registration wrapper (skip in Lovable preview / iframe / dev / `?sw=off`).
- `src/components/palette/*` — `StartCard`, `HarmonyPicker`, `PaletteGrid`, `ScaleStrip`, `NeutralRamp`, `ContrastReport`, `TypographyPicker`, `ExportPanel`, `BrandKitPreview`.
- `src/routes/index.tsx` — replace placeholder; wraps app in AntD `ConfigProvider` with chrome theme (`#2f4f46` / Inter); renders sections.
- `src/routes/__root.tsx` — update `head()`: title `Palette Studio — Opsette Tools`, description, theme-color, manifest link, apple-touch-icon, Inter font link, register PWA wrapper in a client effect.
- `src/styles.css` — minimal: ensure Inter on chrome only, base resets, mobile-first container.

## Technical notes

- AntD `ConfigProvider` theme applies only to chrome (header / control surfaces). The generated palette is rendered with inline styles / CSS vars on a scoped wrapper so it never leaks into AntD components.
- All copy actions use `navigator.clipboard.writeText` + AntD `message`.
- Brand-kit PNG: render `BrandKitPreview` (1080×1350) off-screen, use `htmlToImage.toPng`, trigger download.
- PWA registration follows the Lovable preview-safe pattern (refuse on iframe, `id-preview--*`, `*.lovableproject.com`, `*.lovableproject-dev.com`, `beta.lovable.dev`, `?sw=off`).
- No state library; one `useReducer` in `routes/index.tsx` owning `{ baseHex, harmony, fontPairId }`; derived palette computed with `useMemo`.
- Mobile-first: `max-w-screen-md mx-auto px-4`, swatch grid via CSS grid `repeat(auto-fill, minmax(140px, 1fr))`. Verified at 360px.

## Out of scope

- Exporting Figma / Sketch files.
- Saving multiple named palettes (only last one persists).
- Custom font upload.
