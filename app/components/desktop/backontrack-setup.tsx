"use client";

import { useEffect, useRef, useState } from "react";

const LIVE_URL = "https://backontrack-peach.vercel.app";
const REPO_URL = "https://github.com/ys3508/BackOnTrack";
const FOCUS_SECONDS = 30;

type Avoided = "email" | "deadline" | "project";
type Obstacle = "start" | "begin" | "worry" | "time";
type Plan = {
  action: string;
  minutes: string;
  gap?: { known: string; worry: string; unknown: string };
};

const AVOIDED: { id: Avoided; label: string }[] = [
  { id: "email", label: "An unanswered email" },
  { id: "deadline", label: "A missed deadline" },
  { id: "project", label: "An unfinished project" },
];

const OBSTACLES: { id: Obstacle; label: string }[] = [
  { id: "start", label: "I know what to do, but I can't start" },
  { id: "begin", label: "I don't know where to begin" },
  { id: "worry", label: "I'm worried about the outcome or someone's reaction" },
  { id: "time", label: "I don't have enough time anymore" },
];

const PLANS: Record<Avoided, Record<Obstacle, Plan>> = {
  email: {
    start: { action: "Open the email. You don't have to reply yet.", minutes: "about 2 min" },
    begin: { action: "Write one line: what does this person need from you?", minutes: "about 2 min" },
    worry: {
      action: "Send one line saying you saw it and when you'll reply.",
      minutes: "about 5 min",
      gap: {
        known: "The email is still unanswered.",
        worry: "They're annoyed with me.",
        unknown: "Whether they've noticed the delay.",
      },
    },
    time: { action: "Reduce it: send two lines now. The full answer can come later.", minutes: "about 5 min" },
  },
  deadline: {
    start: { action: "Open what was due. Just look at how much is left.", minutes: "about 2 min" },
    begin: { action: "Write down what has to be handed in, in one sentence.", minutes: "about 3 min" },
    worry: {
      action: "Find the late-work policy, or draft a one-line question about it.",
      minutes: "about 5 min",
      gap: {
        known: "The date has passed.",
        worry: "It's too late to do anything.",
        unknown: "Whether late work is accepted.",
      },
    },
    time: { action: "Reduce it: write down the smallest version you could still hand in.", minutes: "about 5 min" },
  },
  project: {
    start: { action: "Open the file and change one small thing.", minutes: "about 2 min" },
    begin: { action: "Find where you stopped. Write the next step as one sentence.", minutes: "about 3 min" },
    worry: {
      action: "Pick one finished part you could show one person.",
      minutes: "about 5 min",
      gap: {
        known: "It isn't finished yet.",
        worry: "It isn't good enough.",
        unknown: "What anyone else would think of it.",
      },
    },
    time: { action: "Choose one: finish it, shrink it, or release it from your list.", minutes: "about 2 min" },
  },
};

const SMALLER: Record<Avoided, string> = {
  email: "Smaller, then: open your inbox and find the email. Don't read it yet.",
  deadline: "Smaller, then: find the file or page. Just get it on your screen.",
  project: "Smaller, then: open the folder. You don't have to open the file yet.",
};

const LOOP = ["Plan", "Don't do it", "Feel pressure", "Avoid the app", "Tasks pile up", "Harder to restart"];

const ERROR_REPLIES = {
  harder: "Try Harder was already tried. That's how we got here.",
  close: "Closing the program doesn't close the deadline.",
};

const VERSIONS = [
  {
    id: "v1",
    tab: "v1",
    name: "AI Recovery Assistant",
    image: "/desktop/backontrack/v1.webp",
    alt: "BackOnTrack version 1 showing a single suggested step",
    what: "A five-step guided workflow: Reality Check, a decision, one step at a time, and a summary.",
    limit: "It advised people, but left them with nothing to act on or return to.",
  },
  {
    id: "v2",
    tab: "v2",
    name: "Productivity workspace",
    image: "/desktop/backontrack/v2.webp",
    alt: "BackOnTrack version 2 workspace with one next task and quick add",
    what: "Persistent tasks, a calendar, a focus timer, and recovery plans.",
    limit: "It could organize work, but the work itself still happened elsewhere.",
  },
  {
    id: "v3",
    tab: "v3",
    name: "AI-assisted task execution",
    image: "/desktop/backontrack/v3.webp",
    alt: "BackOnTrack version 3 task page with steps, a timer and a working document",
    what: "Each task opens with its instructions, editable steps, a working document, and writing help.",
    limit: "Steps were still too abstract: “train classifier” gives no way in.",
  },
  {
    id: "now",
    tab: "now",
    name: "Failure-aware action system",
    image: "/desktop/backontrack/now.webp",
    alt: "The current BackOnTrack home page: Everyone falls off. Come back.",
    what: "Plan → Start → Get Stuck → Recover → Continue. Today shows one next action, and a way back after time away.",
    limit: "Whether this really helps on real work is still untested.",
  },
];

const STEPS = ["Welcome", "Error", "Try it", "Version history", "README.txt", "Finish"];

function Choice<T extends string>({
  name,
  options,
  value,
  onChange,
}: {
  name: string;
  options: { id: T; label: string }[];
  value: T | null;
  onChange: (id: T) => void;
}) {
  return (
    <div className="setup__choices" role="radiogroup">
      {options.map((option) => (
        <label key={option.id} className="setup__choice">
          <input type="radio" name={name} checked={value === option.id} onChange={() => onChange(option.id)} />
          <span>{option.label}</span>
        </label>
      ))}
    </div>
  );
}

function FocusTimer({ onReset }: { onReset: () => void }) {
  const [startedAt] = useState(() => Date.now());
  const [elapsed, setElapsed] = useState(0);
  const done = elapsed >= FOCUS_SECONDS;

  useEffect(() => {
    if (done) return;
    const timer = window.setInterval(() => setElapsed((Date.now() - startedAt) / 1000), 250);
    return () => window.clearInterval(timer);
  }, [done, startedAt]);

  const left = Math.max(0, Math.ceil(FOCUS_SECONDS - elapsed));
  const filled = Math.min(1, elapsed / FOCUS_SECONDS);

  return (
    <div className="setup__timer">
      <div className="setup__lcd" role="timer" aria-label={`${left} seconds left`}>
        00:{String(left).padStart(2, "0")}
      </div>
      <div className="setup__bar setup__bar--wide" aria-hidden>
        <span style={{ width: `${filled * 100}%` }} />
      </div>
      {done ? (
        <p aria-live="polite">Time's up. You started, and that's all this step asks.</p>
      ) : (
        <p>Thirty seconds. Nothing else is on the list.</p>
      )}
      <button type="button" className="btn btn--wide" onClick={onReset}>
        {done ? "Pick another" : "Stop"}
      </button>
    </div>
  );
}

function TryIt({ avoided }: { avoided: Avoided }) {
  const [obstacle, setObstacle] = useState<Obstacle | null>(null);
  const [stuck, setStuck] = useState(false);
  const [running, setRunning] = useState(false);
  const plan = obstacle && PLANS[avoided][obstacle];

  const pick = (id: Obstacle) => {
    setObstacle(id);
    setStuck(false);
    setRunning(false);
  };

  return (
    <>
      <h3>What's making this difficult right now?</h3>
      <Choice name="bot-obstacle" options={OBSTACLES} value={obstacle} onChange={pick} />

      {plan && (
        <div className="setup__plan" aria-live="polite">
          <p className="setup__kicker">
            {stuck ? "A different, smaller way in" : "Your Plan B"} · {stuck ? "under a minute" : plan.minutes}
          </p>
          {plan.gap && !stuck && (
            <dl className="setup__gap">
              <dt>Known</dt>
              <dd>{plan.gap.known}</dd>
              <dt>Worry</dt>
              <dd>{plan.gap.worry}</dd>
              <dt>Unknown</dt>
              <dd>{plan.gap.unknown}</dd>
            </dl>
          )}
          <p className="setup__action">{stuck ? SMALLER[avoided] : plan.action}</p>
          {running ? (
            <FocusTimer onReset={() => setRunning(false)} />
          ) : (
            <div className="setup__row">
              <button type="button" className="btn btn--wide" onClick={() => setRunning(true)}>
                ▶ Start
              </button>
              {!stuck && (
                <button type="button" className="btn btn--wide" onClick={() => setStuck(true)}>
                  I'm still stuck
                </button>
              )}
            </div>
          )}
        </div>
      )}

      <p className="setup__note">Interactive concept preview. This isn't the actual BackOnTrack engine.</p>
    </>
  );
}

function VersionHistory() {
  const [id, setId] = useState(VERSIONS[0].id);
  const version = VERSIONS.find((v) => v.id === id) ?? VERSIONS[0];

  return (
    <>
      <h3>Not the first draft.</h3>
      <div className="setup__tabs" role="tablist" aria-label="BackOnTrack versions">
        {VERSIONS.map((v) => (
          <button
            type="button"
            role="tab"
            key={v.id}
            aria-selected={v.id === id}
            className={`setup__tab${v.id === id ? " setup__tab--on" : ""}`}
            onClick={() => setId(v.id)}
          >
            {v.tab}
          </button>
        ))}
      </div>
      <div className="setup__sheet" role="tabpanel">
        <img src={version.image} alt={version.alt} draggable={false} />
        <div>
          <h4>{version.name}</h4>
          <p>{version.what}</p>
          <p className="setup__limit">
            <b>! Known issue:</b> {version.limit}
          </p>
        </div>
      </div>
    </>
  );
}

function Readme() {
  return (
    <div className="setup__readme">
      <p>BACKONTRACK README.TXT</p>
      <p>=====================</p>
      <h4>[what the AI does]</h4>
      <p>
        Live AI is optional. It writes recovery plans, breakdowns, and writing help. Everything else works without it.
        The public demo needs no account or key: its suggestions are prewritten templates, and they're labeled that way.
      </p>
      <h4>[what the AI doesn't do]</h4>
      <p>
        Task order and daily plans use fixed rules, because they have to be explainable, instant, and free. Session
        summaries are built from recorded data, so a model can't claim work that didn't happen.
      </p>
      <h4>[the bug that was really a design problem]</h4>
      <p>
        “I haven't finished my homework for a long time” produced “Write the part of this that matters most, in a single
        line.” That still leaves the person to work out what to do. Steps now have to produce something concrete, and
        repeating “I'm stuck” makes the next step smaller.
      </p>
      <h4>[how it was made]</h4>
      <p>
        Built with Claude Code from my brief, as a prototype for the AI Lab in AIML-500: Machine Learning Fundamentals at
        Indiana Wesleyan University. Next.js, TypeScript, and the Vercel AI SDK. Not a commercial product.
      </p>
      <h4>[known limitations]</h4>
      <p>
        No user study has been run, and its effect hasn't been measured. It isn't a treatment for ADHD or anything else.
        Data stays in one browser, with no sync between devices.
      </p>
      <h4>[next]</h4>
      <p>Test it with other people, on real unfinished work. Measure the time from opening the app to starting.</p>
    </div>
  );
}

export function BackOnTrackSetup({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const [avoided, setAvoided] = useState<Avoided | null>(null);
  const [reply, setReply] = useState<keyof typeof ERROR_REPLIES | null>(null);
  const page = useRef<HTMLDivElement>(null);
  const last = STEPS.length - 1;

  const go = (to: number) => {
    setStep(to);
    setReply(null);
  };

  useEffect(() => {
    page.current?.scrollTo(0, 0);
  }, [step]);

  return (
    <div className="setup">
      <div className="setup__main">
        <aside className="setup__banner" aria-hidden>
          <p>
            Back
            <br />
            On
            <br />
            Track
          </p>
          <small>case study 001</small>
          <img src="/desktop/horse.webp" alt="" draggable={false} />
        </aside>

        <div className="setup__page" ref={page}>
          {step === 0 && (
            <>
              <p className="setup__kicker">Welcome to the BackOnTrack Setup Wizard</p>
              <h3 className="setup__big">You've been avoiding something.</h3>
              <p>Maybe it's an email, an application, or something you promised yourself you'd finish.</p>
              <p className="setup__ask">What's been on your mind?</p>
              <Choice<Avoided> name="bot-avoided" options={AVOIDED} value={avoided} onChange={setAvoided} />
              <p className="setup__note">Click Next to continue. You can skip this: no judgment, it's that kind of app.</p>
            </>
          )}

          {step === 1 && (
            <>
              <div className="setup__error" role="group" aria-label="plan.exe error">
                <p className="setup__error-bar">plan.exe</p>
                <div className="setup__error-body">
                  <span className="setup__error-icon" aria-hidden>
                    ×
                  </span>
                  <p>
                    <b>plan.exe has stopped responding.</b>
                    <br />
                    Productivity tools are great at planning. But what happens when we don't follow the plan?
                  </p>
                </div>
                <div className="setup__row setup__row--end">
                  <button type="button" className="btn" onClick={() => setReply("harder")}>
                    Try Harder
                  </button>
                  <button type="button" className="btn" onClick={() => setReply("close")}>
                    Close Program
                  </button>
                  <button type="button" className="btn setup__default" onClick={() => go(2)}>
                    Back On Track
                  </button>
                </div>
                {reply && (
                  <p className="setup__reply" aria-live="polite">
                    {ERROR_REPLIES[reply]}
                  </p>
                )}
              </div>
              <p className="setup__ask">The loop it's built for:</p>
              <ol className="setup__loop">
                {LOOP.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ol>
              <p>
                BackOnTrack is an experiment in designing for the moments when productivity breaks down. Most task
                managers ask what you need to do. This one keeps asking what's realistic now, given what happened.
              </p>
            </>
          )}

          {step === 2 && <TryIt avoided={avoided ?? "email"} />}
          {step === 3 && <VersionHistory />}
          {step === 4 && <Readme />}

          {step === 5 && (
            <>
              <p className="setup__kicker">Completing the BackOnTrack Setup Wizard</p>
              <h3 className="setup__big">Setup complete. Well, almost.</h3>
              <p>It's still a work in progress. The real thing is one click away.</p>
              <div className="setup__row setup__row--links">
                <a className="btn btn--wide setup__default" href={LIVE_URL} target="_blank" rel="noreferrer">
                  ▶ Launch BackOnTrack
                </a>
                <a className="btn btn--wide" href={REPO_URL} target="_blank" rel="noreferrer">
                  View on GitHub
                </a>
              </div>
              <p className="setup__note">The public site runs in Demo Mode, with no account or API key.</p>
            </>
          )}
        </div>
      </div>

      <footer className="setup__foot">
        <div className="setup__progress">
          <span>
            Step {step + 1} of {STEPS.length}: {STEPS[step]}
          </span>
          <div className="setup__bar" aria-hidden>
            <span style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
          </div>
        </div>
        <div className="setup__nav">
          <button type="button" className="btn btn--wide" disabled={step === 0} onClick={() => go(step - 1)}>
            &lt; Back
          </button>
          {step === last ? (
            <button type="button" className="btn btn--wide setup__default" onClick={onClose}>
              Finish
            </button>
          ) : (
            <button type="button" className="btn btn--wide setup__default" onClick={() => go(step + 1)}>
              Next &gt;
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}
