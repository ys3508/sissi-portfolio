import { Pixelify_Sans, VT323 } from "next/font/google";

export const pixel = Pixelify_Sans({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--ff-pixel",
});

export const term = VT323({ subsets: ["latin"], weight: "400", variable: "--ff-term" });
