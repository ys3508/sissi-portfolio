import { useRef } from "react";
import type { PointerEvent } from "react";

// Pointer drag that reports the offset since the press. `moved` lets callers
// tell a drag apart from a click.
export function useDrag(onMove: (dx: number, dy: number) => void, onEnd?: () => void) {
  const start = useRef<{ x: number; y: number } | null>(null);
  const moved = useRef(false);

  return {
    moved,
    bind: {
      onPointerDown(e: PointerEvent<HTMLElement>) {
        if (e.button !== 0 || (e.target as HTMLElement).closest("[data-nodrag]")) return;
        start.current = { x: e.clientX, y: e.clientY };
        moved.current = false;
        e.currentTarget.setPointerCapture(e.pointerId);
      },
      onPointerMove(e: PointerEvent<HTMLElement>) {
        if (!start.current) return;
        const dx = e.clientX - start.current.x;
        const dy = e.clientY - start.current.y;
        if (Math.abs(dx) + Math.abs(dy) > 3) moved.current = true;
        if (moved.current) onMove(dx, dy);
      },
      onPointerUp() {
        if (!start.current) return;
        start.current = null;
        onEnd?.();
      },
      onPointerCancel() {
        start.current = null;
        onEnd?.();
      },
    },
  };
}
