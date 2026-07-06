// Loads the Opsette logo and caches it as a data URL.
//
// The brand kit PNG is rendered off-screen and snapshotted with html-to-image.
// A plain <img src="opsette-logo.png"> is unreliable inside that snapshot: the
// image may not have decoded yet when the capture runs, and cache-busting can
// re-request it mid-capture. Inlining the logo as a base64 data URL sidesteps
// both — by the time we hand the data URL to the preview, the bytes are already
// in memory, so it always paints.

const base = (import.meta.env.BASE_URL || "/").replace(/\/+$/, "/");
// Use the export-optimized logo (~320px tall, ~12KB) rather than the full-res
// 3140px app logo (~435KB). The brand kit renders the logo at most 88px, so a
// 320px source is retina-crisp while keeping the inlined data URL — and any
// downloaded artifact that carries it — light instead of dragging the full image.
const LOGO_URL = `${base}opsette-logo-export.png`;

let cached: string | null = null;
let inflight: Promise<string> | null = null;

export function loadOpsetteLogo(): Promise<string> {
  if (cached) return Promise.resolve(cached);
  if (inflight) return inflight;
  inflight = fetch(LOGO_URL)
    .then((r) => r.blob())
    .then(
      (blob) =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            cached = reader.result as string;
            resolve(cached);
          };
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(blob);
        }),
    )
    .catch(() => {
      // Never block the export on a logo failure — fall back to no logo.
      inflight = null;
      return "";
    });
  return inflight;
}
