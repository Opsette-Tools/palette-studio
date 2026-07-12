// Palette Studio → PDF export.
//
// A REAL PDF (jsPDF), not an image of one: every hex code and color name is drawn
// as selectable jsPDF text, so a client can open the PDF and copy "#E8884A"
// straight out of it. The swatches are vector rectangles. This is the deliverable
// half of the "bake both PNG + PDF into the export blob" work — the PNG shows the
// palette, the PDF makes its hex codes copyable.
//
// Layout: US Letter portrait. Title + "Generated with Palette Studio", the color
// roles (or the user's own colors) as a swatch grid with copyable name+hex, the
// three tint/shade scales as labeled rows with copyable stops, and a small
// right-sized Opsette logo footer (the ~12KB export logo via loadOpsetteLogo —
// never the full-res app logo, per the "small logo in any PDF" rule).

import { jsPDF } from "jspdf";
import type { Palette } from "./harmony";
import { CUSTOM_ROLE_OPTIONS } from "./harmony";
import type { FontPair } from "./presets";
import { readableOn } from "./color";
import { loadOpsetteLogo } from "./logo";

function roleLabel(role: string): string {
  return CUSTOM_ROLE_OPTIONS.find((o) => o.value === role)?.label ?? role;
}

/** "#e8884a" → { r, g, b } for jsPDF fill/text colors. Tolerant of missing "#". */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

/** The named swatches shown at the top — user's own colors, or the six roles. */
function topSwatches(p: Palette): { label: string; hex: string }[] {
  if (p.custom) {
    return p.custom.map((c) => ({ label: c.name?.trim() || roleLabel(c.role), hex: c.hex }));
  }
  return [
    { label: "Buttons / CTA", hex: p.primary },
    { label: "Secondary button", hex: p.secondary },
    { label: "Accent", hex: p.accent },
    { label: "Page background", hex: p.roles.background },
    { label: "Card background", hex: p.roles.surface },
    { label: "Heading", hex: p.roles.heading },
    { label: "Body text", hex: p.roles.text },
  ];
}

// Letter portrait, in points (jsPDF's default unit for "pt").
const PAGE_W = 612;
const PAGE_H = 792;
const MARGIN = 48;
const CONTENT_W = PAGE_W - MARGIN * 2;

/**
 * Build the palette PDF as a Blob. All hex codes and labels are live, selectable
 * text. Async only because it inlines the small Opsette logo for the footer.
 */
export async function buildPalettePdf(
  palette: Palette,
  font: FontPair,
  kitName: string,
): Promise<Blob> {
  const doc = new jsPDF({ unit: "pt", format: "letter", compress: true });
  const title = kitName.trim() || "Brand palette";

  let y = MARGIN;

  // ---- Header ------------------------------------------------------------
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.setTextColor(20, 20, 20);
  doc.text(title, MARGIN, y + 6);
  y += 24;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(120, 120, 120);
  doc.text(
    `Generated with Palette Studio  ·  ${font.heading} / ${font.body}`,
    MARGIN,
    y + 6,
  );
  y += 30;

  // ---- Section: color roles / your colors --------------------------------
  const swatches = topSwatches(palette);
  const heading = (label: string) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(30, 30, 30);
    doc.text(label, MARGIN, y + 6);
    y += 22;
  };

  heading(palette.custom ? "Your colors" : "Color roles");

  // A 4-column grid of slim swatch cards. Each card is a filled rect with the
  // label and hex drawn ON the swatch in a readable ink — the hex is the real
  // selectable text, so it copies cleanly. 4-up + a shorter card recoups the
  // vertical space that was pushing the doc to a second page.
  const cols = 4;
  const gap = 8;
  const cardW = (CONTENT_W - gap * (cols - 1)) / cols;
  const cardH = 48;
  swatches.forEach((s, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = MARGIN + col * (cardW + gap);
    const cy = y + row * (cardH + gap);
    const { r, g, b } = hexToRgb(s.hex);
    doc.setFillColor(r, g, b);
    doc.roundedRect(x, cy, cardW, cardH, 5, 5, "F");
    const ink = readableOn(s.hex);
    const inkRgb = hexToRgb(ink);
    doc.setTextColor(inkRgb.r, inkRgb.g, inkRgb.b);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.text(s.label, x + 8, cy + 18, { maxWidth: cardW - 16 });
    doc.setFont("courier", "normal");
    doc.setFontSize(9);
    doc.text(s.hex.toUpperCase(), x + 8, cy + cardH - 10);
  });
  const swatchRows = Math.ceil(swatches.length / cols);
  y += swatchRows * (cardH + gap) + 6;

  // ---- Sections: tint & shade scales -------------------------------------
  const scales: { label: string; scale: Record<string, string> }[] = [
    { label: "Buttons / CTA — tints & shades", scale: palette.primaryScale },
    { label: "Accent — tints & shades", scale: palette.accentScale },
    { label: "Neutral — tints & shades", scale: palette.neutrals },
  ];

  scales.forEach(({ label, scale }) => {
    heading(label);
    const entries = Object.entries(scale);
    const n = entries.length;
    const stripGap = 4;
    const stripW = (CONTENT_W - stripGap * (n - 1)) / n;
    // Slim strip that holds BOTH the stop number and the hex INSIDE it — no more
    // separate hex row beneath, which was doubling the height of every scale.
    // The hex stays real selectable text; it's just drawn on the swatch now.
    const stripH = 34;
    entries.forEach(([stop, hex], i) => {
      const x = MARGIN + i * (stripW + stripGap);
      const { r, g, b } = hexToRgb(hex);
      doc.setFillColor(r, g, b);
      doc.roundedRect(x, y, stripW, stripH, 4, 4, "F");
      const inkRgb = hexToRgb(readableOn(hex));
      doc.setTextColor(inkRgb.r, inkRgb.g, inkRgb.b);
      // Stop number (top) + hex (bottom), both on the swatch in readable ink.
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.text(stop, x + 4, y + 12);
      doc.setFont("courier", "normal");
      doc.setFontSize(6);
      doc.text(hex.toUpperCase(), x + 4, y + stripH - 6);
    });
    y += stripH + 12;
  });

  // ---- Section: "In context" mockup --------------------------------------
  // The same composed mini-page as the PNG's "In context" block — a page-bg card
  // wrapping a surface card with the heading (in the CTA color), body + muted
  // text, and CTA / Secondary / Accent-badge chips. Drawn with jsPDF primitives
  // so the PDF carries everything the PNG does.
  //
  // The mockup is ~200pt tall; if the scales already pushed us near the bottom,
  // start a fresh page so it's never clipped by the footer.
  const MOCKUP_EST_H = 210;
  if (y + MOCKUP_EST_H > PAGE_H - MARGIN - 30) {
    doc.addPage();
    y = MARGIN;
  }
  heading("In context");
  {
    const roles = palette.roles;
    const pad = 16;
    const outerX = MARGIN;
    const outerW = CONTENT_W;
    const innerX = outerX + pad;
    const innerW = outerW - pad * 2;
    const textW = innerW - pad * 2;

    // Measure body/muted copy so the card is exactly tall enough (no clipping).
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    const bodyText =
      "This is your body text on a section background. The heading uses your buttons / CTA color so you can see how the pieces sit together.";
    const bodyLines = doc.splitTextToSize(bodyText, textW) as string[];
    const mutedText = "Secondary text sits a little quieter than the body.";

    // Inner card height: heading + body lines + muted + buttons row.
    const headingH = 22;
    const bodyH = bodyLines.length * 14;
    const mutedH = 16;
    const buttonsH = 30;
    const innerH = pad + headingH + bodyH + 8 + mutedH + 14 + buttonsH + pad;
    const labelH = 20;
    const outerH = pad + labelH + innerH + pad;

    // Outer page-background card.
    const bg = hexToRgb(roles.background);
    const border = hexToRgb(roles.border);
    doc.setFillColor(bg.r, bg.g, bg.b);
    doc.setDrawColor(border.r, border.g, border.b);
    doc.roundedRect(outerX, y, outerW, outerH, 10, 10, "FD");

    // "On the page background" label.
    const txt = hexToRgb(roles.text);
    doc.setTextColor(txt.r, txt.g, txt.b);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("On the page background", innerX, y + pad + 12);

    // Inner surface card.
    const innerY = y + pad + labelH;
    const surface = hexToRgb(roles.surface);
    doc.setFillColor(surface.r, surface.g, surface.b);
    doc.setDrawColor(border.r, border.g, border.b);
    doc.roundedRect(innerX, innerY, innerW, innerH, 8, 8, "FD");

    let iy = innerY + pad;

    // Heading in the CTA/primary color.
    const heads = hexToRgb(roles.heading);
    doc.setTextColor(heads.r, heads.g, heads.b);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    iy += 14;
    doc.text("Your brand, in context.", innerX + pad, iy);
    iy += 12;

    // Body text.
    doc.setTextColor(txt.r, txt.g, txt.b);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(bodyLines, innerX + pad, iy + 6);
    iy += bodyH + 6;

    // Muted text.
    const muted = hexToRgb(roles.mutedText);
    doc.setTextColor(muted.r, muted.g, muted.b);
    doc.setFontSize(10);
    doc.text(mutedText, innerX + pad, iy + 6);
    iy += mutedH + 12;

    // Buttons row: CTA (solid), Secondary (outline), Accent badge (pill).
    const chip = (
      label: string,
      x: number,
      opts: { fill?: string; textColor: string; outline?: string; pill?: boolean },
    ): number => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      const w = doc.getTextWidth(label) + 20;
      const h = 22;
      const r = opts.pill ? h / 2 : 6;
      if (opts.fill) {
        const f = hexToRgb(opts.fill);
        doc.setFillColor(f.r, f.g, f.b);
      }
      if (opts.outline) {
        const o = hexToRgb(opts.outline);
        doc.setDrawColor(o.r, o.g, o.b);
      }
      const style = opts.fill && opts.outline ? "FD" : opts.fill ? "F" : "D";
      doc.roundedRect(x, iy, w, h, r, r, style);
      const tc = hexToRgb(opts.textColor);
      doc.setTextColor(tc.r, tc.g, tc.b);
      doc.text(label, x + 10, iy + 15);
      return w;
    };

    let bx = innerX + pad;
    bx += chip("Buttons / CTA", bx, { fill: palette.primary, textColor: readableOn(palette.primary) }) + 8;
    bx += chip("Secondary", bx, { textColor: palette.primary, outline: palette.primary }) + 8;
    chip("Accent badge", bx, { fill: palette.accent, textColor: readableOn(palette.accent), pill: true });

    y += outerH + 12;
  }

  // ---- Footer: small Opsette logo + mark ---------------------------------
  const footerY = PAGE_H - MARGIN + 6;
  doc.setDrawColor(230, 230, 230);
  doc.line(MARGIN, footerY - 18, PAGE_W - MARGIN, footerY - 18);
  const logo = await loadOpsetteLogo();
  if (logo) {
    try {
      // ~16pt tall mark, keeping the export logo's aspect (roughly square-ish).
      doc.addImage(logo, "PNG", MARGIN, footerY - 12, 16, 16);
    } catch {
      // Never fail the PDF on a logo problem.
    }
  }
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text("Built with Palette Studio · Opsette", MARGIN + (logo ? 22 : 0), footerY);

  return doc.output("blob");
}

/** Trigger a browser download of the palette PDF. */
export async function downloadPalettePdf(
  palette: Palette,
  font: FontPair,
  kitName: string,
  fileName: string,
): Promise<void> {
  const blob = await buildPalettePdf(palette, font, kitName);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.download = fileName;
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
}

/** A Blob → base64 data URL (for baking the PDF into the export blob). */
export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}
