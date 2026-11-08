"use client";

import { useEffect, useState } from "react";
import { useLab } from "./lab-state";

const FIELDS = [
  { id: "audience", label: "Intended audience", hint: "Who is this for, and how did you adjust the language and interactions for them?" },
  { id: "learned", label: "What I learned", hint: "What did building and testing this teach you about CNNs, or about explaining them?" },
  { id: "feedback", label: "Feedback received", hint: "Who tried it, and what did they say? Leave this empty until it has happened." },
  { id: "changes", label: "Changes made after feedback", hint: "What did you change because of that feedback?" },
];
const KEY = "pixel-reflection-v1";

function Reflection() {
  const [values, setValues] = useState<Record<string, string>>({});
  useEffect(() => {
    try {
      setValues(JSON.parse(localStorage.getItem(KEY) ?? "{}"));
    } catch {}
  }, []);
  const update = (id: string, v: string) => {
    const next = { ...values, [id]: v };
    setValues(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {}
  };
  return (
    <div className="px-reflect">
      <p className="px-draft">DRAFT AREA · TO BE COMPLETED BY SISSI · saved only in this browser</p>
      {FIELDS.map((f) => (
        <label key={f.id}>
          <b>{f.label}</b>
          <textarea rows={3} value={values[f.id] ?? ""} placeholder={f.hint} onChange={(e) => update(f.id, e.target.value)} />
        </label>
      ))}
    </div>
  );
}

export function AboutProject() {
  const { model } = useLab();
  const meta = model.status === "ready" ? model.model.meta : null;
  return (
    <div className="px-app px-about">
      <p className="px-sys">ARTIFACT 04 · AIML-500 MACHINE LEARNING FUNDAMENTALS</p>
      <h2 className="px-title">
        PIXEL.exe: How Machines See <small>An Interactive CNN Laboratory</small>
      </h2>

      <h3>Objective</h3>
      <p>Explain how convolutional neural networks process images and make predictions through hands-on experimentation.</p>

      <h3>Value proposition</h3>
      <p>
        Help beginners understand neural networks and CNNs through visual experiments rather than technical lectures. Every number on screen comes
        from a real, trained network running in the browser.
      </p>

      <h3>Process</h3>
      <ol className="px-list">
        <li>
          Read the READMEs and licenses of CNN Explainer (MIT), CNN Explorer (MIT), and TensorFlow Playground (Apache 2.0). I took ideas from
          them, not code.
        </li>
        <li>
          Wrote a NumPy-only training script (<code>scripts/train-mnist-cnn.py</code>) and trained a small CNN on the 60,000 MNIST training
          images, with random shifts of up to 2 pixels.
        </li>
        <li>
          Measured it on the 10,000 official MNIST test images: {meta ? `${(meta.testAccuracy * 100).toFixed(2)}%` : "…"} accuracy (seed{" "}
          {meta?.seed ?? "…"}, {meta?.epochs ?? "…"} epochs).
        </li>
        <li>
          Wrote the forward pass in TypeScript and checked it against the Python code on 8 test images: the same predictions, with probabilities
          within 3 × 10⁻⁷ of each other.
        </li>
        <li>Checked the drawing preprocessing by enlarging and shifting those test digits; all 8 were still classified correctly.</li>
        <li>Built the windows, then tested drawing, scanning, and every view at desktop and phone sizes in a browser.</li>
      </ol>

      <h3>The model</h3>
      <p>
        Input 1×28×28 → convolution, 8 filters of 5×5 → ReLU → 2×2 max pooling → convolution, 16 filters of 3×3 → ReLU → 2×2 max pooling →
        flatten (784) → dense layer (10) → softmax. 9,226 learned numbers in total. The weights file is{" "}
        <a href="/pixel/mnist-cnn.json">/pixel/mnist-cnn.json</a>.
      </p>

      <h3>Tools</h3>
      <ul className="px-list">
        <li>Next.js, React, and TypeScript, the stack this portfolio already uses</li>
        <li>NumPy, for training</li>
        <li>A hand-written TypeScript forward pass for inference, so no TensorFlow.js or ONNX download is needed</li>
        <li>HTML Canvas for drawing and feature maps, and SVG for diagrams</li>
        <li>Claude Code, an AI coding assistant (see below)</li>
      </ul>

      <h3>Course connection</h3>
      <p>
        It puts foundational ML ideas into practice: supervised training, a held-out test set, convolution, nonlinearity, pooling, and softmax
        classification. It also applies visual-learning principles: one question per window, progressive disclosure, and immediate feedback from
        your own input.
      </p>

      <h3>Reflection</h3>
      <Reflection />

      <h3>AI use disclosure</h3>
      <p>
        This project was built with Claude Code, an AI coding assistant, working from my brief. It researched the reference projects, wrote the
        training script, the TypeScript inference code, and the interface, and ran the checks described above. <i>[Sissi: add what you decided,
        reviewed, or changed yourself.]</i>
      </p>

      <h3>Attribution</h3>
      <ul className="px-list">
        <li>
          Data: the MNIST database, by Yann LeCun, Corinna Cortes, and Christopher J.C. Burges, downloaded from Google&apos;s CVDF mirror for
          training. The images aren&apos;t included on this site.
        </li>
        <li>
          Inspiration: CNN Explainer, Wang et al., “CNN Explainer: Learning Convolutional Neural Networks with Interactive Visualization,” IEEE
          TVCG, 2020 (<a href="https://github.com/poloclub/cnn-explainer">github.com/poloclub/cnn-explainer</a>, MIT).
        </li>
        <li>
          Inspiration: CNN Explorer by Ángel Morales, for showing the patch × kernel arithmetic (
          <a href="https://github.com/moralesangel/cnn-explorer">github.com/moralesangel/cnn-explorer</a>, MIT).
        </li>
        <li>
          Inspiration: TensorFlow Playground, for click-to-explore networks (
          <a href="https://github.com/tensorflow/playground">github.com/tensorflow/playground</a>, Apache 2.0).
        </li>
        <li>No code from these projects was copied.</li>
      </ul>
    </div>
  );
}
