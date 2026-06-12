import { Card, Radio, Typography } from "antd";
import { HARMONY_OPTIONS, type HarmonyRule } from "../../lib/harmony";

type Props = { value: HarmonyRule; onChange: (r: HarmonyRule) => void };

export function HarmonyPicker({ value, onChange }: Props) {
  const current = HARMONY_OPTIONS.find((o) => o.value === value)!;
  return (
    <Card title="2. Choose a harmony rule">
      <Radio.Group
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ display: "flex", flexWrap: "wrap", gap: 8 }}
      >
        {HARMONY_OPTIONS.map((o) => (
          <Radio.Button key={o.value} value={o.value}>
            {o.label}
          </Radio.Button>
        ))}
      </Radio.Group>
      <Typography.Paragraph type="secondary" style={{ marginTop: 12, marginBottom: 0 }}>
        {current.caption}
      </Typography.Paragraph>
    </Card>
  );
}
