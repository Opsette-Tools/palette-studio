import type { Palette } from "./harmony";

export function toCssVars(p: Palette): string {
  const lines = [
    ":root {",
    `  --color-primary: ${p.primary};`,
    `  --color-secondary: ${p.secondary};`,
    `  --color-accent: ${p.accent};`,
    `  --color-background: ${p.roles.background};`,
    `  --color-surface: ${p.roles.surface};`,
    `  --color-text: ${p.roles.text};`,
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
        secondary: "${p.secondary}",
        background: "${p.roles.background}",
        surface: "${p.roles.surface}",
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
