"use client";

import { useState } from "react";
import Link from "next/link";
import { me, photos } from "app/lib/desktop-content";
import { projects } from "app/(site)/projects/project-data";

export function About() {
  return (
    <div className="notepad">
      <div className="notepad__menu" aria-hidden>
        <span>File</span>
        <span>Edit</span>
        <span>Help</span>
      </div>
      <div className="notepad__page">
        <img src="/desktop/cat.webp" alt="Kitten wearing headphones, lifting a tiny barbell" className="notepad__cat" />
        <h3>hi, i&apos;m {me.name} ♡</h3>
        <p>{me.intro}</p>
        <p className="notepad__status">{me.status}</p>
      </div>
    </div>
  );
}

export function Projects({ onOpenSetup }: { onOpenSetup: () => void }) {
  return (
    <div className="explorer">
      <div className="explorer__address">
        <span>Address</span>
        <code>C:\{me.handle}\projects</code>
      </div>
      <ul className="list">
        {projects.map((p) => {
          const row = (
            <>
              <span className="list__main">
                <img src={p.icon ?? "/desktop/projects.webp"} alt="" />
                <span>
                  <strong>{p.title}</strong>
                  <small>{p.description}</small>
                </span>
              </span>
              <span className="list__meta">{p.year}</span>
            </>
          );
          return (
            <li key={p.title}>
              {p.hasSetup ? (
                <button type="button" className="list__row" onClick={onOpenSetup}>
                  {row}
                </button>
              ) : (
                <a className="list__row" href={p.url} target="_blank" rel="noreferrer">
                  {row}
                </a>
              )}
            </li>
          );
        })}
      </ul>
      <p className="statusbar">
        {projects.length} {projects.length === 1 ? "object" : "objects"} · <Link href="/projects">open classic view</Link>
      </p>
    </div>
  );
}

export function Photos() {
  const [open, setOpen] = useState<number | null>(null);

  if (open !== null) {
    const photo = photos[open];
    const go = (by: number) => setOpen((open + by + photos.length) % photos.length);
    return (
      <div className="viewer">
        <img src={photo.src} alt={photo.alt} />
        <div className="viewer__bar">
          <button type="button" className="btn" onClick={() => setOpen(null)}>
            ← all
          </button>
          <span>{photo.alt}</span>
          <span className="viewer__nav">
            <button type="button" className="btn" aria-label="Previous photo" onClick={() => go(-1)}>
              ◀
            </button>
            <button type="button" className="btn" aria-label="Next photo" onClick={() => go(1)}>
              ▶
            </button>
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="wall">
      {photos.map((photo, i) => (
        <button
          type="button"
          key={photo.src}
          className="wall__print"
          style={{ rotate: `${[-4, 3, -2, 5, -3, 2, 4, -5, 1][i % 9]}deg` }}
          onClick={() => setOpen(i)}
        >
          <img src={photo.src} alt={photo.alt} loading="lazy" draggable={false} />
        </button>
      ))}
    </div>
  );
}
