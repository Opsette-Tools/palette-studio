import { Card, Tooltip, message } from "antd";
import { CopyOutlined } from "@ant-design/icons";
import type { Palette } from "../../lib/harmony";
import { CUSTOM_ROLE_OPTIONS } from "../../lib/harmony";
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
          borderRadius: 12,
          padding: 12,
          height: 96,
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

function roleLabel(role: string): string {
  return CUSTOM_ROLE_OPTIONS.find((o) => o.value === role)?.label ?? role;
}

export function PaletteGrid({ palette }: { palette: Palette }) {
  // Custom palette: show ONLY the colors the user supplied, labeled with their
  // own name (or the role they assigned). Nothing is derived or invented here.
  const swatches: Swatch[] = palette.custom
    ? palette.custom.map((c) => ({
        label: c.name?.trim() || roleLabel(c.role),
        hex: c.hex,
        hint: c.name?.trim() ? `${roleLabel(c.role)} · ${c.hex}` : "Tap to copy.",
      }))
    : [
        {
          label: "Buttons / CTA",
          hex: palette.primary,
          hint: "Your main buttons, calls-to-action, headings, and links.",
        },
        {
          label: "Secondary button",
          hex: palette.secondary,
          hint: "The quieter, outline-style button.",
        },
        {
          label: "Accent",
          hex: palette.accent,
          hint: "Sparingly — badges, callouts, small details.",
        },
        ...(palette.accent2
          ? [
              {
                label: "Accent 2",
                hex: palette.accent2,
                hint: "An extra accent — handy for charts or tags.",
              },
            ]
          : []),
        {
          label: "Page background",
          hex: palette.roles.background,
          hint: "The color behind your whole page.",
        },
        {
          label: "Card background",
          hex: palette.roles.surface,
          hint: "Cards and panels that sit on top of the page.",
        },
        {
          label: "Heading",
          hex: palette.roles.heading,
          hint: "Your titles and section headings.",
        },
        {
          label: "Body text",
          hex: palette.roles.text,
          hint: "Your paragraphs and longer copy.",
        },
        {
          label: "Muted text",
          hex: palette.roles.mutedText,
          hint: "Captions, hints, quieter labels.",
        },
        {
          label: "Border",
          hex: palette.roles.border,
          hint: "Dividers, input borders, subtle outlines.",
        },
      ];

  return (
    <Card
      title="3. Your palette"
      extra={<span style={{ fontSize: 12, color: "#6b7280" }}>Tap any swatch to copy</span>}
    >
      <div
        className="ps-swatch-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: 10,
        }}
      >
        {swatches.map((s, i) => (
          <Tile key={`${s.label}-${i}`} s={s} />
        ))}
      </div>
    </Card>
  );
}
