import type { Palette, HarmonyRule, Vibrancy, Temperature, CustomColor } from "./harmony";
import type { FontPair } from "./presets";

export function toCssVars(p: Palette): string {
  const lines = [
    ":root {",
    `  --color-primary: ${p.primary};`,
    `  --color-secondary: ${p.secondary};`,
    `  --color-accent: ${p.accent};`,
    ...(p.accent2 ? [`  --color-accent-2: ${p.accent2};`] : []),
    `  --color-background: ${p.roles.background};`,
    `  --color-surface: ${p.roles.surface};`,
    `  --color-text: ${p.roles.text};`,
    `  --color-heading: ${p.roles.heading};`,
    `  --color-muted: ${p.roles.mutedText};`,
    `  --color-border: ${p.roles.border};`,
  ];
  Object.entries(p.primaryScale).forEach(([k, v]) => lines.push(`  --color-primary-${k}: ${v};`));
  Object.entries(p.accentScale).forEach(([k, v]) => lines.push(`  --color-accent-${k}: ${v};`));
  Object.entries(p.neutrals).forEach(([k, v]) => lines.push(`  --color-neutral-${k}: ${v};`));
  lines.push("}");
  return lines.join("\n");
}

export function toTailwind(p: Palette): string {
  return `// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: ${JSON.stringify(p.primaryScale, null, 10).replace(/\n/g, "\n        ")},
        accent: ${JSON.stringify(p.accentScale, null, 10).replace(/\n/g, "\n        ")},
        neutral: ${JSON.stringify(p.neutrals, null, 10).replace(/\n/g, "\n        ")},
        secondary: "${p.secondary}",${p.accent2 ? `\n        accent2: "${p.accent2}",` : ""}
        background: "${p.roles.background}",
        surface: "${p.roles.surface}",
        heading: "${p.roles.heading}",
      },
    },
  },
};`;
}

export function toAntd(p: Palette): string {
  const token = {
    colorPrimary: p.primary,
    colorInfo: p.secondary,
    colorSuccess: "#52c41a",
    colorWarning: "#faad14",
    colorError: "#ff4d4f",
    colorTextBase: p.roles.text,
    colorTextHeading: p.roles.heading,
    colorBgBase: p.roles.background,
    colorBgContainer: p.roles.surface,
    colorBorder: p.roles.border,
    colorLink: p.primary,
  };
  return `// AntD ConfigProvider theme
import { ConfigProvider } from "antd";

const theme = {
  token: ${JSON.stringify(token, null, 2).replace(/\n/g, "\n  ")},
};

<ConfigProvider theme={theme}>{/* your app */}</ConfigProvider>`;
}

// ── Brand Kit interop (see docs/BRAND-KIT-INTEROP-CONTRACT.md) ───────────────
// The shared clipboard shape Brand Board (and this app's own reopen path)
// consume. Palette Studio is the "build first" source: this is the `palette`
// payload. Version + type + source let the consumer route/validate a pasted blob.

export type PalettePayload = {
  type: "palette";
  v: 1;
  source: "opsette";
  data: {
    kitName: string;
    base: string;
    rule: HarmonyRule;
    vibrancy: Vibrancy;
    temperature: Temperature;
    primary: string;
    secondary: string;
    accent: string;
    accent2?: string;
    roles: {
      background: string;
      surface: string;
      text: string;
      heading: string;
      mutedText: string;
      border: string;
    };
    scales: {
      primary: Record<string, string>;
      accent: Record<string, string>;
      neutral: Record<string, string>;
    };
    // Only present in "My own colors" mode — the user's exact colors + roles.
    custom?: CustomColor[];
    font: {
      id: string;
      heading: string;
      body: string;
      googleHref: string;
    };
  };
};

// Serialize the current palette + fonts into the shared Brand Kit shape. All the
// data already exists at the ExportPanel boundary — this is a pure mapping, no
// model changes. `custom` is carried only for "My own colors" palettes so the
// reopen path can rebuild the exact user-supplied colors.
export function toKitJson(p: Palette, font: FontPair, kitName: string): PalettePayload {
  return {
    type: "palette",
    v: 1,
    source: "opsette",
    data: {
      kitName,
      base: p.base,
      rule: p.rule,
      vibrancy: p.vibrancy,
      temperature: p.temperature,
      primary: p.primary,
      secondary: p.secondary,
      accent: p.accent,
      ...(p.accent2 ? { accent2: p.accent2 } : {}),
      roles: { ...p.roles },
      scales: {
        primary: { ...p.primaryScale },
        accent: { ...p.accentScale },
        neutral: { ...p.neutrals },
      },
      ...(p.custom ? { custom: p.custom } : {}),
      font: {
        id: font.id,
        heading: font.heading,
        body: font.body,
        googleHref: font.googleHref,
      },
    },
  };
}

// Parse a pasted blob back into a palette payload — used by the reopen path.
// Returns null (never throws) for anything that isn't a valid Opsette palette
// blob, so the caller can show a friendly "that's not a palette" message. This
// is deliberately strict on the envelope (type/v/source) and lenient on the
// interior: we only read the fields the reopen path actually restores.
export function fromKitJson(raw: string): PalettePayload | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw.trim());
  } catch {
    return null;
  }
  if (typeof parsed !== "object" || parsed === null) return null;
  const p = parsed as Record<string, unknown>;
  if (p.type !== "palette" || p.v !== 1 || p.source !== "opsette") return null;
  const data = p.data;
  if (typeof data !== "object" || data === null) return null;
  const d = data as Record<string, unknown>;
  // Minimum viable payload for a reopen: a base hex + a rule. Custom palettes
  // additionally carry `custom`, which the caller checks for.
  if (typeof d.base !== "string" || typeof d.rule !== "string") return null;
  return parsed as PalettePayload;
}
