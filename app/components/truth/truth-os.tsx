"use client";

import "../desktop/desktop.css";
import "./truth.css";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { Window } from "../desktop/window";
import { placeWindow, windowsReducer } from "../desktop/window-stack";
import type { StackAction, StackWin } from "../desktop/window-stack";
import { About, CaseFiles, EvidenceExplorer, Reflection, SafetyManual, SystemLog, TrustMonitor } from "./truth-apps";
import { Case1, Case2, Case3, Case4, Case5, Case6 } from "./truth-cases";
import { CASE_META, CLAIMS } from "./truth-data";
import { OsCtx } from "./truth-os-context";
import type { Notice, TruthAppId } from "./truth-os-context";
import { GameProvider, useGame } from "./truth-state";

/* ---------- pixel icons, drawn on a 16-unit grid ---------- */

const svg = (body: string) =>
  `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" shape-rendering="crispEdges">${body}</svg>`)}`;

const ICON = {
  files: svg(
    `<path fill="#4a4666" d="M1 3h6l1 1h7v10H1z"/><path fill="#c9c2f2" d="M2 5h12v8H2z"/><path fill="#e7e2ff" d="M2 4h4l1 1h7v1H2z"/><path fill="#d3263b" d="M10 9h3v3h-3z"/>`,
  ),
  evidence: svg(
    `<path fill="#4a4666" d="M3 1h6v1h1v1h1v6h-1v1H9v1H3v-1H2V9H1V3h1V2h1z"/><path fill="#cfe6ff" d="M3 3h6v6H3z"/><path fill="#fff" d="M4 4h2v2H4z"/><path fill="#4a4666" d="M10 10h2v1h1v1h1v1h1v2h-2v-1h-1v-1h-1v-1h-1z"/><path fill="#2b3bdb" d="M11 11h1v1h1v1h-1v-1h-1z"/>`,
  ),
  monitor: svg(
    `<path fill="#4a4666" d="M1 1h14v11H1zM6 12h4v2h2v1H4v-1h2z"/><path fill="#fffdf8" d="M2 2h12v9H2z"/><path fill="#2b3bdb" d="M3 7h2v3H3z"/><path fill="#9b8cf0" d="M6 5h2v5H6z"/><path fill="#f4a6c8" d="M9 3h2v7H9z"/><path fill="#8fc3ee" d="M12 6h1v4h-1z"/>`,
  ),
  manual: svg(
    `<path fill="#4a4666" d="M2 1h11v14H2z"/><path fill="#9b8cf0" d="M3 2h9v12H3z"/><path fill="#fffdf8" d="M5 4h5v3H5z"/><path fill="#d3263b" d="M12 9h2v6l-1-1-1 1z"/>`,
  ),
  about: svg(
    `<path fill="#4a4666" d="M3 1h10v1h1v9h-1v1H7l-3 3v-3H3v-1H2V2h1z"/><path fill="#cfe6ff" d="M3 2h10v9H3z"/><path fill="#2b3bdb" d="M7 3h2v2H7zM7 6h2v4H7z"/>`,
  ),
  log: svg(
    `<path fill="#4a4666" d="M2 1h12v14H2z"/><path fill="#fffdf8" d="M3 2h10v12H3z"/><path fill="#9aa0b5" d="M4 4h7v1H4zM4 6h8v1H4zM4 8h6v1H4zM4 10h8v1H4z"/><path fill="#2b3bdb" d="M4 12h3v1H4z"/>`,
  ),
  case: svg(
    `<path fill="#4a4666" d="M3 1h7l3 3v11H3z"/><path fill="#fffdf8" d="M4 2h5v3h3v9H4z"/><path fill="#9aa0b5" d="M5 7h6v1H5zM5 9h5v1H5z"/><path fill="#d3263b" d="M6 11h5v2H6z"/>`,
  ),
  reflection: svg(
    `<path fill="#4a4666" d="M7 1h2v3h3l-2 3 2 5-4-2-4 2 2-5-2-3h3z"/><path fill="#f4a6c8" d="M7 3h2v2h1l-1 2 1 3-2-1-2 1 1-3-1-2h1z"/>`,
  ),
};

type AppDef = { title: string; icon: string; w: number; h: number; render: () => ReactNode };

const APPS: Record<TruthAppId, AppDef> = {
  files: { title: "CASE_FILES", icon: ICON.files, w: 560, h: 470, render: () => <CaseFiles /> },
  evidence: { title: "EVIDENCE_EXPLORER.exe", icon: ICON.evidence, w: 620, h: 580, render: () => <EvidenceExplorer /> },
  monitor: { title: "TRUST_MONITOR.exe", icon: ICON.monitor, w: 560, h: 580, render: () => <TrustMonitor /> },
  manual: { title: "SAFETY_MANUAL.hlp", icon: ICON.manual, w: 660, h: 600, render: () => <SafetyManual /> },
  about: { title: "ABOUT_THIS_EXPERIMENT.txt", icon: ICON.about, w: 580, h: 580, render: () => <About /> },
  log: { title: "SYSTEM.LOG", icon: ICON.log, w: 500, h: 420, render: () => <SystemLog /> },
  reflection: { title: "REFLECTION.exe", icon: ICON.reflection, w: 560, h: 540, render: () => <Reflection /> },
  case1: { title: CASE_META[1].file, icon: ICON.case, w: 700, h: 620, render: () => <Case1 /> },
  case2: { title: CASE_META[2].file, icon: ICON.case, w: 700, h: 620, render: () => <Case2 /> },
  case3: { title: CASE_META[3].file, icon: ICON.case, w: 700, h: 620, render: () => <Case3 /> },
  case4: { title: CASE_META[4].file, icon: ICON.case, w: 760, h: 640, render: () => <Case4 /> },
  case5: { title: CASE_META[5].file, icon: ICON.case, w: 700, h: 620, render: () => <Case5 /> },
  case6: { title: CASE_META[6].file, icon: ICON.case, w: 760, h: 640, render: () => <Case6 /> },
};

const DESKTOP_ICONS: { id: TruthAppId; label: string }[] = [
  { id: "files", label: "Case Files" },
  { id: "evidence", label: "Evidence Explorer" },
  { id: "monitor", label: "Trust Monitor" },
  { id: "manual", label: "Safety Manual" },
  { id: "about", label: "About This Experiment" },
  { id: "log", label: "System Log" },
];

const reducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- small pieces ---------- */

function Loading({ children }: { children: ReactNode }) {
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (reducedMotion()) return setDone(true);
    const t = window.setTimeout(() => setDone(true), 650);
    return () => window.clearTimeout(t);
  }, []);
  if (done) return <>{children}</>;
  return (
    <div className="t-loading" role="status">
      <p className="t-sys">LOADING CASE FILE...</p>
      <div className="t-bar">
        <span />
      </div>
    </div>
  );
}

const BOOT_LINES = ["Initializing trust protocol...", "Loading evidence database...", "Checking user confidence..."];

function Boot({ onEnter }: { onEnter: () => void }) {
  const button = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    button.current?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") onEnter();
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [onEnter]);
  return (
    <div className="t-boot">
      <div className="t-boot__box">
        <p className="t-boot__logo">TRUTH.EXE</p>
        <ul>
          {BOOT_LINES.map((line, i) => (
            <li key={line} style={{ animationDelay: `${250 + i * 450}ms` }}>
              {line}
            </li>
          ))}
        </ul>
        <div className="t-boot__warn" style={{ animationDelay: "1600ms" }}>
          <b>WARNING:</b> Confidence does not equal correctness.
        </div>
        <button ref={button} type="button" className="btn btn--wide t-boot__enter" onClick={onEnter}>
          [ ENTER SYSTEM ]
        </button>
        <p className="t-boot__skip">Press Enter or Esc to skip.</p>
      </div>
    </div>
  );
}

function Finale({ onClose }: { onClose: () => void }) {
  const button = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    button.current?.focus();
    const key = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [onClose]);
  return (
    <div className="t-finale" role="dialog" aria-modal="true" aria-label="The last line">
      <p className="t-finale__a">The real question isn&apos;t whether AI can answer.</p>
      <p className="t-finale__b">It&apos;s whether we should rely on that answer.</p>
      <button ref={button} type="button" className="btn btn--wide t-finale__close" onClick={onClose}>
        Return to desktop
      </button>
    </div>
  );
}

/* ---------- the desktop ---------- */

function Shell() {
  const { log } = useGame();
  const [booted, setBooted] = useState(false);
  const [windows, dispatch] = useReducer(windowsReducer<TruthAppId>, [] as StackWin<TruthAppId>[]);
  const [notices, setNotices] = useState<(Notice & { key: number })[]>([]);
  const [startOpen, setStartOpen] = useState(false);
  const [sound, setSound] = useState(false);
  const [clock, setClock] = useState("");
  const [evidenceCase, setEvidenceCase] = useState(1);
  const [finale, setFinale] = useState(false);
  const [selected, setSelected] = useState<TruthAppId | null>(null);
  const audio = useRef<AudioContext | null>(null);
  const counter = useRef(0);

  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }));
    tick();
    const t = window.setInterval(tick, 15000);
    return () => window.clearInterval(t);
  }, []);

  const beep = useCallback(
    (kind: "click" | "warn" | "done" = "click") => {
      if (!sound) return;
      try {
        audio.current ??= new AudioContext();
        const ctx = audio.current;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "square";
        osc.frequency.value = kind === "warn" ? 220 : kind === "done" ? 880 : 660;
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + (kind === "warn" ? 0.35 : 0.08));
        osc.connect(gain).connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      } catch {}
    },
    [sound],
  );

  const notify = useCallback((notice: Notice) => {
    const key = ++counter.current;
    setNotices((list) => [...list.slice(-2), { ...notice, key }]);
    window.setTimeout(() => setNotices((list) => list.filter((n) => n.key !== key)), 7000);
  }, []);

  const open = useCallback(
    (id: TruthAppId) => {
      const app = APPS[id];
      dispatch({ type: "open", id, rect: placeWindow(app.w, app.h, windows.length) } as StackAction<TruthAppId>);
      setStartOpen(false);
      if (!windows.some((win) => win.id === id)) log(`Opened ${app.title}`);
    },
    [windows, log],
  );

  const focusClaim = useCallback(
    (claimId: string) => {
      const claim = CLAIMS.find((c) => c.id === claimId);
      if (claim) setEvidenceCase(claim.caseId);
      open("evidence");
      window.setTimeout(() => {
        const el = document.getElementById(`claim-${claimId}`);
        const body = el?.closest(".win__body");
        if (el && body) body.scrollTop += el.getBoundingClientRect().top - body.getBoundingClientRect().top - 8;
        el?.classList.add("t-evcard--flash");
        window.setTimeout(() => el?.classList.remove("t-evcard--flash"), 1200);
      }, 80);
    },
    [open],
  );

  const enter = useCallback(() => {
    setBooted(true);
    log("Entered TRUTH.EXE");
    window.setTimeout(
      () => notify({ title: "TRUTH.EXE", body: "6 unresolved case files found. Click Start Investigation to begin with Case 01." }),
      reducedMotion() ? 0 : 900,
    );
  }, [log, notify]);

  const top = windows.filter((w) => !w.minimized).at(-1)?.id;
  const api = { open, notify, beep, focusClaim, evidenceCase, setEvidenceCase, showFinale: () => setFinale(true) };

  return (
    <OsCtx.Provider value={api}>
      {!booted && <Boot onEnter={enter} />}
      <main
        className="desk__area t-area"
        aria-hidden={!booted}
        onPointerDown={(e) => {
          if (e.target === e.currentTarget) setSelected(null);
          setStartOpen(false);
        }}
      >
        <div className="t-wall" aria-hidden>
          <span className="t-wall__404">404</span>
          <span className="t-cloud t-cloud--a" />
          <span className="t-cloud t-cloud--b" />
          <span className="t-cloud t-cloud--c" />
        </div>

        <section className="t-hero" aria-labelledby="t-title">
          <p className="t-sys">ARTIFACT 03 · AN INTERACTIVE EXPERIMENT</p>
          <h1 id="t-title">
            404: <span>Truth</span> Not Found
          </h1>
          <p className="t-hero__sub">An interactive experiment about AI safety, trust, and human judgment.</p>
          <p className="t-hero__tag">Not every helpful answer is safe to trust.</p>
          <button type="button" className="btn btn--wide t-primary t-hero__start" onClick={() => open("case1")}>
            ▶ Start Investigation
          </button>
        </section>

        <nav className="t-icons" aria-label="Desktop">
          {DESKTOP_ICONS.map(({ id, label }) => (
            <button
              type="button"
              key={id}
              className={`icon t-icon${selected === id ? " icon--on" : ""}`}
              onClick={() => (window.matchMedia("(pointer: coarse)").matches ? open(id) : setSelected(id))}
              onDoubleClick={() => open(id)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  open(id);
                }
              }}
            >
              <img src={APPS[id].icon} alt="" draggable={false} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        {windows.map((win, i) => {
          const app = APPS[win.id];
          const isCase = win.id.startsWith("case");
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
              onFocus={() => dispatch({ type: "focus", id: win.id })}
              onClose={() => dispatch({ type: "close", id: win.id })}
              onMinimize={() => dispatch({ type: "minimize", id: win.id })}
              onMaximize={() => dispatch({ type: "maximize", id: win.id })}
              onRect={(rect) => dispatch({ type: "rect", id: win.id, rect })}
            >
              {isCase ? <Loading>{app.render()}</Loading> : app.render()}
            </Window>
          );
        })}

        <div className="t-notices" aria-live="polite">
          {notices.map((n) => (
            <div key={n.key} className={`t-notice t-notice--${n.kind ?? "info"}`} role={n.kind === "error" ? "alert" : "status"}>
              <p className="t-notice__bar">
                <span>{n.title}</span>
                <button
                  type="button"
                  aria-label="Dismiss notification"
                  onClick={() => setNotices((list) => list.filter((x) => x.key !== n.key))}
                >
                  ×
                </button>
              </p>
              <p>{n.body}</p>
            </div>
          ))}
        </div>
      </main>

      {startOpen && (
        <div className="start t-start" role="menu">
          <p className="start__rail" aria-hidden>
            TRUTH<b>.EXE</b>
          </p>
          <div className="start__items">
            <button type="button" role="menuitem" onClick={() => open("case1")}>
              <img src={ICON.case} alt="" />
              Start Investigation
            </button>
            {DESKTOP_ICONS.map(({ id, label }) => (
              <button type="button" role="menuitem" key={id} onClick={() => open(id)}>
                <img src={APPS[id].icon} alt="" />
                {label}
              </button>
            ))}
            <button type="button" role="menuitem" onClick={() => open("reflection")}>
              <img src={ICON.reflection} alt="" />
              Reflection
            </button>
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
          className={`btn taskbar__start t-startbtn${startOpen ? " btn--down" : ""}`}
          aria-expanded={startOpen}
          onClick={() => setStartOpen((s) => !s)}
        >
          <span aria-hidden>◆</span> TRUTH
        </button>
        <div className="taskbar__tasks">
          {windows.map((w) => (
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
        <button
          type="button"
          className="btn t-sound"
          aria-pressed={sound}
          aria-label={sound ? "Sound on. Turn sound off" : "Sound off. Turn sound on"}
          onClick={() => setSound((s) => !s)}
        >
          {sound ? "♪ ON" : "♪ OFF"}
        </button>
        <time className="taskbar__tray">{clock}</time>
      </footer>

      {finale && <Finale onClose={() => setFinale(false)} />}
    </OsCtx.Provider>
  );
}

export function TruthOS({ className }: { className?: string }) {
  return (
    <GameProvider>
      <div className={`desk truth ${className ?? ""}`}>
        <Shell />
      </div>
    </GameProvider>
  );
}
