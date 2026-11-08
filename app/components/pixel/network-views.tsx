"use client";

import { useState } from "react";
import type { PointerEvent } from "react";
import { kernel } from "./cnn";
import type { FeatureMaps, Model, Trace } from "./cnn";
import { LAYERS, useLab } from "./lab-state";
import type { LayerKey } from "./lab-state";
import { MapCanvas, maxAbs } from "./visuals";

function NeedScan() {
  const { open } = useLab();
  return (
    <div className="px-app px-status">
      <p className="px-sys">NO SPECIMEN YET</p>
      <p>Draw a digit in the Image Scanner and press SCAN. This window shows what the real network did with it.</p>
      <button type="button" className="btn btn--wide px-primary" onClick={() => open("scanner")}>
        Open Image Scanner
      </button>
    </div>
  );
}

const shape = (m: FeatureMaps) => `${m.channels} × ${m.size} × ${m.size}`;

/** Which of the 16 final feature channels pushed hardest toward a digit, from the real dense weights. */
function channelContributions(model: Model, trace: Trace, digit: number) {
  const { w, outputs } = model.dense;
  const per = trace.pool2.size * trace.pool2.size;
  return Array.from({ length: trace.pool2.channels }, (_, c) => {
    let sum = 0;
    for (let i = c * per; i < (c + 1) * per; i++) sum += trace.flat[i] * w[i * outputs + digit];
    return sum;
  });
}

function MapStrip({ maps, signed, count = maps.channels }: { maps: FeatureMaps; signed?: boolean; count?: number }) {
  const per = maps.size * maps.size;
  const scale = maxAbs(maps.data);
  return (
    <div className="px-strip">
      {Array.from({ length: Math.min(count, maps.channels) }, (_, c) => (
        <MapCanvas key={c} data={maps.data} offset={c * per} size={maps.size} scale={scale} signed={signed} label={`Map ${c + 1}`} />
      ))}
    </div>
  );
}

type Stage = { id: string; name: string; tone: string; shape: string; text: string; body: React.ReactNode; inspect?: LayerKey };

export function InsideNetwork() {
  const { current, model, open, setLayer, inspect } = useLab();
  const [step, setStep] = useState(0);
  if (!current || model.status !== "ready") return <NeedScan />;
  const t = current.trace;
  const contrib = channelContributions(model.model, t, t.prediction);
  const cmax = Math.max(...contrib.map(Math.abs)) || 1;
  const logitMax = Math.max(...Array.from(t.logits).map(Math.abs)) || 1;

  const stages: Stage[] = [
    {
      id: "input",
      name: "Input image",
      tone: "input",
      shape: "1 × 28 × 28",
      text: "Your drawing, shrunk to 784 numbers between 0 (background) and 1 (ink). This is all the network ever sees.",
      body: <MapCanvas data={t.input.data} size={28} scale={1} label="Input image" className="px-map--big" />,
    },
    {
      id: "conv1",
      name: "Convolution 1",
      tone: "conv",
      shape: shape(t.conv1),
      text: "Eight learned 5×5 filters slide across the image. Each one looks for its own small pattern, such as an edge or a curve, and makes a map of where it found it.",
      body: <MapStrip maps={t.conv1} signed />,
      inspect: "conv1",
    },
    {
      id: "relu1",
      name: "ReLU",
      tone: "relu",
      shape: shape(t.relu1),
      text: "Negative values become zero and positive values pass through. That simple bend lets the network build up curved, nonlinear patterns.",
      body: <MapStrip maps={t.relu1} />,
      inspect: "relu1",
    },
    {
      id: "pool1",
      name: "Max pooling",
      tone: "pool",
      shape: shape(t.pool1),
      text: "Each 2×2 block is replaced by its largest value. The maps get half as wide, keeping the strongest signals and dropping exact positions.",
      body: <MapStrip maps={t.pool1} />,
      inspect: "pool1",
    },
    {
      id: "conv2",
      name: "Convolution 2",
      tone: "conv",
      shape: shape(t.conv2),
      text: "Sixteen learned filters, each looking at all eight maps at once. They combine simple patterns into larger pieces of a digit.",
      body: <MapStrip maps={t.conv2} signed />,
      inspect: "conv2",
    },
    {
      id: "relu2",
      name: "ReLU",
      tone: "relu",
      shape: shape(t.relu2),
      text: "Negatives become zero again.",
      body: <MapStrip maps={t.relu2} />,
      inspect: "relu2",
    },
    {
      id: "pool2",
      name: "Max pooling",
      tone: "pool",
      shape: shape(t.pool2),
      text: "Down to sixteen tiny 7×7 maps: a compact summary of which patterns showed up, and roughly where.",
      body: <MapStrip maps={t.pool2} />,
      inspect: "pool2",
    },
    {
      id: "flatten",
      name: "Flatten",
      tone: "flat",
      shape: "784",
      text: "The 16 maps are laid end to end into one list of 784 numbers. Nothing is calculated here; it just changes the shape.",
      body: (
        <div className="px-flat" role="img" aria-label="The 784 flattened values as a strip">
          {Array.from({ length: 16 }, (_, c) => (
            <MapCanvas key={c} data={t.flat} offset={c * 49} size={7} scale={maxAbs(t.flat)} label={`Flattened channel ${c + 1}`} className="px-map--flat" />
          ))}
        </div>
      ),
    },
    {
      id: "dense",
      name: "Dense layer",
      tone: "dense",
      shape: "784 → 10",
      text: `Every one of the 784 values gets a learned weight for each digit, and they're added up into 10 scores. These bars show how much each of the 16 feature channels pushed the score for ${t.prediction} up or down.`,
      body: (
        <div className="px-contrib">
          {contrib.map((v, c) => (
            <span key={c} title={`Channel ${c + 1}: ${v.toFixed(2)}`}>
              <i className={v >= 0 ? "px-contrib--up" : "px-contrib--down"} style={{ height: `${(Math.abs(v) / cmax) * 100}%` }} />
              <small>{c + 1}</small>
            </span>
          ))}
        </div>
      ),
    },
    {
      id: "softmax",
      name: "Softmax → prediction",
      tone: "out",
      shape: "10",
      text: `The 10 scores (logits) are turned into probabilities that add up to 100%. The biggest one wins: ${t.prediction}.`,
      body: (
        <div className="px-logits">
          {Array.from(t.logits).map((v, d) => (
            <span key={d} className={d === t.prediction ? "px-logits--top" : ""}>
              <small>{d}</small>
              <i style={{ width: `${(Math.abs(v) / logitMax) * 50}%`, marginLeft: v < 0 ? `${50 - (Math.abs(v) / logitMax) * 50}%` : "50%" }} className={v < 0 ? "px-neg" : ""} />
              <b>{v.toFixed(1)}</b>
            </span>
          ))}
        </div>
      ),
    },
  ];

  return (
    <div className="px-app px-inside">
      <p className="px-sys">THE REAL ARCHITECTURE · {stages.length} STAGES · 9,226 LEARNED NUMBERS</p>
      <ol className="px-pipeline">
        {stages.map((s, i) => (
          <li key={s.id} className={`px-stage px-stage--${s.tone}${i === step ? " px-stage--on" : ""}`} style={{ animationDelay: `${i * 90}ms` }}>
            <button type="button" className="px-stage__head" aria-expanded={i === step} onClick={() => setStep(i)}>
              <span className="px-chip">{String(i).padStart(2, "0")}</span>
              <b>{s.name}</b>
              <code>{s.shape}</code>
            </button>
            {i === step ? (
              <div className="px-stage__body">
                <p>{s.text}</p>
                {s.body}
                <div className="px-row">
                  {s.inspect && (
                    <button
                      type="button"
                      className="btn"
                      onClick={() => {
                        setLayer(s.inspect!);
                        inspect(s.inspect!);
                        open("maps");
                      }}
                    >
                      Inspect in Feature Map Explorer
                    </button>
                  )}
                  {i < stages.length - 1 && (
                    <button type="button" className="btn px-primary" onClick={() => setStep(i + 1)}>
                      Next layer ▼
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="px-stage__peek" aria-hidden>
                {s.id === "input" && <MapCanvas data={t.input.data} size={28} scale={1} label="" />}
              </div>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}

export function FeatureMaps() {
  const { current, scans, model, layer, setLayer, inspect } = useLab();
  const [pick, setPick] = useState(0);
  const [shared, setShared] = useState(true);
  const [compare, setCompare] = useState(false);
  const [hover, setHover] = useState<{ x: number; y: number } | null>(null);
  if (!current || model.status !== "ready") return <NeedScan />;
  const maps = current.trace[layer];
  const per = maps.size * maps.size;
  const signed = layer.startsWith("conv");
  const previous = scans.at(-2);
  const prevMaps = previous?.trace[layer];
  const channel = Math.min(pick, maps.channels - 1);
  const layerMax = maxAbs(maps.data);
  const scaleFor = (c: number, m = maps) => (shared ? maxAbs(m.data) : maxAbs(m.data, c * per, per));
  const strength = Array.from({ length: maps.channels }, (_, c) => {
    let s = 0;
    for (let i = c * per; i < (c + 1) * per; i++) s += Math.max(0, maps.data[i]);
    return s / per;
  });
  const strongest = strength.indexOf(Math.max(...strength));
  const convLayer = layer.endsWith("1") ? "conv1" : "conv2";
  const kernels =
    convLayer === "conv1"
      ? [kernel(model.model, "conv1", channel % 8)]
      : Array.from({ length: 8 }, (_, c) => kernel(model.model, "conv2", channel % 16, c));
  const value = hover ? maps.data[channel * per + hover.y * maps.size + hover.x] : null;

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    const x = Math.floor(((e.clientX - box.left) / box.width) * maps.size);
    const y = Math.floor(((e.clientY - box.top) / box.height) * maps.size);
    if (x >= 0 && y >= 0 && x < maps.size && y < maps.size) setHover({ x, y });
  };

  return (
    <div className="px-app px-maps">
      <div className="px-tabs" role="tablist" aria-label="Layer">
        {LAYERS.map((l) => (
          <button
            type="button"
            role="tab"
            key={l.key}
            aria-selected={l.key === layer}
            className={`px-tab px-tab--${l.kind}${l.key === layer ? " px-tab--on" : ""}`}
            onClick={() => {
              setLayer(l.key);
              inspect(l.key);
            }}
          >
            {l.name}
          </button>
        ))}
      </div>
      <div className="px-row px-row--between">
        <p className="px-sys">
          OUTPUT SHAPE {shape(maps)} · {maps.channels} MAPS
        </p>
        <div className="px-row">
          <label className="px-check">
            <input type="checkbox" checked={shared} onChange={() => setShared(!shared)} /> Same brightness scale
          </label>
          <label className="px-check">
            <input type="checkbox" checked={compare} disabled={!prevMaps} onChange={() => setCompare(!compare)} /> Compare with previous scan
          </label>
        </div>
      </div>
      <div className="px-maps__grid">
        {Array.from({ length: maps.channels }, (_, c) => (
          <button
            type="button"
            key={c}
            aria-pressed={c === channel}
            className={`px-tile${c === channel ? " px-tile--on" : ""}`}
            onClick={() => setPick(c)}
          >
            <MapCanvas data={maps.data} offset={c * per} size={maps.size} scale={scaleFor(c)} signed={signed} label={`Map ${c + 1}`} />
            {compare && prevMaps && (
              <MapCanvas data={prevMaps.data} offset={c * per} size={maps.size} scale={scaleFor(c, prevMaps)} signed={signed} label={`Previous map ${c + 1}`} className="px-map--prev" />
            )}
            <small>
              #{c + 1}
              {c === strongest && " ★"}
            </small>
          </button>
        ))}
      </div>
      <div className="px-zoom">
        <div className="px-zoom__view" onPointerMove={onMove} onPointerLeave={() => setHover(null)}>
          <MapCanvas
            data={maps.data}
            offset={channel * per}
            size={maps.size}
            scale={shared ? layerMax : scaleFor(channel)}
            signed={signed}
            label={`Map ${channel + 1}, zoomed in`}
            className="px-map--zoom"
          />
        </div>
        <div className="px-zoom__info">
          <p className="px-sys">MAP #{channel + 1}</p>
          <p className="px-small">
            {hover && value !== null
              ? `Row ${hover.y + 1}, column ${hover.x + 1}: ${value.toFixed(3)}`
              : "Point at the map to read single values."}
          </p>
          <p className="px-small">
            Average positive activation {strength[channel].toFixed(3)}
            {channel === strongest ? ", the strongest in this layer for this drawing." : "."}
          </p>
          <p className="px-sys">
            {convLayer === "conv1" ? "THE LEARNED 5×5 FILTER BEHIND IT" : "ITS 8 LEARNED 3×3 FILTERS, ONE PER INPUT MAP"}
          </p>
          <div className="px-kernels">
            {kernels.map((k, i) => (
              <MapCanvas key={i} data={k.data} size={k.size} scale={maxAbs(k.data)} signed label={`Learned filter weights ${i + 1}`} />
            ))}
          </div>
          <p className="px-small">
            {layer.startsWith("conv")
              ? "Pink means a positive response, blue a negative one."
              : layer.startsWith("relu")
                ? "After ReLU, every value is zero or positive."
                : "Pooling keeps the largest value from each 2×2 block."}{" "}
            Some filters respond strongly to particular strokes. These patterns were learned during training, and not every filter has a
            simple human meaning.
          </p>
        </div>
      </div>
    </div>
  );
}
