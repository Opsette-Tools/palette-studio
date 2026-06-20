import { Card, Select, Typography } from "antd";
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
      {/* One dropdown for the whole font library (it's grown past what a chip grid
          can hold). Each option renders in its OWN heading font, so the menu is a
          real type preview rather than a plain list. */}
      <div style={{ marginBottom: 12 }}>
        <Typography.Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>
          Font pairing
        </Typography.Text>
        <Select
          value={pair.id}
          onChange={(id) => onFontChange(FONT_PAIRS.find((f) => f.id === id)!)}
          style={{ width: "100%" }}
          size={isMobile ? "large" : "middle"}
          // Show the picked pair's name in its own font in the closed control too.
          labelRender={({ value }) => {
            const f = FONT_PAIRS.find((p) => p.id === value);
            return <span style={{ fontFamily: f?.headingFamily }}>{f?.label}</span>;
          }}
          options={FONT_PAIRS.map((f) => ({
            value: f.id,
            label: (
              <span style={{ fontFamily: f.headingFamily, fontSize: 15 }}>{f.label}</span>
            ),
          }))}
          // Make the preview real: each option's font is loaded as the menu opens.
          onDropdownVisibleChange={(open) => {
            if (open) FONT_PAIRS.forEach(loadFontPair);
          }}
        />
      </div>

      {/* The mock page — shared with the exported brand kit so the preview and the
          download show the exact same composition. */}
      <BrandMockup palette={palette} pair={pair} />

      <Typography.Text type="secondary" style={{ display: "block", marginTop: 10, fontSize: 12 }}>
        Heading: {pair.heading} · Body: {pair.body}
      </Typography.Text>
    </Card>
  );
}
