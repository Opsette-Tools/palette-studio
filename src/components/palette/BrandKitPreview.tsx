import type { Palette } from "../../lib/harmony";
import { CUSTOM_ROLE_OPTIONS } from "../../lib/harmony";
import type { FontPair } from "../../lib/presets";
import { readableOn } from "../../lib/color";

function roleLabel(role: string): string {
  return CUSTOM_ROLE_OPTIONS.find((o) => o.value === role)?.label ?? role;
}

type Props = {
  palette: Palette;
  fontPair: FontPair;
  /** User-supplied name for this kit; shown as the headline. */
  kitName?: string;
  /** Opsette logo as a data URL (see lib/logo.ts). Omitted → text fallback. */
  logoSrc?: string;
};

export function BrandKitPreview({ palette, fontPair, kitName, logoSrc }: Props) {
  const title = kitName?.trim() || "Your brand kit";
  const isCustom = !!palette.custom;
  // Custom palette: show exactly the colors the user supplied, with her names.
  // Generated palette: show the six core roles.
  const roleSwatches = isCustom
    ? palette.custom!.map((c) => ({ label: c.name?.trim() || roleLabel(c.role), hex: c.hex }))
    : [
        { label: "Buttons / CTA", hex: palette.primary },
        { label: "Secondary button", hex: palette.secondary },
        { label: "Accent", hex: palette.accent },
        { label: "Page background", hex: palette.roles.background },
        { label: "Card background", hex: palette.roles.surface },
        { label: "Body text", hex: palette.roles.text },
      ];

  return (
    <div
      style={{
        width: 1080,
        // Min-height keeps the familiar 4:5 poster shape, but lets the canvas
        // grow if the three scale rows need a little more room — so nothing ever
        // clips or leaves an awkward empty band at the bottom.
        minHeight: 1350,
        background: palette.roles.background,
        color: palette.roles.text,
        padding: 64,
        fontFamily: fontPair.bodyFamily,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        gap: 28,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 24,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontFamily: fontPair.headingFamily,
              fontSize: 64,
              fontWeight: 700,
              lineHeight: 1.05,
              color: palette.primary,
              wordBreak: "break-word",
            }}
          >
            {title}
          </div>
          <div style={{ fontSize: 22, color: palette.roles.mutedText, marginTop: 8 }}>
            Generated with Palette Studio · {fontPair.heading} / {fontPair.body}
          </div>
        </div>
        {/* Opsette logo — top-right, so it reads as a maker's mark without
            crowding the kit's own title. */}
        {logoSrc ? (
          <img
            src={logoSrc}
            alt="Opsette"
            style={{ width: 88, height: 88, flexShrink: 0, objectFit: "contain" }}
          />
        ) : null}
      </div>

      <div>
        <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>
          {isCustom ? "Your colors" : "Color roles"}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {roleSwatches.map((s) => {
            const fg = readableOn(s.hex);
            return (
              <div
                key={s.label}
                style={{
                  background: s.hex,
                  color: fg,
                  borderRadius: 16,
                  padding: 20,
                  height: 150,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  border: `1px solid ${palette.roles.border}`,
                }}
              >
                <div style={{ fontWeight: 700, fontSize: 18 }}>{s.label}</div>
                <div style={{ fontFamily: "monospace", fontSize: 18 }}>{s.hex}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tint/shade scales — the same in BOTH modes: even, perceptually-spaced
          shades of the palette's key colors (in custom mode these are derived
          faithfully from the user's own Buttons/CTA + Accent colors). All three
          rows always render so the kit looks complete, never like it's missing
          one. Labels use the unified plain-language vocabulary. */}
      {[
        { label: "Buttons / CTA — tints & shades", scale: palette.primaryScale },
        { label: "Accent — tints & shades", scale: palette.accentScale },
        { label: "Neutral — tints & shades", scale: palette.neutrals },
      ].map(({ label, scale }) => (
        <div key={label}>
          <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 10 }}>{label}</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(10, 1fr)", gap: 6 }}>
            {Object.entries(scale).map(([stop, hex]) => (
              <div
                key={stop}
                style={{
                  background: hex,
                  height: 52,
                  borderRadius: 8,
                  color: readableOn(hex),
                  fontSize: 11,
                  padding: 6,
                  fontWeight: 700,
                }}
              >
                {stop}
              </div>
            ))}
          </div>
        </div>
      ))}

      <div
        style={{
          marginTop: "auto",
          padding: 24,
          background: palette.roles.surface,
          borderRadius: 16,
          border: `1px solid ${palette.roles.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 24,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontFamily: fontPair.headingFamily,
              fontSize: 36,
              fontWeight: 700,
              color: palette.primary,
            }}
          >
            The quick brown fox.
          </div>
          <div style={{ fontSize: 18, marginTop: 8, color: palette.roles.text }}>
            Body copy in {fontPair.body}. Built with Palette Studio — part of Opsette Tools.
          </div>
        </div>
        {logoSrc ? (
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
            <img src={logoSrc} alt="" style={{ width: 40, height: 40, objectFit: "contain" }} />
            <span style={{ fontSize: 22, fontWeight: 700, color: palette.roles.text }}>
              Opsette
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
