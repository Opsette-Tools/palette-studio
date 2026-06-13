import { Segmented, Typography } from "antd";
import { VIBRANCY_OPTIONS, type Vibrancy } from "../../lib/harmony";

type Props = { value: Vibrancy; onChange: (v: Vibrancy) => void };

export function VibrancyPicker({ value, onChange }: Props) {
  return (
    <div style={{ marginTop: 16 }}>
      <Typography.Text strong style={{ display: "block", marginBottom: 8 }}>
        Vibrancy
      </Typography.Text>
      <Segmented
        value={value}
        onChange={(v) => onChange(v as Vibrancy)}
        options={VIBRANCY_OPTIONS.map((o) => ({ label: o.label, value: o.value }))}
        block
      />
      <Typography.Paragraph type="secondary" style={{ marginTop: 8, marginBottom: 0, fontSize: 13 }}>
        Muted is soft and grown-up; Vibrant pushes the colors bolder. Same hues, more or less punch.
      </Typography.Paragraph>
    </div>
  );
}
