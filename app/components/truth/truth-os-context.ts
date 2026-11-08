"use client";

import { createContext, useContext } from "react";

export type TruthAppId =
  | "files"
  | "evidence"
  | "monitor"
  | "manual"
  | "about"
  | "log"
  | "reflection"
  | "case1"
  | "case2"
  | "case3"
  | "case4"
  | "case5"
  | "case6";

export type Notice = { title: string; body: string; kind?: "info" | "warn" | "error" };

export type OsApi = {
  open: (id: TruthAppId) => void;
  notify: (notice: Notice) => void;
  beep: (kind?: "click" | "warn" | "done") => void;
  focusClaim: (claimId: string) => void;
  evidenceCase: number;
  setEvidenceCase: (id: number) => void;
  showFinale: () => void;
};

export const OsCtx = createContext<OsApi | null>(null);

export function useOs() {
  const api = useContext(OsCtx);
  if (!api) throw new Error("useOs needs OsCtx");
  return api;
}
