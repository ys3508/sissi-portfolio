"use client";

import { useEffect, useRef, useState } from "react";
import type { PointerEvent } from "react";
import { preprocess } from "./cnn";
import { SAMPLE_DIGITS } from "./digits";
import type { Stroke } from "./digits";
import { useLab } from "./lab-state";
import { MapCanvas, ProbabilityChart } from "./visuals";

const SIDE = 280;
const BRUSH = 20;

export const CHALLENGES = [
  { id: "seven", prompt: "Draw a 7 with a line through the middle.", expect: 7 },
  { id: "one", prompt: "Draw a 1 with a flag on top and a base at the bottom.", expect: 1 },
  { id: "open4", prompt: "Draw a 4 with an open top, so it starts to look like a 9.", expect: 4 },
  { id: "three8", prompt: "Draw a 3, then close its left side so it drifts toward an 8.", expect: 3 },
  { id: "half", prompt: "Draw only the top half of a 2.", expect: 2 },
  { id: "notdigit", prompt: "Draw something that isn't a digit at all, like a heart or a star.", expect: "none" as const },
];

function paint(ctx: CanvasRenderingContext2D, strokes: Stroke[], ink: string, bg: string | null) {
  ctx.clearRect(0, 0, SIDE, SIDE);
  if (bg) {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, SIDE, SIDE);
  }
  ctx.strokeStyle = ink;
  ctx.fillStyle = ink;
  ctx.lineWidth = BRUSH;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (const s of strokes) {
    if (s.length === 1) {
      ctx.beginPath();
      ctx.arc(s[0][0], s[0][1], BRUSH / 2, 0, Math.PI * 2);
      ctx.fill();
      continue;
    }
    ctx.beginPath();
    ctx.moveTo(s[0][0], s[0][1]);
    for (const [x, y] of s.slice(1)) ctx.lineTo(x, y);
    ctx.stroke();
  }
}

export function Scanner({ fool = false }: { fool?: boolean }) {
  const { model, retry, scan, scans, open, setIntended } = useLab();
  const view = useRef<HTMLCanvasElement>(null);
  const ink = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef<Stroke | null>(null);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [intended, setIntendedLocal] = useState<number | "none" | null>(null);
  const [challenge, setChallenge] = useState(0);
  const [scanning, setScanning] = useState(false);
  const [lastId, setLastId] = useState<number | null>(null);
  // The strokes that produced the latest scan. Changing "I meant to draw" relabels that scan only while the pad is unchanged.
  const scanned = useRef<Stroke[] | null>(null);
  const [empty, setEmpty] = useState(false);

  const mine = scans.find((s) => s.id === lastId) ?? null;
  const previous = mine ? scans[scans.indexOf(mine) - 1] : undefined;

  useEffect(() => {
    ink.current ??= Object.assign(document.createElement("canvas"), { width: SIDE, height: SIDE });
    const v = view.current?.getContext("2d");
    if (v) paint(v, strokes, "#3b2f8f", null);
  }, [strokes]);

  const point = (e: PointerEvent<HTMLCanvasElement>): [number, number] => {
    const box = e.currentTarget.getBoundingClientRect();
    return [((e.clientX - box.left) / box.width) * SIDE, ((e.clientY - box.top) / box.height) * SIDE];
  };

  const runScan = () => {
    const c = ink.current?.getContext("2d", { willReadFrequently: true });
    if (!c) return;
    paint(c, strokes, "#fff", "#000");
    const rgba = c.getImageData(0, 0, SIDE, SIDE).data;
    const gray = new Float32Array(SIDE * SIDE);
    for (let i = 0; i < gray.length; i++) gray[i] = rgba[i * 4] / 255;
    const pixels = preprocess(gray, SIDE);
    if (!pixels) {
      setEmpty(true);
      return;
    }
    setEmpty(false);
    const entry = scan(pixels, intended, fool ? CHALLENGES[challenge].prompt : undefined);
    if (!entry) return;
    setLastId(entry.id);
    scanned.current = strokes;
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setScanning(true);
      window.setTimeout(() => setScanning(false), 700);
    }
  };

  const mismatch = mine && typeof mine.intended === "number" && mine.intended !== mine.trace.prediction;
  const notDigit = mine?.intended === "none";

  if (model.status !== "ready") {
    return (
      <div className="px-app px-status">
        {model.status === "loading" ? (
          <>
            <p className="px-sys">LOADING NEURAL NETWORK WEIGHTS...</p>
            <div className="px-bar">
              <span />
            </div>
          </>
        ) : (
          <>
            <p className="px-sys px-sys--warn">MODEL FAILED TO LOAD</p>
            <p>{model.message}</p>
            <button type="button" className="btn btn--wide" onClick={retry}>
              Try again
            </button>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="px-app px-scanner">
      {fool && (
        <section className="px-challenge">
          <p className="px-sys">CHALLENGE {challenge + 1} / {CHALLENGES.length}</p>
          <p className="px-challenge__prompt">{CHALLENGES[challenge].prompt}</p>
          <div className="px-row">
            <button type="button" className="btn" onClick={() => setChallenge((challenge + CHALLENGES.length - 1) % CHALLENGES.length)}>
              ◀ Prev
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => {
                const next = (challenge + 1) % CHALLENGES.length;
                setChallenge(next);
                setIntendedLocal(CHALLENGES[next].expect);
                setStrokes([]);
              }}
            >
              Next ▶
            </button>
            <button type="button" className="btn" onClick={() => setIntendedLocal(CHALLENGES[challenge].expect)}>
              Use this as my intended label
            </button>
          </div>
        </section>
      )}

      <div className="px-scanner__grid">
        <section className="px-pad">
          <p className="px-sys">1 · DRAW A DIGIT</p>
          <div className="px-pad__frame">
            <canvas
              ref={view}
              width={SIDE}
              height={SIDE}
              className="px-pad__canvas"
              aria-label="Drawing pad. Draw a digit with a mouse, finger, or pen, or load a sample below."
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                drawing.current = [point(e)];
                setStrokes((s) => [...s, drawing.current!]);
              }}
              onPointerMove={(e) => {
                if (!drawing.current) return;
                drawing.current.push(point(e));
                setStrokes((s) => [...s.slice(0, -1), [...drawing.current!]]);
              }}
              onPointerUp={() => (drawing.current = null)}
              onPointerCancel={() => (drawing.current = null)}
            />
            {scanning && <i className="px-beam" aria-hidden />}
          </div>
          <div className="px-row">
            <button type="button" className="btn" onClick={() => setStrokes((s) => s.slice(0, -1))} disabled={!strokes.length}>
              ↶ Undo
            </button>
            <button type="button" className="btn" onClick={() => setStrokes([])} disabled={!strokes.length}>
              Clear
            </button>
            <label className="px-select">
              Sample
              <select
                value=""
                onChange={(e) => {
                  const d = Number(e.target.value);
                  setStrokes(SAMPLE_DIGITS[d].map((s) => s.map((p) => [...p] as [number, number])));
                }}
              >
                <option value="" disabled>
                  load…
                </option>
                {Object.keys(SAMPLE_DIGITS).map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="px-select px-intended">
            I meant to draw
            <select
              value={intended === null ? "" : String(intended)}
              onChange={(e) => {
                const v = e.target.value;
                const next = v === "" ? null : v === "none" ? "none" : Number(v);
                setIntendedLocal(next);
                if (mine && scanned.current === strokes) setIntended(mine.id, next);
              }}
            >
              <option value="">(skip)</option>
              {Array.from({ length: 10 }, (_, d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
              <option value="none">not a digit</option>
            </select>
          </label>
          <button type="button" className="btn btn--wide px-primary" onClick={runScan} disabled={!strokes.length}>
            ▶ SCAN
          </button>
          {empty && <p className="px-small">The pad is empty. Draw something first.</p>}
        </section>

        <section className="px-result" aria-live="polite">
          <p className="px-sys">2 · WHAT THE NETWORK SEES</p>
          {mine ? (
            <>
              <div className="px-seen">
                <MapCanvas data={mine.pixels} size={28} scale={1} label="Your drawing as 28 by 28 input pixels" className="px-seen__img" />
                <div>
                  <p className="px-small">28 × 28 pixels, grayscale, centered by its center of mass, just like the training images.</p>
                  <p className="px-predict">
                    <span className="px-sys">MODEL PREDICTION</span>
                    <b>{mine.trace.prediction}</b>
                    <small>{(mine.trace.probs[mine.trace.prediction] * 100).toFixed(1)}% probability</small>
                  </p>
                </div>
              </div>
              {(mismatch || notDigit) && (
                <div className={`px-error${notDigit ? " px-error--soft" : ""}`} role="status">
                  <p className="px-error__bar">{notDigit ? "NOTICE: NO \"NONE\" BUTTON" : "ERROR: CLASSIFICATION MISMATCH"}</p>
                  <p>
                    {notDigit
                      ? `You drew something that isn't a digit, and the network still had to pick 0–9. It chose ${mine.trace.prediction}. A classifier can only answer with the classes it was trained on.`
                      : `You meant ${mine.intended}. The network said ${mine.trace.prediction} with ${(mine.trace.probs[mine.trace.prediction] * 100).toFixed(1)}% probability. A high number didn't make it right.`}
                  </p>
                  <div className="px-row">
                    <button type="button" className="btn" onClick={() => open("maps")}>
                      Inspect feature maps
                    </button>
                    <button type="button" className="btn" onClick={() => open("dashboard")}>
                      Compare with earlier scans
                    </button>
                  </div>
                </div>
              )}
              {typeof mine.intended === "number" && !mismatch && (
                <p className="px-match">Matches the digit you meant ({mine.intended}).</p>
              )}
            </>
          ) : (
            <p className="px-small">Draw a digit and press SCAN. The real network runs in your browser; nothing you draw leaves this page.</p>
          )}

          <p className="px-sys">3 · PROBABILITY FOR EACH DIGIT</p>
          {mine ? (
            <>
              <ProbabilityChart probs={mine.trace.probs} previous={previous?.trace.probs} intended={mine.intended} />
              <p className="px-small">
                These are softmax outputs: they always add up to 100%, even for a scribble. A high probability is the model&apos;s score,
                not a measured chance of being right.
                {previous && " The faint bars show your previous scan."}
              </p>
              <button type="button" className="btn btn--wide px-primary" onClick={() => open("inside")}>
                SEE HOW IT WORKS ▶
              </button>
            </>
          ) : (
            <ProbabilityChart probs={new Float32Array(10)} />
          )}
        </section>
      </div>
    </div>
  );
}
