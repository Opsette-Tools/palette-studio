// Guarded SW registration — never registers in Lovable preview/iframe/dev.
export function registerPwa() {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;
  if (!import.meta.env.PROD) return;

  const url = new URL(window.location.href);
  if (url.searchParams.get("sw") === "off") {
    void unregisterAppSw();
    return;
  }
  const inIframe = window.self !== window.top;
  const host = window.location.hostname;
  const blocked =
    inIframe ||
    host.startsWith("id-preview--") ||
    host.startsWith("preview--") ||
    host === "lovableproject.com" ||
    host.endsWith(".lovableproject.com") ||
    host === "lovableproject-dev.com" ||
    host.endsWith(".lovableproject-dev.com") ||
    host === "beta.lovable.dev" ||
    host.endsWith(".beta.lovable.dev");
  if (blocked) {
    void unregisterAppSw();
    return;
  }
  navigator.serviceWorker.register("/sw.js").catch(() => {});
}

async function unregisterAppSw() {
  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(
      regs
        .filter((r) => r.active?.scriptURL.endsWith("/sw.js"))
        .map((r) => r.unregister()),
    );
  } catch {
    /* ignore */
  }
}
