import { Card, Select, Typography } from "antd";
import { useEffect } from "react";
import { FONT_PAIRS, loadFontPair, type FontPair } from "../../lib/presets";
import type { Palette } from "../../lib/harmony";
import { readableOn } from "../../lib/color";
import { useIsMobile } from "../../hooks/use-mobile";

type Props = {
  pair: FontPair;
  onChange: (p: FontPair) => void;
  palette: Palette;
};

export function TypographyPicker({ pair, onChange, palette }: Props) {
  const isMobile = useIsMobile();
  useEffect(() => {
    FONT_PAIRS.forEach(loadFontPair);
  }, []);

  return (
    <Card title="5. Font pairing">
      {/* One dropdown for the whole font library — each option renders in its own
          heading font so the menu doubles as a type preview. */}
      <Select
        value={pair.id}
        onChange={(id) => onChange(FONT_PAIRS.find((f) => f.id === id)!)}
        style={{ width: "100%" }}
        size={isMobile ? "large" : "middle"}
        labelRender={({ value }) => {
          const f = FONT_PAIRS.find((p) => p.id === value);
          return <span style={{ fontFamily: f?.headingFamily }}>{f?.label}</span>;
        }}
        options={FONT_PAIRS.map((f) => ({
          value: f.id,
          label: <span style={{ fontFamily: f.headingFamily, fontSize: 15 }}>{f.label}</span>,
        }))}
        onDropdownVisibleChange={(open) => {
          if (open) FONT_PAIRS.forEach(loadFontPair);
        }}
      />
      <div
        style={{
          marginTop: 16,
          background: palette.roles.surface,
          color: palette.roles.text,
          borderRadius: 12,
          padding: 20,
          border: `1px solid ${palette.roles.border}`,
        }}
      >
        <div
          style={{
            fontFamily: pair.headingFamily,
            fontWeight: 700,
            fontSize: 28,
            lineHeight: 1.15,
            color: palette.roles.heading,
          }}
        >
          Your brand, beautifully balanced.
        </div>
        <div
          style={{
            fontFamily: pair.bodyFamily,
            fontSize: 15,
            marginTop: 10,
            color: palette.roles.text,
          }}
        >
          This is what body copy will look like on a card surface. Notice the rhythm between the
          heading and the body — that's the pairing doing its job.
        </div>
        <div
          style={{
            fontFamily: pair.bodyFamily,
            fontSize: 13,
            marginTop: 8,
            color: palette.roles.mutedText,
          }}
        >
          Muted text uses the same family at a lower contrast.
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
          <button
            style={{
              background: palette.primary,
              color: readableOn(palette.primary),
              border: "none",
              borderRadius: 8,
              padding: "8px 14px",
              fontFamily: pair.bodyFamily,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Primary action
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
              cursor: "pointer",
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
              alignSelf: "center",
            }}
          >
            Accent badge
          </span>
        </div>
      </div>
      <Typography.Text type="secondary" style={{ display: "block", marginTop: 8, fontSize: 12 }}>
        Heading: {pair.heading} · Body: {pair.body}
      </Typography.Text>
    </Card>
  );
}
