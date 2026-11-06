import type { Metadata } from "next";
import { Pixelify_Sans, VT323 } from "next/font/google";
import { Desktop } from "./components/desktop/desktop";
import { hero } from "./lib/home-content";
import { getBlogPosts } from "./lib/posts";

const pixel = Pixelify_Sans({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--ff-pixel",
});
const term = VT323({ subsets: ["latin"], weight: "400", variable: "--ff-term" });

export const metadata: Metadata = {
  title: { absolute: `${hero.name} — ${hero.role}` },
  description: hero.intro,
};

export default function Page() {
  const posts = getBlogPosts()
    .map((p) => ({ slug: p.slug, title: p.metadata.title, date: p.metadata.publishedAt }))
    .sort((a, b) => b.date.localeCompare(a.date));

  return <Desktop posts={posts} className={`${pixel.variable} ${term.variable}`} />;
}
