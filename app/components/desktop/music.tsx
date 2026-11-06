"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { tracks } from "app/lib/desktop-content";

const NOTE: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

function toFreq(token: string) {
  const midi = NOTE[token[0]] + (Number(token[1]) + 1) * 12;
  return 440 * 2 ** ((midi - 69) / 12);
}

function blip(ctx: AudioContext, out: AudioNode, token: string, wave: OscillatorType, at: number, len: number, level: number) {
  if (token === ".") return;
  const osc = ctx.createOscillator();
  const env = ctx.createGain();
  osc.type = wave;
  osc.frequency.value = toFreq(token);
  env.gain.setValueAtTime(level, at);
  env.gain.exponentialRampToValueAtTime(0.0001, at + len);
  osc.connect(env).connect(out);
  osc.start(at);
  osc.stop(at + len);
}

export function Music() {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [step, setStep] = useState(0);
  const ctxRef = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);

  useEffect(() => {
    if (masterRef.current) masterRef.current.gain.value = volume * 0.3;
  }, [volume]);

  // Lookahead sequencer: schedules notes slightly ahead of the audio clock.
  useEffect(() => {
    if (!playing) return;
    const ctx = ctxRef.current;
    const master = masterRef.current;
    if (!ctx || !master) return;
    const track = tracks[index];
    const lead = track.lead.split(" ");
    const bass = track.bass.split(" ");
    const dur = 60 / track.bpm / 4;
    let n = 0;
    let next = ctx.currentTime + 0.05;
    const timer = window.setInterval(() => {
      while (next < ctx.currentTime + 0.12) {
        blip(ctx, master, lead[n % lead.length], track.wave, next, dur * 1.8, 0.5);
        blip(ctx, master, bass[n % bass.length], "triangle", next, dur * 2.5, 0.7);
        setStep(n);
        n += 1;
        next += dur;
      }
    }, 25);
    return () => window.clearInterval(timer);
  }, [playing, index]);

  useEffect(
    () => () => {
      ctxRef.current?.close();
    },
    [],
  );

  const toggle = useCallback(async () => {
    if (!ctxRef.current) {
      const ctx = new AudioContext();
      const master = ctx.createGain();
      master.gain.value = volume * 0.3;
      master.connect(ctx.destination);
      ctxRef.current = ctx;
      masterRef.current = master;
    }
    await ctxRef.current.resume();
    setPlaying((p) => !p);
  }, [volume]);

  const skip = (by: number) => {
    setIndex((i) => (i + by + tracks.length) % tracks.length);
    setStep(0);
  };

  const track = tracks[index];
  const length = track.lead.split(" ").length;

  return (
    <div className="music">
      <div className="music__deck">
        <img
          src="/desktop/cd.webp"
          alt="Stickered mixtape CD"
          className={`music__cd${playing ? " music__cd--spin" : ""}`}
          draggable={false}
        />
        <div className="music__lcd">
          <p className="music__now">{playing ? "▶ now playing" : "■ stopped"}</p>
          <p className="music__title">{track.title}</p>
          <div className="music__bars" aria-hidden>
            {Array.from({ length: 16 }, (_, i) => (
              <span
                key={i}
                style={{
                  height: playing ? `${20 + (((step + 3) * (i + 7) * 13) % 80)}%` : "8%",
                }}
              />
            ))}
          </div>
          <div className="music__progress" aria-hidden>
            <span style={{ width: `${((step % length) / length) * 100}%` }} />
          </div>
        </div>
      </div>
      <div className="music__controls">
        <button type="button" className="btn" aria-label="Previous track" onClick={() => skip(-1)}>
          |◀
        </button>
        <button type="button" className="btn btn--wide" onClick={toggle}>
          {playing ? "❚❚ pause" : "▶ play"}
        </button>
        <button type="button" className="btn" aria-label="Next track" onClick={() => skip(1)}>
          ▶|
        </button>
        <label className="music__volume">
          vol
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
          />
        </label>
      </div>
      <ul className="list music__list">
        {tracks.map((t, i) => (
          <li key={t.title}>
            <button
              type="button"
              className={`list__row${i === index ? " list__row--on" : ""}`}
              onClick={() => {
                setIndex(i);
                setStep(0);
              }}
            >
              <span>♪ {t.title}</span>
              <span className="list__meta">{t.bpm} bpm</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
