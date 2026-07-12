import { Card, Tabs, Button, Input, Modal, Form, Space, Grid, Typography, message } from "antd";

const { Text } = Typography;
import { CopyOutlined, DownloadOutlined, ExportOutlined, FilePdfOutlined } from "@ant-design/icons";
import { useEffect, useRef, useState } from "react";
import { toPng } from "html-to-image";
import type { Palette } from "../../lib/harmony";
import { CUSTOM_ROLE_OPTIONS } from "../../lib/harmony";
import type { FontPair } from "../../lib/presets";
import { toAntd, toCssVars, toKitJson, toTailwind } from "../../lib/exporters";
import { buildPalettePdf, blobToDataUrl, downloadPalettePdf } from "../../lib/pdf";
import { loadOpsetteLogo } from "../../lib/logo";
import { BrandKitPreview } from "./BrandKitPreview";
import { ScaledPreview } from "./ScaledPreview";

// The intrinsic width of the BrandKitPreview canvas (see BrandKitPreview.tsx).
// The live pane scales this down to fit; the download snapshots it at full res.
const PREVIEW_WIDTH = 1080;

function CopyBlock({ code }: { code: string }) {
  return (
    <div style={{ position: "relative" }}>
      <Button
        size="small"
        icon={<CopyOutlined />}
        onClick={() => {
          void navigator.clipboard.writeText(code);
          void message.success("Copied to clipboard");
        }}
        style={{ position: "absolute", top: 8, right: 8, zIndex: 1 }}
      >
        Copy
      </Button>
      <pre
        style={{
          background: "#0f1115",
          color: "#e6edf3",
          padding: 16,
          paddingTop: 44,
          borderRadius: 10,
          fontSize: 12,
          overflowX: "auto",
          maxHeight: 360,
          margin: 0,
        }}
      >
        <code>{code}</code>
      </pre>
    </div>
  );
}

function roleLabel(role: string): string {
  return CUSTOM_ROLE_OPTIONS.find((o) => o.value === role)?.label ?? role;
}

// Every hex in the palette, labeled, as plain copyable text. This is the answer
// to "the codes should be selectable" for the PNG path: the image can't carry
// selectable text, so we hand the same codes to the clipboard (and the PDF makes
// them selectable in the document itself).
function hexList(p: Palette): string {
  const lines: string[] = [];
  if (p.custom) {
    p.custom.forEach((c) => lines.push(`${(c.name?.trim() || roleLabel(c.role))}: ${c.hex.toUpperCase()}`));
  } else {
    lines.push(`Buttons / CTA: ${p.primary.toUpperCase()}`);
    lines.push(`Secondary button: ${p.secondary.toUpperCase()}`);
    lines.push(`Accent: ${p.accent.toUpperCase()}`);
    lines.push(`Page background: ${p.roles.background.toUpperCase()}`);
    lines.push(`Card background: ${p.roles.surface.toUpperCase()}`);
    lines.push(`Heading: ${p.roles.heading.toUpperCase()}`);
    lines.push(`Body text: ${p.roles.text.toUpperCase()}`);
  }
  const scale = (label: string, s: Record<string, string>) => {
    lines.push("");
    lines.push(`${label}:`);
    Object.entries(s).forEach(([stop, hex]) => lines.push(`  ${stop}: ${hex.toUpperCase()}`));
  };
  scale("Buttons / CTA — tints & shades", p.primaryScale);
  scale("Accent — tints & shades", p.accentScale);
  scale("Neutral — tints & shades", p.neutrals);
  return lines.join("\n");
}

// Turn a free-text kit name into a safe, readable file name.
function toFileSlug(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "brand-kit";
}

export function ExportPanel({ palette, fontPair }: { palette: Palette; fontPair: FontPair }) {
  const screens = Grid.useBreakpoint();
  const isNarrow = !screens.md; // stack name + preview on phones/small tablets
  // The live preview node IS the download source — snapshotting this exact node
  // guarantees what you see is what you get.
  const previewRef = useRef<HTMLDivElement | null>(null);
  // An always-mounted, off-screen copy of the SAME preview node. It's the capture
  // source for "Export to Brand Board" so we can bake the PNG into the blob even
  // when the download modal is closed — the export must never depend on the modal
  // being open. Pixel-identical to the modal preview (same component, same props).
  const bakeRef = useRef<HTMLDivElement | null>(null);
  const [logoSrc, setLogoSrc] = useState<string>("");
  const [kitName, setKitName] = useState<string>("");
  const [open, setOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Pre-load the logo so it's already inlined when the user hits download — the
  // preview reads `logoSrc` synchronously during capture.
  useEffect(() => {
    void loadOpsetteLogo().then(setLogoSrc);
  }, []);

  // Export to Brand Board: serialize the palette + fonts AND bake the rendered
  // PNG (the swatch sheet) + a copyable-hex PDF into the shared kit JSON, then
  // copy it to the clipboard. Now the whole kit flows Palette Studio → Brand
  // Board → File Builder with no manual downloads (mirrors Icon Kit's blob).
  async function exportToBrandBoard() {
    setExporting(true);
    try {
      const name = kitName.trim() || "Untitled palette";
      let image: string | undefined;
      let pdf: string | undefined;
      // Bake the PNG from the off-screen node (exists whether or not the modal is
      // open). Failure here must not block the export — fall back to numbers-only.
      if (bakeRef.current) {
        try {
          image = await toPng(bakeRef.current, { pixelRatio: 2, cacheBust: true });
        } catch {
          image = undefined;
        }
      }
      try {
        const blob = await buildPalettePdf(palette, fontPair, name);
        pdf = await blobToDataUrl(blob);
      } catch {
        pdf = undefined;
      }
      const payload = toKitJson(palette, fontPair, name, { image, pdf });
      await navigator.clipboard.writeText(JSON.stringify(payload));
      const baked = [image ? "PNG" : null, pdf ? "PDF" : null].filter(Boolean).join(" + ");
      void message.success(
        baked
          ? `Palette copied with ${baked} — paste it into Brand Board`
          : "Palette copied — paste it into Brand Board",
      );
    } catch {
      void message.error("Couldn't copy to clipboard");
    } finally {
      setExporting(false);
    }
  }

  // Download the live preview node exactly as shown. The name is already baked
  // into the node (it re-renders as you type), so no snapshot-timing dance.
  async function downloadKit() {
    const node = previewRef.current ?? bakeRef.current;
    if (!node) return;
    const fileName = `${toFileSlug(kitName || `palette-${palette.primary.slice(1)}`)}.png`;
    setDownloading(true);
    try {
      const url = await toPng(node, { pixelRatio: 2, cacheBust: true });
      const link = document.createElement("a");
      link.download = fileName;
      link.href = url;
      link.click();
    } catch {
      void message.error("Couldn't generate the brand kit");
    } finally {
      setDownloading(false);
    }
  }

  // Download the copyable-hex PDF — real selectable text, for a client to grab
  // hex codes straight out of the document.
  async function downloadPdf() {
    const name = kitName.trim() || "Brand palette";
    const fileName = `${toFileSlug(kitName || `palette-${palette.primary.slice(1)}`)}.pdf`;
    setDownloadingPdf(true);
    try {
      await downloadPalettePdf(palette, fontPair, name, fileName);
    } catch {
      void message.error("Couldn't generate the PDF");
    } finally {
      setDownloadingPdf(false);
    }
  }

  async function copyHexes() {
    try {
      await navigator.clipboard.writeText(hexList(palette));
      void message.success("All hex codes copied");
    } catch {
      void message.error("Couldn't copy — try the PDF, its codes are selectable.");
    }
  }

  return (
    <Card
      title="5. Export"
      extra={
        <Space wrap>
          <Button icon={<CopyOutlined />} onClick={() => void copyHexes()}>
            Copy hex codes
          </Button>
          <Button
            icon={<ExportOutlined />}
            loading={exporting}
            onClick={() => void exportToBrandBoard()}
          >
            Export to Brand Board
          </Button>
          <Button type="primary" icon={<DownloadOutlined />} onClick={() => setOpen(true)}>
            Preview &amp; download brand kit
          </Button>
        </Space>
      }
    >
      <Tabs
        items={[
          { key: "css", label: "CSS variables", children: <CopyBlock code={toCssVars(palette)} /> },
          { key: "tw", label: "Tailwind", children: <CopyBlock code={toTailwind(palette)} /> },
          { key: "antd", label: "Ant Design", children: <CopyBlock code={toAntd(palette)} /> },
        ]}
      />

      <Modal
        open={open}
        title="Preview & download your brand kit"
        onCancel={() => setOpen(false)}
        width={isNarrow ? "94vw" : 980}
        style={{ top: 24 }}
        footer={null}
        destroyOnClose
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isNarrow ? "1fr" : "minmax(240px, 300px) 1fr",
            gap: 24,
            alignItems: "start",
            marginTop: 8,
          }}
        >
          {/* Left: name it, then download PNG or the copyable-hex PDF. */}
          <div>
            <Form layout="vertical">
              <Form.Item
                label="Kit name"
                help="Shown on the brand kit image and used as the file name. Type to see it update on the right."
                style={{ marginBottom: 20 }}
              >
                <Input
                  autoFocus
                  value={kitName}
                  onChange={(e) => setKitName(e.target.value)}
                  placeholder="e.g. Sunrise Bakery"
                  maxLength={60}
                />
              </Form.Item>
            </Form>
            <Space direction="vertical" size={10} style={{ width: "100%" }}>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: 0.6,
                  textTransform: "uppercase",
                  color: "#8a8f98",
                }}
              >
                Download
              </Text>
              <div style={{ display: "flex", gap: 8 }}>
                <Button
                  type="primary"
                  icon={<DownloadOutlined />}
                  loading={downloading}
                  onClick={() => void downloadKit()}
                  style={{ flex: 1 }}
                >
                  PNG
                </Button>
                <Button
                  icon={<FilePdfOutlined />}
                  loading={downloadingPdf}
                  onClick={() => void downloadPdf()}
                  style={{ flex: 1 }}
                >
                  PDF
                </Button>
              </div>
              <Button icon={<CopyOutlined />} onClick={() => void copyHexes()} block>
                Copy all hex codes
              </Button>
              <Button onClick={() => setOpen(false)} block>
                Close
              </Button>
            </Space>
          </div>

          {/* Right: the live, to-scale preview — and the exact node we snapshot. */}
          <div
            style={{
              background: "#f4f5f4",
              borderRadius: 12,
              padding: 12,
              maxHeight: "72vh",
              overflowY: "auto",
              border: "1px solid #e6e9e7",
            }}
          >
            <ScaledPreview contentWidth={PREVIEW_WIDTH}>
              <div ref={previewRef}>
                <BrandKitPreview
                  palette={palette}
                  fontPair={fontPair}
                  kitName={kitName}
                  logoSrc={logoSrc}
                />
              </div>
            </ScaledPreview>
          </div>
        </div>
      </Modal>

      {/* Off-screen capture node for "Export to Brand Board". Kept mounted (not
          display:none — html-to-image needs a laid-out node) but positioned far
          off-screen so it never shows. Identical props to the modal preview. */}
      <div
        aria-hidden
        style={{ position: "fixed", top: 0, left: -100000, pointerEvents: "none", opacity: 0 }}
      >
        <div ref={bakeRef}>
          <BrandKitPreview
            palette={palette}
            fontPair={fontPair}
            kitName={kitName || "Untitled palette"}
            logoSrc={logoSrc}
          />
        </div>
      </div>
    </Card>
  );
}
