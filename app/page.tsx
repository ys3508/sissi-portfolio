import type { Metadata } from "next";
import { Desktop } from "./components/desktop/desktop";
import { hero } from "./lib/home-content";
import { pixel, term } from "./lib/desktop-fonts";

export const metadata: Metadata = {
  title: { absolute: `${hero.name} — ${hero.role}` },
  description: hero.intro,
};

export default function Page() {
  return <Desktop className={`${pixel.variable} ${term.variable}`} />;
}
