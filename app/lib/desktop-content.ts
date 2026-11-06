// Everything the retro desktop says lives here.
// Copy marked "TODO" is placeholder — swap in your own words.
import { hero } from "./home-content";

export const me = {
  name: hero.name,
  handle: "sissi",
  role: hero.role,
  tagline: hero.titleWords.join(" "),
  intro: hero.intro,
  status: hero.status,
};

// Shown in the Start menu and terminal only when filled in.
export const links: { label: string; href: string }[] = [
  // TODO: { label: "email", href: "mailto:you@example.com" },
  // TODO: { label: "github", href: "https://github.com/you" },
];

export const photos = [
  { src: "/photos/photo7.jpg", alt: "Pixel flower cut through pink paper onto a white lamb" },
  { src: "/photos/photo8.jpg", alt: "Pixel flourish over grass and pink fabric" },
  { src: "/photos/photo9.jpg", alt: "Pixel rabbits leaping over lace and a garden" },
  { src: "/photos/photo10.jpg", alt: "Pixel blossom over lace and hanging flowers" },
  { src: "/photos/photo11.jpg", alt: "Dotted figure among pink petals" },
  { src: "/photos/photo12.jpg", alt: "Blue butterfly and pink line drawings" },
  { src: "/photos/photo13.jpg", alt: "Pastel collage of stars and butterflies" },
  { src: "/photos/photo14.jpg", alt: "Butterflies emerging from a vintage typewriter" },
  { src: "/photos/be5580dbe53404076299f0ecd673fc36.jpg", alt: "Glitched rainbow landscape" },
];

// Original little loops, synthesised live in the browser (no audio files).
// One token per sixteenth note; "." is a rest.
export const tracks = [
  {
    title: "bubblegum.mid",
    bpm: 132,
    wave: "square" as OscillatorType,
    lead: "C5 . E5 G5 . E5 C5 . D5 . F5 A5 . F5 D5 . E5 . G5 C6 . G5 E5 . D5 E5 F5 . E5 . C5 .",
    bass: "C3 . . C3 . . G3 . D3 . . D3 . . A3 . E3 . . E3 . . B3 . F3 . G3 . C3 . . .",
  },
  {
    title: "green_hills.mid",
    bpm: 96,
    wave: "triangle" as OscillatorType,
    lead: "E5 . . G5 . . A5 . B5 . . A5 . . G5 . E5 . . D5 . . E5 . G5 . . . . . . . A5 . . C6 . . B5 . G5 . . E5 . . D5 . E5 . . . . . . . . . . . . . . .",
    bass: "C3 . . . G3 . . . A2 . . . E3 . . . F3 . . . C3 . . . G3 . . . G2 . . .",
  },
  {
    title: "dial_up_lullaby.mid",
    bpm: 78,
    wave: "sine" as OscillatorType,
    lead: "A4 C5 E5 . A5 . E5 C5 G4 B4 D5 . G5 . D5 B4 F4 A4 C5 . F5 . C5 A4 E4 G4 B4 . E5 . . .",
    bass: "A2 . . . . . . . G2 . . . . . . . F2 . . . . . . . E2 . . . . . . .",
  },
];
