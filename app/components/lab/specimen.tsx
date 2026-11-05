"use client";

import { useEffect, useRef, useState } from "react";

/**
 * An image "specimen" with a graceful fallback: if the file in
 * /public/images is missing, a generated placeholder card is shown.
 */
export function Specimen({
  src,
  alt,
  id,
  className = "",
}: {
  src: string;
  alt: string;
  id: string;
  className?: string;
}) {
  const [broken, setBroken] = useState(false);
  const img = useRef<HTMLImageElement>(null);

  // onError can fire before hydration; double-check once mounted.
  useEffect(() => {
    const el = img.current;
    if (el && el.complete && el.naturalWidth === 0) setBroken(true);
  }, []);

  if (broken) {
    return (
      <div
        role="img"
        aria-label={`Placeholder for ${src}`}
        className={`lab-placeholder flex aspect-[4/5] w-full flex-col justify-between p-3 font-mono text-[10px] uppercase tracking-wider ${className}`}
      >
        <span>specimen {id}</span>
        <span className="font-dot text-5xl normal-case leading-none">{id}</span>
        <span>add {src}</span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={img}
      src={src}
      alt={alt}
      draggable={false}
      onError={() => setBroken(true)}
      className={`block aspect-[4/5] w-full object-cover ${className}`}
    />
  );
}
