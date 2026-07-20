import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { ConfigProvider, App as AntdApp, Typography, message as staticMessage } from "antd";
import { OpsetteHeader } from "./components/opsette-header";
import { OpsetteFooterLogo } from "./components/opsette-share";
import { StartCard } from "./components/palette/StartCard";
import { HarmonyPicker } from "./components/palette/HarmonyPicker";
import { VibrancyPicker } from "./components/palette/VibrancyPicker";
import { TemperaturePicker } from "./components/palette/TemperaturePicker";
import { PaletteGrid } from "./components/palette/PaletteGrid";
import { ScaleStrips } from "./components/palette/ScaleStrips";
import { ContrastReport } from "./components/palette/ContrastReport";
import { RoleOverridesPanel } from "./components/palette/RoleOverrides";
import { LivePreview } from "./components/palette/LivePreview";
import { ExportPanel, type BuildKitBlob } from "./components/palette/ExportPanel";
import {
  buildPalette,
  buildCustomPalette,
  type HarmonyRule,
  type Vibrancy,
  type Temperature,
  type CustomColor,
  type RoleOverrides,
  type RoleKey,
  derivedRoleColors,
} from "./lib/harmony";
import { FONT_PAIRS, loadFontPair } from "./lib/presets";
import { fromKitJson } from "./lib/exporters";
import { loadSaved, saveState } from "./lib/storage";
import {
  readSeedFromUrl,
  clearLinkParams,
  isEmbedded,
  isTrustedEmbedMessage,
  embedSave,
  OPSETTE_TOOLS_ORIGIN,
} from "./lib/opsette-kit-link";
import { seedToState } from "./lib/seed";
import { EmbedSaveBar } from "./components/palette/EmbedSaveBar";

type State = {
  baseHex: string;
  rule: HarmonyRule;
  vibrancy: Vibrancy;
  temperature: Temperature;
  fontPairId: string;
  // Per-role hex pins for a generated palette (see RoleOverrides). Empty = every
  // role derived. A base/rule/vibrancy/temperature change does NOT clear these —
  // a pinned border stays pinned as you tune the harmony, which is the point.
  roleOverrides: RoleOverrides;
};
type Action =
  | { type: "setBase"; hex: string }
  | { type: "setRule"; rule: HarmonyRule }
  | { type: "setVibrancy"; vibrancy: Vibrancy }
  | { type: "setTemperature"; temperature: Temperature }
  | { type: "setFont"; id: string }
  | { type: "setRoleOverride"; role: RoleKey; hex: string }
  | { type: "clearRoleOverride"; role: RoleKey }
  | { type: "hydrate"; state: State };

const INITIAL: State = {
  baseHex: "#2f6f8f",
  rule: "exact",
  vibrancy: "balanced",
  temperature: "neutral",
  fontPairId: "inter",
  roleOverrides: {},
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
    case "setRoleOverride":
      return { ...s, roleOverrides: { ...s.roleOverrides, [a.role]: a.hex } };
    case "clearRoleOverride": {
      const next = { ...s.roleOverrides };
      delete next[a.role];
      return { ...s, roleOverrides: next };
    }
    case "hydrate":
      // Older saved/loaded state may predate roleOverrides — default it so a
      // hydrate never leaves the field undefined.
      return { ...a.state, roleOverrides: a.state.roleOverrides ?? {} };
  }
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, INITIAL);
  // When the user is in "My own colors" mode, these are the colors she supplied
  // with their assigned roles. A non-empty list switches palette construction
  // from the generated (single-base + harmony) path to the custom path.
  const [customColors, setCustomColors] = useState<CustomColor[]>([]);
  const isCustom = customColors.length > 0;

  // ── Mechanism 3: running inside a Brand Board iframe ──────────────────────
  // When embedded (?embed=1) we hide the app's own chrome (header/footer/intro)
  // so the drawer reads as one surface, listen for the parent's `load` blob, and
  // offer a "Save to Brand Board" bar that posts the revised blob back up. In dev
  // the parent is on localhost, so its origin is added to the trust list.
  const embedded = useMemo(() => isEmbedded(), []);
  const trustedParentOrigins = useMemo(
    () => (import.meta.env.DEV ? [window.location.origin, "http://localhost:8124"] : []),
    [],
  );
  // The freshest blob-builder, published up by ExportPanel. Held in a ref so the
  // save handler always bakes current palette state without re-subscribing.
  const buildBlobRef = useRef<BuildKitBlob | null>(null);
  const [saving, setSaving] = useState(false);
  // The single source of truth for the kit name — one field across every path:
  // the standalone Export card / download modal, the "Export to Brand Board"
  // blob, the embed round-trip save, AND reopen (a pasted/loaded blob restores
  // its name here). ExportPanel edits it as a controlled prop; the embed save
  // reads it directly, so a client's palette never silently relabels "Untitled".
  const [kitName, setKitName] = useState<string>("");

  useEffect(() => {
    // A ?seed= brand core (Mechanism 1) wins over the last-saved palette: when
    // you arrive from the "New client kit" starter, the tool should open on the
    // CLIENT's brand color/font, not whatever you built last. A partial seed
    // merges onto the defaults so unset facts stay sensible. No seed → restore
    // the saved palette exactly as before (behavior unchanged without a seed).
    // Embedded in Brand Board (Mechanism 3): the parent will post the palette to
    // load, so don't seed from the URL or restore this device's last palette —
    // either would flash the wrong palette before the parent's blob arrives.
    if (embedded) return;
    const core = readSeedFromUrl();
    const seeded = core ? seedToState(core) : null;
    if (seeded) {
      dispatch({ type: "hydrate", state: { ...INITIAL, ...seeded } });
      clearLinkParams();
      return;
    }
    const saved = loadSaved();
    if (saved) {
      dispatch({
        type: "hydrate",
        state: {
          baseHex: saved.baseHex,
          rule: saved.rule,
          vibrancy: saved.vibrancy,
          temperature: saved.temperature,
          fontPairId: saved.fontPairId,
          roleOverrides: saved.roleOverrides,
        },
      });
      // Restore the "My own colors" list too — a non-empty list reopens the app
      // in custom mode, so a hand-typed palette survives a refresh instead of
      // making the user re-paste every hex.
      if (saved.customColors.length > 0) setCustomColors(saved.customColors);
    }
  }, [embedded]);

  useEffect(() => {
    // Don't persist while embedded — editing a client's palette in the Brand
    // Board drawer must not overwrite this device's own standalone palette.
    if (embedded) return;
    saveState({ ...state, customColors });
  }, [state, customColors, embedded]);

  const fontPair = useMemo(
    () => FONT_PAIRS.find((f) => f.id === state.fontPairId) ?? FONT_PAIRS[0],
    [state.fontPairId],
  );

  useEffect(() => {
    loadFontPair(fontPair);
  }, [fontPair]);

  // Reopen a saved palette: parse a pasted Brand Kit blob and restore the INPUTS
  // that produced it (base/rule/vibrancy/temperature + font, or the custom color
  // list) — never the derived palette itself. Restoring inputs makes the round
  // trip lossless: buildPalette / buildCustomPalette rebuild the exact same
  // result, and every control reflects the reopened state.
  function reopenFromPaste(raw: string): "generated" | "custom" | null {
    const payload = fromKitJson(raw);
    if (!payload) {
      void staticMessage.error("That doesn't look like a saved Opsette palette.");
      return null;
    }
    const d = payload.data;
    if (typeof d.kitName === "string") setKitName(d.kitName);
    const isCustomPayload = Boolean(d.custom && d.custom.length > 0);
    if (isCustomPayload && d.custom) {
      // "My own colors" palette — restore the exact user-supplied colors.
      setCustomColors(d.custom);
    } else {
      // Generated palette — restore the harmony inputs and leave custom mode.
      setCustomColors([]);
      // Re-derive the roles this base/rule/vibrancy/temperature would produce and
      // pin ONLY the ones the blob's saved roles differ from. That keeps a hand-
      // tuned border (or any role) across the round trip without needlessly
      // pinning the roles that were never changed — so re-tuning the harmony
      // still moves the un-pinned roles as expected.
      const roleOverrides: RoleOverrides = {};
      if (d.roles && typeof d.roles === "object") {
        const derived = derivedRoleColors(d.base, d.rule, d.vibrancy, d.temperature);
        (Object.keys(derived) as RoleKey[]).forEach((k) => {
          const saved = d.roles[k];
          if (typeof saved === "string" && saved.toLowerCase() !== derived[k].toLowerCase()) {
            roleOverrides[k] = saved;
          }
        });
      }
      dispatch({
        type: "hydrate",
        state: {
          baseHex: d.base,
          rule: d.rule,
          vibrancy: d.vibrancy,
          temperature: d.temperature,
          fontPairId: FONT_PAIRS.some((f) => f.id === d.font.id) ? d.font.id : INITIAL.fontPairId,
          roleOverrides,
        },
      });
    }
    void staticMessage.success(
      d.kitName ? `Reopened "${d.kitName}"` : "Palette reopened — pick up where you left off.",
    );
    return isCustomPayload ? "custom" : "generated";
  }

  // ── Mechanism 3 inbound: the parent hands us the current palette blob ──────
  // Brand Board posts a `load` message once the iframe is ready. A non-null
  // payload is an existing palette to revise (run the same reopen path the paste
  // box uses); a null payload means "fresh canvas" — leave the defaults. Only
  // trusted origins are honored (isTrustedEmbedMessage checks event.origin).
  useEffect(() => {
    if (!embedded) return;
    const onMessage = (event: MessageEvent) => {
      if (!isTrustedEmbedMessage(event, trustedParentOrigins)) return;
      const msg = event.data;
      if (msg.kind === "load" && typeof msg.payload === "string") {
        reopenFromPaste(msg.payload);
      }
    };
    window.addEventListener("message", onMessage);
    // Tell the parent we're mounted and ready to receive the load blob. Some
    // parents wait for the iframe's own signal rather than racing `onload`.
    window.parent.postMessage(
      { source: "opsette-embed", kind: "ready" },
      "*",
    );
    return () => window.removeEventListener("message", onMessage);
    // reopenFromPaste is stable enough for this one-time listener; re-subscribing
    // on every palette change would churn the listener needlessly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [embedded, trustedParentOrigins]);

  // ── Mechanism 3 outbound: post the revised blob back to Brand Board ────────
  // Bake the current palette into the same blob "Export to Brand Board" produces,
  // then postMessage it up. The parent re-ingests it (with a confirm) into the
  // right slot. Targeted at the apex origin in production, the dev parent origin
  // locally — never "*", so a revised blob can't leak to an untrusted frame host.
  async function saveToBrandBoard() {
    const build = buildBlobRef.current;
    if (!build) return;
    setSaving(true);
    try {
      // Round-trip the client's kit name (carried in on load) so the revised
      // palette lands back in Brand Board still labeled for that client.
      const name = kitName.trim() || "Untitled palette";
      const json = await build(name);
      const targetOrigin = import.meta.env.DEV ? "*" : OPSETTE_TOOLS_ORIGIN;
      window.parent.postMessage(embedSave(json), targetOrigin);
      void staticMessage.success("Updated in Brand Board");
    } catch {
      void staticMessage.error("Couldn't send the palette back — try again.");
    } finally {
      setSaving(false);
    }
  }

  const palette = useMemo(
    () =>
      isCustom
        ? buildCustomPalette(customColors)
        : buildPalette(
            state.baseHex,
            state.rule,
            state.vibrancy,
            state.temperature,
            state.roleOverrides,
          ),
    [
      isCustom,
      customColors,
      state.baseHex,
      state.rule,
      state.vibrancy,
      state.temperature,
      state.roleOverrides,
    ],
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
          {/* Embed mode (Mechanism 3): the app's own header/footer/intro are
              hidden so the drawer reads as one surface; a slim save bar takes
              the header's place. Standalone: the full chrome as always. */}
          {embedded ? (
            <EmbedSaveBar onSave={() => void saveToBrandBoard()} saving={saving} />
          ) : (
            <OpsetteHeader />
          )}
          <main
            className="ps-layout"
            style={{
              maxWidth: 1320,
              margin: "0 auto",
              padding: embedded ? "16px 20px 64px" : "20px 24px 64px",
            }}
          >
            {!embedded && (
              <section style={{ marginBottom: 16 }}>
                <Typography.Title level={2} style={{ margin: 0, fontSize: 24, color: "#2f4f46" }}>
                  Build a palette you'll trust.
                </Typography.Title>
                <Typography.Paragraph type="secondary" style={{ marginTop: 6, marginBottom: 0 }}>
                  Pick a color or a vibe, choose a harmony rule, and we'll handle the rest — roles,
                  accessible contrast, and matching fonts.
                </Typography.Paragraph>
              </section>
            )}

            {/* UNIFIED LAYOUT — every mode uses the same shape so the page never
                reshuffles when you switch modes:
                  • Left column: the Start card (mode picker + per-mode controls),
                    plus the harmony controls in generated modes (they don't apply
                    to "My own colors").
                  • Right column: a sticky LivePreview, always visible.
                  • Full-width below: palette grid, contrast, scales, export.
                The only per-mode difference is whether the harmony controls and the
                typography picker appear in the left column — the skeleton is identical. */}
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
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <StartCard
                  value={state.baseHex}
                  onChange={(hex) => dispatch({ type: "setBase", hex })}
                  customColors={customColors}
                  onCustomChange={setCustomColors}
                  onReopen={reopenFromPaste}
                />

                {!isCustom && (
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
                )}
              </div>

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
              {/* Role overrides — generated mode only. In "My own colors" mode
                  roles are assigned directly, so there's nothing to override. */}
              {!isCustom && (
                <div style={{ gridColumn: "1 / -1" }}>
                  <RoleOverridesPanel
                    base={state.baseHex}
                    rule={state.rule}
                    vibrancy={state.vibrancy}
                    temperature={state.temperature}
                    overrides={state.roleOverrides}
                    onSet={(role, hex) => dispatch({ type: "setRoleOverride", role, hex })}
                    onClear={(role) => dispatch({ type: "clearRoleOverride", role })}
                  />
                </div>
              )}
              <div style={{ gridColumn: "1 / -1" }}>
                <ScaleStrips
                  primary={palette.primaryScale}
                  accent={palette.accentScale}
                  neutrals={palette.neutrals}
                />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <ExportPanel
                  palette={palette}
                  fontPair={fontPair}
                  kitName={kitName}
                  onKitNameChange={setKitName}
                  onBuildBlobReady={(build) => {
                    buildBlobRef.current = build;
                  }}
                />
              </div>
            </div>

            {!embedded && (
              <>
                <Typography.Paragraph
                  type="secondary"
                  style={{ textAlign: "center", fontSize: 12, marginTop: 24 }}
                >
                  Palette Studio is part of Opsette Tools · Your last palette is saved on this
                  device.
                </Typography.Paragraph>

                <OpsetteFooterLogo />
              </>
            )}
          </main>
        </div>
      </AntdApp>
    </ConfigProvider>
  );
}
