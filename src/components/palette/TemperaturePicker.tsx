import { Segmented, Typography } from "antd";
import { TEMPERATURE_OPTIONS, type Temperature } from "../../lib/harmony";

type Props = { value: Temperature; onChange: (t: Temperature) => void };

export function TemperaturePicker({ value, onChange }: Props) {
  return (
    <div style={{ marginTop: 16 }}>
      <Typography.Text strong style={{ display: "block", marginBottom: 8 }}>
        Temperature
      </Typography.Text>
      <Segmented
        value={value}
        onChange={(t) => onChange(t as Temperature)}
        options={TEMPERATURE_OPTIONS.map((o) => ({ label: o.label, value: o.value }))}
        block
      />
      <Typography.Paragraph type="secondary" style={{ marginTop: 8, marginBottom: 0, fontSize: 13 }}>
        Nudge the whole palette toward cool blues or warm reds — keeps the harmony, shifts the mood.
      </Typography.Paragraph>
    </div>
  );
}
