"use client";

import { useEffect, useMemo, useState } from "react";
import type { KeyboardEvent } from "react";
import { kernel } from "./cnn";
import { useLab } from "./lab-state";
import { MapCanvas, maxAbs } from "./visuals";

type Image = { name: string; size: number; data: Float32Array };
type Kernel = { id: string; name: string; size: number; data: Float32Array; bias: number; learned: boolean; note: string };

function sample(name: string, size: number, f: (x: number, y: number) => number): Image {
  const data = new Float32Array(size * size);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) data[y * size + x] = Math.max(0, Math.min(1, f(x, y)));
  return { name, size, data };
}

const SAMPLES: Image[] = [
  sample("Diagonal stroke", 12, (x, y) => (Math.abs(x - y) <= 1 ? 1 - Math.abs(x - y) * 0.4 : 0)),
  sample("Ring", 12, (x, y) => {
    const d = Math.hypot(x - 5.5, y - 5.5);
    return d > 2.6 && d < 4.6 ? 1 : 0;
  }),
  sample("Plus sign", 12, (x, y) => ((x >= 5 && x <= 6 && y >= 2 && y <= 9) || (y >= 5 && y <= 6 && x >= 2 && x <= 9) ? 1 : 0)),
];

const k3 = (values: number[]) => Float32Array.from(values);
const TEACHING: Kernel[] = [
  { id: "identity", name: "Identity", size: 3, data: k3([0, 0, 0, 0, 1, 0, 0, 0, 0]), bias: 0, learned: false, note: "Copies the center pixel. The output looks just like the input." },
  { id: "vedge", name: "Edge: vertical", size: 3, data: k3([-1, 0, 1, -2, 0, 2, -1, 0, 1]), bias: 0, learned: false, note: "Right side minus left side. Big where brightness changes from left to right." },
  { id: "hedge", name: "Edge: horizontal", size: 3, data: k3([-1, -2, -1, 0, 0, 0, 1, 2, 1]), bias: 0, learned: false, note: "Bottom minus top. Big where brightness changes from top to bottom." },
  { id: "blur", name: "Blur", size: 3, data: k3(Array(9).fill(1 / 9)), bias: 0, learned: false, note: "The average of the 3×3 neighborhood. Softens everything." },
  { id: "sharpen", name: "Sharpen", size: 3, data: k3([0, -1, 0, -1, 5, -1, 0, -1, 0]), bias: 0, learned: false, note: "Boosts the center against its neighbors, so edges stand out." },
];

function convolveAt(img: Image, k: Kernel, x: number, y: number) {
  const pad = k.size >> 1;
  const patch: number[] = [];
  const products: number[] = [];
  let sum = 0;
  for (let i = 0; i < k.size; i++) {
    for (let j = 0; j < k.size; j++) {
      const sy = y + i - pad;
      const sx = x + j - pad;
      const v = sy < 0 || sx < 0 || sy >= img.size || sx >= img.size ? 0 : img.data[sy * img.size + sx];
      const p = v * k.data[i * k.size + j];
      patch.push(v);
      products.push(p);
      sum += p;
    }
  }
  return { patch, products, sum, out: sum + k.bias };
}

export function Microscope() {
  const { current, model } = useLab();
  const learned: Kernel[] =
    model.status === "ready"
      ? Array.from({ length: 8 }, (_, f) => ({
          id: `learned${f}`,
          name: `Learned: conv1 filter #${f + 1}`,
          size: 5,
          data: kernel(model.model, "conv1", f).data,
          bias: model.model.conv1.b[f],
          learned: true,
          note: "Not designed by anyone. These 25 weights and the bias came out of training on MNIST, and this exact filter runs inside the network.",
        }))
      : [];
  const images: Image[] = [...(current ? [{ name: "My latest scan (28 × 28)", size: 28, data: current.pixels }] : []), ...SAMPLES];

  const [imgName, setImgName] = useState(images[0].name);
  const [kId, setKId] = useState("vedge");
  const [pos, setPos] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [full, setFull] = useState(false);

  const img = images.find((i) => i.name === imgName) ?? images[0];
  const k = [...TEACHING, ...learned].find((x) => x.id === kId) ?? TEACHING[1];
  const total = img.size * img.size;
  const at = Math.min(pos, total - 1);
  const x = at % img.size;
  const y = Math.floor(at / img.size);
  const step = convolveAt(img, k, x, y);

  const output = useMemo(() => {
    const out = new Float32Array(total);
    for (let i = 0; i < total; i++) out[i] = convolveAt(img, k, i % img.size, Math.floor(i / img.size)).out;
    return out;
  }, [img, k, total]);
  const revealed = useMemo(() => (full ? output : output.map((v, i) => (i <= at ? v : 0))), [output, at, full]);

  useEffect(() => {
    if (!playing) return;
    const t = window.setInterval(() => setPos((p) => Math.min(p + 1, total - 1)), img.size > 20 ? 25 : 110);
    return () => window.clearInterval(t);
  }, [playing, total, img.size]);

  useEffect(() => {
    if (playing && pos >= total - 1) setPlaying(false);
  }, [playing, pos, total]);

  const move = (dx: number, dy: number) => {
    setFull(false);
    setPos(Math.max(0, Math.min(img.size - 1, y + dy)) * img.size + Math.max(0, Math.min(img.size - 1, x + dx)));
  };
  const onKey = (e: KeyboardEvent) => {
    const map: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    if (map[e.key]) {
      e.preventDefault();
      move(...map[e.key]);
    }
  };
  const small = img.size <= 12;
  const fmt = (v: number) => (Math.abs(v) < 0.005 ? "0" : v.toFixed(2));

  return (
    <div className="px-app px-micro">
      <div className="px-row px-micro__controls">
        <label className="px-select">
          Specimen
          <select
            value={img.name}
            onChange={(e) => {
              setImgName(e.target.value);
              setPos(0);
              setPlaying(false);
            }}
          >
            {images.map((i) => (
              <option key={i.name}>{i.name}</option>
            ))}
          </select>
        </label>
        <label className="px-select">
          Lens (kernel)
          <select value={k.id} onChange={(e) => setKId(e.target.value)}>
            <optgroup label="Teaching filters, designed by hand">
              {TEACHING.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </optgroup>
            {learned.length > 0 && (
              <optgroup label="Learned by the real CNN">
                {learned.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        </label>
      </div>
      <p className={`px-lens ${k.learned ? "px-lens--learned" : ""}`}>
        <b>{k.learned ? "LEARNED KERNEL" : "TEACHING KERNEL"}</b> {k.note}
      </p>

      <div className="px-micro__stage">
        <div>
          <p className="px-sys">INPUT · {img.size}×{img.size}</p>
          <div
            className={`px-grid${small ? " px-grid--numbers" : ""}`}
            style={{ gridTemplateColumns: `repeat(${img.size}, 1fr)` }}
            tabIndex={0}
            role="grid"
            aria-label={`Input image. The kernel is centered on row ${y + 1}, column ${x + 1}. Use arrow keys to move it.`}
            onKeyDown={onKey}
          >
            {Array.from(img.data).map((v, i) => {
              const cx = i % img.size;
              const cy = Math.floor(i / img.size);
              const inPatch = Math.abs(cx - x) <= k.size >> 1 && Math.abs(cy - y) <= k.size >> 1;
              return (
                <button
                  type="button"
                  tabIndex={-1}
                  key={i}
                  className={`px-cell${inPatch ? " px-cell--patch" : ""}${cx === x && cy === y ? " px-cell--center" : ""}`}
                  style={{ "--v": v } as React.CSSProperties}
                  onClick={() => {
                    setFull(false);
                    setPos(i);
                  }}
                  aria-label={`Row ${cy + 1}, column ${cx + 1}, value ${v.toFixed(2)}`}
                >
                  {small ? fmt(v) : ""}
                </button>
              );
            })}
          </div>
        </div>

        <div className="px-math">
          <p className="px-sys">
            AT ROW {y + 1}, COLUMN {x + 1}
          </p>
          <div className="px-math__tables">
            <table className="px-mini-table" aria-label="Input patch">
              <caption>patch</caption>
              <tbody>
                {Array.from({ length: k.size }, (_, i) => (
                  <tr key={i}>
                    {step.patch.slice(i * k.size, (i + 1) * k.size).map((v, j) => (
                      <td key={j}>{fmt(v)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <span className="px-op">×</span>
            <table className="px-mini-table px-mini-table--k" aria-label="Kernel weights">
              <caption>kernel</caption>
              <tbody>
                {Array.from({ length: k.size }, (_, i) => (
                  <tr key={i}>
                    {Array.from(k.data.slice(i * k.size, (i + 1) * k.size)).map((v, j) => (
                      <td key={j} className={v < 0 ? "px-neg" : v > 0 ? "px-pos" : ""}>
                        {fmt(v)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <span className="px-op">=</span>
            <table className="px-mini-table" aria-label="Element-by-element products">
              <caption>products</caption>
              <tbody>
                {Array.from({ length: k.size }, (_, i) => (
                  <tr key={i}>
                    {step.products.slice(i * k.size, (i + 1) * k.size).map((v, j) => (
                      <td key={j} className={v < -0.004 ? "px-neg" : v > 0.004 ? "px-pos" : ""}>
                        {fmt(v)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="px-sum">
            sum of products = <b>{step.sum.toFixed(3)}</b>
            {k.learned && (
              <>
                {" "}
                + bias {k.bias.toFixed(3)} = <b>{step.out.toFixed(3)}</b>
              </>
            )}
            <span> → output pixel</span>
          </p>
          <div className="px-row">
            <button type="button" className="btn" onClick={() => move(-1, 0)} aria-label="Move left">
              ◀
            </button>
            <button type="button" className="btn" onClick={() => move(1, 0)} aria-label="Move right">
              ▶
            </button>
            <button type="button" className="btn" onClick={() => move(0, -1)} aria-label="Move up">
              ▲
            </button>
            <button type="button" className="btn" onClick={() => move(0, 1)} aria-label="Move down">
              ▼
            </button>
            <button
              type="button"
              className="btn px-primary"
              onClick={() => {
                if (!playing && at >= total - 1) setPos(0);
                setFull(false);
                setPlaying(!playing);
              }}
            >
              {playing ? "❚❚ Pause scan" : "▶ Scan the whole image"}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => {
                setPlaying(false);
                setFull(true);
              }}
            >
              Show finished map
            </button>
          </div>
        </div>

        <div>
          <p className="px-sys">FEATURE MAP · {img.size}×{img.size}</p>
          <MapCanvas
            data={revealed}
            size={img.size}
            scale={maxAbs(output)}
            signed
            label="Output feature map"
            className="px-map--micro"
            highlight={full ? null : { x, y, k: 1 }}
          />
          <p className="px-small">
            {full ? "The finished map." : `${at + 1} of ${total} output pixels computed.`} Pink is positive, blue is negative.
          </p>
        </div>
      </div>
      <p className="px-small">
        A convolution repeats one small calculation at every position: multiply the patch by the kernel, add it up, write one pixel. Edges get
        zero padding, so the map stays the same size. A CNN uses this same operation, but it learns its kernels from data instead of being handed
        them.
      </p>
    </div>
  );
}
