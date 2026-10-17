"use client";

import { useReducedMotion } from "framer-motion";
import { useEffect, useRef } from "react";

/**
 * Loop de trabajos del estudio detrás del logo y el menú. Va silenciado y oscurecido para que no
 * compita con el texto, y se funde en negro hacia abajo. Con "reducir movimiento" queda la imagen fija.
 * El video se arma con scripts/hero-loop.sh.
 */
export function HeroVideo() {
  const ref = useRef<HTMLVideoElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (reduceMotion) v.pause();
    else v.play().catch(() => {}); // si el navegador bloquea el autoplay, queda el póster
  }, [reduceMotion]);

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <video
        ref={ref}
        className="hero-video absolute inset-0 size-full object-cover lg:scale-105 lg:blur-[2px]"
        src="/video/hero-loop.mp4"
        poster="/video/hero-poster.jpg"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
      />
      {/* Velo general + viñeta para que el logo se lea siempre */}
      <div className="absolute inset-0 bg-cream/70" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,transparent_20%,var(--cream)_85%)]" />
      {/* Fundido a negro debajo del menú */}
      <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-b from-transparent to-cream" />
    </div>
  );
}
