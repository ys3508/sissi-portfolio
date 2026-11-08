"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { parseModel, run } from "./cnn";
import type { Model, ModelFile, Trace } from "./cnn";

export type PixelAppId = "scanner" | "inside" | "maps" | "microscope" | "fool" | "basics" | "dashboard" | "about";

export type Scan = {
  id: number;
  time: number;
  pixels: Float32Array;
  trace: Trace;
  intended: number | "none" | null;
  challenge?: string;
};

type ModelState = { status: "loading" } | { status: "ready"; model: Model } | { status: "error"; message: string };

type LabApi = {
  model: ModelState;
  retry: () => void;
  scans: Scan[];
  current: Scan | null;
  scan: (pixels: Float32Array, intended: number | "none" | null, challenge?: string) => Scan | null;
  setIntended: (id: number, intended: number | "none" | null) => void;
  reset: () => void;
  open: (id: PixelAppId) => void;
  layer: LayerKey;
  setLayer: (layer: LayerKey) => void;
  inspected: Record<string, number>;
  inspect: (layer: LayerKey) => void;
};

export type LayerKey = "conv1" | "relu1" | "pool1" | "conv2" | "relu2" | "pool2";

const Ctx = createContext<LabApi | null>(null);

export function LabProvider({ children, open }: { children: ReactNode; open: (id: PixelAppId) => void }) {
  const [model, setModel] = useState<ModelState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  const [scans, setScans] = useState<Scan[]>([]);
  const [layer, setLayer] = useState<LayerKey>("conv1");
  const [inspected, setInspected] = useState<Record<string, number>>({});

  useEffect(() => {
    let cancelled = false;
    setModel({ status: "loading" });
    fetch("/pixel/mnist-cnn.json")
      .then((r) => {
        if (!r.ok) throw new Error(`The model file returned ${r.status}.`);
        return r.json() as Promise<ModelFile>;
      })
      .then((file) => {
        const parsed = parseModel(file);
        // Smoke test: a blank image must produce ten probabilities that add up to 1.
        const sum = run(parsed, new Float32Array(784)).probs.reduce((a, v) => a + v, 0);
        if (Math.abs(sum - 1) > 1e-3) throw new Error("The model loaded, but its output didn't check out.");
        if (!cancelled) setModel({ status: "ready", model: parsed });
      })
      .catch((e: Error) => !cancelled && setModel({ status: "error", message: e.message || "The model couldn't be loaded." }));
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const scan = useCallback(
    (pixels: Float32Array, intended: number | "none" | null, challenge?: string) => {
      if (model.status !== "ready") return null;
      const entry: Scan = { id: Date.now(), time: Date.now(), pixels, trace: run(model.model, pixels), intended, challenge };
      setScans((list) => [...list, entry].slice(-40));
      return entry;
    },
    [model],
  );

  const api: LabApi = {
    model,
    retry: () => setAttempt((a) => a + 1),
    scans,
    current: scans.at(-1) ?? null,
    scan,
    setIntended: (id, intended) => setScans((list) => list.map((s) => (s.id === id ? { ...s, intended } : s))),
    reset: () => setScans([]),
    open,
    layer,
    setLayer,
    inspected,
    inspect: (l) => setInspected((v) => ({ ...v, [l]: (v[l] ?? 0) + 1 })),
  };
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useLab() {
  const api = useContext(Ctx);
  if (!api) throw new Error("useLab needs LabProvider");
  return api;
}

export function pickLayer(trace: Trace, layer: LayerKey) {
  return trace[layer];
}

export const LAYERS: { key: LayerKey; name: string; kind: "conv" | "relu" | "pool" }[] = [
  { key: "conv1", name: "Convolution 1", kind: "conv" },
  { key: "relu1", name: "ReLU 1", kind: "relu" },
  { key: "pool1", name: "Max pooling 1", kind: "pool" },
  { key: "conv2", name: "Convolution 2", kind: "conv" },
  { key: "relu2", name: "ReLU 2", kind: "relu" },
  { key: "pool2", name: "Max pooling 2", kind: "pool" },
];
