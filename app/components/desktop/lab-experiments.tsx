"use client";

import { useMemo, useRef, useState } from "react";
import type { KeyboardEvent, MouseEvent } from "react";

function Comment({ author, children }: { author: string; children: React.ReactNode }) {
  return (
    <aside className="word__comment">
      <b>Comment [{author}]:</b> {children}
    </aside>
  );
}

export { Comment };

/* ---------- 001: ML vs. DL ---------- */

type Model = "ml" | "dl";

const MODELS: { id: Model; name: string; detail: string }[] = [
  { id: "ml", name: "Traditional Machine Learning", detail: "Start with logistic regression or tree-based models" },
  { id: "dl", name: "Deep Learning", detail: "Build a multi-layer neural network" },
];

const CASES: { prompt: string; answer: Model; why: string }[] = [
  {
    prompt:
      "Your hospital wants to predict whether a patient might miss their next appointment. You have 2,000 rows of structured appointment data. What would you try first?",
    answer: "ml",
    why: "With a few thousand rows in a tidy table, logistic regression or a tree-based model is quick to train and easier to explain to the clinic. A neural network could work, but it isn't where I'd start.",
  },
  {
    prompt:
      "You have 100,000 labeled chest X-rays, and you want to flag the ones that may show pneumonia. What would you try first?",
    answer: "dl",
    why: "Raw images are hard to describe by hand as columns in a table. A deep network can learn useful visual features from the pixels, and there's enough labeled data to train it.",
  },
  {
    prompt:
      "A bakery wants to predict tomorrow's croissant sales. It has 18 months of daily sales and weather in a spreadsheet. What would you try first?",
    answer: "ml",
    why: "That's only about 550 rows of structured numbers. A simple model is a good baseline, and the baker can see what's driving the prediction. A deep network would have very little to learn from.",
  },
];

const COMPARE = [
  ["Works well with", "Smaller, structured tables", "Lots of images, audio, or text"],
  ["Features", "Often chosen by people", "Learned from the raw data"],
  ["Training", "Often quick, even on a laptop", "Often needs GPUs and more time"],
  ["Explaining results", "Often easier", "Often harder"],
];

export function MlVsDl() {
  const [index, setIndex] = useState(0);
  const [picks, setPicks] = useState<(Model | null)[]>(CASES.map(() => null));
  const current = CASES[index];
  const pick = picks[index];
  const answered = picks.filter(Boolean).length;
  const matches = picks.filter((p, i) => p === CASES[i].answer).length;

  return (
    <>
      <div className="word__box">
        <p className="word__kicker">
          Interactive demo · Case {index + 1} of {CASES.length}
        </p>
        <h3>You&apos;re building an AI system.</h3>
        <p>{current.prompt}</p>
        <div className="word__options">
          {MODELS.map((model) => (
            <button
              type="button"
              key={model.id}
              aria-pressed={pick === model.id}
              className={`word__option${pick === model.id ? " word__option--on" : ""}`}
              onClick={() => setPicks(picks.map((p, i) => (i === index ? model.id : p)))}
            >
              <b>{model.name}</b>
              <small>{model.detail}</small>
            </button>
          ))}
        </div>
        {pick && (
          <div aria-live="polite">
            <Comment author="SS1">
              {pick === current.answer ? "Same pick as mine. " : "I'd start with the other one, though yours could work. "}
              {current.why}
            </Comment>
            <div className="word__case-nav">
              <span>
                {answered === CASES.length &&
                  `You matched my first pick on ${matches} of ${CASES.length}. It's a starting point, not a score.`}
              </span>
              <button type="button" className="btn" onClick={() => setIndex((index + 1) % CASES.length)}>
                {index === CASES.length - 1 ? "Back to case 1" : "Next case"}
              </button>
            </div>
          </div>
        )}
      </div>
      <h2>The short version</h2>
      <table>
        <thead>
          <tr>
            <th scope="col" />
            <th scope="col">Traditional ML</th>
            <th scope="col">Deep learning</th>
          </tr>
        </thead>
        <tbody>
          {COMPARE.map(([row, ml, dl]) => (
            <tr key={row}>
              <th scope="row">{row}</th>
              <td>{ml}</td>
              <td>{dl}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <h2>You changed my mind</h2>
      <p className="word__small">Track Changes is on. Version 1 is what I thought, and Version 2 is what I understand now.</p>
      <p className="word__track">
        <del>Deep learning is simply a more powerful version of machine learning.</del>{" "}
        <ins>Choosing the right model depends on the problem and the data, not just how complicated the model is.</ins>
      </p>
    </>
  );
}

/* ---------- 002: Neural network ---------- */

const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));
type Wire = { kind: "in"; input: number; node: number } | { kind: "out"; node: number };
const wireName = (w: Wire, inputs: string[]) =>
  w.kind === "in" ? `${inputs[w.input]} to node ${w.node + 1}` : `node ${w.node + 1} to output`;

export function NeuralNetwork() {
  const INPUTS = ["Slept well", "Had coffee"];
  const [values, setValues] = useState([0.8, 0.3]);
  const [count, setCount] = useState(2);
  const [inWeights, setInWeights] = useState([
    [3, -2, 1],
    [1, 3, -2],
  ]);
  const [outWeights, setOutWeights] = useState([2.5, 2, -1]);
  const [selected, setSelected] = useState<Wire>({ kind: "in", input: 0, node: 0 });

  const hidden = Array.from({ length: count }, (_, j) =>
    sigmoid(inWeights[0][j] * values[0] + inWeights[1][j] * values[1] - 1),
  );
  const output = sigmoid(hidden.reduce((sum, h, j) => sum + h * outWeights[j], 0) - 1.5);

  const selectedNode = selected.node < count ? selected : ({ kind: "in", input: 0, node: 0 } as Wire);
  const weight = selectedNode.kind === "in" ? inWeights[selectedNode.input][selectedNode.node] : outWeights[selectedNode.node];
  const setWeight = (next: number) => {
    if (selectedNode.kind === "in") {
      setInWeights(inWeights.map((row, i) => (i === selectedNode.input ? row.map((v, j) => (j === selectedNode.node ? next : v)) : row)));
    } else {
      setOutWeights(outWeights.map((v, j) => (j === selectedNode.node ? next : v)));
    }
  };

  const inputY = [65, 155];
  const hiddenY = (j: number) => (220 / (count + 1)) * (j + 1);
  const isOn = (w: Wire) => JSON.stringify(w) === JSON.stringify(selectedNode);

  const wire = (w: Wire, x1: number, y1: number, x2: number, y2: number, value: number) => {
    const name = wireName(w, INPUTS);
    return (
      <g
        key={name}
        role="button"
        tabIndex={0}
        aria-label={`Select the weight from ${name}, currently ${value}`}
        className={isOn(w) ? "lab-wire lab-wire--on" : "lab-wire"}
        onClick={() => setSelected(w)}
        onKeyDown={(e: KeyboardEvent) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setSelected(w);
          }
        }}
      >
        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="transparent" strokeWidth={16} />
        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={value >= 0 ? "#c9407f" : "#2a55c8"} strokeWidth={1 + Math.abs(value) * 0.9} />
      </g>
    );
  };

  return (
    <>
      <div className="word__box">
        <p className="word__kicker">Interactive demo · A toy network, with no training</p>
        <h3>Will I start my homework tonight?</h3>
        <svg className="lab-svg" viewBox="0 0 420 220" role="group" aria-label="Neural network diagram">
          {[0, 1].map((i) =>
            Array.from({ length: count }, (_, j) =>
              wire({ kind: "in", input: i, node: j }, 70, inputY[i], 210, hiddenY(j), inWeights[i][j]),
            ),
          )}
          {Array.from({ length: count }, (_, j) => wire({ kind: "out", node: j }, 210, hiddenY(j), 350, 110, outWeights[j]))}
          {[0, 1].map((i) => (
            <g key={i}>
              <circle cx={70} cy={inputY[i]} r={22} className="lab-node" style={{ fillOpacity: 0.15 + values[i] * 0.85 }} />
              <text x={70} y={inputY[i] + 4} className="lab-node-text">
                {values[i].toFixed(1)}
              </text>
              <text x={70} y={inputY[i] - 28} className="lab-label">
                {INPUTS[i]}
              </text>
            </g>
          ))}
          {hidden.map((h, j) => (
            <g key={j}>
              <circle cx={210} cy={hiddenY(j)} r={20} className="lab-node" style={{ fillOpacity: 0.15 + h * 0.85 }} />
              <text x={210} y={hiddenY(j) + 4} className="lab-node-text">
                {h.toFixed(2)}
              </text>
            </g>
          ))}
          <circle cx={350} cy={110} r={28} className="lab-node" style={{ fillOpacity: 0.15 + output * 0.85 }} />
          <text x={350} y={115} className="lab-node-text">
            {Math.round(output * 100)}%
          </text>
          <text x={350} y={72} className="lab-label">
            Output
          </text>
        </svg>
        <div className="lab-controls">
          {INPUTS.map((name, i) => (
            <label key={name}>
              {name}: {values[i].toFixed(1)}
              <input
                type="range"
                min={0}
                max={1}
                step={0.1}
                value={values[i]}
                onChange={(e) => setValues(values.map((v, k) => (k === i ? Number(e.target.value) : v)))}
              />
            </label>
          ))}
          <label>
            Weight, {wireName(selectedNode, INPUTS)}: {weight.toFixed(1)}
            <input type="range" min={-4} max={4} step={0.5} value={weight} onChange={(e) => setWeight(Number(e.target.value))} />
          </label>
          <div className="lab-row" role="group" aria-label="Number of hidden nodes">
            <span>Hidden nodes:</span>
            {[1, 2, 3].map((n) => (
              <button type="button" key={n} aria-pressed={count === n} className={`btn${count === n ? " btn--down" : ""}`} onClick={() => setCount(n)}>
                {n}
              </button>
            ))}
          </div>
        </div>
        <p className="word__small">
          Click a line to pick its weight. <span className="lab-pos">Pink lines</span> push the next node up, and{" "}
          <span className="lab-neg">blue lines</span> push it down. Thicker means stronger.
        </p>
      </div>
    </>
  );
}

/* ---------- 003: Gradient descent ---------- */

const LOSS = (x: number) => 0.04 * x * x + 0.6 * Math.sin(1.3 * x);
const SLOPE = (x: number) => 0.08 * x + 0.78 * Math.cos(1.3 * x);
const VALLEY = Array.from({ length: 161 }, (_, i) => -8 + i * 0.1);
const LOSSES = VALLEY.map(LOSS);
const LOWEST = Math.min(...LOSSES);
const HIGHEST = Math.max(...LOSSES);
const gdX = (x: number) => 10 + ((x + 8) / 16) * 400;
const gdY = (y: number) => 200 - ((y - LOWEST) / (HIGHEST - LOWEST)) * 175;
const VALLEY_PATH = VALLEY.map((x, i) => `${i ? "L" : "M"}${gdX(x).toFixed(1)} ${gdY(LOSSES[i]).toFixed(1)}`).join(" ");

export function GradientDescent() {
  const svg = useRef<SVGSVGElement>(null);
  const [rate, setRate] = useState(0.3);
  const [trail, setTrail] = useState([6.5]);
  const x = trail[trail.length - 1];
  const left = Math.abs(x) > 8;

  const walk = (steps: number) => {
    const next = [...trail];
    for (let i = 0; i < steps; i++) {
      const at = next[next.length - 1];
      if (Math.abs(at) > 8) break;
      next.push(at - rate * SLOPE(at));
    }
    setTrail(next);
  };

  const dropBall = (e: MouseEvent<SVGSVGElement>) => {
    const box = svg.current?.getBoundingClientRect();
    if (!box) return;
    const picked = ((e.clientX - box.left) / box.width) * 420;
    setTrail([Math.max(-8, Math.min(8, ((picked - 10) / 400) * 16 - 8))]);
  };

  let status = "Take a step. The ball rolls whichever way is downhill from where it stands.";
  if (left) status = "That step was so big the ball left the valley. Try a smaller step size.";
  else if (trail.length > 1 && Math.abs(SLOPE(x)) < 0.01) {
    status =
      LOSS(x) - LOWEST > 0.05
        ? "Settled, but in a shallow dip. There's lower ground elsewhere, and the ball can't see it from here."
        : "Settled at the lowest point in this valley.";
  } else if (trail.length > 1 && LOSS(x) > LOSS(trail[trail.length - 2])) {
    status = "Overshooting: that step was so big it landed higher than where it started.";
  } else if (trail.length > 2 && (x - trail[trail.length - 2]) * (trail[trail.length - 2] - trail[trail.length - 3]) < 0) {
    status = "Bouncing: each step jumps past the bottom and lands on the other side.";
  } else if (trail.length > 1) status = "Still rolling downhill.";

  return (
    <div className="word__box">
      <p className="word__kicker">Interactive demo · Real gradient descent on a made-up valley</p>
      <h3>Find the lowest point. You can only feel the slope under your feet.</h3>
      <svg ref={svg} className="lab-svg lab-svg--click" viewBox="0 0 420 215" role="img" aria-label="Valley with a ball rolling toward the bottom" onClick={dropBall}>
        <path d={`${VALLEY_PATH} L410 215 L10 215 Z`} className="lab-ground" />
        <path d={VALLEY_PATH} className="lab-curve" />
        {!left &&
          trail.slice(-40).map((t, i) => <circle key={i} cx={gdX(t)} cy={gdY(LOSS(t))} r={2.5} className="lab-trail" />)}
        {!left && <circle cx={gdX(x)} cy={gdY(LOSS(x)) - 7} r={7} className="lab-ball" />}
      </svg>
      <p aria-live="polite" className="lab-status">
        {status}
      </p>
      <div className="lab-controls">
        <label>
          Step size: {rate.toFixed(2)}
          <input
            type="range"
            min={0.05}
            max={3}
            step={0.05}
            value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
          />
        </label>
        <div className="lab-row">
          <button type="button" className="btn btn--wide" disabled={left} onClick={() => walk(1)}>
            Take a step
          </button>
          <button type="button" className="btn btn--wide" disabled={left} onClick={() => walk(10)}>
            10 steps
          </button>
          <button type="button" className="btn btn--wide" onClick={() => setTrail([6.5])}>
            Start over
          </button>
        </div>
      </div>
      <p className="word__small">
        Steps taken: {trail.length - 1}. {left ? "" : `Current loss: ${LOSS(x).toFixed(2)}. `}Click anywhere on the valley to drop the ball there.
      </p>
    </div>
  );
}

/* ---------- 004: Overfitting ---------- */

const TRUE_CURVE = (x: number) => Math.sin(2.5 * x);
const TRAIN_NOISE = [0.21, -0.28, 0.31, -0.12, 0.26, -0.33, 0.18, 0.29, -0.24, 0.14, -0.3, 0.22];
const TEST_NOISE = [-0.14, 0.2, -0.22, 0.27, -0.09, 0.16, -0.25, 0.11, 0.24, -0.18, 0.13];
const TRAIN = TRAIN_NOISE.map((noise, i) => {
  const x = -1 + (2 * i) / 11;
  return { x, y: TRUE_CURVE(x) + noise };
});
const TEST = TEST_NOISE.map((noise, i) => {
  const x = -1 + (2 * (i + 0.5)) / 11;
  return { x, y: TRUE_CURVE(x) + noise };
});

// Chebyshev basis keeps the least-squares system well conditioned at high degrees.
function basis(x: number, degree: number) {
  const row = [1, x];
  for (let k = 2; k <= degree; k++) row.push(2 * x * row[k - 1] - row[k - 2]);
  return row.slice(0, degree + 1);
}

function fitPolynomial(degree: number) {
  const size = degree + 1;
  const A = Array.from({ length: size }, () => new Array<number>(size + 1).fill(0));
  for (const { x, y } of TRAIN) {
    const row = basis(x, degree);
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) A[i][j] += row[i] * row[j];
      A[i][size] += row[i] * y;
    }
  }
  for (let i = 0; i < size; i++) {
    let pivot = i;
    for (let r = i + 1; r < size; r++) if (Math.abs(A[r][i]) > Math.abs(A[pivot][i])) pivot = r;
    [A[i], A[pivot]] = [A[pivot], A[i]];
    for (let r = 0; r < size; r++) {
      if (r === i) continue;
      const factor = A[r][i] / A[i][i];
      for (let c = i; c <= size; c++) A[r][c] -= factor * A[i][c];
    }
  }
  const weights = A.map((row, i) => row[size] / row[i]);
  return (x: number) => basis(x, degree).reduce((sum, b, i) => sum + b * weights[i], 0);
}

const rmse = (model: (x: number) => number, points: { x: number; y: number }[]) =>
  Math.sqrt(points.reduce((sum, p) => sum + (model(p.x) - p.y) ** 2, 0) / points.length);

const MAX_DEGREE = 10;
const FITS = Array.from({ length: MAX_DEGREE }, (_, i) => {
  const model = fitPolynomial(i + 1);
  return { model, train: rmse(model, TRAIN), test: rmse(model, TEST) };
});
const BEST_DEGREE = FITS.reduce((best, fit, i) => (fit.test < FITS[best].test ? i : best), 0) + 1;

const ofX = (x: number) => 20 + ((x + 1) / 2) * 380;
const ofY = (y: number) => 105 - y * 58;

export function Overfitting() {
  const [degree, setDegree] = useState(1);
  const fit = FITS[degree - 1];

  const curve = useMemo(() => {
    let path = "";
    for (let i = 0; i <= 200; i++) {
      const x = -1 + i / 100;
      path += `${i ? "L" : "M"}${ofX(x).toFixed(1)} ${Math.max(-40, Math.min(250, ofY(fit.model(x)))).toFixed(1)} `;
    }
    return path;
  }, [fit]);

  let status = "Too simple: this model misses the shape, on both the training and the test points.";
  if (degree >= BEST_DEGREE) {
    status =
      fit.test <= FITS[BEST_DEGREE - 1].test * 1.2
        ? "About right: it follows the trend, and it does well on points it hasn't seen."
        : "Too complex: it's bending to chase the noise. Training error keeps falling, but test error climbs.";
  }

  // Bars cap at 0.6 so the small differences stay visible; the numbers show the real error.
  const scale = 100 / 0.6;

  return (
    <div className="word__box">
      <p className="word__kicker">Interactive demo · A real polynomial fit, recalculated as you drag</p>
      <h3>How wiggly should the model be?</h3>
      <svg className="lab-svg" viewBox="0 0 420 210" role="img" aria-label={`Polynomial of degree ${degree} fitted to data points`}>
        <clipPath id="lab-plot">
          <rect x="0" y="0" width="420" height="210" />
        </clipPath>
        <path d={curve} className="lab-curve" clipPath="url(#lab-plot)" />
        {TRAIN.map((p) => (
          <circle key={`a${p.x}`} cx={ofX(p.x)} cy={ofY(p.y)} r={4} className="lab-dot-train" />
        ))}
        {TEST.map((p) => (
          <rect key={`b${p.x}`} x={ofX(p.x) - 3.5} y={ofY(p.y) - 3.5} width={7} height={7} className="lab-dot-test" />
        ))}
      </svg>
      <p className="word__small">
        <span className="lab-pos">● Training points</span>, which the model learns from. <span className="lab-neg">■ Test points</span>, which it never sees.
      </p>
      <div className="lab-controls">
        <label>
          Model complexity (polynomial degree): {degree}
          <input type="range" min={1} max={MAX_DEGREE} value={degree} onChange={(e) => setDegree(Number(e.target.value))} />
        </label>
      </div>
      <div className="lab-bars">
        <span>Training error</span>
        <div>
          <i className="lab-bar-train" style={{ width: `${fit.train * scale}%` }} />
        </div>
        <b>{fit.train.toFixed(2)}</b>
        <span>Test error</span>
        <div>
          <i className="lab-bar-test" style={{ width: `${fit.test * scale}%` }} />
        </div>
        <b>{fit.test.toFixed(2)}</b>
      </div>
      <p aria-live="polite" className="lab-status">
        {status}
      </p>
    </div>
  );
}

/* ---------- 005: Self-attention ---------- */

const SENTENCE = "The cat didn't cross the street because it was too".split(" ");

const ATTENTION: Record<string, Record<string, Record<number, number>>> = {
  tired: {
    it: { 1: 0.56, 7: 0.14, 10: 0.2, 5: 0.1 },
    tired: { 1: 0.4, 7: 0.3, 10: 0.2, 9: 0.1 },
  },
  wide: {
    it: { 5: 0.56, 7: 0.14, 10: 0.2, 1: 0.1 },
    wide: { 5: 0.4, 7: 0.3, 10: 0.2, 9: 0.1 },
  },
};

const NEIGHBORS: Record<string, Record<number, number>> = {
  cat: { 1: 0.45, 0: 0.2, 3: 0.2, 7: 0.15 },
  street: { 5: 0.45, 4: 0.2, 3: 0.25, 7: 0.1 },
  cross: { 3: 0.4, 1: 0.3, 5: 0.3 },
  "didn't": { 2: 0.45, 3: 0.4, 1: 0.15 },
  because: { 6: 0.4, 2: 0.3, 7: 0.3 },
};

function attentionFor(word: string, index: number, ending: string, length: number) {
  const fromEnding = ATTENTION[ending][word];
  if (fromEnding) return fromEnding;
  if (NEIGHBORS[word]) return NEIGHBORS[word];
  const weights: Record<number, number> = { [index]: 0.5 };
  if (index > 0) weights[index - 1] = 0.25;
  if (index < length - 1) weights[index + 1] = 0.25;
  return weights;
}

export function SelfAttention() {
  const [ending, setEnding] = useState<"tired" | "wide">("tired");
  const [selected, setSelected] = useState(7);
  const words = [...SENTENCE, ending];
  const weights = attentionFor(words[selected].toLowerCase(), selected, ending, words.length);
  const ranked = Object.entries(weights)
    .map(([i, w]) => ({ word: words[Number(i)], index: Number(i), weight: w }))
    .sort((a, b) => b.weight - a.weight);

  return (
    <div className="word__box">
      <p className="word__kicker">Interactive demo · Illustrative numbers I wrote by hand, not from a real model</p>
      <h3>Click a word. What is it looking at?</h3>
      <div className="lab-row" role="group" aria-label="Sentence ending">
        <span>End the sentence with:</span>
        {(["tired", "wide"] as const).map((item) => (
          <button type="button" key={item} aria-pressed={ending === item} className={`btn${ending === item ? " btn--down" : ""}`} onClick={() => setEnding(item)}>
            {item}
          </button>
        ))}
      </div>
      <p className="lab-sentence">
        {words.map((word, i) => {
          const w = weights[i] ?? 0;
          return (
            <button
              type="button"
              key={`${word}${i}`}
              aria-pressed={selected === i}
              className={selected === i ? "lab-word lab-word--on" : "lab-word"}
              style={{ backgroundColor: selected === i ? undefined : `rgb(238 110 165 / ${Math.min(0.9, w * 1.5)})` }}
              onClick={() => setSelected(i)}
            >
              {word}
            </button>
          );
        })}
        .
      </p>
      <div className="lab-bars lab-bars--attn" aria-live="polite">
        {ranked.map(({ word, index, weight }) => (
          <div key={`${word}${index}`} className="lab-bars__row">
            <span>{word}</span>
            <div>
              <i className="lab-bar-train" style={{ width: `${weight * 100}%` }} />
            </div>
            <b>{Math.round(weight * 100)}%</b>
          </div>
        ))}
      </div>
      {words[selected] === "it" && (
        <Comment author="SS1">
          Same word, different meaning. With &quot;{ending}&quot;, &quot;it&quot; most likely means the {ending === "tired" ? "cat" : "street"}. Attention
          is how a model can use later words to work that out.
        </Comment>
      )}
    </div>
  );
}

/* ---------- 006: AI hallucinations ---------- */

const ANSWERS: { question: string; answer: string; wrong: boolean; evidence: string }[] = [
  {
    question: "Who wrote “Attention Is All You Need”?",
    answer: "Ashish Vaswani and seven co-authors, in 2017. It introduced the Transformer.",
    wrong: false,
    evidence: "This one's right. The paper appeared on arXiv in 2017 (1706.03762), and at NeurIPS that year.",
  },
  {
    question: "Can you see the Great Wall of China from the Moon?",
    answer: "Yes. It's the only human-made structure visible to the naked eye from the Moon.",
    wrong: true,
    evidence: "It's wrong, and it sounds confident. NASA says the wall can't be seen from the Moon with the naked eye. A popular myth is an easy thing to repeat.",
  },
  {
    question: "Give me a source on empathy in neural networks.",
    answer: "See Okonkwo & Lindqvist (2019), “Recursive Empathy Networks,” Nature 571, pp. 88–94.",
    wrong: true,
    evidence: "I invented this citation for the demo. Fake references often look like this: believable names, a real journal, exact page numbers. Always look the paper up.",
  },
  {
    question: "Which is bigger, 9.11 or 9.9?",
    answer: "9.11 is bigger, because 11 is greater than 9.",
    wrong: true,
    evidence: "It's wrong: 9.9 is the same as 9.90, which is bigger than 9.11. The reasoning sounds neat, and that's what makes it easy to miss.",
  },
  {
    question: "When did the Eiffel Tower open?",
    answer: "In 1889, for the World's Fair in Paris.",
    wrong: false,
    evidence: "This one's right. Not every answer is a hallucination, which is why you can't just assume either way.",
  },
];

export function Hallucinations() {
  const [guesses, setGuesses] = useState<(boolean | null)[]>(ANSWERS.map(() => null));
  const done = guesses.filter((g) => g !== null).length;
  const right = guesses.filter((g, i) => g === ANSWERS[i].wrong).length;

  return (
    <div className="word__box">
      <p className="word__kicker">Interactive demo · Examples I wrote to show common mistakes, not real chat logs</p>
      <h3>Which of these answers would you trust?</h3>
      {ANSWERS.map((item, i) => {
        const guess = guesses[i];
        return (
          <div key={item.question} className="lab-answer">
            <p className="lab-q">{item.question}</p>
            <p>
              <b>AI:</b> {item.answer}
            </p>
            {guess === null ? (
              <div className="lab-row">
                <button type="button" className="btn btn--wide" onClick={() => setGuesses(guesses.map((g, k) => (k === i ? false : g)))}>
                  Looks right
                </button>
                <button type="button" className="btn btn--wide" onClick={() => setGuesses(guesses.map((g, k) => (k === i ? true : g)))}>
                  Something's off
                </button>
              </div>
            ) : (
              <div aria-live="polite">
                <Comment author="Evidence">
                  <b className={guess === item.wrong ? "lab-pos" : "lab-neg"}>{guess === item.wrong ? "Good call. " : "Not quite. "}</b>
                  {item.evidence}
                </Comment>
              </div>
            )}
          </div>
        );
      })}
      <p className="lab-status" aria-live="polite">
        {done === ANSWERS.length ? `You got ${right} of ${ANSWERS.length}.` : `${done} of ${ANSWERS.length} checked.`}
      </p>
    </div>
  );
}
