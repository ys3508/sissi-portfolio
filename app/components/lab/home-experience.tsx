"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Draggable } from "gsap/Draggable";
import { useGSAP } from "@gsap/react";
import { LatentField } from "./latent-field";
import { Specimen } from "./specimen";
import { ThemeSwitch } from "../theme-switch";
import { chapters, hero, nav, outro } from "../../lib/home-content";

gsap.registerPlugin(ScrollTrigger, Draggable, useGSAP);

/* ---------------------------------------------------------------- */
/* helpers                                                          */
/* ---------------------------------------------------------------- */

function Letters({ text, className = "" }: { text: string; className?: string }) {
  return (
    <span className={className} aria-label={text}>
      {Array.from(text).map((ch, i) => (
        <span key={i} aria-hidden className={ch === " " ? "lab-letter lab-space" : "lab-letter"}>
          {ch === " " ? " " : ch}
        </span>
      ))}
    </span>
  );
}

const GLYPHS = "01░▒▓<>/\\{}[]=+*#%λσ∑∂";

/** Decode text from noise to its final value, like a model converging. */
function scramble(el: HTMLElement, duration = 1.2) {
  const final = el.dataset.text ?? el.textContent ?? "";
  el.dataset.text = final;
  const state = { p: 0 };
  return gsap.to(state, {
    p: 1,
    duration,
    ease: "power2.out",
    onUpdate() {
      const n = Math.floor(final.length * state.p);
      let out = final.slice(0, n);
      for (let i = n; i < final.length; i++) {
        out += final[i] === " " ? " " : GLYPHS[(Math.random() * GLYPHS.length) | 0];
      }
      el.textContent = out;
    },
    onComplete() {
      el.textContent = final;
    },
  });
}

function Clock() {
  const [now, setNow] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  useEffect(() => {
    const tick = () => {
      setNow(new Date().toLocaleTimeString("en-GB", { hour12: false }));
      setStep((s) => s + 1);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <span className="font-mono text-[11px] tabular-nums">
      t={now ?? "--:--:--"} · step {String(step).padStart(4, "0")}
    </span>
  );
}

/* Scattered nav positions + colours: deliberately asymmetric. */
const NAV_LAYOUT = [
  { pos: "left-[6vw] top-[22vh]", color: "var(--lab-blue)", rot: -6 },
  { pos: "left-[34vw] top-[11vh] md:left-auto md:right-[9vw] md:top-[16vh]", color: "var(--lab-tomato)", rot: 4 },
  { pos: "right-[6vw] bottom-[14vh] md:bottom-[7vh]", color: "var(--lab-lilac)", rot: -3 },
];

/* Where the three specimens float in the hero (desktop). */
const SPECIMEN_LAYOUT = [
  "right-[5%] top-[15vh] w-[105px] md:right-auto md:left-[54%] md:top-[8vh] md:w-[190px]",
  "right-[24vw] top-[58vh] w-[150px] hidden lg:block",
  "left-[8%] bottom-[5vh] w-[105px] md:left-auto md:right-[3%] md:bottom-auto md:top-[44vh] md:w-[150px]",
];

/* ---------------------------------------------------------------- */
/* page                                                             */
/* ---------------------------------------------------------------- */

export function HomeExperience() {
  const scope = useRef<HTMLDivElement>(null);
  const cursor = useRef<HTMLDivElement>(null);
  const cursorLabel = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const q = gsap.utils.selector(scope);
      const mm = gsap.matchMedia();

      mm.add(
        {
          motion: "(prefers-reduced-motion: no-preference)",
          fine: "(pointer: fine)",
        },
        (ctx) => {
          const { motion, fine } = ctx.conditions as { motion: boolean; fine: boolean };

          /* ---------- intro ---------- */
          if (motion) {
            const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
            tl.from(q(".hero-title .lab-letter"), {
              yPercent: 120,
              rotation: () => gsap.utils.random(-40, 40),
              opacity: 0,
              duration: 1.3,
              stagger: { each: 0.025, from: "random" },
            })
              .from(
                q("[data-nav]"),
                { scale: 0, rotation: () => gsap.utils.random(-30, 30), duration: 0.9, ease: "back.out(2.2)", stagger: 0.12 },
                0.4
              )
              .from(
                q("[data-specimen]"),
                {
                  y: () => gsap.utils.random(300, 600),
                  x: () => gsap.utils.random(-200, 200),
                  rotation: () => gsap.utils.random(-60, 60),
                  opacity: 0,
                  duration: 1.6,
                  stagger: 0.15,
                },
                0.5
              )
              .from(q("[data-fade]"), { opacity: 0, y: 16, duration: 1, stagger: 0.1 }, 0.9)
              .add(() => q("[data-scramble]").forEach((el: HTMLElement) => scramble(el)), 0.9);

            /* idle drift on the inner wrapper (outer one is draggable) */
            q("[data-drift]").forEach((el: HTMLElement) => {
              gsap.to(el, {
                x: () => gsap.utils.random(-14, 14),
                y: () => gsap.utils.random(-18, 18),
                rotation: () => gsap.utils.random(-5, 5),
                duration: () => gsap.utils.random(3, 5),
                ease: "sine.inOut",
                repeat: -1,
                yoyo: true,
                repeatRefresh: true,
              });
            });

            /* nav labels bob independently */
            q("[data-nav]").forEach((el: HTMLElement, i: number) => {
              gsap.to(el, { y: i % 2 ? 10 : -10, duration: 2.4 + i * 0.4, ease: "sine.inOut", repeat: -1, yoyo: true });
            });
          }

          /* ---------- nav hover: letters jitter ---------- */
          const navHandlers: Array<[HTMLElement, () => void]> = [];
          if (motion) {
            q("[data-nav] a").forEach((a: HTMLElement) => {
              const letters = a.querySelectorAll(".lab-letter");
              const fn = () =>
                gsap.fromTo(
                  letters,
                  { y: 0, rotation: 0 },
                  {
                    y: () => gsap.utils.random(-10, 10),
                    rotation: () => gsap.utils.random(-25, 25),
                    duration: 0.18,
                    stagger: 0.02,
                    yoyo: true,
                    repeat: 1,
                    ease: "power1.inOut",
                  }
                );
              a.addEventListener("mouseenter", fn);
              navHandlers.push([a, fn]);
            });
          }

          /* ---------- draggable specimens ---------- */
          let z = 10;
          const drags = Draggable.create(q("[data-specimen]"), {
            type: "x,y",
            bounds: q("[data-hero]")[0],
            zIndexBoost: false,
            onPress() {
              gsap.set(this.target, { zIndex: ++z });
              gsap.to(this.target, { scale: 1.06, duration: 0.25 });
            },
            onRelease() {
              gsap.to(this.target, { scale: 1, duration: 0.5, ease: "elastic.out(1, 0.5)" });
            },
          });

          /* ---------- scroll story ---------- */
          q("[data-reveal]").forEach((el: HTMLElement) => {
            if (!motion) return;
            gsap.from(el, {
              filter: "blur(14px)",
              opacity: 0,
              y: 50,
              duration: 1.2,
              ease: "power3.out",
              scrollTrigger: { trigger: el, start: "top 85%" },
            });
          });

          q("[data-chapter]").forEach((sec: HTMLElement, i: number) => {
            const dir = i % 2 ? 1 : -1;
            const word = sec.querySelector("[data-word]");
            const fig = sec.querySelector("[data-figure]");
            const tags = sec.querySelectorAll("[data-tag]");
            const paths = sec.querySelectorAll<SVGPathElement>("[data-draw]");
            const caption = sec.querySelector<HTMLElement>("[data-caption]");

            if (motion) {
              gsap.fromTo(
                word,
                { xPercent: 25 * dir },
                {
                  xPercent: -25 * dir,
                  ease: "none",
                  scrollTrigger: { trigger: sec, start: "top bottom", end: "bottom top", scrub: true },
                }
              );
              gsap.fromTo(
                fig,
                { rotation: -9 * dir, y: 80 },
                {
                  rotation: 3 * dir,
                  y: -40,
                  ease: "none",
                  scrollTrigger: { trigger: sec, start: "top bottom", end: "bottom top", scrub: 0.6 },
                }
              );
              gsap.from(tags, {
                scale: 0,
                rotation: () => gsap.utils.random(-50, 50),
                duration: 0.7,
                ease: "back.out(2.5)",
                stagger: 0.12,
                scrollTrigger: { trigger: fig, start: "top 70%" },
              });
              if (caption) {
                ScrollTrigger.create({
                  trigger: caption,
                  start: "top 90%",
                  once: true,
                  onEnter: () => scramble(caption, 0.9),
                });
              }
            }

            paths.forEach((p) => {
              const len = p.getTotalLength();
              gsap.set(p, { strokeDasharray: len, strokeDashoffset: motion ? len : 0 });
              if (motion) {
                gsap.to(p, {
                  strokeDashoffset: 0,
                  ease: "none",
                  scrollTrigger: { trigger: sec, start: "top 75%", end: "center 40%", scrub: true },
                });
              }
            });
          });

          /* outro letters scatter-in */
          if (motion) {
            gsap.from(q(".outro-line .lab-letter"), {
              y: () => gsap.utils.random(-200, 200),
              x: () => gsap.utils.random(-120, 120),
              rotation: () => gsap.utils.random(-90, 90),
              opacity: 0,
              ease: "power3.out",
              stagger: { each: 0.01, from: "random" },
              scrollTrigger: { trigger: q(".outro-line")[0], start: "top 95%", end: "top 45%", scrub: 1 },
            });
          }

          /* ---------- custom cursor ---------- */
          const cursorHandlers: Array<[EventTarget, string, EventListener]> = [];
          if (fine && cursor.current) {
            const c = cursor.current;
            gsap.set(c, { xPercent: -50, yPercent: -50, opacity: 1 });
            const xTo = gsap.quickTo(c, "x", { duration: 0.35, ease: "power3" });
            const yTo = gsap.quickTo(c, "y", { duration: 0.35, ease: "power3" });
            const move = ((e: PointerEvent) => {
              xTo(e.clientX);
              yTo(e.clientY);
            }) as EventListener;
            window.addEventListener("pointermove", move);
            cursorHandlers.push([window, "pointermove", move]);

            q("[data-cursor]").forEach((el: HTMLElement) => {
              const enter = () => {
                if (cursorLabel.current) cursorLabel.current.textContent = el.dataset.cursor ?? "";
                gsap.to(c, { width: 74, height: 74, duration: 0.3 });
              };
              const leave = () => {
                if (cursorLabel.current) cursorLabel.current.textContent = "";
                gsap.to(c, { width: 12, height: 12, duration: 0.3 });
              };
              el.addEventListener("pointerenter", enter);
              el.addEventListener("pointerleave", leave);
              cursorHandlers.push([el, "pointerenter", enter], [el, "pointerleave", leave]);
            });
          }

          return () => {
            drags.forEach((d) => d.kill());
            navHandlers.forEach(([a, fn]) => a.removeEventListener("mouseenter", fn));
            cursorHandlers.forEach(([t, ev, fn]) => t.removeEventListener(ev, fn));
          };
        }
      );
    },
    { scope }
  );

  return (
    <div ref={scope} className="lab relative isolate">
      <LatentField />

      {/* cursor follower (fine pointers only; hidden until GSAP shows it) */}
      <div
        ref={cursor}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[999] flex h-3 w-3 items-center justify-center rounded-full bg-[var(--lab-blue)] text-center font-mono text-[10px] leading-tight text-white opacity-0 mix-blend-difference"
      >
        <span ref={cursorLabel} />
      </div>

      {/* top strip */}
      <header className="fixed inset-x-0 top-0 z-50 flex items-center justify-between bg-[color-mix(in_srgb,var(--lab-paper)_75%,transparent)] px-5 py-3 text-sm backdrop-blur-md">
        <Link href="/" className="font-dot text-lg font-black tracking-tight">
          {hero.name}
        </Link>
        <span className="hidden sm:inline">
          <Clock />
        </span>
        <ThemeSwitch />
      </header>

      {/* ---------------- hero ---------------- */}
      <section data-hero className="relative min-h-[100svh] overflow-hidden px-5 pt-28 pb-[36vh] md:pb-16">
        {nav.map((item, i) => (
          <div
            key={item.href}
            data-nav
            className={`absolute z-20 ${NAV_LAYOUT[i].pos}`}
            style={{ rotate: `${NAV_LAYOUT[i].rot}deg` }}
          >
            <Link
              href={item.href}
              data-cursor="open"
              className="lab-link font-dot text-2xl font-black md:text-4xl"
              style={{ color: NAV_LAYOUT[i].color }}
            >
              <Letters text={item.label} />
            </Link>
          </div>
        ))}

        <h1 className="hero-title relative z-10 mt-[18vh] leading-[0.85] select-none">
          <span className="block font-serif text-[clamp(3.5rem,13vw,12rem)] tracking-[-0.04em]">
            <Letters text={hero.titleWords[0]} />
          </span>
          <span className="block pl-[14vw] font-serif text-[clamp(3.5rem,13vw,12rem)] italic tracking-[-0.04em]">
            <Letters text={hero.titleWords[1]} />
          </span>
          <span className="mt-3 block pl-[38vw] font-dot text-[clamp(1.8rem,5vw,4.5rem)] font-black text-[var(--lab-blue)]">
            <Letters text={hero.titleWords[2]} />
            <span className="lab-cursor-blink">▍</span>
          </span>
        </h1>

        <div className="relative z-10 mt-12 grid max-w-[34rem] gap-4 md:ml-[6vw]">
          <p data-fade className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--lab-muted)]">
            ↳ <span data-scramble>{hero.role}</span>
          </p>
          <p data-fade className="text-lg leading-snug md:text-xl">
            {hero.intro}
          </p>
          <p data-fade>
            <span className="lab-sticker -rotate-2 !bg-[var(--lab-lime)] !text-[#151413]">{hero.status}</span>
          </p>
        </div>

        {chapters.map((c, i) => (
          <div
            key={c.id}
            data-specimen
            data-cursor="drag"
            className={`absolute z-30 cursor-grab touch-none active:cursor-grabbing ${SPECIMEN_LAYOUT[i]}`}
          >
            <div data-drift className="lab-polaroid relative">
              <span className="lab-tape" aria-hidden />
              <Specimen src={c.image} alt={c.alt} id={c.id} />
              <span className="absolute bottom-1.5 left-2 font-mono text-[10px] text-[var(--lab-muted)]">
                #{c.id} · {c.word}
              </span>
            </div>
          </div>
        ))}

        <p
          data-fade
          className="absolute bottom-5 right-5 z-10 max-w-[12rem] text-right font-mono text-[11px] text-[var(--lab-muted)] md:right-auto md:left-1/2 md:max-w-none md:-translate-x-1/2"
        >
          drag the specimens · scroll to train ↓
        </p>
      </section>

      {/* ---------------- story ---------------- */}
      {chapters.map((c, i) => {
        const flip = i % 2 === 1;
        return (
          <section
            key={c.id}
            data-chapter
            aria-labelledby={`chapter-${c.id}`}
            className="relative grid min-h-[110svh] grid-cols-12 items-center gap-y-10 overflow-hidden px-5 py-24"
          >
            <p
              data-word
              aria-hidden
              className={`lab-chapter-word pointer-events-none absolute top-[12%] z-0 opacity-90 ${
                flip ? "right-0 text-[var(--lab-tomato)]" : "left-0 text-[var(--lab-blue)]"
              }`}
            >
              {c.word}
            </p>

            <figure
              data-figure
              className={`relative z-10 col-span-10 col-start-2 sm:col-span-6 md:col-span-4 ${
                flip ? "md:col-start-8" : "md:col-start-2"
              }`}
            >
              <div className="lab-polaroid relative">
                <span className="lab-tape" aria-hidden />
                <Specimen src={c.image} alt={c.alt} id={c.id} />
              </div>
              <figcaption className="mt-3 font-mono text-[11px] text-[var(--lab-muted)]">
                <span data-caption>{c.figure}</span>
              </figcaption>
              {c.tags.map((t, j) => (
                <span
                  key={t}
                  data-tag
                  className="lab-sticker absolute z-20"
                  style={{
                    top: `${18 + j * 26}%`,
                    [flip ? "left" : "right"]: `calc(${-18 - (j % 2) * 12}% * var(--tag-k))`,
                    rotate: `${(j - 1) * 7}deg`,
                  }}
                >
                  {t}
                </span>
              ))}
            </figure>

            <div
              className={`relative z-10 col-span-10 col-start-2 md:col-span-4 ${
                flip ? "md:col-start-2 md:row-start-1" : "md:col-start-8"
              }`}
            >
              <p data-reveal className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--lab-muted)]">
                {c.kicker}
              </p>
              <h2 id={`chapter-${c.id}`} data-reveal className="mt-3 font-serif text-5xl italic leading-none md:text-6xl">
                {c.id} — {c.word}
              </h2>
              <p data-reveal className="mt-5 text-lg leading-snug">
                {c.body}
              </p>

              {/* hand-drawn annotations, drawn as you scroll */}
              {i === 1 ? (
                <svg viewBox="0 0 320 140" className="mt-8 w-full max-w-sm" aria-label="A loss curve decreasing over training steps" role="img">
                  <path d="M10 10 V130 H310" fill="none" stroke="currentColor" strokeOpacity=".35" strokeWidth="1" />
                  <path
                    data-draw
                    d="M12 22 C 40 30, 52 80, 80 84 S 110 70, 128 96 S 170 108, 196 112 S 250 118, 306 121"
                    fill="none"
                    stroke="var(--lab-tomato)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <text x="14" y="138" className="fill-current font-mono text-[9px] opacity-60">steps →</text>
                  <text x="16" y="14" className="fill-current font-mono text-[9px] opacity-60">loss</text>
                </svg>
              ) : (
                <svg viewBox="0 0 200 90" className={`mt-8 w-40 ${flip ? "" : "-scale-x-100"}`} aria-hidden>
                  <path
                    data-draw
                    d="M190 10 C 150 60, 90 80, 20 60 M20 60 l 14 -14 M20 60 l 18 8"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
          </section>
        );
      })}

      {/* ---------------- outro ---------------- */}
      <section className="relative px-5 pt-24 pb-10">
        <p className="outro-line font-serif text-[clamp(3rem,11vw,10rem)] italic leading-[0.85] tracking-[-0.04em]">
          <Letters text={outro.line} />
        </p>
        <nav aria-label="Sections" className="mt-12 flex flex-wrap items-baseline gap-x-10 gap-y-4">
          {nav.map((item, i) => (
            <Link
              key={item.href}
              href={item.href}
              data-cursor="open"
              className="lab-link font-dot text-3xl font-black md:text-5xl"
              style={{ color: NAV_LAYOUT[i].color, rotate: `${NAV_LAYOUT[i].rot / 2}deg` }}
            >
              {item.label}
            </Link>
          ))}
          <a href={outro.email} data-cursor="say hi" className="lab-link font-mono text-sm">
            say hello ↗
          </a>
        </nav>
        <p className="mt-24 flex justify-between font-mono text-[11px] text-[var(--lab-muted)]">
          <span>© {new Date().getFullYear()} {hero.name}</span>
          <span>built with next.js + gsap</span>
        </p>
      </section>
    </div>
  );
}
