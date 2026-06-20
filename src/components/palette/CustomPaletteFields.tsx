import { Button, ColorPicker, Input, Select, Typography, message } from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { useEffect, useRef, useState } from "react";
import { normalizeHex } from "../../lib/color";
import {
  CUSTOM_ROLE_OPTIONS,
  suggestRole,
  suggestRolesForList,
  type CustomColor,
  type CustomRole,
} from "../../lib/harmony";

const isValidHex = (s: string) => /^#?[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/.test(s.trim());

// Internal row keeps raw text so half-typed hex values aren't clobbered; the
// parent only ever receives the valid, normalized subset.
type Row = { hex: string; role: CustomRole; name: string };

type Props = {
  /** Current valid colors from the parent (source of truth). */
  colors: CustomColor[];
  /** Emits the new valid color list whenever the user edits a row. */
  onChange: (colors: CustomColor[]) => void;
};

// A row becomes a CustomColor only once its hex is valid; otherwise it's dropped
// from what we emit (but stays editable on screen).
function toCustom(r: Row): CustomColor | null {
  if (!isValidHex(r.hex)) return null;
  return { hex: normalizeHex(r.hex), role: r.role, name: r.name.trim() || undefined };
}

function seedRows(colors: CustomColor[]): Row[] {
  if (colors.length) return colors.map((c) => ({ hex: c.hex, role: c.role, name: c.name ?? "" }));
  return [
    { hex: "#2f6f8f", role: "button", name: "" },
    { hex: "", role: "pageBg", name: "" },
  ];
}

/**
 * Bring-your-own palette editor. The user enters her colors and, for each one,
 * assigns a role (Primary, Background, Text…) and an optional name. The app
 * suggests a sensible role from the color's lightness, which she can override.
 * Only the colors she enters appear downstream — nothing is derived or invented.
 */
// Compact signature of a CustomColor list, used to tell an external change (e.g.
// the photo handoff seeding all colors) apart from our own edits echoing back
// through the parent. Without this the local rows and the emitted list could
// drift — the on-screen dropdowns showing one set of roles while the export used
// a stale set (the duplicate/wrong-role bug).
function signature(colors: CustomColor[]): string {
  return colors.map((c) => `${normalizeHex(c.hex)}|${c.role}|${c.name ?? ""}`).join(";");
}

export function CustomPaletteFields({ colors, onChange }: Props) {
  const [rows, setRows] = useState<Row[]>(() => seedRows(colors));
  // The signature of the list we last emitted upward. When the incoming `colors`
  // prop differs from this, the change came from OUTSIDE (not our own edit) and
  // we re-seed the rows so the editor reflects it. When it matches, it's just our
  // edit round-tripping — we leave the in-progress rows (and any half-typed hex)
  // untouched.
  const lastEmitted = useRef<string>(signature(seedRows(colors).map(toCustom).filter(Boolean) as CustomColor[]));

  // Re-seed the rows when the parent hands us a genuinely different color list.
  useEffect(() => {
    const incoming = signature(colors);
    if (incoming !== lastEmitted.current) {
      lastEmitted.current = incoming;
      setRows(seedRows(colors));
    }
  }, [colors]);

  // Push the valid subset up whenever rows change.
  useEffect(() => {
    const valid: CustomColor[] = rows.map(toCustom).filter(Boolean) as CustomColor[];
    lastEmitted.current = signature(valid);
    onChange(valid);
    // onChange is stable from the parent; depend only on rows.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows]);

  function setRow(i: number, patch: Partial<Row>) {
    setRows((r) => r.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));
  }

  function onHexChange(i: number, val: string) {
    // Pasting a whole list at once fills multiple rows.
    if (pasteList(val)) return;
    // When a valid color is typed and the row hasn't had its role hand-set yet,
    // re-suggest the role from the new color so the default tracks the color.
    setRows((r) =>
      r.map((x, idx) =>
        idx === i
          ? { ...x, hex: val, role: isValidHex(val) ? suggestRole(normalizeHex(val), idx) : x.role }
          : x,
      ),
    );
  }

  function addRow() {
    if (rows.length >= 8) {
      void message.info("Eight colors is the max for a palette.");
      return;
    }
    setRows((r) => [...r, { hex: "", role: "accent" as CustomRole, name: "" }]);
  }

  function removeRow(i: number) {
    setRows((r) => (r.length <= 1 ? r : r.filter((_, idx) => idx !== i)));
  }

  function pasteList(text: string): boolean {
    const found = text.match(/#?[0-9a-fA-F]{6}|#?[0-9a-fA-F]{3}\b/g);
    if (!found || found.length < 2) return false;
    const hexes = found.slice(0, 8).map((h) => normalizeHex(h));
    // Distinct role per color across the whole pasted set (no duplicate roles).
    const roles = suggestRolesForList(hexes);
    setRows(hexes.map((hex, idx) => ({ hex, role: roles[idx], name: "" })));
    return true;
  }

  return (
    <div>
      <Typography.Text type="secondary" style={{ display: "block", marginBottom: 14 }}>
        Already have your colors? Add them below and tell us what each one is for. We'll show
        exactly the colors you enter — nothing extra — and check them for readability in the roles
        you choose.
      </Typography.Text>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {rows.map((row, i) => {
          const valid = isValidHex(row.hex);
          const swatch = valid ? normalizeHex(row.hex) : "#ffffff";
          return (
            <div
              key={i}
              className="ps-custom-row"
              style={{
                display: "grid",
                gridTemplateColumns: "36px minmax(110px, 150px) minmax(130px, 160px) 1fr auto",
                gap: 10,
                alignItems: "center",
              }}
            >
              <ColorPicker value={swatch} onChange={(c) => onHexChange(i, "#" + c.toHex())}>
                <span
                  role="button"
                  title="Open the color picker"
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    background: swatch,
                    border: "1px solid rgba(0,0,0,0.14)",
                    cursor: "pointer",
                    display: "block",
                  }}
                />
              </ColorPicker>

              <Input
                value={row.hex}
                onChange={(e) => onHexChange(i, e.target.value)}
                placeholder="#hex code"
                status={row.hex.length > 0 && !valid ? "error" : undefined}
                style={{ fontFamily: "monospace" }}
              />

              <Select
                value={row.role}
                onChange={(role) => setRow(i, { role })}
                options={CUSTOM_ROLE_OPTIONS.map((o) => ({
                  label: o.label,
                  value: o.value,
                  title: o.hint,
                }))}
              />

              <Input
                value={row.name}
                onChange={(e) => setRow(i, { name: e.target.value })}
                placeholder="Name (optional) — e.g. Cream"
                maxLength={32}
              />

              <Button
                type="text"
                size="small"
                icon={<DeleteOutlined />}
                aria-label="Remove this color"
                disabled={rows.length <= 1}
                onClick={() => removeRow(i)}
              />
            </div>
          );
        })}
      </div>

      <Button
        type="dashed"
        size="small"
        icon={<PlusOutlined />}
        onClick={addRow}
        disabled={rows.length >= 8}
        style={{ marginTop: 12 }}
      >
        Add a color
      </Button>

      <Typography.Text type="secondary" style={{ display: "block", marginTop: 12, fontSize: 12 }}>
        Tip: paste a list of hex codes into any field to fill the rows at once. Assign one color to{" "}
        <strong>Page background</strong> and one to <strong>Body text</strong> so the readability
        check has something to compare.
      </Typography.Text>
    </div>
  );
}
