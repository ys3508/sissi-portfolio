// Everything the experimental homepage says lives here.
// Copy marked "TODO" is placeholder — swap in your own words.

export const hero = {
  name: "Sissi Sun",
  // Each word is animated separately; keep it short.
  titleWords: ["learning", "machines,", "slowly"],
  role: "AI / ML engineer", // TODO: your exact title
  intro:
    // TODO: one or two sentences in your own voice.
    "I build models that read, see and reason — and I like to show the messy middle: the data, the failed runs, the moment a loss curve finally bends.",
  status: "currently: open to research & engineering roles", // TODO
};

export const nav = [
  { label: "projects", href: "/projects" },
  { label: "writing", href: "/blog" },
  { label: "field notes", href: "/photos" },
];

// The three images that carry the story. Put your files in /public/images
// with these names (or change the paths). If a file is missing, a
// generated placeholder is drawn instead so the layout still works.
export const chapters = [
  {
    id: "01",
    word: "observe",
    kicker: "chapter 01 / data",
    image: "/images/01.jpg",
    alt: "TODO: describe image 01",
    figure: "fig. 01 — the raw signal",
    body:
      // TODO
      "Every project starts before the model: collecting, cleaning and staring at examples until the edge cases start talking back.",
    tags: ["n = 48,210", "labels: noisy", "look first"],
  },
  {
    id: "02",
    word: "iterate",
    kicker: "chapter 02 / training",
    image: "/images/02.jpg",
    alt: "TODO: describe image 02",
    figure: "fig. 02 — run 37 of many",
    body:
      // TODO
      "Then the loop: hypothesis, experiment, ablation, repeat. Most runs fail quietly; the useful ones teach you what to measure next.",
    tags: ["lr 3e-4", "loss ↓", "seed 7"],
  },
  {
    id: "03",
    word: "ship",
    kicker: "chapter 03 / deployment",
    image: "/images/03.jpg",
    alt: "TODO: describe image 03",
    figure: "fig. 03 — out in the world",
    body:
      // TODO
      "Finally the model meets people. Latency budgets, evals that mirror reality, and monitoring that notices drift before users do.",
    tags: ["p95 < 120ms", "eval ✓", "v1.0"],
  },
];

export const outro = {
  line: "more experiments inside",
  email: "mailto:example@gmail.com", // TODO
};
