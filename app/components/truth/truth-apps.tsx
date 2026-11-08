"use client";

import { useState } from "react";
import { CASE_META, CLAIMS, REFLECTION_ENDINGS, SITUATIONS, SOURCES, STATUS_LABEL } from "./truth-data";
import type { CaseId, Choice, ClaimStatus, InvestigationCaseId, Source } from "./truth-data";
import { useOs } from "./truth-os-context";
import type { TruthAppId } from "./truth-os-context";
import { ALL_CASES, INVESTIGATION_IDS, caseName, reflection, summarize, useGame } from "./truth-state";

const STATUSES = Object.keys(STATUS_LABEL) as ClaimStatus[];

/* ---------- case files ---------- */

export function CaseFiles() {
  const { open } = useOs();
  const { state } = useGame();
  const next = ALL_CASES.find((id) => !state.cases[id]?.done);
  return (
    <div className="t-app">
      <div className="t-row t-row--between t-toolbar">
        <span className="t-sys">C:\TRUTH\CASE_FILES · {ALL_CASES.filter((id) => state.cases[id]?.done).length}/6 CLOSED</span>
        <button type="button" className="btn t-primary" onClick={() => open(next ? (`case${next}` as TruthAppId) : "reflection")}>
          {next ? `Open next: Case ${String(next).padStart(2, "0")}` : "See my reflection"}
        </button>
      </div>
      <ul className="t-files">
        {ALL_CASES.map((id) => {
          const r = state.cases[id];
          return (
            <li key={id}>
              <button type="button" className="t-file" onClick={() => open(`case${id}` as TruthAppId)}>
                <span className="t-file__icon" aria-hidden>
                  {String(id).padStart(2, "0")}
                </span>
                <span>
                  <b>{CASE_META[id].title}</b>
                  <small>
                    {CASE_META[id].file} · {CASE_META[id].topic}
                  </small>
                </span>
                <span className={`t-stamp${r?.done ? " t-stamp--done" : ""}`}>{r?.done ? "CLOSED" : r ? "OPEN" : "NEW"}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ---------- evidence explorer ---------- */

export function EvidenceExplorer() {
  const { evidenceCase, setEvidenceCase, beep } = useOs();
  const { state, guess, log } = useGame();
  const caseId = (INVESTIGATION_IDS.includes(evidenceCase as InvestigationCaseId) ? evidenceCase : 1) as InvestigationCaseId;
  const claims = CLAIMS.filter((c) => c.caseId === caseId);

  return (
    <div className="t-app t-evidence">
      <div className="t-tabs" role="tablist" aria-label="Case">
        {INVESTIGATION_IDS.map((id) => (
          <button type="button" role="tab" key={id} aria-selected={id === caseId} className={`t-tab${id === caseId ? " t-tab--on" : ""}`} onClick={() => setEvidenceCase(id)}>
            Case {String(id).padStart(2, "0")}
          </button>
        ))}
      </div>
      <p className="t-small">
        Pick what you think each claim is before you reveal the evidence. Verification isn&apos;t only right or wrong: some claims are true but
        incomplete, and some can&apos;t be settled at all.
      </p>
      <div className="t-claims">
        {claims.map((c) => {
          const guessed = state.guesses[c.id];
          return (
            <article key={c.id} id={`claim-${c.id}`} className={`t-evcard${guessed ? " t-evcard--open" : ""}`}>
              <p className="t-sys">CLAIM {c.id.toUpperCase()}</p>
              <blockquote>“{c.statement}”</blockquote>
              {!guessed ? (
                <div className="t-row" role="group" aria-label="What is this claim?">
                  {STATUSES.map((s) => (
                    <button
                      type="button"
                      key={s}
                      className="btn t-mini"
                      onClick={() => {
                        guess(c.id, s);
                        beep(s === c.status ? "done" : "click");
                        log(`Evidence: marked claim ${c.id.toUpperCase()} as ${STATUS_LABEL[s]}; the file says ${STATUS_LABEL[c.status]}`);
                      }}
                    >
                      {STATUS_LABEL[s]}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="t-evbody">
                  <p>
                    <span className={`t-status t-status--${c.status}`}>{STATUS_LABEL[c.status]}</span>{" "}
                    <small>You said: {STATUS_LABEL[guessed]}</small>
                  </p>
                  <p className="t-quote">{c.evidence}</p>
                  <dl className="t-meta">
                    <dt>Source</dt>
                    <dd>
                      {c.source.url ? (
                        <a href={c.source.url} target="_blank" rel="noreferrer">
                          {c.source.title}
                        </a>
                      ) : (
                        c.source.title
                      )}
                    </dd>
                    <dt>Type</dt>
                    <dd>{c.source.type}</dd>
                    {c.source.date && (
                      <>
                        <dt>Date</dt>
                        <dd>{c.source.date}</dd>
                      </>
                    )}
                  </dl>
                  <p>{c.finding}</p>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- trust monitor ---------- */

const CHOICE_LABEL: Record<Choice, string> = { trust: "Trust", verify: "Verify", escalate: "Ask a human" };
const CHOICE_MARK: Record<Choice, string> = { trust: "T", verify: "V", escalate: "H" };

export function TrustMonitor() {
  const { state, reset, log } = useGame();
  const s = summarize(state);
  const finals = s.trust + s.verify + s.escalate;
  const bars: [Choice, number][] = [
    ["trust", s.trust],
    ["verify", s.verify],
    ["escalate", s.escalate],
  ];

  return (
    <div className="t-app t-monitor">
      <div className="t-stats">
        <p>
          <b>{s.completed}/6</b>
          <span>cases closed</span>
        </p>
        <p>
          <b>
            {s.unsupportedFound}/{s.unsupportedTotal}
          </b>
          <span>unsupported claims flagged</span>
        </p>
        <p>
          <b>{s.changed}</b>
          <span>minds changed after evidence</span>
        </p>
      </div>

      <section>
        <p className="t-sys">FINAL DECISIONS · CASES 01, 02, 04, 05</p>
        <div className="t-dist" role="img" aria-label={`Trust ${s.trust}, verify ${s.verify}, ask a human ${s.escalate}`}>
          {bars.map(([c, n]) => (
            <div key={c} className="t-dist__row">
              <span>{CHOICE_LABEL[c]}</span>
              <div>
                {Array.from({ length: 4 }, (_, i) => (
                  <i key={i} className={i < n ? `t-px t-px--${c}` : "t-px"} />
                ))}
              </div>
              <b>{n}</b>
            </div>
          ))}
        </div>
        {!finals && <p className="t-small">Close a case to see your decisions here.</p>}
      </section>

      <section>
        <p className="t-sys">CONFIDENCE BEFORE → AFTER EVIDENCE</p>
        <div className="t-dumbbell">
          {INVESTIGATION_IDS.map((id) => {
            const r = state.cases[id];
            return (
              <div key={id} className="t-dumbbell__row">
                <span>{String(id).padStart(2, "0")}</span>
                <div className="t-dumbbell__track">
                  {r?.confBefore !== undefined && <i className="t-dot t-dot--before" style={{ left: `${r.confBefore}%` }} title={`Before: ${r.confBefore}%`} />}
                  {r?.confAfter !== undefined && <i className="t-dot t-dot--after" style={{ left: `${r.confAfter}%` }} title={`After: ${r.confAfter}%`} />}
                </div>
                <small>
                  {r?.confBefore !== undefined ? `${r.confBefore}%` : "—"}
                  {r?.confAfter !== undefined ? ` → ${r.confAfter}%` : ""}
                </small>
              </div>
            );
          })}
        </div>
        <p className="t-small">○ before, ● after. Only cases where you opened the evidence have an after.</p>
      </section>

      <section>
        <p className="t-sys">CASE BY CASE · FIRST CHOICE → FINAL</p>
        <ol className="t-timeline">
          {ALL_CASES.map((id) => {
            const r = state.cases[id];
            let text = "Not yet";
            if (r?.first) text = r.final && r.final !== r.first ? `${CHOICE_MARK[r.first]} → ${CHOICE_MARK[r.final]}` : CHOICE_MARK[r.first];
            if (id === 3 && r?.privacy) text = r.privacy === "share" ? "Shared all" : r.privacy === "redact" ? "Redacted" : "Declined";
            if (id === 6 && r?.sorted) text = `${r.sorted.fit}/${r.sorted.total} matched`;
            return (
              <li key={id} className={r?.done ? "t-timeline--done" : ""}>
                <b>{String(id).padStart(2, "0")}</b>
                <span>{text}</span>
              </li>
            );
          })}
        </ol>
        <p className="t-small">T = trust, V = verify, H = ask a human.</p>
      </section>

      <p className="t-disclaimer">
        These numbers describe choices in a small fictional exercise. They aren&apos;t a validated measure of anyone&apos;s judgment or AI literacy,
        and they stay in this browser: there&apos;s no account and nothing is sent anywhere.
      </p>
      <button
        type="button"
        className="btn"
        onClick={() => {
          reset();
          log("Progress reset");
        }}
      >
        Reset my progress
      </button>
    </div>
  );
}

/* ---------- system log ---------- */

export function SystemLog() {
  const { state } = useGame();
  return (
    <div className="t-app t-log">
      <p className="t-sys">TRUTH.EXE SYSTEM LOG · STORED IN THIS BROWSER ONLY</p>
      {state.log.length === 0 ? (
        <p className="t-small">Nothing logged yet. Open a case to begin.</p>
      ) : (
        <ol>
          {state.log.map((entry, i) => (
            <li key={i}>
              <time>{new Date(entry.t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</time> {entry.text}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

/* ---------- reflection ---------- */

export function Reflection() {
  const { open } = useOs();
  const { state } = useGame();
  const s = summarize(state);
  const ending = REFLECTION_ENDINGS[reflection(state)];
  const remaining = ALL_CASES.filter((id) => !state.cases[id]?.done);
  const details: string[] = [];
  for (const id of INVESTIGATION_IDS) {
    const r = state.cases[id];
    if (!r?.final) continue;
    const verb = r.final === "trust" ? "trusted the answer" : r.final === "verify" ? "verified it" : "brought in a person";
    details.push(`In ${caseName(id)}, you ${verb}${r.first !== r.final ? ` after first choosing ${CHOICE_LABEL[r.first!].toLowerCase()}` : ""}.`);
  }
  const privacy = state.cases[3]?.privacy;
  if (privacy) details.push(`With BudgetBuddy, you ${privacy === "share" ? "shared everything" : privacy === "redact" ? "redacted before sending" : "declined and used a template"}.`);

  return (
    <div className="t-app t-reflection">
      <p className="t-sys">END OF RUN · DESCRIPTIVE, NOT A DIAGNOSIS</p>
      {remaining.length > 0 && (
        <p className="t-small">
          {remaining.length} case{remaining.length > 1 ? "s" : ""} still open, so this is a preview.{" "}
          <button type="button" className="t-link" onClick={() => open(`case${remaining[0]}` as TruthAppId)}>
            Open {caseName(remaining[0]).split(":")[0]}
          </button>
        </p>
      )}
      <h2 className="t-ending">{ending.name}</h2>
      <p className="t-lede">{ending.line}</p>
      <ul className="t-feedback">
        {details.map((d) => (
          <li key={d}>{d}</li>
        ))}
      </ul>
      <p>
        Flagged {s.unsupportedFound} of {s.unsupportedTotal} unsupported claims. Changed your mind after reading evidence {s.changed}{" "}
        {s.changed === 1 ? "time" : "times"}.
      </p>
      <p className="t-disclaimer">
        This is a game outcome based on a few fictional cases, not a personality type or a measure of how safe you are with AI. You can reopen any
        case and try a different path.
      </p>
      <div className="t-row">
        <button type="button" className="btn btn--wide" onClick={() => open("files")}>
          Revisit cases
        </button>
        <button type="button" className="btn btn--wide t-primary" onClick={() => open("manual")}>
          Read the User Manual
        </button>
      </div>
    </div>
  );
}

/* ---------- safety manual ---------- */

const LEVELS = {
  USE: "AI is often useful for low-risk brainstorming, drafting, organizing ideas, and exploring alternatives.",
  VERIFY: "Check sources, assumptions, and omitted context when you use AI for facts, research, technical work, and unfamiliar subjects.",
  ESCALATE: "Get qualified human review, the right authorization, or independent judgment for high-stakes and consequential decisions.",
};

export function SafetyManual() {
  const { showFinale } = useOs();
  const [picked, setPicked] = useState(SITUATIONS[0].id);
  const [raised, setRaised] = useState(false);
  const situation = SITUATIONS.find((s) => s.id === picked)!;
  const view = raised ? situation.raised : situation;

  return (
    <div className="t-app t-manual">
      <p className="t-sys">USER MANUAL: HOW TO LIVE WITH AI</p>
      <h2 className="t-big">
        AI is useful, but usefulness is <em>not</em> the same as trustworthiness.
      </h2>
      <div className="t-levels">
        {(Object.keys(LEVELS) as (keyof typeof LEVELS)[]).map((l) => (
          <div key={l} className={`t-level${view.level === l ? " t-level--on" : ""}`}>
            <b>{l}</b>
            <p>{LEVELS[l]}</p>
          </div>
        ))}
      </div>
      <p className="t-sys">PICK A SITUATION</p>
      <div className="t-situations">
        {SITUATIONS.map((s) => (
          <button
            type="button"
            key={s.id}
            aria-pressed={s.id === picked}
            className={`btn t-mini${s.id === picked ? " btn--down" : ""}`}
            onClick={() => {
              setPicked(s.id);
              setRaised(false);
            }}
          >
            {s.label}
          </button>
        ))}
      </div>
      <div className="t-situation" aria-live="polite">
        <p>
          <b>{raised ? situation.raised.label : situation.label}</b> → <span className="t-pill">{view.level}</span>
        </p>
        <p>{view.why}</p>
        <button type="button" className="btn" onClick={() => setRaised(!raised)}>
          {raised ? "Back to the original situation" : "Change the stakes"}
        </button>
      </div>
      <button type="button" className="btn btn--wide t-primary t-finale-btn" onClick={showFinale}>
        Read the last line
      </button>
    </div>
  );
}

/* ---------- about ---------- */

export function About() {
  const used: Source[] = [SOURCES.nistGai, SOURCES.nistRmf, SOURCES.unesco, SOURCES.oecd, SOURCES.gdpr, SOURCES.obermeyer, SOURCES.parasuraman, SOURCES.mata, SOURCES.who];
  return (
    <div className="t-app t-about">
      <p className="t-sys">ARTIFACT 3 · AIML-500 MACHINE LEARNING FUNDAMENTALS</p>
      <h2 className="t-big">404: Truth Not Found</h2>
      <p className="t-lede">An interactive experiment about AI safety, trust, and human judgment.</p>
      <p>
        <b>Artifact 1, BackOnTrack:</b> I build with AI. <b>Artifact 2, Learning Lab:</b> I learn and explain AI. <b>Artifact 3:</b> I question and
        evaluate AI.
      </p>
      <h3>Why</h3>
      <p>
        Helpful and trustworthy aren&apos;t the same thing. I wanted something you play rather than read, where the point isn&apos;t to distrust AI
        but to match how much you rely on it to what&apos;s at stake.
      </p>
      <h3>How it works</h3>
      <p>
        Six fictional cases, each with a simulated AI response and a decision. Choices change what happens next, and an evidence window lets you
        check individual claims. Your progress is saved only in this browser.
      </p>
      <h3>Limitations</h3>
      <ul className="t-feedback">
        <li>Every AI response is simulated. I wrote them to show common failure patterns; they aren&apos;t transcripts from a real model.</li>
        <li>The people, companies, documents, and the Hartwell & Osei citation are fictional.</li>
        <li>The reflection describes choices in a short game. It isn&apos;t a validated assessment.</li>
        <li>Nothing here is medical, legal, or financial advice.</li>
      </ul>
      <h3>Sources I quote</h3>
      <ul className="t-sources">
        {used.map((s) => (
          <li key={s.title}>
            <a href={s.url} target="_blank" rel="noreferrer">
              {s.title}
            </a>{" "}
            <small>
              {s.type}
              {s.date ? `, ${s.date}` : ""}
            </small>
          </li>
        ))}
      </ul>
      <p className="t-small">The OECD principles and WHO guidance are listed as further reading. Quoted lines come from the other sources.</p>
    </div>
  );
}

export function caseLabel(id: CaseId) {
  return CASE_META[id].title;
}
