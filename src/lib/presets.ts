export type Vibe = { id: string; label: string; description: string; hex: string };

export const VIBES: Vibe[] = [
  { id: "calm", label: "Calm & trustworthy", description: "Cool blues — good for finance, health, SaaS.", hex: "#2f6f8f" },
  { id: "bold", label: "Bold & energetic", description: "High-saturation reds — startups, fitness, food.", hex: "#e2483d" },
  { id: "warm", label: "Warm & friendly", description: "Sunset orange — community, hospitality.", hex: "#e8884a" },
  { id: "elegant", label: "Elegant & premium", description: "Deep plum — fashion, luxury, editorial.", hex: "#3a2f4f" },
  { id: "fresh", label: "Fresh & natural", description: "Garden greens — wellness, food, eco.", hex: "#4f8f5a" },
  { id: "professional", label: "Professional", description: "Steady forest green — agencies, consulting.", hex: "#2f4f46" },
];

export type FontPair = {
  id: string;
  label: string;
  heading: string;
  body: string;
  headingFamily: string;
  bodyFamily: string;
  googleHref: string;
};

export const FONT_PAIRS: FontPair[] = [
  {
    id: "inter",
    label: "Inter / Inter",
    heading: "Inter",
    body: "Inter",
    headingFamily: '"Inter", system-ui, sans-serif',
    bodyFamily: '"Inter", system-ui, sans-serif',
    googleHref: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap",
  },
  {
    id: "playfair-source",
    label: "Playfair Display / Source Sans 3",
    heading: "Playfair Display",
    body: "Source Sans 3",
    headingFamily: '"Playfair Display", serif',
    bodyFamily: '"Source Sans 3", system-ui, sans-serif',
    googleHref:
      "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Source+Sans+3:wght@400;600&display=swap",
  },
  {
    id: "poppins-inter",
    label: "Poppins / Inter",
    heading: "Poppins",
    body: "Inter",
    headingFamily: '"Poppins", sans-serif',
    bodyFamily: '"Inter", system-ui, sans-serif',
    googleHref:
      "https://fonts.googleapis.com/css2?family=Inter:wght@400;500&family=Poppins:wght@600;700&display=swap",
  },
  {
    id: "space-inter",
    label: "Space Grotesk / Inter",
    heading: "Space Grotesk",
    body: "Inter",
    headingFamily: '"Space Grotesk", sans-serif',
    bodyFamily: '"Inter", system-ui, sans-serif',
    googleHref:
      "https://fonts.googleapis.com/css2?family=Inter:wght@400;500&family=Space+Grotesk:wght@600;700&display=swap",
  },
  {
    id: "merriweather-lato",
    label: "Merriweather / Lato",
    heading: "Merriweather",
    body: "Lato",
    headingFamily: '"Merriweather", serif',
    bodyFamily: '"Lato", system-ui, sans-serif',
    googleHref:
      "https://fonts.googleapis.com/css2?family=Lato:wght@400;700&family=Merriweather:wght@700&display=swap",
  },
];

const loaded = new Set<string>();
export function loadFontPair(pair: FontPair) {
  if (typeof document === "undefined" || loaded.has(pair.id)) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = pair.googleHref;
  document.head.appendChild(link);
  loaded.add(pair.id);
}
