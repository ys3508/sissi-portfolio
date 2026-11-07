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
    title: "OpenDeepLearning",
    year: 2023,
    description: "Open source AI education resources",
    url: "https://opendeeplearning.xyz/",
  },
];
