import { useEffect, useMemo, useReducer, useState } from "react";
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
import { LivePreview } from "./components/palette/LivePreview";
import { ExportPanel } from "./components/palette/ExportPanel";
import {
  buildPalette,
  buildCustomPalette,
  type HarmonyRule,
  type Vibrancy,
  type Temperature,
  type CustomColor,
} from "./lib/harmony";
import { FONT_PAIRS, loadFontPair } from "./lib/presets";
import { loadSaved, saveState } from "./lib/storage";

type State = {
  baseHex: string;
  rule: HarmonyRule;
  vibrancy: Vibrancy;
  temperature: Temperature;
  fontPairId: string;
};
type Action =
  | { type: "setBase"; hex: string }
  | { type: "setRule"; rule: HarmonyRule }
  | { type: "setVibrancy"; vibrancy: Vibrancy }
  | { type: "setTemperature"; temperature: Temperature }
  | { type: "setFont"; id: string }
  | { type: "hydrate"; state: State };

const INITIAL: State = {
  baseHex: "#2f6f8f",
  rule: "exact",
  vibrancy: "balanced",
  temperature: "neutral",
  fontPairId: "inter",
};

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case "setBase":
      return { ...s, baseHex: a.hex };
    case "setRule":
      return { ...s, rule: a.rule };
    case "setVibrancy":
      return { ...s, vibrancy: a.vibrancy };
    case "setTemperature":
      return { ...s, temperature: a.temperature };
    case "setFont":
      return { ...s, fontPairId: a.id };
    case "hydrate":
      return a.state;
  }
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, INITIAL);
  // When the user is in "My own colors" mode, these are the colors she supplied
  // with their assigned roles. A non-empty list switches palette construction
  // from the generated (single-base + harmony) path to the custom path.
  const [customColors, setCustomColors] = useState<CustomColor[]>([]);
  const isCustom = customColors.length > 0;

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
    () =>
      isCustom
        ? buildCustomPalette(customColors)
        : buildPalette(state.baseHex, state.rule, state.vibrancy, state.temperature),
    [isCustom, customColors, state.baseHex, state.rule, state.vibrancy, state.temperature],
  );

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#2f4f46",
          fontFamily: '"Inter", system-ui, sans-serif',
          borderRadius: 10,
        },
        components: {
          Select: {
            // Replace the default muddy-grey selected row with a clean brand tint.
            optionSelectedBg: "#eef3f1",
            optionSelectedColor: "#2f4f46",
            optionSelectedFontWeight: 600,
          },
        },
      }}
    >
      <AntdApp>
        <div style={{ minHeight: "100dvh", background: "#fafafa" }}>
          <OpsetteHeader />
          <main
            className="ps-layout"
            style={{ maxWidth: 1320, margin: "0 auto", padding: "20px 24px 64px" }}
          >
            <section style={{ marginBottom: 16 }}>
              <Typography.Title level={2} style={{ margin: 0, fontSize: 24, color: "#2f4f46" }}>
                Build a palette you'll trust.
              </Typography.Title>
              <Typography.Paragraph type="secondary" style={{ marginTop: 6, marginBottom: 0 }}>
                Pick a color or a vibe, choose a harmony rule, and we'll handle the rest — roles,
                accessible contrast, and matching fonts.
              </Typography.Paragraph>
            </section>

            {isCustom ? (
              /* CUSTOM MODE — editor on the left, a sticky live preview on the
                 right so the result is always visible while she assigns colors.
                 Palette grid, accessibility, and export run full-width below. */
              <>
                <div
                  className="ps-custom-split"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "minmax(0, 1.15fr) minmax(0, 1fr)",
                    gap: 20,
                    alignItems: "start",
                    marginBottom: 20,
                  }}
                >
                  <StartCard
                    value={state.baseHex}
                    onChange={(hex) => dispatch({ type: "setBase", hex })}
                    customColors={customColors}
                    onCustomChange={setCustomColors}
                  />
                  <div className="ps-sticky-preview" style={{ position: "sticky", top: 20 }}>
                    <LivePreview
                      palette={palette}
                      pair={fontPair}
                      onFontChange={(p) => dispatch({ type: "setFont", id: p.id })}
                    />
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                    gap: 20,
                    alignItems: "start",
                  }}
                >
                  <PaletteGrid palette={palette} />
                  <ContrastReport palette={palette} />
                  {/* Scales are derived from her own colors — even tints/shades,
                      same component and labels as generated mode. */}
                  <div style={{ gridColumn: "1 / -1" }}>
                    <ScaleStrips
                      primary={palette.primaryScale}
                      accent={palette.accentScale}
                      neutrals={palette.neutrals}
                    />
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <ExportPanel palette={palette} fontPair={fontPair} />
                  </div>
                </div>
              </>
            ) : (
              /* GENERATED MODE — unchanged two-column flow. */
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                  gap: 20,
                  alignItems: "start",
                }}
              >
                <div style={{ gridColumn: "1 / -1" }}>
                  <StartCard
                    value={state.baseHex}
                    onChange={(hex) => dispatch({ type: "setBase", hex })}
                    customColors={customColors}
                    onCustomChange={setCustomColors}
                  />
                </div>

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
                        onChange={(temperature) =>
                          dispatch({ type: "setTemperature", temperature })
                        }
                      />
                    </>
                  }
                />
                <PaletteGrid palette={palette} />

                <div style={{ gridColumn: "1 / -1" }}>
                  <ScaleStrips
                    primary={palette.primaryScale}
                    accent={palette.accentScale}
                    neutrals={palette.neutrals}
                  />
                </div>

                <ContrastReport palette={palette} />
                <TypographyPicker
                  pair={fontPair}
                  onChange={(p) => dispatch({ type: "setFont", id: p.id })}
                  palette={palette}
                />

                <div style={{ gridColumn: "1 / -1" }}>
                  <ExportPanel palette={palette} fontPair={fontPair} />
                </div>
              </div>
            )}

            <Typography.Paragraph
              type="secondary"
              style={{ textAlign: "center", fontSize: 12, marginTop: 24 }}
            >
              Palette Studio is part of Opsette Tools · Your last palette is saved on this device.
            </Typography.Paragraph>

            <OpsetteFooterLogo />
          </main>
        </div>
      </AntdApp>
    </ConfigProvider>
  );
}
