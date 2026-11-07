"use client";

import { useState } from "react";
import Link from "next/link";
import { me, photos } from "app/lib/desktop-content";
import { projects } from "app/(site)/projects/project-data";

export type PostLink = { slug: string; title: string; date: string };

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
        {projects.length} objects · <Link href="/projects">open classic view</Link>
      </p>
    </div>
  );
}

export function Writing({ posts }: { posts: PostLink[] }) {
  return (
    <div className="explorer">
      <div className="explorer__address">
        <span>Address</span>
        <code>C:\{me.handle}\love_letters</code>
      </div>
      <ul className="list">
        {posts.map((p) => (
          <li key={p.slug}>
            <Link className="list__row" href={`/blog/${p.slug}`}>
              <span className="list__main">
                <img src="/desktop/bunny.webp" alt="" />
                <strong>{p.title}.txt</strong>
              </span>
              <span className="list__meta">{p.date}</span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="statusbar">
        {posts.length} letters · <Link href="/blog">open classic view</Link>
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

export function Beautiful({ onDone }: { onDone: () => void }) {
  const [dodges, setDodges] = useState(0);
  const [hearts, setHearts] = useState(false);

  const yes = () => {
    setHearts(true);
    window.setTimeout(onDone, 900);
  };

  return (
    <div className="alert">
      <div className="alert__row">
        <span className="alert__icon" aria-hidden>
          ?
        </span>
        <div>
          <p>{dodges > 2 ? "That wasn't a real question." : "You are beautiful."}</p>
          <p>(ﾉ◕ヮ◕)ﾉ*:･ﾟ✧</p>
        </div>
      </div>
      <div className="alert__buttons">
        <button type="button" className="btn btn--wide" onClick={yes}>
          <u>Y</u>es
        </button>
        <button
          type="button"
          className="btn btn--wide"
          style={{
            translate: dodges ? `${((dodges * 67) % 90) - 90}px ${dodges % 2 ? -30 : 0}px` : undefined,
          }}
          onClick={() => setDodges((d) => d + 1)}
        >
          <u>N</u>o
        </button>
      </div>
      {hearts && (
        <div className="alert__hearts" aria-hidden>
          {Array.from({ length: 14 }, (_, i) => (
            <span
              key={i}
              style={{
                left: `${(i * 37) % 100}%`,
                animationDelay: `${(i % 5) * 60}ms`,
              }}
            >
              ♥
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
