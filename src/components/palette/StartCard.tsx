import {
  Card,
  ColorPicker,
  Input,
  Segmented,
  Select,
  Button,
  Typography,
  Space,
  Upload,
  Modal,
  message,
} from "antd";
import {
  ThunderboltOutlined,
  CameraOutlined,
  AppstoreOutlined,
  FolderOpenOutlined,
} from "@ant-design/icons";
import { useEffect, useRef, useState } from "react";
import type { UploadProps } from "antd";
import { VIBES } from "../../lib/presets";
import { normalizeHex } from "../../lib/color";
import {
  randomBase,
  suggestRole,
  suggestRolesForList,
  type CustomColor,
} from "../../lib/harmony";
import { loadImageFile, extractPalette, sampleColorAt } from "../../lib/image-colors";
import { useIsMobile } from "../../hooks/use-mobile";
import { CustomPaletteFields } from "./CustomPaletteFields";

// Order matters: the generated modes (color / vibe / surprise) share the same
// left-column layout, so they sit together. "From a photo" and "My own colors"
// come last because they swap the left column's contents — keeping them at the
// end means the layout settles as you move left-to-right instead of jumping back.
const MODE_OPTIONS = [
  { label: "Pick a color", value: "color" },
  { label: "Pick a vibe", value: "vibe" },
  { label: "Surprise me", value: "surprise" },
  { label: "From a photo", value: "photo" },
  { label: "My own colors", value: "custom" },
] as const;

type Props = {
  value: string;
  onChange: (hex: string) => void;
  /** Custom mode: the colors the user assigned (role + optional name). */
  customColors: CustomColor[];
  /** Fired when the custom color list changes; empty array → leave custom mode. */
  onCustomChange: (colors: CustomColor[]) => void;
  /** Reopen a saved palette from a pasted Brand Kit blob. Returns which kind of
   *  palette was restored (so we can sync this card's mode), or null if invalid. */
  onReopen: (raw: string) => "generated" | "custom" | null;
};
type Mode = "color" | "vibe" | "photo" | "custom" | "surprise";

export function StartCard({ value, onChange, customColors, onCustomChange, onReopen }: Props) {
  const isMobile = useIsMobile();
  const [mode, setMode] = useState<Mode>("color");
  const [hexInput, setHexInput] = useState(value);

  // Reopen-a-saved-palette state (the paste-your-own-blob path from the interop
  // contract — revising a client without a backend).
  const [reopening, setReopening] = useState(false);
  const [pasteBlob, setPasteBlob] = useState("");

  function confirmReopen() {
    const result = onReopen(pasteBlob);
    if (!result) return; // App already surfaced the error; keep the modal open to retry.
    // Sync this card's local mode to match what was restored, so the right
    // controls show (custom fields vs. the generated color picker).
    setMode(result === "custom" ? "custom" : "color");
    setReopening(false);
    setPasteBlob("");
  }

  // Keep the always-visible hex field in sync when the color is set from any
  // mode (vibe, photo swatch/eyedropper, surprise) — not just by typing here.
  useEffect(() => {
    setHexInput(value);
  }, [value]);

  // Photo-mode state
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [swatches, setSwatches] = useState<string[]>([]);
  const [hover, setHover] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const handleUpload: UploadProps["beforeUpload"] = async (file) => {
    if (!file.type.startsWith("image/")) {
      message.error("Please choose an image file.");
      return Upload.LIST_IGNORE;
    }
    try {
      const { el } = await loadImageFile(file);
      imgRef.current = el;
      if (photoUrl) URL.revokeObjectURL(photoUrl);
      setPhotoUrl(el.src);
      setSwatches(extractPalette(el, 6));
    } catch {
      message.error("Could not read that image.");
    }
    return Upload.LIST_IGNORE; // we handle the file ourselves; no AntD upload list
  };

  // Switching modes is also the on/off switch for custom-palette building in
  // App: entering "custom" hands App the current hex list; leaving it clears the
  // list so App falls back to the single-base generated palette.
  function changeMode(next: Mode) {
    setMode(next);
    if (next === "custom") {
      // Seed with the user's current color (as primary) if she hasn't built a
      // custom list yet, so the panel opens with something to work from.
      onCustomChange(
        customColors.length
          ? customColors
          : [{ hex: normalizeHex(value), role: suggestRole(normalizeHex(value), 0), name: "" }],
      );
    } else {
      onCustomChange([]);
    }
  }

  function pickAt(e: React.MouseEvent<HTMLImageElement>) {
    const img = imgRef.current;
    if (!img) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const fx = (e.clientX - rect.left) / rect.width;
    const fy = (e.clientY - rect.top) / rect.height;
    const hex = sampleColorAt(img, fx, fy);
    if (hex) {
      setHexInput(hex);
      onChange(hex);
    }
  }

  // Path 2 from a photo: take every color we found and make it the palette.
  // We assign each a smart starting role (lightest → backgrounds, darkest → text,
  // colorful mid-tones → buttons/accent) so the brand kit is sensible out of the
  // gate; she can still rename or reassign in the editor before exporting.
  function useAllPhotoColors() {
    const hexes = swatches.map((h) => normalizeHex(h));
    // Assign a DISTINCT role to each color across the whole set, so we never seed
    // two "Muted text" rows from similar colors.
    const roles = suggestRolesForList(hexes);
    const seeded: CustomColor[] = hexes.map((hex, idx) => ({
      hex,
      role: roles[idx],
      name: "",
    }));
    onCustomChange(seeded);
    setMode("custom");
  }

  const customMode = mode === "custom";

  return (
    <Card
      title="1. Start with a color"
      extra={
        <Button
          type="link"
          size="small"
          icon={<FolderOpenOutlined />}
          onClick={() => setReopening(true)}
          style={{ paddingRight: 0 }}
        >
          Reopen a saved palette
        </Button>
      }
    >
      {/* Always-visible color control — the single source of truth, usable from
          every generated mode. The swatch IS the visual color picker; the hex
          field edits it by text. Hidden in "My own colors" mode, where the user
          supplies every role color directly and there's no single base. */}
      <div
        style={{
          display: customMode ? "none" : "flex",
          alignItems: "center",
          gap: 12,
          padding: "10px 12px",
          marginBottom: 16,
          borderRadius: 12,
          background: "#fafafa",
          border: "1px solid #eef0ef",
        }}
      >
        <ColorPicker value={value} onChange={(c) => onChange("#" + c.toHex())}>
          <span
            role="button"
            title="Click to open the color picker"
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: value,
              border: "1px solid rgba(0,0,0,0.12)",
              flexShrink: 0,
              cursor: "pointer",
              display: "block",
            }}
          />
        </ColorPicker>
        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.2, flexShrink: 0 }}>
          <Typography.Text type="secondary" style={{ fontSize: 11 }}>
            Your color
          </Typography.Text>
          <Typography.Text strong style={{ fontFamily: "monospace", fontSize: 14 }}>
            {value.toUpperCase()}
          </Typography.Text>
        </div>
        <Input
          value={hexInput}
          onChange={(e) => setHexInput(e.target.value)}
          onBlur={() => onChange(normalizeHex(hexInput))}
          onPressEnter={() => onChange(normalizeHex(hexInput))}
          placeholder="#2f4f46"
          style={{ marginLeft: "auto", width: 130 }}
        />
      </div>

      {isMobile ? (
        // 4 segments truncate on a phone ("Surpri…") — a full-width dropdown
        // keeps every mode readable.
        <Select
          value={mode}
          onChange={(v) => changeMode(v as Mode)}
          options={MODE_OPTIONS.map((o) => ({ label: o.label, value: o.value }))}
          style={{ width: "100%" }}
          size="large"
        />
      ) : (
        <Segmented
          block
          value={mode}
          onChange={(v) => changeMode(v as Mode)}
          options={MODE_OPTIONS.map((o) => ({ label: o.label, value: o.value }))}
        />
      )}
      <div style={{ marginTop: 20 }}>
        {mode === "color" && (
          <Typography.Text type="secondary">
            Click the color swatch above to open the picker, or type a hex code — we'll build
            everything else from it.
          </Typography.Text>
        )}

        {mode === "custom" && (
          <CustomPaletteFields colors={customColors} onChange={onCustomChange} />
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

        {mode === "photo" && (
          <Space direction="vertical" size="middle" style={{ width: "100%" }}>
            {!photoUrl && (
              <Upload.Dragger
                accept="image/*"
                multiple={false}
                showUploadList={false}
                beforeUpload={handleUpload}
              >
                <p style={{ margin: 0 }}>
                  <CameraOutlined style={{ fontSize: 28, color: "#2f4f46" }} />
                </p>
                <p style={{ margin: "8px 0 0", fontWeight: 600 }}>
                  Upload a photo to pull colors from
                </p>
                <p style={{ margin: "2px 0 0", fontSize: 13, color: "#6b7280" }}>
                  Tap or drop an image — it stays on your device.
                </p>
              </Upload.Dragger>
            )}

            {photoUrl && (
              <>
                <div style={{ position: "relative", lineHeight: 0 }}>
                  <img
                    src={photoUrl}
                    alt="Your photo — tap anywhere to sample a color"
                    onClick={pickAt}
                    onMouseMove={(e) => {
                      const img = imgRef.current;
                      if (!img) return;
                      const rect = e.currentTarget.getBoundingClientRect();
                      const fx = (e.clientX - rect.left) / rect.width;
                      const fy = (e.clientY - rect.top) / rect.height;
                      setHover(sampleColorAt(img, fx, fy));
                    }}
                    onMouseLeave={() => setHover(null)}
                    style={{
                      width: "100%",
                      maxHeight: 280,
                      objectFit: "contain",
                      borderRadius: 12,
                      border: "1px solid #e5e7eb",
                      cursor: "crosshair",
                      display: "block",
                    }}
                  />
                  {hover && (
                    <div
                      style={{
                        position: "absolute",
                        top: 8,
                        right: 8,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        background: "rgba(255,255,255,0.92)",
                        padding: "4px 8px",
                        borderRadius: 8,
                        fontSize: 12,
                        fontVariantNumeric: "tabular-nums",
                        boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
                      }}
                    >
                      <span
                        style={{
                          width: 16,
                          height: 16,
                          borderRadius: 4,
                          background: hover,
                          border: "1px solid rgba(0,0,0,0.1)",
                        }}
                      />
                      {hover}
                    </div>
                  )}
                </div>

                <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                  Tap anywhere on the photo to grab that exact color — or pick one of the main
                  colors we found below.
                </Typography.Text>

                {swatches.length > 0 && (
                  <Space wrap size={8}>
                    {swatches.map((hex) => {
                      const selected = value.toLowerCase() === hex.toLowerCase();
                      return (
                        <button
                          key={hex}
                          onClick={() => {
                            setHexInput(hex);
                            onChange(hex);
                          }}
                          title={hex}
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: 10,
                            background: hex,
                            cursor: "pointer",
                            border: selected ? "3px solid #2f4f46" : "1px solid rgba(0,0,0,0.12)",
                          }}
                        />
                      );
                    })}
                  </Space>
                )}

                {/* The two paths from a photo:
                    1. Tap one swatch / the photo → that single color drives the
                       generated palette + harmony play (handled above).
                    2. "Use all these colors" → all the colors we found become the
                       palette directly, ready to export as a brand kit. We seed the
                       My-own-colors editor (with smart roles) and switch into custom
                       mode, so she can rename / reassign before exporting. */}
                {swatches.length > 0 && (
                  <Button
                    type="primary"
                    icon={<AppstoreOutlined />}
                    block
                    onClick={useAllPhotoColors}
                  >
                    Use all these colors as my palette
                  </Button>
                )}

                <Button
                  size="small"
                  onClick={() => {
                    if (photoUrl) URL.revokeObjectURL(photoUrl);
                    imgRef.current = null;
                    setPhotoUrl(null);
                    setSwatches([]);
                    setHover(null);
                  }}
                >
                  Choose a different photo
                </Button>
              </>
            )}
          </Space>
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

      <Modal
        open={reopening}
        title="Reopen a saved palette"
        okText="Reopen palette"
        okButtonProps={{ disabled: !pasteBlob.trim() }}
        onOk={confirmReopen}
        onCancel={() => {
          setReopening(false);
          setPasteBlob("");
        }}
        destroyOnClose
      >
        <Typography.Paragraph type="secondary" style={{ marginTop: 0 }}>
          Paste the palette code you exported earlier (the "Export to Brand Board" button copies
          it). This reloads every color, role, and font so you can tweak and re-export — handy when
          a client comes back for a revision.
        </Typography.Paragraph>
        <Input.TextArea
          value={pasteBlob}
          onChange={(e) => setPasteBlob(e.target.value)}
          placeholder='{"type":"palette","v":1,"source":"opsette", ...}'
          autoSize={{ minRows: 4, maxRows: 8 }}
          style={{ fontFamily: "monospace", fontSize: 12 }}
        />
      </Modal>
    </Card>
  );
}
