import { Card, Tooltip, message } from "antd";
import { CopyOutlined } from "@ant-design/icons";
import type { Palette } from "../../lib/harmony";
import { readableOn } from "../../lib/color";

type Swatch = {
  label: string;
  hex: string;
  hint: string;
};

function copy(hex: string) {
  void navigator.clipboard.writeText(hex);
  void message.success(`Copied ${hex}`);
}

function Tile({ s }: { s: Swatch }) {
  const fg = readableOn(s.hex);
  return (
    <Tooltip title={s.hint}>
      <button
        onClick={() => copy(s.hex)}
        style={{
          background: s.hex,
          color: fg,
          border: "none",
          borderRadius: 14,
          padding: 16,
          height: 130,
          textAlign: "left",
          cursor: "pointer",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
        }}
      >
        <div style={{ fontWeight: 700, fontSize: 14 }}>{s.label}</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontFamily: "monospace", fontSize: 13 }}>{s.hex}</span>
          <CopyOutlined style={{ opacity: 0.8 }} />
        </div>
      </button>
    </Tooltip>
  );
}

export function PaletteGrid({ palette }: { palette: Palette }) {
  const swatches: Swatch[] = [
    { label: "Primary", hex: palette.primary, hint: "Use for primary buttons, links, key brand moments." },
    { label: "Secondary", hex: palette.secondary, hint: "Supporting actions, secondary buttons, highlights." },
    { label: "Accent", hex: palette.accent, hint: "Sparingly — badges, callouts, small details." },
    ...(palette.accent2
      ? [{ label: "Accent 2", hex: palette.accent2, hint: "The fourth tetradic hue — extra variety for charts or tags." }]
      : []),
    { label: "Background", hex: palette.roles.background, hint: "The page background — biggest surface." },
    { label: "Surface", hex: palette.roles.surface, hint: "Cards, modals, anything elevated above the page." },
    { label: "Text", hex: palette.roles.text, hint: "Body copy and headings on light surfaces." },
    { label: "Muted text", hex: palette.roles.mutedText, hint: "Captions, hints, secondary labels." },
    { label: "Border", hex: palette.roles.border, hint: "Dividers, input borders, subtle outlines." },
  ];

  return (
    <Card title="3. Your palette" extra={<span style={{ fontSize: 12, color: "#6b7280" }}>Tap any swatch to copy</span>}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
          gap: 12,
        }}
      >
        {swatches.map((s) => (
          <Tile key={s.label} s={s} />
        ))}
      </div>
    </Card>
  );
}
