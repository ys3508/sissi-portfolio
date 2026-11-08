"use client";

import { useState } from "react";
import type { KeyboardEvent } from "react";

// A toy network with made-up weights, small enough to follow by hand.
const INPUTS = [0.9, 0.2, 0.7];
const W1 = [
  [0.8, -0.4, 0.3],
  [-0.6, 0.9, 0.5],
  [0.4, 0.7, -0.8],
  [0.5, -0.3, 0.6],
];
const B1 = [0.1, 0, -0.1, 0.05];
const W2 = [
  [0.9, -0.5, 0.4, 0.2],
  [-0.4, 0.8, 0.3, -0.6],
];
const relu = (v: number) => Math.max(0, v);
const HIDDEN = W1.map((row, j) => relu(row.reduce((s, w, i) => s + w * INPUTS[i], B1[j])));
const OUT = W2.map((row) => row.reduce((s, w, j) => s + w * HIDDEN[j], 0));

type Pick = { kind: "input" | "hidden" | "output"; i: number } | { kind: "edge1" | "edge2"; from: number; to: number };

const X = { input: 50, hidden: 200, output: 350 };
// Each column is centered vertically, 55 units between nodes, clear of the labels at the bottom.
const yFor = (count: number, i: number) => 105 + (i - (count - 1) / 2) * 55;

function explain(p: Pick): { title: string; body: string } {
  switch (p.kind) {
    case "input":
      return { title: `Input ${p.i + 1}`, body: `Holds one number from the data, here ${INPUTS[p.i]}. In the digit network, each input is one pixel's brightness, and there are 784 of them.` };
    case "hidden": {
      const parts = W1[p.i].map((w, i) => `${w} × ${INPUTS[i]}`).join(" + ");
      return {
        title: `Hidden unit ${p.i + 1}`,
        body: `Adds up its inputs, each multiplied by a weight, plus a bias: ${parts} + ${B1[p.i]}. Then ReLU turns anything negative into zero. Result: ${HIDDEN[p.i].toFixed(2)}.`,
      };
    }
    case "output":
      return { title: `Output ${p.i + 1}`, body: `Combines the hidden units the same way, giving a score of ${OUT[p.i].toFixed(2)}. In the digit network there are 10 outputs, one per digit, and softmax turns them into probabilities.` };
    case "edge1":
      return { title: `Weight, input ${p.from + 1} → hidden ${p.to + 1}`, body: `${W1[p.to][p.from]}. A connection is just a number that scales the signal. Positive weights push the next unit up; negative ones push it down. Training adjusts every weight a little at a time.` };
    case "edge2":
      return { title: `Weight, hidden ${p.from + 1} → output ${p.to + 1}`, body: `${W2[p.to][p.from]}. The output layer learns which hidden patterns count as evidence for each answer.` };
  }
}

export function NetworkBasics() {
  const [pick, setPick] = useState<Pick>({ kind: "hidden", i: 0 });
  const [cell, setCell] = useState(5);
  const info = explain(pick);
  const same = (p: Pick) => JSON.stringify(p) === JSON.stringify(pick);
  const activate = (p: Pick) => ({
    role: "button",
    tabIndex: 0,
    onClick: () => setPick(p),
    onKeyDown: (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setPick(p);
      }
    },
  });

  // A 6x6 image. A dense unit sees all 36 pixels; a 3x3 convolution output sees only its window.
  const cx = cell % 4;
  const cy = Math.floor(cell / 4);

  return (
    <div className="px-app px-basics">
      <p className="px-sys">PART 1 · A PLAIN NEURAL NETWORK (TOY NUMBERS)</p>
      <div className="px-basics__net">
        <svg viewBox="0 0 400 230" className="px-nn" aria-label="A neural network with 3 inputs, 4 hidden units, and 2 outputs">
          {W1.map((row, j) =>
            row.map((w, i) => (
              <line
                key={`a${i}${j}`}
                {...activate({ kind: "edge1", from: i, to: j })}
                aria-label={`Weight from input ${i + 1} to hidden unit ${j + 1}`}
                x1={X.input}
                y1={yFor(3, i)}
                x2={X.hidden}
                y2={yFor(4, j)}
                className={`px-edge ${w < 0 ? "px-edge--neg" : ""} ${same({ kind: "edge1", from: i, to: j }) ? "px-edge--on" : ""}`}
                strokeWidth={1 + Math.abs(w) * 3}
              />
            )),
          )}
          {W2.map((row, k) =>
            row.map((w, j) => (
              <line
                key={`b${j}${k}`}
                {...activate({ kind: "edge2", from: j, to: k })}
                aria-label={`Weight from hidden unit ${j + 1} to output ${k + 1}`}
                x1={X.hidden}
                y1={yFor(4, j)}
                x2={X.output}
                y2={yFor(2, k)}
                className={`px-edge ${w < 0 ? "px-edge--neg" : ""} ${same({ kind: "edge2", from: j, to: k }) ? "px-edge--on" : ""}`}
                strokeWidth={1 + Math.abs(w) * 3}
              />
            )),
          )}
          {(
            [
              ["input", 3, INPUTS],
              ["hidden", 4, HIDDEN],
              ["output", 2, OUT],
            ] as const
          ).map(([kind, count, values]) =>
            Array.from({ length: count }, (_, i) => (
              <g key={`${kind}${i}`} {...activate({ kind, i })} aria-label={`${kind} ${i + 1}`} className={`px-node ${same({ kind, i }) ? "px-node--on" : ""}`}>
                <circle cx={X[kind]} cy={yFor(count, i)} r={17} style={{ fillOpacity: 0.25 + Math.min(1, Math.abs(values[i])) * 0.75 }} />
                <text x={X[kind]} y={yFor(count, i) + 4}>
                  {values[i].toFixed(1)}
                </text>
              </g>
            )),
          )}
          <text x={X.input} y={225} className="px-nn__label">input</text>
          <text x={X.hidden} y={225} className="px-nn__label">hidden</text>
          <text x={X.output} y={225} className="px-nn__label">output</text>
        </svg>
        <div className="px-note" aria-live="polite">
          <p className="px-sys">{info.title}</p>
          <p>{info.body}</p>
          <p className="px-small">Click any circle or line. These weights are made up so you can follow the arithmetic.</p>
        </div>
      </div>

      <p className="px-sys">PART 2 · WHY IMAGES GET A CONVOLUTIONAL NETWORK</p>
      <div className="px-compare">
        <figure>
          <svg viewBox="0 0 220 170" aria-label="Dense layer: one unit connected to all 36 pixels">
            {Array.from({ length: 36 }, (_, i) => (
              <g key={i}>
                <line x1={14 + (i % 6) * 18 + 8} y1={14 + Math.floor(i / 6) * 18 + 8} x2={190} y2={70} className="px-edge px-edge--thin" />
                <rect x={14 + (i % 6) * 18} y={14 + Math.floor(i / 6) * 18} width={16} height={16} className="px-px" />
              </g>
            ))}
            <circle cx={190} cy={70} r={14} className="px-unit" />
          </svg>
          <figcaption>
            <b>Fully connected.</b> One unit has a weight for every pixel: 36 here. The next unit gets 36 more, and none of it knows which pixels sit
            next to each other.
          </figcaption>
        </figure>
        <figure>
          <svg viewBox="0 0 220 170" aria-label="Convolution: each output pixel sees a 3 by 3 window, reusing the same 9 weights">
            {Array.from({ length: 36 }, (_, i) => {
              const x = i % 6;
              const y = Math.floor(i / 6);
              const inside = x >= cx && x < cx + 3 && y >= cy && y < cy + 3;
              return <rect key={i} x={14 + x * 18} y={14 + y * 18} width={16} height={16} className={`px-px ${inside ? "px-px--on" : ""}`} />;
            })}
            {Array.from({ length: 16 }, (_, i) => (
              <rect
                key={i}
                {...activate({ kind: "input", i: 0 })}
                onClick={() => setCell(i)}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), setCell(i))}
                aria-label={`Output pixel row ${Math.floor(i / 4) + 1}, column ${(i % 4) + 1}`}
                x={140 + (i % 4) * 18}
                y={32 + Math.floor(i / 4) * 18}
                width={16}
                height={16}
                className={`px-px px-px--out ${i === cell ? "px-px--on" : ""}`}
              />
            ))}
            <line x1={14 + (cx + 1) * 18 + 8} y1={14 + (cy + 1) * 18 + 8} x2={140 + cx * 18 + 8} y2={32 + cy * 18 + 8} className="px-edge px-edge--on" />
          </svg>
          <figcaption>
            <b>Convolutional.</b> Each output pixel looks at a 3×3 window, and all 16 reuse the same 9 weights. Click an output square to move the
            window.
          </figcaption>
        </figure>
      </div>
      <p className="px-note px-note--wide">
        In the digit network, the first convolution makes 8 maps of 28×28 from 208 learned numbers. A fully connected layer making the same
        6,272 outputs from 784 pixels would need 4,923,520. Sharing small filters across the image is what makes CNNs practical for images, and
        it builds in the idea that a stroke means the same thing wherever it appears.
      </p>
    </div>
  );
}
