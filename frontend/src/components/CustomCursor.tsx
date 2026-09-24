import { useEffect, useRef, type ReactElement } from "react";

const TRAIL_COUNT = 6;
const INTERACTIVE_SELECTOR = "a, button, input, textarea, select, [role='button']";

export const CustomCursor = (): ReactElement => {
  const cursorRef = useRef<HTMLDivElement>(null);
  const trailRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    const finePointer = window.matchMedia("(pointer: fine)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!finePointer.matches || reducedMotion.matches) return;

    const cursor = cursorRef.current;
    if (!cursor) return;
    document.documentElement.classList.add("kridangan-custom-cursor");

    let frame = 0;
    let targetX = -100;
    let targetY = -100;
    const points = Array.from({ length: TRAIL_COUNT }, () => ({ x: -100, y: -100 }));

    const move = (event: PointerEvent): void => {
      targetX = event.clientX;
      targetY = event.clientY;
      cursor.dataset.visible = "true";
      const target = event.target instanceof Element ? event.target : null;
      cursor.dataset.hover = String(Boolean(target?.closest(INTERACTIVE_SELECTOR)));
      trailRefs.current.forEach((node, index) => { if (node) node.style.opacity = String(0.2 - index * 0.025); });
    };
    const hide = (): void => {
      cursor.dataset.visible = "false";
      trailRefs.current.forEach((node) => { if (node) node.style.opacity = "0"; });
    };
    const animate = (): void => {
      cursor.style.transform = `translate3d(${targetX - 12}px, ${targetY - 12}px, 0)`;
      points.forEach((point, index) => {
        const source = index === 0 ? { x: targetX, y: targetY } : points[index - 1];
        const ease = 0.25 - index * 0.02;
        point.x += (source.x - point.x) * ease;
        point.y += (source.y - point.y) * ease;
        const node = trailRefs.current[index];
        if (node) node.style.transform = `translate3d(${point.x - 2}px, ${point.y - 2}px, 0)`;
      });
      frame = window.requestAnimationFrame(animate);
    };

    window.addEventListener("pointermove", move, { passive: true });
    document.documentElement.addEventListener("pointerleave", hide);
    frame = window.requestAnimationFrame(animate);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", move);
      document.documentElement.removeEventListener("pointerleave", hide);
      document.documentElement.classList.remove("kridangan-custom-cursor");
    };
  }, []);

  return (
    <div aria-hidden="true" data-testid="custom-cursor-layer" className="pointer-events-none fixed inset-0 z-[100]">
      {Array.from({ length: TRAIL_COUNT }, (_, index) => <span key={index} ref={(node) => { trailRefs.current[index] = node; }} className="kridangan-cursor-trail" style={{ opacity: 0 }} />)}
      <div ref={cursorRef} data-testid="custom-cursor-crosshair" data-visible="false" data-hover="false" className="kridangan-cursor"><span /></div>
    </div>
  );
};