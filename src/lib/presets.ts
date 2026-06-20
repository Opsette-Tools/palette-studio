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

  // ── Editorial / elegant: an expressive serif heading over a clean sans body.
  // The serif carries personality; the sans keeps long copy comfortable to read.
  {
    id: "cormorant-lato",
    label: "Cormorant Garamond / Lato",
    heading: "Cormorant Garamond",
    body: "Lato",
    headingFamily: '"Cormorant Garamond", serif',
    bodyFamily: '"Lato", system-ui, sans-serif',
    googleHref:
      "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=Lato:wght@400;700&display=swap",
  },
  {
    id: "libre-baskerville-montserrat",
    label: "Libre Baskerville / Montserrat",
    heading: "Libre Baskerville",
    body: "Montserrat",
    headingFamily: '"Libre Baskerville", serif',
    bodyFamily: '"Montserrat", system-ui, sans-serif',
    googleHref:
      "https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@700&family=Montserrat:wght@400;600&display=swap",
  },
  {
    id: "dmserif-dmsans",
    label: "DM Serif Display / DM Sans",
    heading: "DM Serif Display",
    body: "DM Sans",
    headingFamily: '"DM Serif Display", serif',
    bodyFamily: '"DM Sans", system-ui, sans-serif',
    googleHref:
      "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500&family=DM+Serif+Display&display=swap",
  },

  // ── Modern / startup: geometric or grotesque sans headings, neutral sans body.
  {
    id: "montserrat-opensans",
    label: "Montserrat / Open Sans",
    heading: "Montserrat",
    body: "Open Sans",
    headingFamily: '"Montserrat", sans-serif',
    bodyFamily: '"Open Sans", system-ui, sans-serif',
    googleHref:
      "https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700&family=Open+Sans:wght@400;600&display=swap",
  },
  {
    id: "manrope-manrope",
    label: "Manrope / Manrope",
    heading: "Manrope",
    body: "Manrope",
    headingFamily: '"Manrope", system-ui, sans-serif',
    bodyFamily: '"Manrope", system-ui, sans-serif',
    googleHref: "https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;700&display=swap",
  },
  {
    id: "sora-inter",
    label: "Sora / Inter",
    heading: "Sora",
    body: "Inter",
    headingFamily: '"Sora", sans-serif',
    bodyFamily: '"Inter", system-ui, sans-serif',
    googleHref:
      "https://fonts.googleapis.com/css2?family=Inter:wght@400;500&family=Sora:wght@600;700&display=swap",
  },

  // ── Friendly / approachable: rounder, warmer letterforms — good for community,
  // hospitality, consumer apps.
  {
    id: "fraunces-nunito",
    label: "Fraunces / Nunito Sans",
    heading: "Fraunces",
    body: "Nunito Sans",
    headingFamily: '"Fraunces", serif',
    bodyFamily: '"Nunito Sans", system-ui, sans-serif',
    googleHref:
      "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&family=Nunito+Sans:wght@400;600&display=swap",
  },
  {
    id: "quicksand-nunito",
    label: "Quicksand / Nunito",
    heading: "Quicksand",
    body: "Nunito",
    headingFamily: '"Quicksand", sans-serif',
    bodyFamily: '"Nunito", system-ui, sans-serif',
    googleHref:
      "https://fonts.googleapis.com/css2?family=Nunito:wght@400;600&family=Quicksand:wght@600;700&display=swap",
  },

  // ── Technical / trustworthy: superfamily pairings (designed together) — steady
  // and precise for SaaS, finance, developer tools.
  {
    id: "plex-serif-sans",
    label: "IBM Plex Serif / IBM Plex Sans",
    heading: "IBM Plex Serif",
    body: "IBM Plex Sans",
    headingFamily: '"IBM Plex Serif", serif',
    bodyFamily: '"IBM Plex Sans", system-ui, sans-serif',
    googleHref:
      "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;600&family=IBM+Plex+Serif:wght@600;700&display=swap",
  },
  {
    id: "source-serif-sans",
    label: "Source Serif 4 / Source Sans 3",
    heading: "Source Serif 4",
    body: "Source Sans 3",
    headingFamily: '"Source Serif 4", serif',
    bodyFamily: '"Source Sans 3", system-ui, sans-serif',
    googleHref:
      "https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400;600&family=Source+Serif+4:wght@600;700&display=swap",
  },
  {
    id: "worksans-worksans",
    label: "Work Sans / Work Sans",
    heading: "Work Sans",
    body: "Work Sans",
    headingFamily: '"Work Sans", system-ui, sans-serif',
    bodyFamily: '"Work Sans", system-ui, sans-serif',
    googleHref: "https://fonts.googleapis.com/css2?family=Work+Sans:wght@400;500;700&display=swap",
  },

  // ── Distinctive: a strong slab/serif display over a quiet sans — high
  // personality headings for brands that want to stand out.
  {
    id: "lora-inter",
    label: "Lora / Inter",
    heading: "Lora",
    body: "Inter",
    headingFamily: '"Lora", serif',
    bodyFamily: '"Inter", system-ui, sans-serif',
    googleHref:
      "https://fonts.googleapis.com/css2?family=Inter:wght@400;500&family=Lora:wght@600;700&display=swap",
  },
  {
    id: "archivo-inter",
    label: "Archivo / Inter",
    heading: "Archivo",
    body: "Inter",
    headingFamily: '"Archivo", sans-serif',
    bodyFamily: '"Inter", system-ui, sans-serif',
    googleHref:
      "https://fonts.googleapis.com/css2?family=Archivo:wght@600;700&family=Inter:wght@400;500&display=swap",
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
