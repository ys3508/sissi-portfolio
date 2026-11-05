import type { Metadata } from "next";
import { HomeExperience } from "./components/lab/home-experience";
import { hero } from "./lib/home-content";

export const metadata: Metadata = {
  title: { absolute: `${hero.name} — ${hero.role}` },
  description: hero.intro,
};

export default function Page() {
  return <HomeExperience />;
}
