import type { Palette } from "../../lib/harmony";
import type { FontPair } from "../../lib/presets";
import { readableOn } from "../../lib/color";

export function BrandKitPreview({ palette, fontPair }: { palette: Palette; fontPair: FontPair }) {
  const roleSwatches = [
    { label: "Primary", hex: palette.primary },
    { label: "Secondary", hex: palette.secondary },
    { label: "Accent", hex: palette.accent },
    { label: "Background", hex: palette.roles.background },
    { label: "Surface", hex: palette.roles.surface },
    { label: "Text", hex: palette.roles.text },
  ];

  return (
    <div
      style={{
        width: 1080,
        height: 1350,
        background: palette.roles.background,
        color: palette.roles.text,
        padding: 64,
        fontFamily: fontPair.bodyFamily,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        gap: 32,
      }}
    >
      <div>
        <div
          style={{
            fontFamily: fontPair.headingFamily,
            fontSize: 64,
            fontWeight: 700,
            lineHeight: 1.05,
            color: palette.primary,
          }}
        >
          Your brand kit
        </div>
        <div style={{ fontSize: 22, color: palette.roles.mutedText, marginTop: 8 }}>
          Generated with Palette Studio · {fontPair.heading} / {fontPair.body}
        </div>
      </div>

      <div>
        <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Roles</div>
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

      <div>
        <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Primary scale</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(10, 1fr)", gap: 6 }}>
          {Object.entries(palette.primaryScale).map(([stop, hex]) => (
            <div key={stop} style={{ background: hex, height: 60, borderRadius: 8, color: readableOn(hex), fontSize: 11, padding: 6, fontWeight: 700 }}>
              {stop}
            </div>
          ))}
        </div>
      </div>

      <div>
        <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Accent scale</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(10, 1fr)", gap: 6 }}>
          {Object.entries(palette.accentScale).map(([stop, hex]) => (
            <div key={stop} style={{ background: hex, height: 60, borderRadius: 8, color: readableOn(hex), fontSize: 11, padding: 6, fontWeight: 700 }}>
              {stop}
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          marginTop: "auto",
          padding: 24,
          background: palette.roles.surface,
          borderRadius: 16,
          border: `1px solid ${palette.roles.border}`,
        }}
      >
        <div style={{ fontFamily: fontPair.headingFamily, fontSize: 36, fontWeight: 700, color: palette.primary }}>
          The quick brown fox.
        </div>
        <div style={{ fontSize: 18, marginTop: 8, color: palette.roles.text }}>
          Body copy in {fontPair.body}. Built with Palette Studio — part of Opsette Tools.
        </div>
      </div>
    </div>
  );
}
