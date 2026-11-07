"use client";

import { useState } from "react";
import type { ComponentType, ReactNode } from "react";
import { hero } from "app/lib/home-content";
import { Comment, GradientDescent, Hallucinations, MlVsDl, NeuralNetwork, Overfitting, SelfAttention } from "./lab-experiments";

const NOTE_TYPES = ["I have a question", "My own analogy", "I noticed something"];
const WORD_MENU = ["File", "Edit", "View", "Insert", "Format", "Tools", "Table", "Window", "Help"];
const TOOLS = ["▭", "▤", "⎙", "✂", "⧉", "↶", "↷"];

type Experiment = {
  id: `lab-${string}`;
  file: string;
  number: string;
  title: string;
  question: string;
  Demo: ComponentType;
  // Sissi's own words. Each one shows only once it's filled in.
  confused?: string;
  explain: string;
  stillFiguringOut?: string;
};

const EXPERIMENTS: Experiment[] = [
  {
    id: "lab-ml",
    file: "001_ml_vs_dl.doc",
    number: "001",
    title: "Machine Learning vs. Deep Learning",
    question: "Is deep learning just machine learning with extra steps?",
    Demo: MlVsDl,
    confused: "I used to think deep learning was simply a more powerful version of machine learning.",
    explain:
      "Deep learning is a kind of machine learning that uses neural networks with many layers. When people compare the two, they usually mean traditional methods versus deep learning. Neither one is better in general: a small, tidy table and a pile of raw images call for different tools.",
  },
  {
    id: "lab-nn",
    file: "002_neural_network.doc",
    number: "002",
    title: "What is a neural network?",
    question: "What are all those circles and lines actually doing?",
    Demo: NeuralNetwork,
    explain:
      "It's a stack of very small calculators. Each node adds up what it receives, multiplied by a weight, and squashes the result into a number between 0 and 1. Nothing in it knows about homework. Training is the part that finds useful weights, and here you're setting them by hand.",
  },
  {
    id: "lab-gd",
    file: "003_gradient_descent.doc",
    number: "003",
    title: "Gradient Descent",
    question: "How does a model get better if nobody tells it the answer?",
    Demo: GradientDescent,
    explain:
      "Imagine standing in a foggy valley. You can't see the bottom, but you can feel which way the ground slopes, so you take a step downhill and check again. The step size matters: too small and it takes forever, too big and you jump right over the bottom.",
  },
  {
    id: "lab-overfit",
    file: "004_overfitting.doc",
    number: "004",
    title: "Overfitting",
    question: "If training error keeps going down, why isn't that always good?",
    Demo: Overfitting,
    explain:
      "It's like memorizing the practice test instead of learning the subject. A complex enough model can learn the noise in its training data, then stumble on anything new. That's why you judge a model on data it hasn't seen.",
  },
  {
    id: "lab-attention",
    file: "005_self_attention.doc",
    number: "005",
    title: "How does attention work?",
    question: "How does a model know what “it” refers to?",
    Demo: SelfAttention,
    explain:
      "When a model reads a word, self-attention lets it look back and forth across the whole sentence and decide which other words matter most for understanding this one. Those amounts are learned during training, and the numbers in this demo only illustrate the idea.",
  },
  {
    id: "lab-halluc",
    file: "006_ai_hallucinations.doc",
    number: "006",
    title: "AI Hallucinations",
    question: "Why does AI sound so sure when it's wrong?",
    Demo: Hallucinations,
    explain:
      "A language model generates text that's likely to come next, which isn't the same as checking whether it's true. So a wrong answer can sound just as confident as a right one. The fix isn't to distrust everything: it's to check the claims that matter.",
  },
];

export type LabId = "lab" | Experiment["id"] | "lab-notes" | "lab-behind";

const ORDER: LabId[] = ["lab", ...EXPERIMENTS.map((e) => e.id), "lab-notes", "lab-behind"];

export const LAB_WINDOWS: Record<LabId, { title: string; icon: string; w: number; h: number }> = Object.fromEntries(
  [
    ["lab", "learning_lab.doc"],
    ...EXPERIMENTS.map((e) => [e.id, e.file]),
    ["lab-notes", "margin_notes.doc"],
    ["lab-behind", "behind_the_project.doc"],
  ].map(([id, file]) => [id, { title: `${file} - Word`, icon: "/desktop/lab-doc.svg", w: id === "lab" ? 720 : 800, h: id === "lab" ? 560 : 600 }]),
) as Record<LabId, { title: string; icon: string; w: number; h: number }>;

function WordShell({ id, children }: { id: LabId; children: ReactNode }) {
  const page = ORDER.indexOf(id) + 1;
  return (
    <div className="word">
      <div className="word__menu" aria-hidden>
        {WORD_MENU.map((item) => (
          <span key={item}>{item}</span>
        ))}
      </div>
      <div className="word__tools" aria-hidden>
        {TOOLS.map((tool) => (
          <span key={tool} className="word__tool">
            {tool}
          </span>
        ))}
        <span className="word__sep" />
        <span className="word__select word__select--style">Normal</span>
        <span className="word__select word__select--font">Times New Roman</span>
        <span className="word__select">12</span>
        <span className="word__sep" />
        <span className="word__tool">
          <b>B</b>
        </span>
        <span className="word__tool">
          <i>I</i>
        </span>
        <span className="word__tool">
          <u>U</u>
        </span>
        <span className="word__sep" />
        <span className="word__select">100%</span>
      </div>
      <div className="word__ruler" aria-hidden>
        {[1, 2, 3, 4, 5].map((n) => (
          <span key={n}>{n}</span>
        ))}
      </div>
      <div className="word__doc">
        <article className="word__sheet">{children}</article>
      </div>
      <footer className="word__status">
        <span>Page {page}</span>
        <span>Sec 1</span>
        <span>
          {page}/{ORDER.length}
        </span>
        <span className="word__status-extra">At 1&quot;</span>
        <span className="word__status-extra">Ln 1</span>
        <span className="word__status-extra">Col 1</span>
      </footer>
    </div>
  );
}

function Contents({ onOpen }: { onOpen: (id: LabId) => void }) {
  const row = (id: LabId, label: string, hint: string) => (
    <li key={id}>
      <button type="button" onClick={() => onOpen(id)}>
        <span>{label}</span>
        <i aria-hidden />
        <b>{hint}</b>
      </button>
    </li>
  );
  return (
    <>
      <p className="word__kicker">{hero.name.split(" ")[0].toUpperCase()}&apos;S LEARNING LAB / VOL. 001</p>
      <h1 className="word__art">Wait, I think I get it.</h1>
      <p className="word__lede">Complicated AI ideas, explained like we&apos;re having coffee.</p>
      <blockquote>If I can&apos;t explain it simply, I probably don&apos;t understand it well enough.</blockquote>
      <p>
        An interactive collection of things I&apos;m learning about AI: a growing pile of questions, mistakes, discoveries, and
        tiny experiments. It isn&apos;t a textbook, and I&apos;m not an expert. I&apos;m working it out as I go.
      </p>
      <h2>Contents</h2>
      <ol className="word__toc">
        {EXPERIMENTS.map((e, i) => row(e.id, `Experiment ${e.number}: ${e.title}`, i === 0 ? "Start here" : "Open"))}
      </ol>
      <ol className="word__toc word__toc--extra">
        {row("lab-notes", "The Margin Notes", "Open")}
        {row("lab-behind", "Behind the Project", "Open")}
      </ol>
    </>
  );
}

function ExperimentDoc({ experiment, onOpen }: { experiment: Experiment; onOpen: (id: LabId) => void }) {
  const { Demo } = experiment;
  const position = EXPERIMENTS.indexOf(experiment);
  const next = EXPERIMENTS[position + 1];
  return (
    <>
      <p className="word__kicker">EXPERIMENT {experiment.number}</p>
      <h2 className="word__title">{experiment.title}</h2>
      <p className="word__lede">{experiment.question}</p>
      <Demo />
      <h2>What stuck</h2>
      {experiment.confused && (
        <p>
          <b>What confused me:</b> {experiment.confused}
        </p>
      )}
      <p>
        <b>How I&apos;d explain it now:</b> {experiment.explain}
      </p>
      {experiment.stillFiguringOut && (
        <p>
          <b>What I&apos;m still figuring out:</b> {experiment.stillFiguringOut}
        </p>
      )}
      <div className="lab-next">
        <button type="button" className="btn" onClick={() => onOpen("lab")}>
          Contents
        </button>
        {next ? (
          <button type="button" className="btn" onClick={() => onOpen(next.id)}>
            Next: {next.number} &gt;
          </button>
        ) : (
          <button type="button" className="btn" onClick={() => onOpen("lab-notes")}>
            Margin Notes &gt;
          </button>
        )}
      </div>
    </>
  );
}

function MarginNotes() {
  const [type, setType] = useState(NOTE_TYPES[0]);
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [preview, setPreview] = useState<{ type: string; name: string; note: string } | null>(null);

  return (
    <>
      <p className="word__kicker">TEACH ME SOMETHING BACK</p>
      <h2 className="word__title">The Margin Notes</h2>
      <p className="word__lede">What did I miss? How would you explain it?</p>
      <form
        className="word__form"
        onSubmit={(e) => {
          e.preventDefault();
          if (note.trim()) setPreview({ type, name: name.trim() || "Curious Visitor", note: note.trim() });
        }}
      >
        <div className="word__types" role="group" aria-label="Kind of note">
          {NOTE_TYPES.map((item) => (
            <button
              type="button"
              key={item}
              aria-pressed={type === item}
              className={`btn${type === item ? " btn--down" : ""}`}
              onClick={() => setType(item)}
            >
              {item}
            </button>
          ))}
        </div>
        <label>
          Nickname (optional)
          <input value={name} maxLength={40} autoComplete="off" onChange={(e) => setName(e.target.value)} />
        </label>
        <label>
          Your note
          <textarea rows={3} value={note} maxLength={500} onChange={(e) => setNote(e.target.value)} />
        </label>
        <button type="submit" className="btn btn--wide" disabled={!note.trim()}>
          Preview my note
        </button>
      </form>
      {preview && (
        <div aria-live="polite">
          <Comment author={preview.name}>
            <i>{preview.type}:</i> {preview.note}
          </Comment>
          <p className="word__small">Preview only. Notes aren&apos;t sent or saved yet, because the notes board isn&apos;t connected.</p>
        </div>
      )}
      <p className="word__label">Example conversation</p>
      <Comment author="Curious Visitor">
        <i>Question:</i> If deep learning is a type of machine learning, why do people compare them like they&apos;re separate things?
      </Comment>
      <Comment author="Sissi">
        Good question! Usually the comparison means traditional ML methods versus deep learning. Deep learning is still part of ML.
      </Comment>
    </>
  );
}

function Behind() {
  return (
    <>
      <p className="word__kicker">NOTES ON THE PROCESS</p>
      <h2 className="word__title">Behind the Project</h2>
      <p>
        Experiment 001 is adapted from my Machine Learning vs. Deep Learning assignment in AIML-500. I rebuilt it as something you
        can play with, for readers who don&apos;t work in AI.
      </p>
      <p>Every experiment follows the same idea: try it first, then read what stuck.</p>
      <h2>What&apos;s real in these demos</h2>
      <table>
        <tbody>
          <tr>
            <th scope="row">Neural network</th>
            <td>The output is really calculated from the weights you set. Nothing is trained.</td>
          </tr>
          <tr>
            <th scope="row">Gradient descent</th>
            <td>Real gradient descent, on a made-up valley.</td>
          </tr>
          <tr>
            <th scope="row">Overfitting</th>
            <td>Real polynomial fits and errors, on made-up data.</td>
          </tr>
          <tr>
            <th scope="row">Self-attention</th>
            <td>Illustrative numbers I wrote by hand, not from a real model.</td>
          </tr>
          <tr>
            <th scope="row">Hallucinations</th>
            <td>Examples I wrote to show common mistakes, not real chat logs.</td>
          </tr>
        </tbody>
      </table>
    </>
  );
}

export function LabDocument({ id, onOpen }: { id: LabId; onOpen: (id: LabId) => void }) {
  const experiment = EXPERIMENTS.find((e) => e.id === id);
  return (
    <WordShell id={id}>
      {id === "lab" && <Contents onOpen={onOpen} />}
      {experiment && <ExperimentDoc experiment={experiment} onOpen={onOpen} />}
      {id === "lab-notes" && <MarginNotes />}
      {id === "lab-behind" && <Behind />}
    </WordShell>
  );
}
