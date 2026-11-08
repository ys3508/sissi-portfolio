import type { Metadata } from "next";
import { TruthOS } from "../components/truth/truth-os";
import { pixel, term } from "../lib/desktop-fonts";

export const metadata: Metadata = {
  title: { absolute: "404: Truth Not Found" },
  description: "An interactive experiment about AI safety, trust, and human judgment. Not every helpful answer is safe to trust.",
};

export default function TruthNotFoundPage() {
  return <TruthOS className={`${pixel.variable} ${term.variable}`} />;
}
