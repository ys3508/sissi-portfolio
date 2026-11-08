// Hand-made stroke paths for each digit, in a 280x280 drawing space.
// They're drawn onto the canvas like a pen would, so they go through the same
// preprocessing as a visitor's drawing. They are not MNIST images.

type Pt = [number, number];
export type Stroke = Pt[];

const arc = (cx: number, cy: number, rx: number, ry: number, from: number, to: number, steps = 24): Stroke =>
  Array.from({ length: steps + 1 }, (_, i) => {
    const a = ((from + ((to - from) * i) / steps) * Math.PI) / 180;
    return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)] as Pt;
  });

export const SAMPLE_DIGITS: Record<number, Stroke[]> = {
  0: [arc(140, 140, 62, 95, 0, 360, 40)],
  1: [
    [
      [118, 72],
      [148, 48],
      [148, 235],
    ],
  ],
  2: [
    [
      ...arc(140, 105, 58, 52, 200, 360, 18),
      [190, 135],
      [96, 232],
      [200, 232],
    ],
  ],
  3: [arc(138, 95, 55, 45, 210, 450, 20), arc(138, 182, 60, 52, 270, 500, 22)],
  4: [
    [
      [168, 48],
      [86, 180],
      [204, 180],
    ],
    [
      [170, 110],
      [170, 238],
    ],
  ],
  5: [
    [
      [196, 52],
      [108, 52],
      [100, 130],
      ...arc(140, 172, 62, 58, 240, 495, 22),
    ],
  ],
  6: [
    [[176, 50], ...arc(150, 170, 58, 60, 250, 180, 6), ...arc(140, 178, 55, 55, 180, 540, 30)],
  ],
  7: [
    [
      [86, 58],
      [200, 58],
      [122, 238],
    ],
  ],
  8: [arc(140, 95, 48, 44, 90, 450, 30), arc(140, 185, 58, 52, 270, 630, 30)],
  9: [
    [...arc(140, 102, 52, 50, 0, 360, 30), [192, 102], [182, 238]],
  ],
};
