import { Card, Radio, Select, Typography } from "antd";
import { useEffect } from "react";
import { FONT_PAIRS, loadFontPair, type FontPair } from "../../lib/presets";
import type { Palette } from "../../lib/harmony";
import { readableOn } from "../../lib/color";
import { useIsMobile } from "../../hooks/use-mobile";

type Props = {
  palette: Palette;
  pair: FontPair;
  onFontChange: (p: FontPair) => void;
};

/**
 * The always-visible "how do my colors actually land?" preview. Renders a small
 * but realistic UI — page background, a card on the section background, heading
 * and body text, a Buttons/CTA + Secondary button, and an accent badge — using
 * the exact roles the user assigned. Pairs with the font picker so she sees
 * type + color together. Meant to live sticky beside the color editor so there's
 * no scrolling to judge the result.
 */
export function LivePreview({ palette, pair, onFontChange }: Props) {
  const isMobile = useIsMobile();
  const { roles } = palette;

  useEffect(() => {
    FONT_PAIRS.forEach(loadFontPair);
  }, []);

  return (
    <Card
      title="Live preview"
      styles={{ body: { padding: 16 } }}
      extra={<span style={{ fontSize: 12, color: "#6b7280" }}>Your colors, in a real layout</span>}
    >
      {isMobile ? (
        <Select
          value={pair.id}
          onChange={(id) => onFontChange(FONT_PAIRS.find((f) => f.id === id)!)}
          options={FONT_PAIRS.map((f) => ({ label: f.label, value: f.id }))}
          style={{ width: "100%", marginBottom: 12 }}
          size="large"
        />
      ) : (
        <Radio.Group
          value={pair.id}
          onChange={(e) => onFontChange(FONT_PAIRS.find((f) => f.id === e.target.value)!)}
          style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}
        >
          {FONT_PAIRS.map((f) => (
            <Radio.Button key={f.id} value={f.id}>
              {f.label}
            </Radio.Button>
          ))}
        </Radio.Group>
      )}

      {/* The mock page: page background wraps a section-background card. */}
      <div
        style={{
          background: roles.background,
          borderRadius: 14,
          padding: 18,
          border: `1px solid ${roles.border}`,
        }}
      >
        <div
          style={{
            fontFamily: pair.headingFamily,
            fontWeight: 700,
            fontSize: 15,
            color: roles.text,
            opacity: 0.85,
            marginBottom: 12,
          }}
        >
          On the page background
        </div>

        <div
          style={{
            background: roles.surface,
            color: roles.text,
            borderRadius: 12,
            padding: 18,
            border: `1px solid ${roles.border}`,
          }}
        >
          <div
            style={{
              fontFamily: pair.headingFamily,
              fontWeight: 700,
              fontSize: 24,
              lineHeight: 1.15,
              color: palette.primary,
            }}
          >
            Your brand, in context.
          </div>
          <div
            style={{ fontFamily: pair.bodyFamily, fontSize: 14, marginTop: 8, color: roles.text }}
          >
            This is your body text on a section background. The heading uses your buttons / CTA
            color so you can see how the pieces sit together.
          </div>
          <div
            style={{
              fontFamily: pair.bodyFamily,
              fontSize: 12.5,
              marginTop: 6,
              color: roles.mutedText,
            }}
          >
            Secondary text sits a little quieter than the body.
          </div>

          <div
            style={{
              display: "flex",
              gap: 8,
              marginTop: 14,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <button
              style={{
                background: palette.primary,
                color: readableOn(palette.primary),
                border: "none",
                borderRadius: 8,
                padding: "8px 14px",
                fontFamily: pair.bodyFamily,
                fontWeight: 600,
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
                borderRadius: 8,
                padding: "8px 14px",
                fontFamily: pair.bodyFamily,
                fontWeight: 600,
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
                padding: "4px 10px",
                fontFamily: pair.bodyFamily,
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              Accent badge
            </span>
          </div>
        </div>
      </div>

      <Typography.Text type="secondary" style={{ display: "block", marginTop: 10, fontSize: 12 }}>
        Heading: {pair.heading} · Body: {pair.body}
      </Typography.Text>
    </Card>
  );
}
