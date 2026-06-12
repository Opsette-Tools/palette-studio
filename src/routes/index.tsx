import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useReducer } from "react";
import { ConfigProvider, App as AntdApp, Typography } from "antd";
import { StartCard } from "../components/palette/StartCard";
import { HarmonyPicker } from "../components/palette/HarmonyPicker";
import { PaletteGrid } from "../components/palette/PaletteGrid";
import { ScaleStrips } from "../components/palette/ScaleStrips";
import { ContrastReport } from "../components/palette/ContrastReport";
import { TypographyPicker } from "../components/palette/TypographyPicker";
import { ExportPanel } from "../components/palette/ExportPanel";
import { buildPalette, type HarmonyRule } from "../lib/harmony";
import { FONT_PAIRS, loadFontPair } from "../lib/presets";
import { loadSaved, saveState } from "../lib/storage";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Palette Studio — Color & brand kit generator" },
      {
        name: "description",
        content:
          "Generate a complete color palette, accessible text pairings, and font combos for your website — no design experience needed.",
      },
      { property: "og:title", content: "Palette Studio — Color & brand kit generator" },
      {
        property: "og:description",
        content: "Pick a color or a vibe and get a full, accessible brand palette in seconds.",
      },
      { name: "theme-color", content: "#2f4f46" },
    ],
  }),
  component: PaletteStudio,
});

type State = { baseHex: string; rule: HarmonyRule; fontPairId: string };
type Action =
  | { type: "setBase"; hex: string }
  | { type: "setRule"; rule: HarmonyRule }
  | { type: "setFont"; id: string }
  | { type: "hydrate"; state: State };

const INITIAL: State = { baseHex: "#2f6f8f", rule: "analogous", fontPairId: "inter" };

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case "setBase": return { ...s, baseHex: a.hex };
    case "setRule": return { ...s, rule: a.rule };
    case "setFont": return { ...s, fontPairId: a.id };
    case "hydrate": return a.state;
  }
}

function PaletteStudio() {
  const [state, dispatch] = useReducer(reducer, INITIAL);

  useEffect(() => {
    const saved = loadSaved();
    if (saved) dispatch({ type: "hydrate", state: saved });
  }, []);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const fontPair = useMemo(
    () => FONT_PAIRS.find((f) => f.id === state.fontPairId) ?? FONT_PAIRS[0],
    [state.fontPairId],
  );

  useEffect(() => {
    loadFontPair(fontPair);
  }, [fontPair]);

  const palette = useMemo(
    () => buildPalette(state.baseHex, state.rule),
    [state.baseHex, state.rule],
  );

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#2f4f46",
          fontFamily: '"Inter", system-ui, sans-serif',
          borderRadius: 10,
        },
      }}
    >
      <AntdApp>
        <div style={{ minHeight: "100dvh", background: "#fafafa" }}>
          <header
            style={{
              position: "sticky",
              top: 0,
              zIndex: 10,
              background: "rgba(250,250,250,0.85)",
              backdropFilter: "saturate(180%) blur(8px)",
              borderBottom: "1px solid #ececec",
            }}
          >
            <div
              style={{
                maxWidth: 880,
                margin: "0 auto",
                padding: "14px 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <h1
                style={{
                  margin: 0,
                  fontSize: 18,
                  fontWeight: 700,
                  color: "#2f4f46",
                  letterSpacing: -0.2,
                }}
              >
                Palette Studio
              </h1>
              <span style={{ fontSize: 12, color: "#6b7280" }}>Opsette Tools</span>
            </div>
          </header>
          <main
            style={{
              maxWidth: 880,
              margin: "0 auto",
              padding: "20px 16px 64px",
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <section style={{ marginBottom: 4 }}>
              <Typography.Title level={2} style={{ margin: 0, fontSize: 24, color: "#2f4f46" }}>
                Build a palette you'll trust.
              </Typography.Title>
              <Typography.Paragraph type="secondary" style={{ marginTop: 6, marginBottom: 0 }}>
                Pick a color or a vibe, choose a harmony rule, and we'll handle the rest —
                roles, accessible contrast, and matching fonts.
              </Typography.Paragraph>
            </section>

            <StartCard
              value={state.baseHex}
              onChange={(hex) => dispatch({ type: "setBase", hex })}
            />
            <HarmonyPicker
              value={state.rule}
              onChange={(rule) => dispatch({ type: "setRule", rule })}
            />
            <PaletteGrid palette={palette} />
            <ScaleStrips
              primary={palette.primaryScale}
              accent={palette.accentScale}
              neutrals={palette.neutrals}
            />
            <ContrastReport palette={palette} />
            <TypographyPicker
              pair={fontPair}
              onChange={(p) => dispatch({ type: "setFont", id: p.id })}
              palette={palette}
            />
            <ExportPanel palette={palette} fontPair={fontPair} />

            <Typography.Paragraph type="secondary" style={{ textAlign: "center", fontSize: 12, marginTop: 16 }}>
              Palette Studio is part of Opsette Tools · Your last palette is saved on this device.
            </Typography.Paragraph>
          </main>
        </div>
      </AntdApp>
    </ConfigProvider>
  );
}
