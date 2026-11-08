"use client";

import "../desktop/desktop.css";
import "./pixel.css";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { Window } from "../desktop/window";
import { placeWindow, windowsReducer } from "../desktop/window-stack";
import type { StackAction, StackWin } from "../desktop/window-stack";
import { AboutProject } from "./about";
import { NetworkBasics } from "./basics";
import { Dashboard } from "./dashboard";
import { LabProvider, useLab } from "./lab-state";
import type { PixelAppId } from "./lab-state";
import { Microscope } from "./microscope";
import { FeatureMaps, InsideNetwork } from "./network-views";
import { Scanner } from "./scanner";

const svg = (body: string) =>
  `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" shape-rendering="crispEdges">${body}</svg>`)}`;

const ICON: Record<PixelAppId, string> = {
  scanner: svg(`<path fill="#46405f" d="M1 4h14v9H1z"/><path fill="#e9f2ff" d="M2 5h12v7H2z"/><path fill="#2f5bea" d="M2 8h12v1H2z"/><path fill="#c25b9a" d="M5 6h1v5H5zM6 6h2v1H6zM8 7h1v2H8zM6 9h2v1H6zM6 10h1v1H6z"/>`),
  inside: svg(`<path fill="#46405f" d="M1 6h3v4H1zM6 3h3v4H6zM6 9h3v4H6zM12 6h3v4h-3z"/><path fill="#2f5bea" d="M2 7h1v2H2z"/><path fill="#1f8a70" d="M7 4h1v2H7z"/><path fill="#c47f00" d="M7 10h1v2H7z"/><path fill="#8b5cf6" d="M13 7h1v2h-1z"/><path fill="#9a94b5" d="M4 8h2v1H4zM9 5h3v1H9zM9 11h3v-1H9z"/>`),
  maps: svg(`<path fill="#46405f" d="M1 1h6v6H1zM9 1h6v6H9zM1 9h6v6H1zM9 9h6v6H9z"/><path fill="#c9c2f2" d="M2 2h4v4H2z"/><path fill="#f2a7c9" d="M10 2h4v4h-4z"/><path fill="#9cc7f4" d="M2 10h4v4H2z"/><path fill="#fff" d="M10 10h4v4h-4z"/><path fill="#2f5bea" d="M3 3h2v2H3zM11 12h2v1h-2z"/>`),
  microscope: svg(`<path fill="#46405f" d="M6 1h3v2H6zM6 3h3v6H6zM3 13h10v2H3zM11 6h2v7h-2zM5 9h5v2H5z"/><path fill="#c9c2f2" d="M7 4h1v4H7z"/><path fill="#2f5bea" d="M6 1h3v1H6z"/>`),
  fool: svg(`<path fill="#46405f" d="M2 1h12v14H2z"/><path fill="#fff4f8" d="M3 2h10v12H3z"/><path fill="#d6336c" d="M5 4h2v2H5zM9 4h2v2H9zM5 9h6v1H5zM4 10h1v1H4zM11 10h1v1h-1z"/>`),
  basics: svg(`<path fill="#9a94b5" d="M3 4l5 4M3 12l5-4M8 8l5-4M8 8l5 4" stroke="#9a94b5"/><path fill="#46405f" d="M1 2h4v4H1zM1 10h4v4H1zM6 6h4v4H6zM11 2h4v4h-4zM11 10h4v4h-4z"/><path fill="#c9c2f2" d="M2 3h2v2H2zM2 11h2v2H2zM12 3h2v2h-2zM12 11h2v2h-2z"/><path fill="#2f5bea" d="M7 7h2v2H7z"/>`),
  dashboard: svg(`<path fill="#46405f" d="M1 1h14v14H1z"/><path fill="#fffdf8" d="M2 2h12v12H2z"/><path fill="#2f5bea" d="M3 9h2v4H3z"/><path fill="#c25b9a" d="M6 6h2v7H6z"/><path fill="#1f8a70" d="M9 4h2v9H9z"/><path fill="#c47f00" d="M12 8h1v5h-1z"/>`),
  about: svg(`<path fill="#46405f" d="M2 1h9l3 3v11H2z"/><path fill="#fffdf8" d="M3 2h7v3h3v9H3z"/><path fill="#9a94b5" d="M4 6h7v1H4zM4 8h8v1H4zM4 10h6v1H4z"/><path fill="#c25b9a" d="M4 12h4v1H4z"/>`),
};

type AppDef = { title: string; w: number; h: number; question: string; render: () => ReactNode };

const APPS: Record<PixelAppId, AppDef> = {
  scanner: { title: "IMAGE_SCANNER.exe", w: 760, h: 660, question: "What happens when I draw a number?", render: () => <Scanner /> },
  inside: { title: "INSIDE_THE_NETWORK.exe", w: 640, h: 640, question: "What does the CNN do with my drawing?", render: () => <InsideNetwork /> },
  maps: { title: "FEATURE_MAP_EXPLORER.exe", w: 760, h: 640, question: "What does each filter respond to?", render: () => <FeatureMaps /> },
  microscope: { title: "CONVOLUTION_MICROSCOPE.exe", w: 900, h: 640, question: "How does a filter detect a pattern?", render: () => <Microscope /> },
  fool: { title: "CAN_YOU_FOOL_THE_NETWORK.exe", w: 760, h: 680, question: "Why did the model predict the wrong digit?", render: () => <Scanner fool /> },
  basics: { title: "NEURAL_NETWORK_BASICS.exe", w: 680, h: 640, question: "What's the difference between a neural network and a CNN?", render: () => <NetworkBasics /> },
  dashboard: { title: "EXPERIMENT_LOG.exe", w: 620, h: 620, question: "What happened in my experiments?", render: () => <Dashboard /> },
  about: { title: "ABOUT_THIS_PROJECT.txt", w: 640, h: 640, question: "How and why was this made?", render: () => <AboutProject /> },
};

const DESKTOP: { id: PixelAppId; label: string }[] = [
  { id: "scanner", label: "Image Scanner" },
  { id: "inside", label: "Inside the Network" },
  { id: "maps", label: "Feature Maps" },
  { id: "microscope", label: "Convolution Microscope" },
  { id: "fool", label: "Can You Fool It?" },
  { id: "basics", label: "Neural Network Basics" },
  { id: "dashboard", label: "Experiment Log" },
  { id: "about", label: "About This Project" },
];

const BOOT = ["Initializing visual cortex simulation...", "Loading neural network weights...", "Preparing image scanner...", "SYSTEM READY."];

function Boot({ onEnter }: { onEnter: () => void }) {
  const button = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    button.current?.focus();
    const key = (e: KeyboardEvent) => e.key === "Escape" && onEnter();
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [onEnter]);
  return (
    <div className="px-boot">
      <div className="px-boot__box">
        <p className="px-boot__logo">PIXEL.EXE</p>
        <ul>
          {BOOT.map((line, i) => (
            <li key={line} style={{ animationDelay: `${200 + i * 380}ms` }}>
              {line}
            </li>
          ))}
        </ul>
        <p className="px-boot__quote" style={{ animationDelay: "1700ms" }}>
          “Computers don&apos;t see images the way humans do.”
        </p>
        <button ref={button} type="button" className="btn btn--wide px-boot__go" onClick={onEnter}>
          [ START EXPERIMENT ]
        </button>
        <p className="px-boot__skip">Press Enter or Esc to skip.</p>
      </div>
    </div>
  );
}

function Status() {
  const { model, retry } = useLab();
  if (model.status === "ready")
    return (
      <span className="px-tray__model" title={`${model.model.meta.testAccuracy * 100}% on MNIST test images`}>
        ● CNN READY
      </span>
    );
  if (model.status === "loading") return <span className="px-tray__model px-tray__model--wait">◌ LOADING CNN</span>;
  return (
    <button type="button" className="btn px-tray__model px-tray__model--err" onClick={retry}>
      ✕ CNN FAILED · RETRY
    </button>
  );
}

function Desktop() {
  const [booted, setBooted] = useState(false);
  const [windows, dispatch] = useReducer(windowsReducer<PixelAppId>, [] as StackWin<PixelAppId>[]);
  const [startOpen, setStartOpen] = useState(false);
  const [selected, setSelected] = useState<PixelAppId | null>(null);
  const [clock, setClock] = useState("");

  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }));
    tick();
    const t = window.setInterval(tick, 15000);
    return () => window.clearInterval(t);
  }, []);

  const open = useCallback(
    (id: PixelAppId) => {
      dispatch({ type: "open", id, rect: placeWindow(APPS[id].w, APPS[id].h, windows.length) } as StackAction<PixelAppId>);
      setStartOpen(false);
    },
    [windows.length],
  );
  const top = windows.filter((w) => !w.minimized).at(-1)?.id;

  return (
    <LabProvider open={open}>
      {!booted && <Boot onEnter={() => setBooted(true)} />}
      <main
        className="desk__area px-area"
        aria-hidden={!booted}
        onPointerDown={(e) => {
          if (e.target === e.currentTarget) setSelected(null);
          setStartOpen(false);
        }}
      >
        <div className="px-wall" aria-hidden>
          <img src="/pixel/laptop.webp" alt="" className="px-wall__art" draggable={false} />
          <span className="px-wall__grid" />
        </div>

        <section className="px-hero" aria-labelledby="px-title">
          <p className="px-sys">ARTIFACT 04 · AIML-500 · LAB NOTEBOOK</p>
          <h1 id="px-title">
            PIXEL<span>.exe</span>
          </h1>
          <p className="px-hero__sub">An interactive journey inside a convolutional neural network.</p>
          <p className="px-hero__note">A real, trained CNN runs in this page. Draw a digit and watch what it does.</p>
          <button type="button" className="btn btn--wide px-primary px-hero__go" onClick={() => open("scanner")}>
            ▶ START EXPERIMENT
          </button>
        </section>

        <nav className="px-icons" aria-label="Lab programs">
          {DESKTOP.map(({ id, label }) => (
            <button
              type="button"
              key={id}
              className={`icon px-icon${selected === id ? " icon--on" : ""}`}
              title={APPS[id].question}
              onClick={() => (window.matchMedia("(pointer: coarse)").matches ? open(id) : setSelected(id))}
              onDoubleClick={() => open(id)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  open(id);
                }
              }}
            >
              <img src={ICON[id]} alt="" draggable={false} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        {windows.map((win, i) => (
          <Window
            key={win.id}
            title={APPS[win.id].title}
            icon={ICON[win.id]}
            rect={win.rect}
            z={10 + i}
            active={top === win.id}
            minimized={win.minimized}
            maximized={win.maximized}
            onFocus={() => dispatch({ type: "focus", id: win.id })}
            onClose={() => dispatch({ type: "close", id: win.id })}
            onMinimize={() => dispatch({ type: "minimize", id: win.id })}
            onMaximize={() => dispatch({ type: "maximize", id: win.id })}
            onRect={(rect) => dispatch({ type: "rect", id: win.id, rect })}
          >
            <div className="px-window">
              <p className="px-question">{APPS[win.id].question}</p>
              {APPS[win.id].render()}
            </div>
          </Window>
        ))}
      </main>

      {startOpen && (
        <div className="start px-start" role="menu">
          <p className="start__rail" aria-hidden>
            PIXEL<b>.exe</b>
          </p>
          <div className="start__items">
            {DESKTOP.map(({ id, label }) => (
              <button type="button" role="menuitem" key={id} onClick={() => open(id)}>
                <img src={ICON[id]} alt="" />
                {label}
              </button>
            ))}
            <hr />
            <Link role="menuitem" href="/">
              Exit to Sissi&apos;s desktop
            </Link>
          </div>
        </div>
      )}

      <footer className="taskbar">
        <button
          type="button"
          className={`btn taskbar__start px-startbtn${startOpen ? " btn--down" : ""}`}
          aria-expanded={startOpen}
          onClick={() => setStartOpen((s) => !s)}
        >
          <span aria-hidden>▦</span> PIXEL
        </button>
        <div className="taskbar__tasks">
          {windows.map((w) => (
            <button
              type="button"
              key={w.id}
              className={`btn taskbar__task${top === w.id ? " btn--down" : ""}`}
              onClick={() => dispatch({ type: "toggleMin", id: w.id })}
            >
              <img src={ICON[w.id]} alt="" />
              <span>{APPS[w.id].title}</span>
            </button>
          ))}
        </div>
        <Status />
        <time className="taskbar__tray">{clock}</time>
      </footer>
    </LabProvider>
  );
}

export function PixelOS({ className }: { className?: string }) {
  return (
    <div className={`desk pixel ${className ?? ""}`}>
      <Desktop />
    </div>
  );
}
