import type { Rect } from "./window";

// A stack of windows for the standalone desktops (TRUTH.EXE, PIXEL.exe).
// The array order is the stacking order: the last window is on top.

export type StackWin<Id extends string> = { id: Id; rect: Rect; minimized: boolean; maximized: boolean };

export type StackAction<Id extends string> =
  | { type: "open"; id: Id; rect: Rect }
  | { type: "close" | "focus" | "toggleMin" | "minimize" | "maximize"; id: Id }
  | { type: "rect"; id: Id; rect: Partial<Rect> };

export function windowsReducer<Id extends string>(windows: StackWin<Id>[], action: StackAction<Id>): StackWin<Id>[] {
  const current = windows.find((w) => w.id === action.id);
  const raise = (win: StackWin<Id>) => [...windows.filter((w) => w.id !== win.id), win];
  switch (action.type) {
    case "open":
      return raise(current ? { ...current, minimized: false } : { id: action.id, rect: action.rect, minimized: false, maximized: false });
    case "close":
      return windows.filter((w) => w.id !== action.id);
    case "focus":
      return current && windows.at(-1)?.id !== action.id ? raise(current) : windows;
    case "minimize":
      return windows.map((w) => (w.id === action.id ? { ...w, minimized: true } : w));
    case "toggleMin": {
      if (!current) return windows;
      const top = windows.filter((w) => !w.minimized).at(-1);
      if (top?.id === action.id) return windows.map((w) => (w.id === action.id ? { ...w, minimized: true } : w));
      return raise({ ...current, minimized: false });
    }
    case "maximize":
      return windows.map((w) => (w.id === action.id ? { ...w, maximized: !w.maximized } : w));
    case "rect":
      return windows.map((w) => (w.id === action.id ? { ...w, rect: { ...w.rect, ...action.rect } } : w));
  }
}

/** Where a newly opened window goes: centered, nudged down-right for each window already open. */
export function placeWindow(w: number, h: number, openCount: number): Rect {
  const W = window.innerWidth;
  const H = window.innerHeight - 38;
  const width = Math.min(w, W - 24);
  const height = Math.min(h, H - 24);
  const step = (openCount % 6) * 26;
  return {
    x: Math.max(12, Math.min(W - width - 12, (W - width) / 2 + step - 60)),
    y: Math.max(12, Math.min(H - height - 12, (H - height) / 2 + step - 50)),
    w: width,
    h: height,
  };
}
