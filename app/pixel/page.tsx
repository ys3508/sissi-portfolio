import type { Metadata } from "next";
import { PixelOS } from "../components/pixel/pixel-os";
import { pixel, term } from "../lib/desktop-fonts";

export const metadata: Metadata = {
  title: { absolute: "PIXEL.exe: How Machines See" },
  description: "An interactive journey inside a convolutional neural network. Draw a digit and watch a real CNN read it.",
};

export default function PixelPage() {
  return <PixelOS className={`${pixel.variable} ${term.variable}`} />;
}
