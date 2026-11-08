export interface Project {
  title: string;
  year: number;
  description: string;
  url: string;
  icon?: string;
  /** On the desktop homepage, opens the setup wizard instead of the link. */
  hasSetup?: boolean;
}

export const projects: Project[] = [
  {
    title: "BackOnTrack",
    year: 2026,
    description: "AI app · When plans fall apart, find your way forward",
    url: "https://backontrack-peach.vercel.app",
    icon: "/desktop/backontrack/icon.svg",
    hasSetup: true,
  },
  {
    title: "404: Truth Not Found",
    year: 2026,
    description: "AI safety experiment · Not every helpful answer is safe to trust",
    url: "/truth-not-found",
    icon: "/desktop/truth-orb.webp",
  },
  {
    title: "PIXEL.exe",
    year: 2026,
    description: "CNN lab · Draw a digit and watch a real network read it",
    url: "/pixel",
    icon: "/desktop/pixel-card.webp",
  },
];
