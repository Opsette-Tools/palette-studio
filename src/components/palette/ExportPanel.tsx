import { Card, Tabs, Button, Input, Modal, Form, message } from "antd";
import { CopyOutlined, DownloadOutlined } from "@ant-design/icons";
import { useEffect, useRef, useState } from "react";
import { toPng } from "html-to-image";
import type { Palette } from "../../lib/harmony";
import type { FontPair } from "../../lib/presets";
import { toAntd, toCssVars, toTailwind } from "../../lib/exporters";
import { loadOpsetteLogo } from "../../lib/logo";
import { BrandKitPreview } from "./BrandKitPreview";

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
  const previewRef = useRef<HTMLDivElement | null>(null);
  const [logoSrc, setLogoSrc] = useState<string>("");
  const [kitName, setKitName] = useState<string>("");
  const [naming, setNaming] = useState(false);
  const [pendingName, setPendingName] = useState<string>("");

  // Pre-load the logo so it's already inlined when the user hits download — the
  // off-screen preview reads `logoSrc` synchronously during capture.
  useEffect(() => {
    void loadOpsetteLogo().then(setLogoSrc);
  }, []);

  function openNaming() {
    setPendingName(kitName);
    setNaming(true);
  }

  async function confirmDownload() {
    const name = pendingName.trim();
    setKitName(name);
    setNaming(false);
    // Let React commit the new name into the off-screen preview before we
    // snapshot it, so the entered name actually appears on the PNG.
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    if (!previewRef.current) return;
    try {
      const url = await toPng(previewRef.current, { pixelRatio: 2, cacheBust: true });
      const link = document.createElement("a");
      link.download = `${toFileSlug(name || `palette-${palette.primary.slice(1)}`)}.png`;
      link.href = url;
      link.click();
    } catch {
      void message.error("Couldn't generate PNG");
    }
  }

  return (
    <Card
      title="6. Export"
      extra={
        <Button type="primary" icon={<DownloadOutlined />} onClick={openNaming}>
          Download brand kit
        </Button>
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
        open={naming}
        title="Name your brand kit"
        okText="Download PNG"
        onOk={() => void confirmDownload()}
        onCancel={() => setNaming(false)}
        destroyOnClose
      >
        <Form layout="vertical" style={{ marginTop: 8 }}>
          <Form.Item
            label="Kit name"
            help="Shown on the brand kit image and used as the file name."
          >
            <Input
              autoFocus
              value={pendingName}
              onChange={(e) => setPendingName(e.target.value)}
              onPressEnter={() => void confirmDownload()}
              placeholder="e.g. Sunrise Bakery"
              maxLength={60}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Off-screen preview used for PNG export */}
      <div style={{ position: "fixed", left: -99999, top: 0, pointerEvents: "none" }} aria-hidden>
        <div ref={previewRef}>
          <BrandKitPreview
            palette={palette}
            fontPair={fontPair}
            kitName={kitName}
            logoSrc={logoSrc}
          />
        </div>
      </div>
    </Card>
  );
}
