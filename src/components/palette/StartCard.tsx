import { Card, ColorPicker, Input, Segmented, Button, Typography, Space } from "antd";
import { ThunderboltOutlined } from "@ant-design/icons";
import { useState } from "react";
import { VIBES } from "../../lib/presets";
import { normalizeHex } from "../../lib/color";
import { randomBase } from "../../lib/harmony";

type Props = { value: string; onChange: (hex: string) => void };

export function StartCard({ value, onChange }: Props) {
  const [mode, setMode] = useState<"color" | "vibe" | "surprise">("color");
  const [hexInput, setHexInput] = useState(value);

  return (
    <Card title="1. Start with a color">
      <Segmented
        block
        value={mode}
        onChange={(v) => setMode(v as typeof mode)}
        options={[
          { label: "Pick a color", value: "color" },
          { label: "Pick a vibe", value: "vibe" },
          { label: "Surprise me", value: "surprise" },
        ]}
      />
      <div style={{ marginTop: 20 }}>
        {mode === "color" && (
          <Space direction="vertical" size="middle" style={{ width: "100%" }}>
            <Space wrap>
              <ColorPicker
                value={value}
                onChange={(c) => {
                  const hex = "#" + c.toHex();
                  setHexInput(hex);
                  onChange(hex);
                }}
                showText
                size="large"
              />
              <Input
                value={hexInput}
                onChange={(e) => setHexInput(e.target.value)}
                onBlur={() => onChange(normalizeHex(hexInput))}
                onPressEnter={() => onChange(normalizeHex(hexInput))}
                placeholder="#2f4f46"
                style={{ width: 140 }}
              />
            </Space>
            <Typography.Text type="secondary">
              Tip: pick a color you love — we'll build everything else from it.
            </Typography.Text>
          </Space>
        )}

        {mode === "vibe" && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
              gap: 12,
            }}
          >
            {VIBES.map((v) => {
              const selected = value.toLowerCase() === v.hex.toLowerCase();
              return (
                <button
                  key={v.id}
                  onClick={() => onChange(v.hex)}
                  style={{
                    border: selected ? "2px solid #2f4f46" : "1px solid #e5e7eb",
                    background: "#fff",
                    borderRadius: 12,
                    padding: 12,
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <div
                    style={{
                      height: 44,
                      borderRadius: 8,
                      background: v.hex,
                      marginBottom: 8,
                    }}
                  />
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{v.label}</div>
                  <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>
                    {v.description}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {mode === "surprise" && (
          <Space direction="vertical" size="middle" style={{ width: "100%" }}>
            <Button
              type="primary"
              size="large"
              icon={<ThunderboltOutlined />}
              onClick={() => onChange(randomBase())}
              block
            >
              Surprise me with a color
            </Button>
            <Typography.Text type="secondary">
              We'll pick a balanced hue that's easy to build a palette around.
            </Typography.Text>
          </Space>
        )}
      </div>
    </Card>
  );
}
