import { Card, Typography, message } from "antd";
import type { Scale } from "../../lib/color";
import { readableOn } from "../../lib/color";

function copy(hex: string) {
  void navigator.clipboard.writeText(hex);
  void message.success(`Copied ${hex}`);
}

function Strip({ label, scale }: { label: string; scale: Scale }) {
  return (
    <div>
      <Typography.Text strong style={{ fontSize: 13 }}>
        {label}
      </Typography.Text>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(10, minmax(0, 1fr))",
          gap: 4,
          marginTop: 6,
        }}
      >
        {Object.entries(scale).map(([stop, hex]) => (
          <button
            key={stop}
            onClick={() => copy(hex)}
            title={`${stop}: ${hex}`}
            style={{
              background: hex,
              color: readableOn(hex),
              border: "none",
              borderRadius: 6,
              padding: "10px 2px",
              cursor: "pointer",
              fontSize: 10,
              fontWeight: 600,
            }}
          >
            {stop}
          </button>
        ))}
      </div>
    </div>
  );
}

export function ScaleStrips({
  primary,
  accent,
  neutrals,
}: {
  primary: Scale;
  accent: Scale;
  neutrals: Scale;
}) {
  return (
    <Card title="Tint & shade scales">
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Strip label="Primary 50–900" scale={primary} />
        <Strip label="Accent 50–900" scale={accent} />
        <Strip label="Neutral 50–900 (tinted gray)" scale={neutrals} />
      </div>
    </Card>
  );
}
