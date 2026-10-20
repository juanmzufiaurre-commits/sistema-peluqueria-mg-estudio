"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const EASE = [0.76, 0, 0.24, 1] as const;

/**
 * Loop de trabajos del estudio detrás del logo y el menú. Va silenciado; durante la intro se ve
 * casi limpio y después se oscurece y se funde en negro hacia abajo para no competir con el texto.
 * El video se arma con scripts/hero-loop.sh.
 *
 * Debajo siempre hay una imagen, y el video se hace visible recién cuando de verdad se está
 * reproduciendo (así nunca se ve el botón de play que Safari dibuja sobre los videos pausados).
 * Si el navegador no deja arrancar videos solos (iPhone en "ahorro de batería"), esa imagen pasa a
 * ser el mismo loop como WebP animado, que sí se mueve. Con "reducir movimiento" queda la foto fija.
 */
export function HeroVideo({ intro, instant = false }: { intro: boolean; instant?: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  const reduceMotion = useReducedMotion();
  const [playing, setPlaying] = useState(false);
  // El navegador bloqueó la reproducción automática: se muestra el loop como imagen animada.
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);

  // Visible solo mientras reproduce. Se escucha acá (no con props de React) porque el video puede
  // arrancar antes de que la página termine de cargar y perderíamos el primer evento "playing".
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const sync = () => setPlaying(!v.paused && !v.ended && v.readyState > 2);
    sync();
    const events = ["playing", "pause", "waiting", "ended"] as const;
    for (const e of events) v.addEventListener(e, sync);
    return () => events.forEach((e) => v.removeEventListener(e, sync));
  }, []);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (reduceMotion) {
      v.pause();
      return;
    }
    // iOS solo reproduce solo si el video está silenciado desde el arranque (React no siempre deja
    // el atributo puesto), y en "ahorro de batería" no reproduce nada hasta que la persona toca la
    // pantalla: en ese caso queda el póster y se arranca con el primer toque o deslizamiento.
    v.muted = true;
    v.defaultMuted = true;
    v.setAttribute("muted", "");

    const gestures = ["touchstart", "pointerdown", "scroll", "keydown"] as const;
    const retry = () => {
      v.play()
        .then(() => gestures.forEach((g) => window.removeEventListener(g, retry)))
        .catch(() => {});
    };
    v.play().catch(() => {
      setAutoplayBlocked(true);
      for (const g of gestures) window.addEventListener(g, retry, { passive: true });
    });
    return () => gestures.forEach((g) => window.removeEventListener(g, retry));
  }, [reduceMotion]);

  const fade = { duration: reduceMotion || instant ? 0 : 1.1, ease: EASE };

  return (
    // La máscara desvanece todo el fondo (video + velos) en los últimos px de la portada. El video y los
    // velos se dibujan en capas separadas y, si el borde inferior cae en medio píxel, cada capa se
    // redondea distinto y asomaba una fila de video sin oscurecer (una línea clara) al animar.
    <div aria-hidden className="hero-backdrop pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element -- imagen fija de fondo, ya optimizada */}
      <img
        src={autoplayBlocked ? "/video/hero-loop.webp" : "/video/hero-poster.jpg"}
        alt=""
        className="absolute inset-0 size-full object-cover lg:scale-105 lg:blur-[2px]"
      />
      <video
        ref={ref}
        className={cn(
          "hero-video absolute inset-0 size-full object-cover transition-opacity duration-1000 lg:scale-105 lg:blur-[2px]",
          playing ? "opacity-100" : "opacity-0",
        )}
        src="/video/hero-loop.mp4"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
      />
      {/* Velo general: suave en la intro, más denso después para que el menú se lea siempre */}
      <motion.div className="absolute inset-0 bg-cream" initial={false} animate={{ opacity: intro ? 0.38 : 0.68 }} transition={fade} />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,transparent_25%,var(--cream)_88%)]" />
      {/* Fundido a negro debajo del menú; aparece al terminar la intro. Sin backdrop-blur: combinado con
          el cambio de tamaño de la portada dibujaba una línea clara en el borde. */}
      <motion.div
        className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-b from-transparent via-cream/75 to-cream"
        initial={false}
        animate={{ opacity: intro ? 0 : 1 }}
        transition={fade}
      />
    </div>
  );
}
