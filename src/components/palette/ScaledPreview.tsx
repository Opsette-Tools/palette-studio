import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

// Renders a fixed-size node (e.g. the 1080px-wide BrandKitPreview) scaled to fit
// the width it's dropped into, so a live preview can sit inside a modal pane
// without changing the node itself. The child stays pixel-identical to what an
// export snapshot (html-to-image / toPng) captures — we only apply a CSS
// transform on a wrapper, never touch the child's own layout. That's what keeps
// "what you see is what you download" true.
//
// Generic on purpose: hand it any fixed-width block and a target and it scales.
type Props = {
  /** The intrinsic (unscaled) width of the child, in px. */
  contentWidth: number;
  /** The fixed node to scale — typically also the export/snapshot target. */
  children: ReactNode;
  /** Max width the preview may occupy; defaults to the container's width. */
  maxWidth?: number;
};

export function ScaledPreview({ contentWidth, children, maxWidth }: Props) {
  const outerRef = useRef<HTMLDivElement | null>(null);
  const innerRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);
  const [renderedHeight, setRenderedHeight] = useState<number>(0);

  // Measure the available width and the child's natural height, then compute the
  // scale that makes the child fit. A ResizeObserver keeps it correct as the
  // modal/viewport resizes (e.g. rotating a phone) without a manual re-open.
  useLayoutEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;

    const measure = () => {
      const available = maxWidth
        ? Math.min(outer.clientWidth, maxWidth)
        : outer.clientWidth;
      const next = available > 0 ? Math.min(available / contentWidth, 1) : 1;
      setScale(next);
      // The child's own rendered height (unscaled) × scale gives the space the
      // scaled preview actually occupies, so the wrapper reserves the right box.
      setRenderedHeight(inner.offsetHeight * next);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(outer);
    return () => ro.disconnect();
  }, [contentWidth, maxWidth, children]);

  return (
    <div ref={outerRef} style={{ width: "100%", height: renderedHeight || undefined }}>
      <div
        ref={innerRef}
        style={{
          width: contentWidth,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        {children}
      </div>
    </div>
  );
}
