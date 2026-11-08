"use client";

import { useState } from "react";
import type { DragEvent, ReactNode } from "react";
import { CASE_META, CLAIMS, OUTCOMES, SOURCES, STATUS_LABEL } from "./truth-data";
import type { CaseId, Choice, InvestigationCaseId } from "./truth-data";
import { useOs } from "./truth-os-context";
import type { TruthAppId } from "./truth-os-context";
import { caseName, useGame } from "./truth-state";

/* ---------- shared pieces ---------- */

type Segment = string | { claim: string; text: string };

const REPLIES: Record<InvestigationCaseId, Segment[]> = {
  1: [
    "Absolutely! Generative AI can produce false statements with complete confidence. ",
    { claim: "1a", text: "NIST's Generative AI Profile uses the term “confabulation” for this." },
    " ",
    { claim: "1d", text: "The same report finds that about 27% of generative AI answers contain confabulations." },
    " A well-known real example: ",
    { claim: "1b", text: "in Mata v. Avianca, a US federal court sanctioned lawyers over a filing that cited non-existent cases." },
    " For peer-reviewed support, cite ",
    { claim: "1c", text: "Hartwell & Osei (2021), “Confidence Calibration in Neural Language Models,” Journal of Machine Cognition 14(2), 101–119." },
  ],
  2: [
    "Good news: ",
    { claim: "2a", text: "this is almost certainly a muscle strain." },
    " Tightness after exercise is very common in active adults, especially when you're otherwise healthy. Rest for a week and you should feel better. ",
    { claim: "2b", text: "There's no need to see anyone about it." },
    " ",
    { claim: "2c", text: "Ultimately, you're responsible for your own decisions," },
    " but I wouldn't worry!",
  ],
  4: [
    { claim: "4a", text: "HireSort ranks candidates objectively, using data rather than opinion." },
    " ",
    { claim: "4b", text: "Higher scores mean stronger candidates," },
    " so I recommend interviewing the top of the list. The model weighs experience, skills, education, career continuity, and neighborhood, ",
    { claim: "4c", text: "which is just a neutral signal of commute reliability." },
    " ",
    { claim: "4d", text: "HireSort is aligned with NIST's trustworthy AI characteristics, including fairness." },
  ],
  5: [
    "Key points: ",
    { claim: "5a", text: "The Northbridge Community Grant pays $4,000 per academic year" },
    " for up to four years. Funds go directly to your school each term. ",
    { claim: "5b", text: "The grant renews automatically each year," },
    " and ",
    { claim: "5c", text: "you keep the award as long as you stay enrolled." },
    " Congratulations!",
  ],
};

const CHOICES: { id: Choice; label: string; detail: string }[] = [
  { id: "trust", label: "TRUST", detail: "Use the answer as it is" },
  { id: "verify", label: "VERIFY", detail: "Open the evidence first" },
  { id: "escalate", label: "ASK A HUMAN", detail: "Bring in someone qualified" },
];

const NEXT: Record<CaseId, TruthAppId> = { 1: "case2", 2: "case3", 3: "case4", 4: "case5", 5: "case6", 6: "reflection" };

function Sources({ ids }: { ids: string[] }) {
  const seen = new Set<string>();
  const list = CLAIMS.filter((c) => ids.includes(c.id))
    .map((c) => c.source)
    .filter((s) => s.url && !seen.has(s.title) && seen.add(s.title));
  if (!list.length) return null;
  return (
    <ul className="t-sources">
      {list.map((s) => (
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
  );
}

function Confidence({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="t-confidence">
      <span>
        {label} <b>{value}%</b>
      </span>
      <input type="range" min={0} max={100} step={5} value={value} onChange={(e) => onChange(Number(e.target.value))} />
      <small>
        <span>Not at all</span>
        <span>Completely</span>
      </small>
    </label>
  );
}

function ChoiceButtons({ onChoose, disabled }: { onChoose: (c: Choice) => void; disabled?: boolean }) {
  return (
    <div className="t-choices" role="group" aria-label="Your decision">
      {CHOICES.map((c) => (
        <button type="button" key={c.id} className="btn t-choice" disabled={disabled} onClick={() => onChoose(c.id)}>
          <b>{c.label}</b>
          <small>{c.detail}</small>
        </button>
      ))}
    </div>
  );
}

function CaseHeader({ id }: { id: CaseId }) {
  return (
    <header className="t-case-head">
      <p className="t-sys">
        {caseName(id).split(":")[0]} · {CASE_META[id].topic.toUpperCase()}
      </p>
      <h2>{CASE_META[id].title}</h2>
    </header>
  );
}

function AiMessage({ id, live }: { id: InvestigationCaseId; live: boolean }) {
  const { focusClaim } = useOs();
  const { state } = useGame();
  return (
    <div className="t-chat">
      <p className="t-chat__user">
        <span className="t-tag">{OUTCOMES[id].requester}</span>
        {OUTCOMES[id].request}
      </p>
      <div className="t-chat__ai">
        <p className="t-tag t-tag--ai">ASSISTANT · SIMULATED RESPONSE</p>
        <p>
          {REPLIES[id].map((seg, i) =>
            typeof seg === "string" ? (
              <span key={i}>{seg}</span>
            ) : live ? (
              // A span, so the claim wraps inside the sentence like the text around it.
              <span
                role="button"
                tabIndex={0}
                key={i}
                className={`t-claim${state.guesses[seg.claim] ? " t-claim--seen" : ""}`}
                onClick={() => focusClaim(seg.claim)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    focusClaim(seg.claim);
                  }
                }}
                title="Inspect this claim in the Evidence Explorer"
              >
                {seg.text}
              </span>
            ) : (
              <span key={i}>{seg.text}</span>
            ),
          )}
        </p>
      </div>
      {live && <p className="t-hint">Claims are now clickable. Each one opens in the Evidence Explorer.</p>}
    </div>
  );
}

function Outcome({ id, children }: { id: CaseId; children: ReactNode }) {
  const { open } = useOs();
  const { retry, log } = useGame();
  return (
    <div className="t-outcome" aria-live="polite">
      {children}
      <p className="t-concept">
        <span className="t-sys">AI SAFETY CONCEPT</span> {CASE_META[id].concept}
      </p>
      <div className="t-row">
        <button
          type="button"
          className="btn btn--wide"
          onClick={() => {
            retry(id);
            log(`Reopened ${caseName(id)} to try another path`);
          }}
        >
          Try another path
        </button>
        <button type="button" className="btn btn--wide t-primary" onClick={() => open(NEXT[id])}>
          {id === 6 ? "See my reflection" : "Next case"}
        </button>
      </div>
    </div>
  );
}

/* ---------- investigation cases: 1, 2, 4, 5 ---------- */

function InvestigationCase({ id, lab, labTitle }: { id: InvestigationCaseId; lab: ReactNode; labTitle: string }) {
  const { open, notify, beep, setEvidenceCase } = useOs();
  const { state, setCase, log } = useGame();
  const record = state.cases[id] ?? { done: false };
  const [before, setBefore] = useState(50);
  const [after, setAfter] = useState(50);
  const claims = CLAIMS.filter((c) => c.caseId === id);
  const inspected = claims.filter((c) => state.guesses[c.id]).length;
  const stage = !record.first ? "decide" : !record.final ? "review" : "outcome";

  const openEvidence = () => {
    setEvidenceCase(id);
    open("evidence");
  };

  const decide = (choice: Choice) => {
    beep("click");
    log(`${caseName(id)}: chose ${choice.toUpperCase()} at ${before}% confidence`);
    if (choice === "verify") {
      setCase(id, { first: choice, confBefore: before });
      openEvidence();
      return;
    }
    setCase(id, { first: choice, final: choice, confBefore: before, done: true });
    if (id === 1 && choice === "trust") {
      notify({ kind: "error", title: "Reference Manager", body: "Error 404: Hartwell & Osei (2021) could not be located in any catalog." });
      beep("warn");
    }
  };

  const finish = (choice: Choice) => {
    beep("done");
    setCase(id, { final: choice, confAfter: after, reviewed: true, done: true });
    log(`${caseName(id)}: after the evidence, chose ${choice.toUpperCase()} at ${after}% confidence`);
  };

  const outcome = record.final ? OUTCOMES[id][record.final] : null;

  return (
    <div className="t-case">
      <CaseHeader id={id} />
      <AiMessage id={id} live={stage !== "decide"} />

      {stage === "decide" && (
        <section className="t-panel">
          <Confidence label="How much would you rely on this answer?" value={before} onChange={setBefore} />
          <ChoiceButtons onChoose={decide} />
        </section>
      )}

      {stage === "review" && (
        <section className="t-panel">
          <div className="t-row t-row--between">
            <p className="t-sys">
              EVIDENCE REVIEW · {inspected}/{claims.length} CLAIMS INSPECTED
            </p>
            <button type="button" className="btn" onClick={openEvidence}>
              Open Evidence Explorer
            </button>
          </div>
          <details className="t-lab" open>
            <summary>{labTitle}</summary>
            {lab}
          </details>
          <Confidence label="After the evidence, how much would you rely on it?" value={after} onChange={setAfter} />
          <p className="t-ask">Now what do you do?</p>
          <ChoiceButtons onChoose={finish} />
        </section>
      )}

      {stage === "outcome" && outcome && (
        <Outcome id={id}>
          <p className="t-sys">OUTCOME · YOU CHOSE {record.final?.toUpperCase()}</p>
          <h3 className="t-headline">{outcome.headline}</h3>
          <p>{outcome.body}</p>
          {!record.reviewed && (
            <button
              type="button"
              className="btn"
              onClick={() => {
                setCase(id, { final: undefined, done: false });
                log(`${caseName(id)}: went back to look at the evidence`);
                openEvidence();
              }}
            >
              Look at the evidence anyway
            </button>
          )}
          <p className="t-lesson">{OUTCOMES[id].lesson}</p>
          <Sources ids={claims.map((c) => c.id)} />
        </Outcome>
      )}
    </div>
  );
}

const CATALOG = [
  { query: "NIST AI 600-1", result: "1 record: Generative AI Profile, NIST, July 2024.", url: SOURCES.nistGai.url },
  { query: "Mata v. Avianca, S.D.N.Y. 2023", result: "Docket 1:22-cv-01461 found. Opinion and Order on Sanctions, June 22, 2023.", url: SOURCES.mata.url },
  { query: "Hartwell & Osei 2021", result: "0 records. No journal named “Journal of Machine Cognition” in the catalog.", url: undefined },
  { query: "“27%” in NIST AI 600-1", result: "0 matches in the document's full text.", url: undefined },
];

function CitationLookup() {
  const [run, setRun] = useState<number[]>([]);
  return (
    <div className="t-catalog">
      <p className="t-small">A simulated library catalog. The real sources it finds link to the actual documents.</p>
      {CATALOG.map((row, i) => (
        <div key={row.query} className="t-catalog__row">
          <button type="button" className="btn" onClick={() => setRun((r) => (r.includes(i) ? r : [...r, i]))}>
            Search
          </button>
          <code>{row.query}</code>
          {run.includes(i) && (
            <p className={row.url ? "t-found" : "t-missing"}>
              {row.url ? (
                <>
                  {row.result}{" "}
                  <a href={row.url} target="_blank" rel="noreferrer">
                    Open source
                  </a>
                </>
              ) : (
                <>
                  <b>404</b> {row.result}
                </>
              )}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

const QUESTIONS = [
  ["When exactly did it start?", "During the run, after it, or the next day changes what it might be."],
  ["What does it feel like?", "Sharp, pressing, or burning point to different things."],
  ["Anything else going on?", "Shortness of breath, dizziness, or pain spreading elsewhere would change everything."],
  ["Any history?", "Heart or lung conditions, medicines, or family history were never asked about."],
  ["Is it getting better or worse?", "Two days of the same symptom is information too."],
];

function MissingQuestions() {
  const [shown, setShown] = useState<number[]>([]);
  return (
    <div>
      <p className="t-small">Questions the AI never asked. Click each card to turn it over.</p>
      <div className="t-cards">
        {QUESTIONS.map(([q, a], i) => (
          <button
            type="button"
            key={q}
            aria-pressed={shown.includes(i)}
            className={`t-card${shown.includes(i) ? " t-card--open" : ""}`}
            onClick={() => setShown((v) => (v.includes(i) ? v : [...v, i]))}
          >
            <b>{q}</b>
            {shown.includes(i) ? <span>{a}</span> : <span aria-hidden>? ? ?</span>}
          </button>
        ))}
      </div>
      {shown.length === QUESTIONS.length && (
        <p className="t-unlock">
          <span className="t-sys">NOTE UNLOCKED</span> An answer is only as good as what it was told. A clinician would ask these first.
        </p>
      )}
    </div>
  );
}

type Feature = "exp" | "skill" | "school" | "gap" | "hood";
const FEATURES: { id: Feature; name: string; weight: number; note: string; kind: "job" | "proxy" | "unclear" }[] = [
  { id: "exp", name: "Years of experience", weight: 0.2, kind: "job", note: "Usually job-related, though years aren't the same as skill." },
  { id: "skill", name: "Skills test", weight: 0.2, kind: "job", note: "Directly job-related, if the test itself has been checked to measure the job." },
  { id: "school", name: "School prestige", weight: 0.25, kind: "proxy", note: "Can stand in for family wealth and access, more than ability." },
  { id: "gap", name: "No employment gaps", weight: 0.15, kind: "unclear", note: "Penalizes caregiving, illness, or study breaks. Needs a reason to be here." },
  { id: "hood", name: "Neighborhood score", weight: 0.2, kind: "proxy", note: "Where someone lives can track income or race. The vendor gave no evidence it predicts anything." },
];
const APPLICANTS: { name: string; v: Record<Feature, number> }[] = [
  { name: "Avery", v: { exp: 0.6, skill: 0.55, school: 1, gap: 1, hood: 1 } },
  { name: "Blake", v: { exp: 0.7, skill: 0.6, school: 0.8, gap: 1, hood: 0.9 } },
  { name: "Casey", v: { exp: 0.8, skill: 0.95, school: 0.3, gap: 0.4, hood: 0.2 } },
  { name: "Devon", v: { exp: 0.5, skill: 0.7, school: 0.5, gap: 1, hood: 0.5 } },
  { name: "Emerson", v: { exp: 0.9, skill: 0.85, school: 0.4, gap: 0.7, hood: 0.3 } },
];
const KIND_LABEL = { job: "Job-related", proxy: "Possible proxy", unclear: "Needs justification" };

function ModelInspector() {
  const [on, setOn] = useState<Record<Feature, boolean>>({ exp: true, skill: true, school: true, gap: true, hood: true });
  const [tags, setTags] = useState<Partial<Record<Feature, keyof typeof KIND_LABEL>>>({});
  const total = FEATURES.filter((f) => on[f.id]).reduce((s, f) => s + f.weight, 0) || 1;
  const ranked = APPLICANTS.map((a) => ({
    ...a,
    score: FEATURES.filter((f) => on[f.id]).reduce((s, f) => s + f.weight * a.v[f.id], 0) / total,
  })).sort((a, b) => b.score - a.score);

  return (
    <div className="t-inspector">
      <p className="t-small">Fictional applicants and a fictional model. The scores are really calculated from the features you leave on.</p>
      <div className="t-inspector__grid">
        <div>
          <p className="t-sys">FEATURES</p>
          {FEATURES.map((f) => (
            <div key={f.id} className="t-feature">
              <label>
                <input type="checkbox" checked={on[f.id]} onChange={() => setOn((v) => ({ ...v, [f.id]: !v[f.id] }))} /> {f.name}{" "}
                <small>weight {f.weight}</small>
              </label>
              <div className="t-row" role="group" aria-label={`What is ${f.name}?`}>
                {(Object.keys(KIND_LABEL) as (keyof typeof KIND_LABEL)[]).map((k) => (
                  <button
                    type="button"
                    key={k}
                    aria-pressed={tags[f.id] === k}
                    className={`btn t-mini${tags[f.id] === k ? " btn--down" : ""}`}
                    onClick={() => setTags((v) => ({ ...v, [f.id]: k }))}
                  >
                    {KIND_LABEL[k]}
                  </button>
                ))}
              </div>
              {tags[f.id] && (
                <p className="t-small">
                  {tags[f.id] === f.kind ? "Matches my note. " : `My note says: ${KIND_LABEL[f.kind]}. `}
                  {f.note}
                </p>
              )}
            </div>
          ))}
        </div>
        <div>
          <p className="t-sys">RANKING</p>
          <ol className="t-rank">
            {ranked.map((a) => (
              <li key={a.name}>
                <span>
                  {a.name}
                  {a.name === "Casey" && <small> · best skills test</small>}
                </span>
                <i style={{ width: `${a.score * 100}%` }} />
                <b>{Math.round(a.score * 100)}</b>
              </li>
            ))}
          </ol>
          <p className="t-sys">NOT IN THE MODEL</p>
          <p className="t-small">Work samples, interviews, references, and whether anyone needs accommodations. A ranking can only weigh what it was given.</p>
        </div>
      </div>
    </div>
  );
}

const LETTER = [
  { id: "s1", text: "1. Award. You have been selected for an award of $4,000 per academic year, for up to four years.", gap: false },
  { id: "s2", text: "2. Payment. Funds are sent directly to your school at the start of each term.", gap: false },
  { id: "s3", text: "3. Renewal. Renewal is not automatic. Recipients must submit a progress form by May 15 each year.", gap: true },
  { id: "s4", text: "4. Enrollment. Recipients must stay enrolled full time (12 credits or more). Anyone who drops below 12 credits in a term must repay that term's award within 90 days.", gap: true },
  { id: "s5", text: "5. Contact. Questions can be sent to the Northbridge Foundation aid office.", gap: false },
];

function DocumentCompare() {
  const [marked, setMarked] = useState<string[]>([]);
  const [revealed, setRevealed] = useState(false);
  const hits = LETTER.filter((s) => s.gap && marked.includes(s.id)).length;
  return (
    <div>
      <p className="t-small">The original letter (fictional). Click the sections the summary got wrong or left out, then reveal.</p>
      <div className="t-letter">
        {LETTER.map((s) => (
          <button
            type="button"
            key={s.id}
            aria-pressed={marked.includes(s.id)}
            className={[
              "t-para",
              marked.includes(s.id) && "t-para--marked",
              revealed && s.gap && "t-para--gap",
            ]
              .filter(Boolean)
              .join(" ")}
            onClick={() => setMarked((v) => (v.includes(s.id) ? v.filter((m) => m !== s.id) : [...v, s.id]))}
          >
            {s.text}
          </button>
        ))}
      </div>
      <button type="button" className="btn" onClick={() => setRevealed(true)}>
        Reveal omissions
      </button>
      {revealed && (
        <p className="t-unlock" aria-live="polite">
          <span className="t-sys">YOU FOUND {hits} OF 2</span> Sections 3 and 4 hold the conditions. The summary got the money right and the rules wrong.
        </p>
      )}
    </div>
  );
}

export function Case1() {
  return <InvestigationCase id={1} labTitle="Library catalog lookup" lab={<CitationLookup />} />;
}
export function Case2() {
  return <InvestigationCase id={2} labTitle="What the AI never asked" lab={<MissingQuestions />} />;
}
export function Case4() {
  return <InvestigationCase id={4} labTitle="Model inspector" lab={<ModelInspector />} />;
}
export function Case5() {
  return <InvestigationCase id={5} labTitle="Original document vs. summary" lab={<DocumentCompare />} />;
}

/* ---------- case 3: privacy ---------- */

const FIELDS = [
  { id: "name", label: "Full name", value: "Sam Rivera", needed: false },
  { id: "dob", label: "Date of birth", value: "March 14, 1999", needed: false },
  { id: "ssn", label: "Social Security number", value: "•••-••-4821", needed: false },
  { id: "bank", label: "Bank username & password", value: "srivera99 / ••••••••", needed: false },
  { id: "employer", label: "Employer", value: "Lumen Café", needed: false },
  { id: "income", label: "Monthly take-home pay", value: "$2,300", needed: true },
  { id: "rent", label: "Rent", value: "$1,050", needed: true },
  { id: "food", label: "Groceries", value: "$280", needed: true },
  { id: "contacts", label: "Access to phone contacts", value: "Allow", needed: false },
];

export function Case3() {
  const { beep, notify } = useOs();
  const { state, setCase, log } = useGame();
  const record = state.cases[3];
  const [hidden, setHidden] = useState<string[]>([]);
  const [terms, setTerms] = useState(false);
  const sent = FIELDS.filter((f) => !hidden.includes(f.id));
  const extra = sent.filter((f) => !f.needed).length;
  const missingNeeded = FIELDS.filter((f) => f.needed && hidden.includes(f.id)).length;

  const choose = (privacy: "share" | "redact" | "decline") => {
    beep(privacy === "share" ? "warn" : "done");
    const shared = privacy === "share" ? FIELDS.length - 3 : privacy === "redact" ? extra : 0;
    setCase(3, { privacy, sharedExtra: shared, missingNeeded: privacy === "redact" ? missingNeeded : 0, done: true });
    log(`${caseName(3)}: chose to ${privacy === "share" ? "share everything" : privacy === "redact" ? `send ${sent.length} fields` : "decline and use a template"}`);
    if (privacy === "share") notify({ kind: "warn", title: "BudgetBuddy", body: "Data received. Thank you for helping us improve our services and those of our partners." });
  };

  return (
    <div className="t-case">
      <CaseHeader id={3} />
      <div className="t-chat">
        <p className="t-chat__user">
          <span className="t-tag">Fictional user, “Sam”</span>Can you help me make a monthly budget?
        </p>
        <div className="t-chat__ai">
          <p className="t-tag t-tag--ai">BUDGETBUDDY · SIMULATED APP</p>
          <p>Of course! To personalize your budget, please confirm the details below. The more you share, the better I can help.</p>
        </div>
      </div>

      {!record?.done ? (
        <section className="t-panel">
          <p className="t-small">
            Every value here is fictional and already filled in. Nothing you do is sent anywhere. Click a field to black it out before sending.
          </p>
          <div className="t-form">
            {FIELDS.map((f) => (
              <button
                type="button"
                key={f.id}
                aria-pressed={hidden.includes(f.id)}
                className={`t-field${hidden.includes(f.id) ? " t-field--redacted" : ""}`}
                onClick={() => setHidden((v) => (v.includes(f.id) ? v.filter((h) => h !== f.id) : [...v, f.id]))}
              >
                <span>{f.label}</span>
                <b>{hidden.includes(f.id) ? "REDACTED" : f.value}</b>
              </button>
            ))}
          </div>
          <button type="button" className="t-link" onClick={() => setTerms(!terms)} aria-expanded={terms}>
            {terms ? "Hide" : "Read"} BudgetBuddy terms (fictional)
          </button>
          {terms && (
            <p className="t-terms">
              4.2 Information you provide may be shared with partners to improve our services and theirs. 4.3 We keep information for as long as is
              commercially useful. 7.1 You can request deletion by post.
            </p>
          )}
          <div className="t-choices" role="group" aria-label="What do you send?">
            <button type="button" className="btn t-choice" onClick={() => choose("share")}>
              <b>SHARE EVERYTHING</b>
              <small>Send all {FIELDS.length} fields</small>
            </button>
            <button type="button" className="btn t-choice" onClick={() => choose("redact")} disabled={sent.length === FIELDS.length}>
              <b>SEND WHAT&apos;S LEFT</b>
              <small>{sent.length === FIELDS.length ? "Redact something first" : `Send ${sent.length} fields`}</small>
            </button>
            <button type="button" className="btn t-choice" onClick={() => choose("decline")}>
              <b>DECLINE</b>
              <small>Use a budget template instead</small>
            </button>
          </div>
          {missingNeeded > 0 && <p className="t-small">Heads up: you've redacted {missingNeeded} of the numbers a budget actually needs.</p>}
        </section>
      ) : (
        <Outcome id={3}>
          {record.privacy === "share" && (
            <>
              <h3 className="t-headline">Data receipt: 9 fields, 3 partners.</h3>
              <p>
                The budget came out the same as it would with three numbers. The other six fields, including a password and an ID number, went to a
                company whose terms let it share them “with partners.” Nothing bad has happened yet, and you can't take them back.
              </p>
            </>
          )}
          {record.privacy === "redact" && (
            <>
              <h3 className="t-headline">
                {record.missingNeeded
                  ? "Budget incomplete."
                  : record.sharedExtra
                    ? `Budget built. ${record.sharedExtra} extra fields sent.`
                    : "Budget built with what it needed."}
              </h3>
              <p>
                {record.missingNeeded
                  ? "You protected a lot, including some of the numbers a budget actually needs. Privacy and usefulness pull against each other, and the trick is giving the task what it needs and nothing more."
                  : record.sharedExtra
                    ? "You held some things back. The budget only needed income, rent, and groceries, so anything else was a cost with no benefit."
                    : "Income, rent, and groceries were enough. Everything else would have been a cost with no benefit."}
              </p>
            </>
          )}
          {record.privacy === "decline" && (
            <>
              <h3 className="t-headline">Template opened. Nothing shared.</h3>
              <p>
                Take-home $2,300, minus rent $1,050 and groceries $280, leaves <b>$970</b> for everything else. A spreadsheet did the math. Declining
                cost you the friendly suggestions, which is a real tradeoff.
              </p>
            </>
          )}
          <p className="t-lesson">
            Share the minimum a task needs. Read what you're agreeing to, check the privacy settings, and keep passwords and ID numbers out of AI
            tools entirely. GDPR calls the principle “data minimisation”: data should be “limited to what is necessary.” NIST lists leakage and
            unauthorized disclosure of personal data among generative AI risks.
          </p>
          <ul className="t-sources">
            <li>
              <a href={SOURCES.gdpr.url} target="_blank" rel="noreferrer">
                {SOURCES.gdpr.title}
              </a>
            </li>
            <li>
              <a href={SOURCES.nistGai.url} target="_blank" rel="noreferrer">
                {SOURCES.nistGai.title}
              </a>{" "}
              <small>July 2024</small>
            </li>
          </ul>
        </Outcome>
      )}
    </div>
  );
}

/* ---------- case 6: task sorter ---------- */

type Bin = "USE" | "VERIFY" | "ESCALATE";
const BINS: { id: Bin; detail: string }[] = [
  { id: "USE", detail: "Let AI help, then glance over it" },
  { id: "VERIFY", detail: "Use AI, then check what matters" },
  { id: "ESCALATE", detail: "A qualified person decides" },
];
const TASKS: { id: string; text: string; fit: Bin; why: string }[] = [
  { id: "t1", text: "Brainstorm ten titles for a class presentation", fit: "USE", why: "Low risk, easy to judge, and a bad idea costs nothing." },
  { id: "t2", text: "Make an email to a group chat sound friendlier", fit: "USE", why: "You know what you meant, so you'll notice if it drifts." },
  { id: "t3", text: "Explain backpropagation before an exam", fit: "VERIFY", why: "Helpful, but you're new to it. Check the key points against your notes." },
  { id: "t4", text: "Find statistics for a public report", fit: "VERIFY", why: "Every number needs a source you've opened yourself." },
  { id: "t5", text: "Decide whether to refinance a loan", fit: "ESCALATE", why: "It's consequential and depends on details the AI doesn't have." },
  { id: "t6", text: "Check whether a landlord's legal claim is true", fit: "ESCALATE", why: "Legal answers depend on where you live and the facts. Use AI to prepare questions." },
];

export function Case6() {
  const { beep } = useOs();
  const { state, setCase, log } = useGame();
  const record = state.cases[6];
  const [placed, setPlaced] = useState<Record<string, Bin>>({});
  const [dragging, setDragging] = useState<string | null>(null);
  const loose = TASKS.filter((t) => !placed[t.id]);
  const order: Bin[] = ["USE", "VERIFY", "ESCALATE"];

  const put = (task: string, bin: Bin) => {
    beep("click");
    setPlaced((v) => ({ ...v, [task]: bin }));
  };

  const check = () => {
    const fit = TASKS.filter((t) => placed[t.id] === t.fit).length;
    const overcautious = TASKS.filter((t) => order.indexOf(placed[t.id]) > order.indexOf(t.fit)).length;
    const undercautious = TASKS.filter((t) => order.indexOf(placed[t.id]) < order.indexOf(t.fit)).length;
    setCase(6, { sorted: { fit, total: TASKS.length, overcautious, undercautious }, done: true });
    log(`${caseName(6)}: sorted ${TASKS.length} tasks, ${fit} matched my suggestions`);
    beep("done");
  };

  const card = (t: (typeof TASKS)[number]) => (
    <div
      key={t.id}
      className={`t-task${dragging === t.id ? " t-task--drag" : ""}`}
      draggable
      onDragStart={(e: DragEvent) => {
        e.dataTransfer.setData("text/plain", t.id);
        setDragging(t.id);
      }}
      onDragEnd={() => setDragging(null)}
    >
      <p>{t.text}</p>
      <div className="t-row" role="group" aria-label={`Place: ${t.text}`}>
        {BINS.map((b) => (
          <button type="button" key={b.id} className={`btn t-mini${placed[t.id] === b.id ? " btn--down" : ""}`} onClick={() => put(t.id, b.id)}>
            {b.id}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="t-case">
      <CaseHeader id={6} />
      <p>How much should AI be involved? Drag each task into a tray, or use its buttons.</p>
      {!record?.done ? (
        <section className="t-panel">
          {loose.length > 0 && <div className="t-tasks">{loose.map(card)}</div>}
          <div className="t-bins">
            {BINS.map((b) => (
              <div
                key={b.id}
                className="t-bin"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const id = e.dataTransfer.getData("text/plain");
                  if (id) put(id, b.id);
                }}
              >
                <p className="t-sys">{b.id}</p>
                <small>{b.detail}</small>
                {TASKS.filter((t) => placed[t.id] === b.id).map(card)}
              </div>
            ))}
          </div>
          <button type="button" className="btn btn--wide t-primary" disabled={loose.length > 0} onClick={check}>
            {loose.length ? `Place ${loose.length} more` : "Compare with my notes"}
          </button>
        </section>
      ) : (
        <Outcome id={6}>
          <h3 className="t-headline">
            {record.sorted?.fit} of {record.sorted?.total} matched my notes.
          </h3>
          <ul className="t-feedback">
            {TASKS.map((t) => (
              <li key={t.id}>
                <b>{t.text}</b>
                <span>
                  My note: {t.fit}. {t.why}
                </span>
              </li>
            ))}
          </ul>
          {!!record.sorted?.overcautious && (
            <p>
              You were more careful than my notes on {record.sorted.overcautious}. That isn&apos;t wrong, and it has a cost: escalating a friendly email
              spends someone else&apos;s time, and checking everything leaves less attention for what matters.
            </p>
          )}
          {!!record.sorted?.undercautious && (
            <p>You were less careful than my notes on {record.sorted.undercautious}. Those were the ones where a mistake is harder to take back.</p>
          )}
          <p className="t-lesson">
            Responsible use isn&apos;t one setting. Raise your checking and oversight as the stakes and uncertainty go up, and relax it when
            they&apos;re low. My notes are one reasonable answer, not the only one.
          </p>
        </Outcome>
      )}
    </div>
  );
}

export { STATUS_LABEL };
