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

// Open the rendered brand kit in a new tab as a preview, with a Download button,
// instead of pushing the file straight to the user's downloads. She names the kit
// first (the naming modal), then reviews the image here and downloads when ready.
// We build a tiny self-contained HTML doc around the PNG data URL — no network,
// nothing leaves the device.
function openBrandKitPreview(dataUrl: string, fileName: string, title: string): void {
  const win = window.open("", "_blank");
  if (!win) {
    // Pop-up blocked — fall back to a direct download so the action still works.
    const link = document.createElement("a");
    link.download = fileName;
    link.href = dataUrl;
    link.click();
    return;
  }
  const safeTitle = title.replace(/[<>&"]/g, (c) =>
    ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" })[c] as string,
  );
  win.document.write(`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${safeTitle} — Brand kit preview</title>
<style>
  :root { color-scheme: light; }
  body {
    margin: 0; min-height: 100vh; background: #f4f5f4;
    font-family: "Inter", system-ui, -apple-system, sans-serif; color: #2f4f46;
    display: flex; flex-direction: column; align-items: center;
  }
  header {
    width: 100%; box-sizing: border-box; position: sticky; top: 0; z-index: 1;
    display: flex; align-items: center; justify-content: space-between; gap: 16px;
    padding: 14px 20px; background: rgba(255,255,255,0.92);
    backdrop-filter: blur(6px); border-bottom: 1px solid #e6e9e7;
  }
  header .label { font-weight: 600; font-size: 15px; }
  header .hint { font-size: 12px; color: #6b7280; font-weight: 400; }
  a.btn {
    display: inline-flex; align-items: center; gap: 8px;
    background: #2f4f46; color: #fff; text-decoration: none;
    padding: 9px 16px; border-radius: 10px; font-size: 14px; font-weight: 600;
    white-space: nowrap;
  }
  a.btn:hover { background: #264039; }
  main { padding: 24px 20px 48px; width: 100%; box-sizing: border-box; display: flex; justify-content: center; }
  img { max-width: 100%; height: auto; border-radius: 12px; box-shadow: 0 8px 30px rgba(0,0,0,0.12); }
</style>
</head>
<body>
  <header>
    <span class="label">${safeTitle} <span class="hint">— preview, then download when you're happy</span></span>
    <a class="btn" href="${dataUrl}" download="${fileName}">⬇ Download PNG</a>
  </header>
  <main><img src="${dataUrl}" alt="${safeTitle} brand kit" /></main>
</body>
</html>`);
  win.document.close();
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
    // snapshot it, so the entered name actually appears on the image.
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    if (!previewRef.current) return;
    const fileName = `${toFileSlug(name || `palette-${palette.primary.slice(1)}`)}.png`;
    try {
      const url = await toPng(previewRef.current, { pixelRatio: 2, cacheBust: true });
      openBrandKitPreview(url, fileName, name || "Your brand kit");
    } catch {
      void message.error("Couldn't generate the brand kit");
    }
  }

  return (
    <Card
      title="6. Export"
      extra={
        <Button type="primary" icon={<DownloadOutlined />} onClick={openNaming}>
          Preview &amp; download brand kit
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
        okText="Preview brand kit"
        onOk={() => void confirmDownload()}
        onCancel={() => setNaming(false)}
        destroyOnClose
      >
        <Form layout="vertical" style={{ marginTop: 8 }}>
          <Form.Item
            label="Kit name"
            help="Shown on the brand kit image and used as the file name. You'll preview it in a new tab, then download when you're happy."
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
