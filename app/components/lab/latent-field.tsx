"use client";

import { useEffect, useRef } from "react";

/**
 * A full-screen dot lattice that bends away from the pointer, like points
 * in an embedding space being pushed around. Pure canvas 2D, no deps.
 */
export function LatentField() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pointer = { x: -9999, y: -9999, tx: -9999, ty: -9999 };
    let w = 0;
    let h = 0;
    let dpr = 1;
    let raf = 0;
    const GAP = 26;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const color = () =>
      getComputedStyle(canvas).getPropertyValue("--lab-ink").trim() || "#111";
    const accent = () =>
      getComputedStyle(canvas).getPropertyValue("--lab-blue").trim() || "#2b50ff";

    const draw = (t: number) => {
      pointer.x += (pointer.tx - pointer.x) * 0.12;
      pointer.y += (pointer.ty - pointer.y) * 0.12;
      ctx.clearRect(0, 0, w, h);
      const ink = color();
      const blue = accent();
      const R = 140;
      for (let y = GAP / 2; y < h; y += GAP) {
        for (let x = GAP / 2; x < w; x += GAP) {
          const wob = reduce ? 0 : Math.sin(x * 0.012 + t * 0.0006) * Math.cos(y * 0.01 + t * 0.0004) * 3;
          let px = x + wob;
          let py = y - wob;
          const dx = px - pointer.x;
          const dy = py - pointer.y;
          const d = Math.hypot(dx, dy);
          let s = 1;
          if (d < R) {
            const f = (1 - d / R) ** 2;
            px += (dx / (d || 1)) * f * 28;
            py += (dy / (d || 1)) * f * 28;
            s = 1 + f * 2.2;
          }
          ctx.fillStyle = s > 1.4 ? blue : ink;
          ctx.globalAlpha = s > 1.4 ? 0.9 : 0.18;
          ctx.fillRect(px - s / 2, py - s / 2, s, s);
        }
      }
      ctx.globalAlpha = 1;
      if (!reduce) raf = requestAnimationFrame(draw);
    };

    const onMove = (e: PointerEvent) => {
      pointer.tx = e.clientX;
      pointer.ty = e.clientY;
      if (reduce) draw(0);
    };
    const onLeave = () => {
      pointer.tx = -9999;
      pointer.ty = -9999;
    };

    resize();
    raf = requestAnimationFrame(draw);
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove);
    document.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 h-full w-full"
    />
  );
}
