"use client";

import { motion, useReducedMotion } from "framer-motion";
import { MapPin } from "lucide-react";
import { useEffect, useLayoutEffect, useState, type ReactNode } from "react";
import { HeroVideo } from "./hero-video";
import { SectionNav } from "./section-nav";

export const SEEN_KEY = "mg-intro-seen";
const HOLD_MS = 1500; // cuánto se queda el video a pantalla completa con el logo al centro
const EASE = [0.76, 0, 0.24, 1] as const;

// En el servidor no hay layout: useLayoutEffect solo en el navegador (evita el aviso de SSR).
const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

interface Props {
  businessName: string;
  address: string | null;
  children: ReactNode;
}

/**
 * Portada con intro: al entrar, el video ocupa toda la pantalla con el logo al centro; enseguida la
 * portada se achica, el logo sube y aparecen el menú (con desenfoque) y el contenido.
 * Se ve una vez por visita; tocar, deslizar o usar el teclado la adelanta.
 */
export function HeroShell({ businessName, address, children }: Props) {
  const reduceMotion = useReducedMotion();
  const [intro, setIntro] = useState(true);
  // true cuando la intro se salteó antes de pintar: la portada aparece ya acomodada, sin animar.
  const [skipped, setSkipped] = useState(false);

  // Antes de pintar: si ya se vio en esta visita (o se pide menos movimiento), arranca terminada.
  useIsoLayoutEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem(SEEN_KEY) === "1";
    } catch {
      // sin almacenamiento (modo privado estricto): se muestra la intro igual
    }
    if (seen || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setSkipped(true);
      setIntro(false);
    }
  }, []);

  useEffect(() => {
    if (!intro) return;
    const end = () => {
      setIntro(false);
      try {
        sessionStorage.setItem(SEEN_KEY, "1");
      } catch {
        // ver arriba
      }
    };
    const timer = window.setTimeout(end, HOLD_MS);
    const skip = ["wheel", "touchmove", "keydown", "pointerdown"] as const;
    for (const e of skip) window.addEventListener(e, end, { once: true, passive: true });
    return () => {
      window.clearTimeout(timer);
      for (const e of skip) window.removeEventListener(e, end);
    };
  }, [intro]);

  const instant = reduceMotion || skipped;
  const move = { duration: instant ? 0 : 0.95, ease: EASE };

  return (
    <>
      <motion.header
        className="hero-shell relative isolate flex flex-col items-center overflow-hidden px-4 text-center"
        initial={false}
        animate={{ height: intro ? "100svh" : "auto" }}
        transition={move}
      >
        <HeroVideo intro={intro} instant={instant} />

        <motion.div
          className="hero-logo flex flex-col items-center gap-6"
          initial={false}
          animate={{ paddingTop: intro ? "34svh" : "4.5rem" }}
          transition={move}
        >
          <h1 className="sr-only">{businessName}</h1>
          <motion.p
            aria-hidden
            className="font-display text-[8rem] font-semibold leading-none tracking-tight drop-shadow-[0_4px_30px_rgb(0_0_0/0.6)] sm:text-[11rem]"
            initial={reduceMotion ? false : { opacity: 0, scale: 1.08, filter: "blur(14px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            transition={{ duration: reduceMotion ? 0 : 1, ease: [0.22, 1, 0.36, 1] }}
          >
            MG
          </motion.p>
          <motion.div
            aria-hidden
            className="-mt-2 flex flex-col items-center gap-3"
            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.8, delay: reduceMotion ? 0 : 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="label-wide">Estudio</span>
            <span className="label-wide text-ink-soft">Design and style</span>
          </motion.div>
          {address && (
            <p className="flex items-center gap-2 text-sm text-ink-soft">
              <MapPin aria-hidden className="size-4" strokeWidth={1.5} /> {address}
            </p>
          )}
        </motion.div>

        <motion.div className="hero-nav w-full max-w-xl" initial={false} animate={{ marginTop: intro ? "0rem" : "2.5rem" }} transition={move}>
          <SectionNav revealed={!intro} instant={instant} />
        </motion.div>
      </motion.header>

      {/* El contenido entra desenfocado apenas se acomoda la portada */}
      <motion.div
        className="hero-content flex flex-1 flex-col"
        initial={false}
        animate={intro ? { opacity: 0, y: 24, filter: "blur(8px)" } : { opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: instant ? 0 : 0.8, delay: intro || instant ? 0 : 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.div>
    </>
  );
}
