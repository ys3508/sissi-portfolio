"use client";

import { useEffect, useRef } from "react";

// Lavender-to-ink for non-negative activations; blue / cream / pink for signed values.
function sequential(t: number): [number, number, number] {
  const s = Math.max(0, Math.min(1, t));
  return [Math.round(253 - s * 230), Math.round(250 - s * 222), Math.round(255 - s * 165)];
}
function diverging(t: number): [number, number, number] {
  const s = Math.max(-1, Math.min(1, t));
  if (s >= 0) return [Math.round(253 - s * 30), Math.round(250 - s * 160), Math.round(245 - s * 110)];
  return [Math.round(253 + s * 210), Math.round(250 + s * 150), Math.round(245 + s * 20)];
}

/** Draws one feature map (or any square grid of numbers) as a pixelated image. */
export function MapCanvas({
  data,
  size,
  offset = 0,
  scale,
  signed = false,
  label,
  className,
  highlight,
}: {
  data: Float32Array;
  size: number;
  offset?: number;
  scale: number;
  signed?: boolean;
  label: string;
  className?: string;
  highlight?: { x: number; y: number; k: number } | null;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = ref.current?.getContext("2d");
    if (!ctx) return;
    const img = ctx.createImageData(size, size);
    for (let i = 0; i < size * size; i++) {
      const v = data[offset + i];
      const [r, g, b] = signed ? diverging(scale ? v / scale : 0) : sequential(scale ? v / scale : 0);
      img.data.set([r, g, b, 255], i * 4);
    }
    ctx.putImageData(img, 0, 0);
  }, [data, size, offset, scale, signed]);
  return (
    <span className={`px-map ${className ?? ""}`}>
      <canvas ref={ref} width={size} height={size} role="img" aria-label={label} />
      {highlight && (
        <i
          className="px-map__box"
          style={{
            left: `${((highlight.x - (highlight.k >> 1)) / size) * 100}%`,
            top: `${((highlight.y - (highlight.k >> 1)) / size) * 100}%`,
            width: `${(highlight.k / size) * 100}%`,
            height: `${(highlight.k / size) * 100}%`,
          }}
        />
      )}
    </span>
  );
}

export function maxAbs(data: Float32Array, offset = 0, length = data.length - offset) {
  let m = 0;
  for (let i = offset; i < offset + length; i++) m = Math.max(m, Math.abs(data[i]));
  return m || 1;
}

/** Probability bars for the ten digits, optionally with a ghost of the previous scan. */
export function ProbabilityChart({ probs, previous, intended }: { probs: Float32Array; previous?: Float32Array; intended?: number | "none" | null }) {
  let top = 0;
  probs.forEach((p, i) => p > probs[top] && (top = i));
  return (
    <ol className="px-probs" aria-label="Probability for each digit">
      {Array.from(probs).map((p, d) => (
        <li key={d} className={d === top ? "px-probs--top" : ""}>
          <span className="px-probs__digit">
            {d}
            {intended === d && <small title="The digit you meant">★</small>}
          </span>
          <span className="px-probs__track">
            {previous && <i className="px-probs__ghost" style={{ width: `${previous[d] * 100}%` }} />}
            <i className="px-probs__bar" style={{ width: `${p * 100}%` }} />
          </span>
          <span className="px-probs__value">{p < 0.001 ? "<0.1%" : `${(p * 100).toFixed(1)}%`}</span>
        </li>
      ))}
    </ol>
  );
}
