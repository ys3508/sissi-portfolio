"use client";

import { useEffect, useRef, useState } from "react";
import { links, me } from "app/lib/desktop-content";

const APPS = ["about", "projects", "lab", "photos", "music"] as const;
type Line = { kind: "in" | "out"; text: string };

export function Terminal({
  onOpen,
  onCompliment,
  onExit,
}: {
  onOpen: (app: (typeof APPS)[number]) => void;
  onCompliment: () => void;
  onExit: () => void;
}) {
  const prompt = `${me.handle}@pink98 ~ %`;
  const [lines, setLines] = useState<Line[]>([
    { kind: "out", text: `pink98 terminal. type "help" to look around.` },
  ]);
  const [value, setValue] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    end.current?.scrollIntoView({ block: "nearest" });
  }, [lines]);

  function run(raw: string) {
    const [cmd, ...args] = raw.trim().split(/\s+/);
    const arg = args.join(" ");
    const say = (...text: string[]) => text.map((t): Line => ({ kind: "out", text: t }));
    let out: Line[] = [];

    switch (cmd?.toLowerCase()) {
      case "":
      case undefined:
        break;
      case "help":
        out = say(
          "whoami          who lives here",
          "ls              what's on the desktop",
          "cat about.txt   read the about file",
          "open <app>      about, projects, lab, photos, music",
          "links           where else to find me",
          "meow            important",
          "clear           tidy up",
          "exit            close this window",
        );
        break;
      case "whoami":
        out = say(`${me.name} · ${me.role}`, me.tagline);
        break;
      case "ls":
        out = say(APPS.map((a) => `${a}/`).join("  "), "about.txt  kitten.exe");
        break;
      case "cat":
        out = arg === "about.txt" ? say(me.intro, me.status) : say(`cat: ${arg || "?"}: try about.txt`);
        break;
      case "open":
        if ((APPS as readonly string[]).includes(arg)) {
          onOpen(arg as (typeof APPS)[number]);
          out = say(`opening ${arg}...`);
        } else {
          out = say(`open: no such app. try: ${APPS.join(", ")}`);
        }
        break;
      case "links":
        out = links.length ? say(...links.map((l) => `${l.label}: ${l.href}`)) : say("coming soon.");
        break;
      case "meow":
      case "kitten.exe":
        out = say("  /\\_/\\  ", " ( o.o ) mrrp", "  > ^ <  ");
        break;
      case "date":
        out = say(new Date().toString());
        break;
      case "sudo":
        onCompliment();
        out = say("permission granted: you are beautiful.");
        break;
      case "clear":
        setLines([]);
        return;
      case "exit":
        onExit();
        return;
      default:
        out = say(`command not found: ${cmd}. try "help".`);
    }
    setLines((l) => [...l, { kind: "in", text: raw }, ...out]);
  }

  return (
    <div className="term" onClick={() => input.current?.focus()}>
      {lines.map((line, i) => (
        <p key={i} className={line.kind === "in" ? "term__in" : undefined}>
          {line.kind === "in" ? `${prompt} ${line.text}` : line.text}
        </p>
      ))}
      <form
        className="term__row"
        onSubmit={(e) => {
          e.preventDefault();
          run(value);
          setValue("");
        }}
      >
        <label htmlFor="term-input">{prompt}</label>
        <input
          id="term-input"
          ref={input}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          autoFocus
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
        />
      </form>
      <div ref={end} />
    </div>
  );
}
