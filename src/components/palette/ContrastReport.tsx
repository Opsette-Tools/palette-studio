import { Card, Tag, Typography } from "antd";
import type { Palette } from "../../lib/harmony";
import { contrastRatio, wcagLevel } from "../../lib/color";

type Pair = { label: string; fg: string; bg: string; note: string };

function levelColor(level: string) {
  if (level === "AAA") return "green";
  if (level === "AA") return "blue";
  if (level === "AA Large") return "gold";
  return "red";
}

export function ContrastReport({ palette }: { palette: Palette }) {
  const pairs: Pair[] = [
    { label: "Body text on background", fg: palette.roles.text, bg: palette.roles.background, note: "Most of your reading happens here." },
    { label: "Body text on surface", fg: palette.roles.text, bg: palette.roles.surface, note: "Card content." },
    { label: "Muted text on background", fg: palette.roles.mutedText, bg: palette.roles.background, note: "Captions, hints." },
    { label: "White on primary", fg: "#ffffff", bg: palette.primary, note: "Primary button label." },
    { label: "White on accent", fg: "#ffffff", bg: palette.accent, note: "Accent badges or buttons." },
    { label: "Primary on background", fg: palette.primary, bg: palette.roles.background, note: "Links and primary text moments." },
  ];

  return (
    <Card title="4. Accessibility check">
      <Typography.Paragraph type="secondary" style={{ marginTop: 0 }}>
        WCAG contrast ratios for the most common text pairings. Aim for AA (4.5+) on body copy.
      </Typography.Paragraph>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {pairs.map((p) => {
          const ratio = contrastRatio(p.fg, p.bg);
          const level = wcagLevel(ratio);
          const fail = level === "Fail";
          return (
            <div
              key={p.label}
              style={{
                display: "grid",
                gridTemplateColumns: "auto 1fr auto",
                gap: 12,
                alignItems: "center",
                padding: 10,
                border: "1px solid #f0f0f0",
                borderRadius: 10,
              }}
            >
              <div
                style={{
                  background: p.bg,
                  color: p.fg,
                  borderRadius: 8,
                  padding: "8px 12px",
                  fontWeight: 600,
                  minWidth: 64,
                  textAlign: "center",
                }}
              >
                Aa
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{p.label}</div>
                <div style={{ fontSize: 12, color: fail ? "#cf1322" : "#6b7280" }}>
                  {fail ? `Hard to read — try a darker text or lighter background.` : p.note}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <Tag color={levelColor(level)} style={{ margin: 0 }}>
                  {level}
                </Tag>
                <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>
                  {ratio.toFixed(2)}:1
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
