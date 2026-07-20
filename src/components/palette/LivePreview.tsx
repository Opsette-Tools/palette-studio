import { Card, Typography } from "antd";
import { useEffect } from "react";
import { FONT_PAIRS, loadFontPair, getFontPair, type FontPair } from "../../lib/presets";
import type { Palette } from "../../lib/harmony";
import { useIsMobile } from "../../hooks/use-mobile";
import { OpsetteFontPicker } from "../opsette-font-picker";
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
      {/* The shared Opsette font picker: grouped by vibe, each option in its own
          heading font. Value is the library pairing id; resolve it back to the
          flat FontPair this preview + the exported kit use. */}
      <div style={{ marginBottom: 12 }}>
        <Typography.Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>
          Font pairing
        </Typography.Text>
        <OpsetteFontPicker
          value={pair.id}
          onChange={(id) => onFontChange(getFontPair(id))}
          size={isMobile ? "large" : "middle"}
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
