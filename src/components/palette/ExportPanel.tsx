import { Card, Tabs, Button, message } from "antd";
import { CopyOutlined, DownloadOutlined } from "@ant-design/icons";
import { useRef } from "react";
import { toPng } from "html-to-image";
import type { Palette } from "../../lib/harmony";
import type { FontPair } from "../../lib/presets";
import { toAntd, toCssVars, toTailwind } from "../../lib/exporters";
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

export function ExportPanel({ palette, fontPair }: { palette: Palette; fontPair: FontPair }) {
  const previewRef = useRef<HTMLDivElement | null>(null);

  async function downloadPng() {
    if (!previewRef.current) return;
    try {
      const url = await toPng(previewRef.current, { pixelRatio: 2, cacheBust: true });
      const link = document.createElement("a");
      link.download = `palette-${palette.primary.slice(1)}.png`;
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
        <Button icon={<DownloadOutlined />} onClick={downloadPng}>
          Brand kit PNG
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
      {/* Off-screen preview used for PNG export */}
      <div style={{ position: "fixed", left: -99999, top: 0, pointerEvents: "none" }} aria-hidden>
        <div ref={previewRef}>
          <BrandKitPreview palette={palette} fontPair={fontPair} />
        </div>
      </div>
    </Card>
  );
}
