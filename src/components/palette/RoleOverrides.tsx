import { Card, Button, Typography, Grid } from "antd";
import { UndoOutlined } from "@ant-design/icons";
import type { RoleKey, RoleOverrides as Overrides } from "../../lib/harmony";
import { derivedRoleColors } from "../../lib/harmony";

const { Text } = Typography;

// The six roles, in the order a person reads a page: canvas first, then ink,
// then the quiet structural bits. Each carries a plain-language hint so the
// field explains itself without design jargon.
const ROLES: { key: RoleKey; label: string; hint: string }[] = [
  { key: "background", label: "Page background", hint: "Behind the whole page." },
  { key: "surface", label: "Card background", hint: "Cards and panels on top of the page." },
  { key: "heading", label: "Heading", hint: "Titles and section headings." },
  { key: "text", label: "Body text", hint: "Paragraphs and longer copy." },
  { key: "mutedText", label: "Muted text", hint: "Captions, hints, quieter labels." },
  { key: "border", label: "Border", hint: "Dividers, input borders, subtle outlines." },
];

// A single hex → normalized #rrggbb (lowercase) or null if it isn't a full hex.
// The native color input only ever emits valid #rrggbb, so this mainly guards
// the typed field.
function normalizeHex(raw: string): string | null {
  const v = raw.trim().toLowerCase();
  return /^#[0-9a-f]{6}$/.test(v) ? v : null;
}

/**
 * RoleOverrides — lets a GENERATED palette pin any of its six derived role
 * colors to an exact hex. The roles are computed from the neutral ramp (which is
 * faintly tinted toward the brand hue), so e.g. the border can come out looking
 * cool/blue; this is where you override it to a true grey (or anything). Only
 * pinned roles are stored; the rest stay derived and keep tracking the harmony.
 *
 * Not shown in "My own colors" mode — there you assign role colors directly, so
 * there's nothing to override.
 */
export function RoleOverridesPanel({
  base,
  rule,
  vibrancy,
  temperature,
  overrides,
  onSet,
  onClear,
}: {
  base: string;
  rule: Parameters<typeof derivedRoleColors>[1];
  vibrancy: Parameters<typeof derivedRoleColors>[2];
  temperature: Parameters<typeof derivedRoleColors>[3];
  overrides: Overrides;
  onSet: (role: RoleKey, hex: string) => void;
  onClear: (role: RoleKey) => void;
}) {
  const screens = Grid.useBreakpoint();
  const cols = screens.md ? 2 : 1;
  // What each role reverts to when un-pinned — shown as the swatch/value until
  // the user overrides it, and the target of the reset control.
  const derived = derivedRoleColors(base, rule, vibrancy, temperature);

  return (
    <Card
      title="Fine-tune role colors"
      extra={
        <span style={{ fontSize: 12, color: "#6b7280" }}>
          Optional — pin any role to an exact color
        </span>
      }
    >
      <Text type="secondary" style={{ display: "block", marginBottom: 14, fontSize: 13 }}>
        These come from your brand color automatically, so neutrals carry a faint
        tint. Override any that you'd rather set by hand — the border is the usual
        one. Whatever you set here is exactly what exports to Brand Board.
      </Text>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          gap: 12,
        }}
      >
        {ROLES.map(({ key, label, hint }) => {
          const pinned = typeof overrides[key] === "string";
          const value = (overrides[key] ?? derived[key]).toLowerCase();
          return (
            <div
              key={key}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                border: "1px solid #eceeef",
                borderRadius: 10,
                padding: "8px 10px",
              }}
            >
              {/* Native color well — the quickest way to pick, and it always
                  emits valid #rrggbb. Sized to read as a swatch. */}
              <input
                type="color"
                aria-label={`${label} color`}
                value={value}
                onChange={(e) => onSet(key, e.target.value.toLowerCase())}
                style={{
                  width: 34,
                  height: 34,
                  padding: 0,
                  border: "1px solid #e1e4e6",
                  borderRadius: 8,
                  background: "none",
                  cursor: "pointer",
                  flexShrink: 0,
                }}
              />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 13, lineHeight: 1.2 }}>{label}</div>
                <div style={{ fontSize: 11, color: "#8a8f98", lineHeight: 1.3 }}>{hint}</div>
              </div>
              {/* Hex text — editable for paste-in precision; commits only a full
                  valid hex so half-typed values don't thrash the palette. */}
              <input
                aria-label={`${label} hex`}
                value={value}
                onChange={(e) => {
                  const hex = normalizeHex(e.target.value);
                  if (hex) onSet(key, hex);
                }}
                spellCheck={false}
                style={{
                  width: 84,
                  fontFamily: "monospace",
                  fontSize: 12,
                  textTransform: "lowercase",
                  border: "1px solid #e1e4e6",
                  borderRadius: 8,
                  padding: "5px 8px",
                  color: "#3a3f45",
                  flexShrink: 0,
                }}
              />
              {/* Reset appears only when this role is pinned. */}
              <Button
                type="text"
                size="small"
                aria-label={`Reset ${label} to default`}
                icon={<UndoOutlined />}
                onClick={() => onClear(key)}
                disabled={!pinned}
                title={pinned ? `Reset to ${derived[key]}` : "Using the default"}
                style={{ flexShrink: 0, opacity: pinned ? 1 : 0.25 }}
              />
            </div>
          );
        })}
      </div>
    </Card>
  );
}
