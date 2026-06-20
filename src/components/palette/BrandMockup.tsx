import type { Palette } from "../../lib/harmony";
import type { FontPair } from "../../lib/presets";
import { readableOn } from "../../lib/color";

/**
 * The shared "how do my colors actually land?" mockup — a realistic mini-page that
 * exercises EVERY role at once: page background wrapping a section-background card,
 * a heading in the Buttons/CTA color, body text, quieter muted text, a solid CTA
 * button, an outline Secondary button, and an Accent badge.
 *
 * One component, two uses:
 *   • LivePreview renders it at scale 1 (the sticky on-screen preview).
 *   • BrandKitPreview renders it larger (the exported PNG) so the kit demonstrates
 *     the palette in context instead of a bland sample line — what you see in the
 *     live preview is exactly what lands in the export.
 *
 * `scale` multiplies every size so the same composition reads well at any size.
 */
export function BrandMockup({
  palette,
  pair,
  scale = 1,
}: {
  palette: Palette;
  pair: FontPair;
  scale?: number;
}) {
  const { roles } = palette;
  const s = (n: number) => Math.round(n * scale);

  return (
    <div
      style={{
        background: roles.background,
        borderRadius: s(14),
        padding: s(18),
        border: `1px solid ${roles.border}`,
      }}
    >
      <div
        style={{
          fontFamily: pair.headingFamily,
          fontWeight: 700,
          fontSize: s(15),
          color: roles.text,
          opacity: 0.85,
          marginBottom: s(12),
        }}
      >
        On the page background
      </div>

      <div
        style={{
          background: roles.surface,
          color: roles.text,
          borderRadius: s(12),
          padding: s(18),
          border: `1px solid ${roles.border}`,
        }}
      >
        <div
          style={{
            fontFamily: pair.headingFamily,
            fontWeight: 700,
            fontSize: s(24),
            lineHeight: 1.15,
            color: roles.heading,
          }}
        >
          Your brand, in context.
        </div>
        <div
          style={{
            fontFamily: pair.bodyFamily,
            fontSize: s(14),
            marginTop: s(8),
            color: roles.text,
          }}
        >
          This is your body text on a section background. The heading uses your buttons / CTA color
          so you can see how the pieces sit together.
        </div>
        <div
          style={{
            fontFamily: pair.bodyFamily,
            fontSize: s(12.5),
            marginTop: s(6),
            color: roles.mutedText,
          }}
        >
          Secondary text sits a little quieter than the body.
        </div>

        <div
          style={{
            display: "flex",
            gap: s(8),
            marginTop: s(14),
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <button
            style={{
              background: palette.primary,
              color: readableOn(palette.primary),
              border: "none",
              borderRadius: s(8),
              padding: `${s(8)}px ${s(14)}px`,
              fontFamily: pair.bodyFamily,
              fontWeight: 600,
              fontSize: s(14),
              cursor: "default",
            }}
          >
            Buttons / CTA
          </button>
          <button
            style={{
              background: "transparent",
              color: palette.primary,
              border: `1px solid ${palette.primary}`,
              borderRadius: s(8),
              padding: `${s(8)}px ${s(14)}px`,
              fontFamily: pair.bodyFamily,
              fontWeight: 600,
              fontSize: s(14),
              cursor: "default",
            }}
          >
            Secondary
          </button>
          <span
            style={{
              background: palette.accent,
              color: readableOn(palette.accent),
              borderRadius: 999,
              padding: `${s(4)}px ${s(10)}px`,
              fontFamily: pair.bodyFamily,
              fontSize: s(12),
              fontWeight: 600,
            }}
          >
            Accent badge
          </span>
        </div>
      </div>
    </div>
  );
}
