"use client";

import "./desktop.css";
import { useEffect, useLayoutEffect, useReducer, useRef, useState } from "react";
import type { CSSProperties } from "react";
import Link from "next/link";
import { links, me } from "app/lib/desktop-content";
import { About, Beautiful, Photos, Projects, Writing } from "./apps";
import type { PostLink } from "./apps";
import { Music } from "./music";
import { Terminal } from "./terminal";
import { useDrag } from "./use-drag";
import { Window } from "./window";
import type { Rect } from "./window";

type AppId = "about" | "projects" | "writing" | "photos" | "music" | "terminal" | "beautiful";

const APPS: Record<AppId, { title: string; icon?: string; w: number; h: number; dialog?: boolean }> = {
  about: { title: "about_me.txt", icon: "/desktop/about.webp", w: 460, h: 440 },
  projects: { title: "my projects", icon: "/desktop/projects.webp", w: 560, h: 380 },
  writing: { title: "love letters", icon: "/desktop/bunny.webp", w: 520, h: 360 },
  photos: { title: "camera roll", icon: "/desktop/digicam.webp", w: 680, h: 520 },
  music: { title: "mixtape player", icon: "/desktop/cd.webp", w: 460, h: 430 },
  terminal: { title: "kitten.exe", icon: "/desktop/cat.webp", w: 560, h: 360 },
  beautiful: { title: "Error", w: 330, h: 150, dialog: true },
};

const ICONS: { app: AppId; label: string; alt: string }[] = [
  { app: "about", label: "about_me.txt", alt: "Halftone ribbon icon" },
  { app: "projects", label: "projects", alt: "Pink New York folder" },
  { app: "writing", label: "love letters", alt: "Bunny hugging a pink heart" },
  { app: "photos", label: "camera roll", alt: "Stickered digital camera" },
  { app: "music", label: "mixtape", alt: "Stickered mixtape CD" },
  { app: "terminal", label: "kitten.exe", alt: "Kitten wearing headphones" },
];

// `mobile` is [left, top] on phones; stickers without it are hidden there.
const STICKERS: { id: string; alt: string; app?: AppId; left: string; top: string; size: string; rotate: number; mobile?: [string, string] }[] = [
  { id: "camcorder", alt: "Stickered silver camcorder", app: "photos", left: "21%", top: "7%", size: "23vmin", rotate: -6, mobile: ["5%", "72%"] },
  { id: "headphones", alt: "Halftone headphones with red stars", app: "music", left: "48%", top: "3%", size: "17vmin", rotate: 7 },
  { id: "ipod", alt: "Pink music player covered in stickers", app: "music", left: "80%", top: "6%", size: "21vmin", rotate: 6, mobile: ["39%", "70%"] },
  { id: "horse", alt: "Hand-drawn horse in star boots", left: "79%", top: "58%", size: "24vmin", rotate: -4, mobile: ["71%", "72%"] },
  { id: "dog", alt: "Halftone puppy peering at you", left: "19%", top: "65%", size: "19vmin", rotate: 5 },
];

type Win = { id: AppId; rect: Rect; minimized: boolean; maximized: boolean };
type Action =
  | { type: "open"; id: AppId; rect: Rect }
  | { type: "close" | "focus" | "toggleMin" | "minimize" | "maximize"; id: AppId }
  | { type: "rect"; id: AppId; rect: Partial<Rect> };

// `windows` is kept in stacking order: last is on top and active.
function reducer(windows: Win[], action: Action): Win[] {
  const current = windows.find((w) => w.id === action.id);
  const raise = (win: Win) => [...windows.filter((w) => w.id !== win.id), win];

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

function storage(action: "get" | "set") {
  try {
    if (action === "get") return sessionStorage.getItem("pink98-booted") === "1";
    sessionStorage.setItem("pink98-booted", "1");
  } catch {}
  return false;
}

const isTouch = () => window.matchMedia("(pointer: coarse)").matches;

function Sticker({ sticker, onOpen }: { sticker: (typeof STICKERS)[number]; onOpen: (id: AppId) => void }) {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [grabbed, setGrabbed] = useState(false);
  const origin = useRef(offset);
  const drag = useDrag(
    (dx, dy) => setOffset({ x: origin.current.x + dx, y: origin.current.y + dy }),
    () => setGrabbed(false),
  );
  const { app } = sticker;

  return (
    <div
      className={`sticker${grabbed ? " sticker--grabbed" : ""}`}
      style={
        {
          left: sticker.left,
          top: sticker.top,
          width: sticker.size,
          translate: `${offset.x}px ${offset.y}px`,
          rotate: `${sticker.rotate}deg`,
          ...(sticker.mobile && { "--m-left": sticker.mobile[0], "--m-top": sticker.mobile[1] }),
        } as CSSProperties
      }
      {...drag.bind}
      onPointerDown={(e) => {
        origin.current = offset;
        setGrabbed(true);
        drag.bind.onPointerDown(e);
      }}
      onClick={() => {
        if (app && !drag.moved.current && isTouch()) onOpen(app);
      }}
      onDoubleClick={() => app && onOpen(app)}
    >
      <img src={`/desktop/${sticker.id}.webp`} alt={sticker.alt} draggable={false} />
    </div>
  );
}

export function Desktop({ posts, className }: { posts: PostLink[]; className?: string }) {
  const [windows, dispatch] = useReducer(reducer, []);
  const [selected, setSelected] = useState<AppId | null>(null);
  const [startOpen, setStartOpen] = useState(false);
  const [clock, setClock] = useState("");
  const [boot, setBoot] = useState(true);
  const [off, setOff] = useState(false);

  const open = (id: AppId) => {
    const app = APPS[id];
    const W = window.innerWidth;
    const H = window.innerHeight - 38;
    const w = Math.min(app.w, W - 24);
    const h = Math.min(app.h, H - 24);
    const step = windows.length * 26;
    dispatch({
      type: "open",
      id,
      rect: {
        x: Math.max(12, Math.min(W - w - 12, (W - w) / 2 + step - 40)),
        y: Math.max(12, Math.min(H - h - 12, (H - h) / 2 + step - 50)),
        w,
        h,
      },
    });
    setStartOpen(false);
  };

  useLayoutEffect(() => {
    if (storage("get")) setBoot(false);
  }, []);

  // First visit of the session: the compliment pops up once booting is done.
  useEffect(() => {
    if (storage("get")) return;
    const timer = window.setTimeout(() => {
      storage("set");
      setBoot(false);
      const W = window.innerWidth;
      dispatch({
        type: "open",
        id: "beautiful",
        rect: {
          x: Math.max(12, Math.min(W - 342, W * 0.62)),
          y: Math.max(12, (window.innerHeight - 38) * 0.68),
          w: Math.min(330, W - 24),
          h: 150,
        },
      });
    }, 1700);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }));
    tick();
    const timer = window.setInterval(tick, 15000);
    return () => window.clearInterval(timer);
  }, []);

  const top = windows.filter((w) => !w.minimized).at(-1)?.id;

  const renderApp = (id: AppId) => {
    const close = () => dispatch({ type: "close", id });
    switch (id) {
      case "about":
        return <About />;
      case "projects":
        return <Projects />;
      case "writing":
        return <Writing posts={posts} />;
      case "photos":
        return <Photos />;
      case "music":
        return <Music />;
      case "terminal":
        return <Terminal onOpen={open} onCompliment={() => open("beautiful")} onExit={close} />;
      case "beautiful":
        return <Beautiful onDone={close} />;
    }
  };

  if (off) {
    return (
      <div className={`desk desk--off ${className ?? ""}`}>
        <p>It&apos;s now safe to close this tab.</p>
        <button type="button" className="btn btn--wide" onClick={() => setOff(false)}>
          restart ♡
        </button>
      </div>
    );
  }

  return (
    <div className={`desk ${className ?? ""}`}>
      <main
        className="desk__area"
        onPointerDown={(e) => {
          if (e.target === e.currentTarget) setSelected(null);
          setStartOpen(false);
        }}
      >
        <div className="hero">
          <p className="hero__hi">hi, i am ♡</p>
          <div className="hero__box">
            <h1>{me.name}</h1>
            <i className="hero__handle hero__handle--tl" />
            <i className="hero__handle hero__handle--tr" />
            <i className="hero__handle hero__handle--bl" />
            <i className="hero__handle hero__handle--br" />
            <p className="hero__tag hero__tag--a">
              <b aria-hidden>✦</b> {me.role}
            </p>
            <p className="hero__tag hero__tag--b">
              <b aria-hidden>♥</b> {me.tagline}
            </p>
          </div>
        </div>

        {STICKERS.map((s) => (
          <Sticker key={s.id} sticker={s} onOpen={open} />
        ))}

        <nav className="icons" aria-label="Desktop">
          {ICONS.map(({ app, label, alt }) => (
            <button
              type="button"
              key={app}
              className={`icon${selected === app ? " icon--on" : ""}`}
              onClick={() => (isTouch() ? open(app) : setSelected(app))}
              onDoubleClick={() => open(app)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  open(app);
                }
              }}
            >
              <img src={APPS[app].icon} alt={alt} draggable={false} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        {windows.map((win, i) => {
          const app = APPS[win.id];
          return (
            <Window
              key={win.id}
              title={app.title}
              icon={app.icon}
              rect={win.rect}
              z={10 + i}
              active={top === win.id}
              minimized={win.minimized}
              maximized={win.maximized}
              dialog={app.dialog}
              onFocus={() => dispatch({ type: "focus", id: win.id })}
              onClose={() => dispatch({ type: "close", id: win.id })}
              onMinimize={() => dispatch({ type: "minimize", id: win.id })}
              onMaximize={() => dispatch({ type: "maximize", id: win.id })}
              onRect={(rect) => dispatch({ type: "rect", id: win.id, rect })}
            >
              {renderApp(win.id)}
            </Window>
          );
        })}
      </main>

      {startOpen && (
        <div className="start" role="menu">
          <p className="start__rail" aria-hidden>
            pink<b>98</b>
          </p>
          <div className="start__items">
            {ICONS.map(({ app, label }) => (
              <button type="button" role="menuitem" key={app} onClick={() => open(app)}>
                <img src={APPS[app].icon} alt="" />
                {label}
              </button>
            ))}
            <hr />
            <Link role="menuitem" href="/blog">
              classic blog
            </Link>
            <Link role="menuitem" href="/projects">
              classic projects
            </Link>
            <Link role="menuitem" href="/photos">
              classic photos
            </Link>
            {links.map((l) => (
              <a role="menuitem" key={l.href} href={l.href} target="_blank" rel="noreferrer">
                {l.label}
              </a>
            ))}
            <hr />
            <button type="button" role="menuitem" onClick={() => setOff(true)}>
              shut down...
            </button>
          </div>
        </div>
      )}

      <footer className="taskbar">
        <button
          type="button"
          className={`btn taskbar__start${startOpen ? " btn--down" : ""}`}
          aria-expanded={startOpen}
          onClick={() => setStartOpen((s) => !s)}
        >
          <span aria-hidden>♥</span> start
        </button>
        <div className="taskbar__tasks">
          {windows
            .filter((w) => !APPS[w.id].dialog)
            .slice()
            .sort((a, b) => a.id.localeCompare(b.id))
            .map((w) => (
              <button
                type="button"
                key={w.id}
                className={`btn taskbar__task${top === w.id ? " btn--down" : ""}`}
                onClick={() => dispatch({ type: "toggleMin", id: w.id })}
              >
                <img src={APPS[w.id].icon} alt="" />
                <span>{APPS[w.id].title}</span>
              </button>
            ))}
        </div>
        <time className="taskbar__tray">{clock}</time>
      </footer>

      {boot && (
        <div className="boot" aria-hidden>
          <p className="boot__logo">
            pink<b>98</b>
          </p>
          <div className="boot__bar">
            <span />
          </div>
          <p className="boot__hint">loading stickers...</p>
        </div>
      )}
    </div>
  );
}
