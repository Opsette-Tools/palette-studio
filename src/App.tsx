import { useEffect, useMemo, useReducer } from "react";
import { ConfigProvider, App as AntdApp, Typography } from "antd";
import { OpsetteHeader } from "./components/opsette-header";
import { OpsetteFooterLogo } from "./components/opsette-share";
import { StartCard } from "./components/palette/StartCard";
import { HarmonyPicker } from "./components/palette/HarmonyPicker";
import { VibrancyPicker } from "./components/palette/VibrancyPicker";
import { TemperaturePicker } from "./components/palette/TemperaturePicker";
import { PaletteGrid } from "./components/palette/PaletteGrid";
import { ScaleStrips } from "./components/palette/ScaleStrips";
import { ContrastReport } from "./components/palette/ContrastReport";
import { TypographyPicker } from "./components/palette/TypographyPicker";
import { ExportPanel } from "./components/palette/ExportPanel";
import { buildPalette, type HarmonyRule, type Vibrancy, type Temperature } from "./lib/harmony";
import { FONT_PAIRS, loadFontPair } from "./lib/presets";
import { loadSaved, saveState } from "./lib/storage";

type State = { baseHex: string; rule: HarmonyRule; vibrancy: Vibrancy; temperature: Temperature; fontPairId: string };
type Action =
  | { type: "setBase"; hex: string }
  | { type: "setRule"; rule: HarmonyRule }
  | { type: "setVibrancy"; vibrancy: Vibrancy }
  | { type: "setTemperature"; temperature: Temperature }
  | { type: "setFont"; id: string }
  | { type: "hydrate"; state: State };

const INITIAL: State = { baseHex: "#2f6f8f", rule: "analogous", vibrancy: "balanced", temperature: "neutral", fontPairId: "inter" };

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case "setBase": return { ...s, baseHex: a.hex };
    case "setRule": return { ...s, rule: a.rule };
    case "setVibrancy": return { ...s, vibrancy: a.vibrancy };
    case "setTemperature": return { ...s, temperature: a.temperature };
    case "setFont": return { ...s, fontPairId: a.id };
    case "hydrate": return a.state;
  }
}

export default function App() {
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
    () => buildPalette(state.baseHex, state.rule, state.vibrancy, state.temperature),
    [state.baseHex, state.rule, state.vibrancy, state.temperature],
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
          <OpsetteHeader />
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
              vibrancy={
                <>
                  <VibrancyPicker
                    value={state.vibrancy}
                    onChange={(vibrancy) => dispatch({ type: "setVibrancy", vibrancy })}
                  />
                  <TemperaturePicker
                    value={state.temperature}
                    onChange={(temperature) => dispatch({ type: "setTemperature", temperature })}
                  />
                </>
              }
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

            <OpsetteFooterLogo />
          </main>
        </div>
      </AntdApp>
    </ConfigProvider>
  );
}
