"use client";

import { createContext, useCallback, useContext, useEffect, useReducer, useRef } from "react";
import type { ReactNode } from "react";
import { CASE_META, CLAIMS } from "./truth-data";
import type { CaseId, Choice, ClaimStatus, InvestigationCaseId } from "./truth-data";

export type CaseRecord = {
  done: boolean;
  first?: Choice;
  final?: Choice;
  confBefore?: number;
  confAfter?: number;
  reviewed?: boolean;
  privacy?: "share" | "redact" | "decline";
  sharedExtra?: number;
  missingNeeded?: number;
  sorted?: { fit: number; total: number; overcautious: number; undercautious: number };
};

export type GameState = {
  cases: Partial<Record<CaseId, CaseRecord>>;
  guesses: Record<string, ClaimStatus>;
  log: { t: number; text: string }[];
};

const EMPTY: GameState = { cases: {}, guesses: {}, log: [] };
const KEY = "truth404-v1";

type Action =
  | { type: "load"; state: GameState }
  | { type: "case"; id: CaseId; patch: Partial<CaseRecord> }
  | { type: "retry"; id: CaseId }
  | { type: "guess"; claim: string; status: ClaimStatus }
  | { type: "log"; text: string }
  | { type: "reset" };

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case "load":
      return action.state;
    case "case":
      return { ...state, cases: { ...state.cases, [action.id]: { done: false, ...state.cases[action.id], ...action.patch } } };
    case "retry": {
      const cases = { ...state.cases };
      delete cases[action.id];
      const guesses = Object.fromEntries(Object.entries(state.guesses).filter(([id]) => !id.startsWith(String(action.id))));
      return { ...state, cases, guesses };
    }
    case "guess":
      return { ...state, guesses: { ...state.guesses, [action.claim]: action.status } };
    case "log":
      return { ...state, log: [...state.log, { t: Date.now(), text: action.text }].slice(-200) };
    case "reset":
      return EMPTY;
  }
}

type Api = {
  state: GameState;
  ready: boolean;
  setCase: (id: CaseId, patch: Partial<CaseRecord>) => void;
  retry: (id: CaseId) => void;
  guess: (claim: string, status: ClaimStatus) => void;
  log: (text: string) => void;
  reset: () => void;
};

const Ctx = createContext<Api | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, EMPTY);
  const loaded = useRef(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved) dispatch({ type: "load", state: { ...EMPTY, ...JSON.parse(saved) } });
    } catch {}
    loaded.current = true;
  }, []);

  useEffect(() => {
    if (!loaded.current) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {}
  }, [state]);

  const setCase = useCallback((id: CaseId, patch: Partial<CaseRecord>) => dispatch({ type: "case", id, patch }), []);
  const retry = useCallback((id: CaseId) => dispatch({ type: "retry", id }), []);
  const guess = useCallback((claim: string, status: ClaimStatus) => dispatch({ type: "guess", claim, status }), []);
  const log = useCallback((text: string) => dispatch({ type: "log", text }), []);
  const reset = useCallback(() => {
    try {
      localStorage.removeItem(KEY);
    } catch {}
    dispatch({ type: "reset" });
  }, []);

  return <Ctx.Provider value={{ state, ready: true, setCase, retry, guess, log, reset }}>{children}</Ctx.Provider>;
}

export function useGame() {
  const api = useContext(Ctx);
  if (!api) throw new Error("useGame needs GameProvider");
  return api;
}

export const INVESTIGATION_IDS: InvestigationCaseId[] = [1, 2, 4, 5];
export const ALL_CASES: CaseId[] = [1, 2, 3, 4, 5, 6];

// What tends to fit each case. Used only for the end-of-run reflection, never shown as a score.
const FITTING: Record<InvestigationCaseId, Choice[]> = { 1: ["verify"], 2: ["escalate"], 4: ["verify", "escalate"], 5: ["verify"] };

export function summarize(state: GameState) {
  const records = ALL_CASES.map((id) => ({ id, ...state.cases[id] }));
  const done = records.filter((r) => r.done);
  const finals = INVESTIGATION_IDS.map((id) => state.cases[id]?.final).filter(Boolean) as Choice[];
  const firsts = INVESTIGATION_IDS.map((id) => state.cases[id]?.first).filter(Boolean) as Choice[];
  const count = (list: Choice[], c: Choice) => list.filter((x) => x === c).length;
  const unsupportedFound = CLAIMS.filter((c) => c.status !== "supported" && state.guesses[c.id] && state.guesses[c.id] !== "supported").length;
  const unsupportedTotal = CLAIMS.filter((c) => c.status !== "supported").length;
  const changed = INVESTIGATION_IDS.filter((id) => {
    const r = state.cases[id];
    return r?.first && r.final && r.first !== r.final;
  }).length;

  let fit = 0;
  for (const id of INVESTIGATION_IDS) {
    const final = state.cases[id]?.final;
    if (final && FITTING[id].includes(final)) fit++;
  }
  const privacy = state.cases[3]?.privacy;
  if ((privacy === "redact" && !state.cases[3]?.missingNeeded) || privacy === "decline") fit++;
  const sorted = state.cases[6]?.sorted;
  if (sorted && sorted.fit >= sorted.total - 1) fit++;

  return {
    completed: done.length,
    trust: count(finals, "trust"),
    verify: count(finals, "verify"),
    escalate: count(finals, "escalate"),
    firstTrust: count(firsts, "trust"),
    firstVerify: count(firsts, "verify"),
    firstEscalate: count(firsts, "escalate"),
    unsupportedFound,
    unsupportedTotal,
    changed,
    fit,
  };
}

export function reflection(state: GameState) {
  const s = summarize(state);
  if (s.fit >= 5) return "contextual" as const;
  const top = Math.max(s.trust, s.verify, s.escalate);
  if (top === 0) return "contextual" as const;
  if (s.verify === top) return "evidence" as const;
  if (s.escalate === top) return "human" as const;
  return "fast" as const;
}

export function caseName(id: CaseId) {
  return `CASE ${String(id).padStart(2, "0")}: ${CASE_META[id].title}`;
}
