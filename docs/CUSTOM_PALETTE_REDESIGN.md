# "My own colors" — redesign plan

**Owner:** Ruthnie · **Status:** approved, building · **Date:** 2026-06-17

## Why

The first cut of "My own colors" had three problems Ruthnie hit immediately:

1. **Role vocabulary was wrong/confusing.** "Primary" read as "primary button," not
   "primary color." Definitions were design-system jargon ("Cards and panels sitting
   above the page") that didn't match how she labels her own colors.
2. **No "Buttons / CTA" role** — she has an explicit button color (her "Teal Deep")
   with nowhere clean to put it.
3. **Layout forced scroll-thrash.** A big dead gap between "Your palette" and "Font
   pairing," and the only place colors render as real UI (the font preview) was buried
   at section #5 — so she scrolled up→down→up→down to judge her colors.

Her real-world paste, which the vocabulary must match:

| Her label | Hex | Meaning |
|---|---|---|
| Paper | `#F6F4EF` | page background |
| Paper Deep | `#EEEBE3` | section background |
| Ink | `#1E2A2B` | primary text |
| Teal | `#2E5A5E` | accent |
| Teal Deep | `#21464A` | buttons, CTA |
| Muted | `#6E6A62` | secondary text |

## Decisions (approved 2026-06-17)

- **Role vocabulary → plain language.** Replace Primary/Secondary/Surface with:
  - `pageBg` — **Page background** (the main page color)
  - `sectionBg` — **Section background** (alt-shaded sections / cards)
  - `bodyText` — **Body text** (paragraphs & headings)
  - `button` — **Buttons / CTA** (main button color) ← NEW, the missing role
  - `accent` — **Accent** (highlights, badges, links)
  - `secondaryText` — **Secondary text** (captions, muted labels)
  - `border` — **Border** (lines & dividers)
- **Live preview → sticky, beside/above the editor.** As she adds/assigns colors, a
  live mockup (heading, body, button, secondary button, accent badge, card on section
  bg) updates instantly. Font pairing folds INTO this preview. No more scrolling to
  see results.

## Architecture

### Role model (lib/harmony.ts)

`CustomRole` becomes the plain-language set above. `buildCustomPalette` maps these
new roles onto the internal `Palette` keys the rest of the app already reads, so
downstream (contrast, export, brand kit) keeps working:

- `pageBg`        → `roles.background`
- `sectionBg`     → `roles.surface`
- `bodyText`      → `roles.text`
- `button`        → `primary`  (this is what TypographyPicker/ContrastReport treat as
  the button color — so "Buttons / CTA" correctly drives the button preview)
- `accent`        → `accent`
- `secondaryText` → `roles.mutedText`
- `border`        → `roles.border`

`secondary` (internal) = button color, since the "Secondary" button in previews is an
outline of the button color. No separate role exposed for it.

`suggestRole` updated to the new vocabulary: lightest→pageBg, next-lightest→sectionBg,
darkest→bodyText, saturated mid-tone→button, second saturated→accent, low-chroma
mid→secondaryText.

`palette.custom` keeps storing the user's `{hex, role, name}` so the grid + brand kit
show only her colors with her names.

### Layout (App.tsx) — custom mode

Two-column sticky layout when `isCustom`:
- **Left:** the editor (StartCard) — add/assign/name colors.
- **Right (sticky):** a `LivePreview` component — the font picker + a realistic mock
  (page bg, card on section bg, heading in body text, body copy, muted caption,
  Buttons/CTA + Secondary buttons, accent badge). Sticks on scroll so it's always
  visible. On mobile it stacks under the editor.

In custom mode we DROP the separate HarmonyPicker, ScaleStrips, and the standalone
TypographyPicker card (its preview now lives in LivePreview). "Your palette" grid +
Accessibility check stay (they read the roles she assigned). Export stays.

Generated mode is UNCHANGED — same sections, same order.

### New/changed components

- `LivePreview.tsx` (new) — sticky font+UI preview, reused shape from the brand kit /
  TypographyPicker mock. Takes `palette` + `fontPair` + `onFontChange`.
- `CustomPaletteFields.tsx` — new role options + helper text in plain language.
- `PaletteGrid.tsx` / `BrandKitPreview.tsx` — role label lookups already go through
  `CUSTOM_ROLE_OPTIONS`, so they update automatically.
- Keep the earlier `readableOn()` button-color bug fix (black/white auto-pick).

## Out of scope (noted, not building)

- "Make it warmer/cooler / generate variations from my colors" — Ruthnie may add later;
  it's a separate mode from "show me my colors," not part of this.
- Reworking generated mode's tab/section structure — only custom mode changes here.

## Progress log

- 2026-06-17: Plan written and approved (plain-language roles + sticky preview).
- 2026-06-17: Built. Shipped:
  - `lib/harmony.ts` — `CustomRole` → plain-language set (pageBg, sectionBg,
    bodyText, button, accent, secondaryText, border). `buildCustomPalette` maps
    them onto internal keys (button→primary, pageBg→background, sectionBg→surface,
    bodyText→text, secondaryText→mutedText). `suggestRole` updated to match.
  - `components/palette/LivePreview.tsx` (new) — sticky font+UI mock; replaces the
    standalone TypographyPicker card in custom mode.
  - `App.tsx` — split into two layouts: custom mode = editor + sticky LivePreview
    side-by-side, then PaletteGrid/ContrastReport/Export full-width below.
    Generated mode unchanged.
  - `CustomPaletteFields.tsx` — role dropdown + name field per row, plain-language
    helper/tip text, mobile row-wrapping via `.ps-custom-row`.
  - `styles.css` — responsive rules retargeted to the nested grids; sticky preview
    de-sticks on mobile.
  - Carried the `readableOn()` button-text fix (TypographyPicker, ContrastReport)
    so light button colors get dark labels and the a11y report tells the truth.
  - Verified: `tsc --noEmit` clean; eslint clean on all changed files (repo-wide
    CRLF lint noise is pre-existing, untouched).
  - LEFT TO DO: Ruthnie to verify in-app at :8117; then prod build + commit.
    Brand-kit PNG (naming + logo) from the prior round is intact and untouched.
- 2026-06-17 (vocabulary unification): Made the WHOLE app speak one plain-language
  role vocabulary (not just custom mode) — this resolves the "what does Primary
  mean?" confusion. Mapping unchanged; only labels. Final vocabulary everywhere
  (grid, custom dropdown, brand kit, contrast report, scales):
  - primary    → "Buttons / CTA"
  - secondary  → "Secondary button" (generated grid only; not a custom role)
  - accent     → "Accent"
  - background → "Page background"
  - surface    → "Card background"  (was the jargon word "Surface")
  - text       → "Body text"
  - mutedText  → "Muted text"
  - border     → "Border"
  Scales are always built from the Buttons/CTA color (the one scalable brand
  color) + Accent + Neutral, same in both modes. Code-export variable names stay
  conventional (`--color-primary`, etc.) — humans read the UI, machines read the
  export. Files: PaletteGrid, ContrastReport, BrandKitPreview, ScaleStrips,
  harmony.ts (CUSTOM_ROLE_OPTIONS). Removed the now-pointless ScaleStrips label
  override props.
- 2026-06-17 (neutral row + kit integrity): Brand kit PNG now shows ALL THREE
  scales (Buttons/CTA, Accent, Neutral) in both modes, looping a small array so
  it stays DRY. Canvas switched from fixed `height: 1350` to `minHeight: 1350` so
  the third row never clips and never leaves an empty band — fixes the "looks like
  a glitch" gap Ruthnie flagged. On-screen ScaleStrips already showed all three.
- 2026-06-17 (DEFERRED to a new session, per Ruthnie): apply the sticky LivePreview
  to ALL generated tabs (Pick a color / vibe / photo / surprise), not just custom
  mode. Generated mode still buries font pairing at the bottom → scroll-thrash.
  This is the next session's job; do NOT do it here.
- 2026-06-17 (follow-up): Reversed the "hide scales in custom mode" call. Ruthnie
  noted the kit lost the Primary/Accent scales vs. a generated kit. Decision: SHOW
  derived tint/shade scales for custom palettes too — they're real, perceptually-
  even shades of her own Buttons/CTA + Accent colors (same `buildScale()` math),
  labeled "Buttons / CTA — tints & shades" / "Accent — tints & shades" so it's clear
  they're shades, not new colors. Re-enabled both the on-screen `ScaleStrips`
  (with label overrides + an explanatory caption) and the two scale sections in
  `BrandKitPreview`. tsc + eslint clean on changed files.
