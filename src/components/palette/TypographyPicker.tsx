import { Card, Radio, Select, Typography } from "antd";
import { useEffect } from "react";
import { FONT_PAIRS, loadFontPair, type FontPair } from "../../lib/presets";
import type { Palette } from "../../lib/harmony";
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
      {isMobile ? (
        // Same as the harmony rule — wrapping buttons get messy on phones.
        <Select
          value={pair.id}
          onChange={(id) => onChange(FONT_PAIRS.find((f) => f.id === id)!)}
          options={FONT_PAIRS.map((f) => ({ label: f.label, value: f.id }))}
          style={{ width: "100%" }}
          size="large"
        />
      ) : (
        <Radio.Group
          value={pair.id}
          onChange={(e) => onChange(FONT_PAIRS.find((f) => f.id === e.target.value)!)}
          style={{ display: "flex", flexWrap: "wrap", gap: 8 }}
        >
          {FONT_PAIRS.map((f) => (
            <Radio.Button key={f.id} value={f.id}>
              {f.label}
            </Radio.Button>
          ))}
        </Radio.Group>
      )}
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
            color: palette.primary,
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
          This is what body copy will look like on a card surface. Notice the rhythm
          between the heading and the body — that's the pairing doing its job.
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
              color: "#fff",
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
              color: "#fff",
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
