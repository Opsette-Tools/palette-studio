import { Card, Radio, Select, Typography } from "antd";
import { useEffect } from "react";
import { FONT_PAIRS, loadFontPair, type FontPair } from "../../lib/presets";
import type { Palette } from "../../lib/harmony";
import { useIsMobile } from "../../hooks/use-mobile";
import { BrandMockup } from "./BrandMockup";

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

      {/* The mock page — shared with the exported brand kit so the preview and the
          download show the exact same composition. */}
      <BrandMockup palette={palette} pair={pair} />

      <Typography.Text type="secondary" style={{ display: "block", marginTop: 10, fontSize: 12 }}>
        Heading: {pair.heading} · Body: {pair.body}
      </Typography.Text>
    </Card>
  );
}
