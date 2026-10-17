"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef } from "react";

const EASE = [0.76, 0, 0.24, 1] as const;

/**
 * Loop de trabajos del estudio detrás del logo y el menú. Va silenciado; durante la intro se ve
 * casi limpio y después se oscurece y se funde en negro hacia abajo para no competir con el texto.
 * Con "reducir movimiento" queda la imagen fija. El video se arma con scripts/hero-loop.sh.
 */
export function HeroVideo({ intro, instant = false }: { intro: boolean; instant?: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (reduceMotion) v.pause();
    else v.play().catch(() => {}); // si el navegador bloquea el autoplay, queda el póster
  }, [reduceMotion]);

  const fade = { duration: reduceMotion || instant ? 0 : 1.1, ease: EASE };

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
      {/* Velo general: suave en la intro, más denso después para que el menú se lea siempre */}
      <motion.div className="absolute inset-0 bg-cream" initial={false} animate={{ opacity: intro ? 0.38 : 0.68 }} transition={fade} />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,transparent_25%,var(--cream)_88%)]" />
      {/* Fundido a negro (con desenfoque) debajo del menú; aparece al terminar la intro */}
      <motion.div
        className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-b from-transparent via-cream/70 to-cream backdrop-blur-[3px] [mask-image:linear-gradient(to_bottom,transparent,black_60%)]"
        initial={false}
        animate={{ opacity: intro ? 0 : 1 }}
        transition={fade}
      />
    </div>
  );
}
