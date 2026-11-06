"use client";

import { useRef } from "react";
import type { ReactNode } from "react";
import { useDrag } from "./use-drag";

export type Rect = { x: number; y: number; w: number; h: number };

const TASKBAR = 38;
const isSmallScreen = () => window.matchMedia("(max-width: 640px)").matches;

type Props = {
  title: string;
  icon?: string;
  rect: Rect;
  z: number;
  active: boolean;
  minimized: boolean;
  maximized: boolean;
  dialog?: boolean;
  onFocus: () => void;
  onClose: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
  onRect: (rect: Partial<Rect>) => void;
  children: ReactNode;
};

export function Window({
  title,
  icon,
  rect,
  z,
  active,
  minimized,
  maximized,
  dialog,
  onFocus,
  onClose,
  onMinimize,
  onMaximize,
  onRect,
  children,
}: Props) {
  const origin = useRef(rect);

  const move = useDrag(
    (dx, dy) => {
      if (maximized || (isSmallScreen() && !dialog)) return;
      const maxX = window.innerWidth - 80;
      const maxY = window.innerHeight - TASKBAR - 28;
      onRect({
        x: Math.min(maxX, Math.max(80 - rect.w, origin.current.x + dx)),
        y: Math.min(maxY, Math.max(0, origin.current.y + dy)),
      });
    },
  );

  const resize = useDrag((dx, dy) => {
    onRect({
      w: Math.max(280, origin.current.w + dx),
      h: Math.max(180, origin.current.h + dy),
    });
  });

  const className = [
    "win",
    active && "win--active",
    maximized && "win--max",
    dialog && "win--dialog",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <section
      role={dialog ? "alertdialog" : "dialog"}
      aria-label={title}
      className={className}
      style={{
        left: rect.x,
        top: rect.y,
        width: rect.w,
        height: dialog ? undefined : rect.h,
        zIndex: z,
        display: minimized ? "none" : undefined,
      }}
      onPointerDownCapture={onFocus}
    >
      <header
        className="win__bar"
        {...move.bind}
        onPointerDown={(e) => {
          origin.current = rect;
          move.bind.onPointerDown(e);
        }}
        onDoubleClick={dialog ? undefined : onMaximize}
      >
        {icon && <img src={icon} alt="" className="win__icon" draggable={false} />}
        <h2 className="win__title">{title}</h2>
        <div className="win__controls" data-nodrag>
          {!dialog && (
            <>
              <button type="button" aria-label={`Minimize ${title}`} onClick={onMinimize}>
                <span aria-hidden>_</span>
              </button>
              <button type="button" aria-label={`Maximize ${title}`} onClick={onMaximize} className="win__max-btn">
                <span aria-hidden>□</span>
              </button>
            </>
          )}
          <button type="button" aria-label={`Close ${title}`} onClick={onClose}>
            <span aria-hidden>×</span>
          </button>
        </div>
      </header>
      <div className="win__body">{children}</div>
      {!dialog && !maximized && (
        <div
          className="win__grip"
          aria-hidden
          {...resize.bind}
          onPointerDown={(e) => {
            origin.current = rect;
            resize.bind.onPointerDown(e);
          }}
        />
      )}
    </section>
  );
}
