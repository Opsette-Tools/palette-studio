import { Button, Typography } from "antd";
import { CheckOutlined } from "@ant-design/icons";

/**
 * EmbedSaveBar — the slim top bar shown ONLY when Palette Studio runs inside a
 * Brand Board iframe (Mechanism 3, ?embed=1). It replaces the app's own header
 * so the drawer reads as one surface, and gives the one action the embed needs:
 * push the revised palette back to the board. Closing the drawer is the parent's
 * job (the Drawer's own X / mask), so this bar carries only Save.
 */
export function EmbedSaveBar({
  onSave,
  saving,
}: {
  onSave: () => void;
  saving: boolean;
}) {
  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 10,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        padding: "10px 16px",
        background: "#2f4f46",
        color: "#fff",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.25 }}>
        <Typography.Text style={{ color: "#fff", fontWeight: 600, fontSize: 14 }}>
          Editing your palette
        </Typography.Text>
        <Typography.Text style={{ color: "rgba(255,255,255,0.72)", fontSize: 12 }}>
          Changes stay here until you send them back to the board.
        </Typography.Text>
      </div>
      <Button
        type="primary"
        icon={<CheckOutlined />}
        loading={saving}
        onClick={onSave}
        style={{ background: "#fff", color: "#2f4f46", borderColor: "#fff", flexShrink: 0 }}
      >
        Save to Brand Board
      </Button>
    </div>
  );
}
