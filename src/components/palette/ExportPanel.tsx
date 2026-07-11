import { Card, Tabs, Button, Input, Modal, Form, Space, Grid, message } from "antd";
import { CopyOutlined, DownloadOutlined, ExportOutlined } from "@ant-design/icons";
import { useEffect, useRef, useState } from "react";
import { toPng } from "html-to-image";
import type { Palette } from "../../lib/harmony";
import type { FontPair } from "../../lib/presets";
import { toAntd, toCssVars, toKitJson, toTailwind } from "../../lib/exporters";
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
  const [logoSrc, setLogoSrc] = useState<string>("");
  const [kitName, setKitName] = useState<string>("");
  const [open, setOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Pre-load the logo so it's already inlined when the user hits download — the
  // preview reads `logoSrc` synchronously during capture.
  useEffect(() => {
    void loadOpsetteLogo().then(setLogoSrc);
  }, []);

  // Export to Brand Board: serialize the palette + fonts to the shared kit JSON
  // and copy it to the clipboard. Brand Board has a matching paste field; the
  // same blob also reopens this palette here (see StartCard's reopen path).
  async function exportToBrandBoard() {
    const payload = toKitJson(palette, fontPair, kitName.trim() || "Untitled palette");
    try {
      await navigator.clipboard.writeText(JSON.stringify(payload));
      void message.success("Palette copied — paste it into Brand Board");
    } catch {
      void message.error("Couldn't copy to clipboard");
    }
  }

  // Download the live preview node exactly as shown. The name is already baked
  // into the node (it re-renders as you type), so no snapshot-timing dance.
  async function downloadKit() {
    if (!previewRef.current) return;
    const fileName = `${toFileSlug(kitName || `palette-${palette.primary.slice(1)}`)}.png`;
    setDownloading(true);
    try {
      const url = await toPng(previewRef.current, { pixelRatio: 2, cacheBust: true });
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

  return (
    <Card
      title="5. Export"
      extra={
        <Space wrap>
          <Button icon={<ExportOutlined />} onClick={() => void exportToBrandBoard()}>
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
          {/* Left: name it, then download. */}
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
            <Space direction="vertical" style={{ width: "100%" }}>
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                loading={downloading}
                onClick={() => void downloadKit()}
                block
              >
                Download PNG
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
    </Card>
  );
}
