import type { ReactNode } from "react";
import { Card, Radio, Select, Typography } from "antd";
import { HARMONY_OPTIONS, type HarmonyRule } from "../../lib/harmony";
import { useIsMobile } from "../../hooks/use-mobile";

type Props = {
  value: HarmonyRule;
  onChange: (r: HarmonyRule) => void;
  vibrancy?: ReactNode;
};

export function HarmonyPicker({ value, onChange, vibrancy }: Props) {
  const current = HARMONY_OPTIONS.find((o) => o.value === value)!;
  const isMobile = useIsMobile();
  return (
    <Card title="2. Choose a harmony rule">
      {isMobile ? (
        // On phones the 7 buttons stack into messy rows — a dropdown is cleaner.
        <Select
          value={value}
          onChange={(v) => onChange(v)}
          options={HARMONY_OPTIONS.map((o) => ({ label: o.label, value: o.value }))}
          style={{ width: "100%" }}
          size="large"
        />
      ) : (
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
      )}
      <Typography.Paragraph type="secondary" style={{ marginTop: 12, marginBottom: 0 }}>
        {current.caption}
      </Typography.Paragraph>
      {vibrancy}
    </Card>
  );
}
