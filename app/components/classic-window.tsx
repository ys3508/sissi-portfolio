"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { me } from "app/lib/desktop-content";

const NAV = [
  { href: "/", label: "Desktop" },
  { href: "/blog", label: "Blog" },
  { href: "/projects", label: "Projects" },
  { href: "/photos", label: "Photos" },
];

export function ClassicWindow({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const section = pathname.split("/").filter(Boolean);

  return (
    <div className="classic__win">
      <header className="classic__bar">
        <img src="/desktop/projects.webp" alt="" />
        <span>{section.at(-1) ?? "home"} - Explorer</span>
        <Link href="/" aria-label="Close and return to the desktop">
          <span aria-hidden>×</span>
        </Link>
      </header>
      <nav className="classic__menu" aria-label="Site">
        {NAV.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            aria-current={href !== "/" && pathname.startsWith(href) ? "page" : undefined}
          >
            {label}
          </Link>
        ))}
      </nav>
      <div className="classic__address">
        <span>Address</span>
        <code>C:\{[me.handle, ...section].join("\\")}</code>
      </div>
      <main className="classic__page">{children}</main>
      <footer className="classic__status">
        <span>© {new Date().getFullYear()} {me.name}</span>
        <a href="/rss.xml">RSS</a>
      </footer>
    </div>
  );
}
