"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { HeroVideo } from "./hero-video";
import { SectionNav } from "./section-nav";

const HOLD_MS = 2200; // cuánto se queda el video a pantalla completa con el logo al centro
const SETTLED_PAD = 72; // px sobre el logo con la portada ya acomodada
const SETTLED_NAV_GAP = 40; // px entre el logo y el menú con la portada ya acomodada
const EASE = [0.76, 0, 0.24, 1] as const;

// En el servidor no hay layout: useLayoutEffect solo en el navegador (evita el aviso de SSR).
const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

interface Props {
  businessName: string;
  children: ReactNode;
}

/**
 * Portada con intro: al cargar la página, el video ocupa toda la pantalla (con viñeta) y solo se ve el
 * logo al centro; después la portada se achica, el logo sube y aparecen el menú (primero "Agendar
 * turno", luego los costados), el degradado y el contenido. Al navegar entre apartados no se repite
 * porque esta portada vive en el layout. Tocar, deslizar o usar el teclado la adelanta.
 */
export function HeroShell({ businessName, children }: Props) {
  const reduceMotion = useReducedMotion();
  const [intro, setIntro] = useState(true);
  // Con "reducir movimiento" la portada aparece ya acomodada, sin animar.
  const [skipped, setSkipped] = useState(false);
  // Durante la intro el logo queda justo al centro y la portada ocupa toda la pantalla. Se logra con
  // rellenos medidos en px (arriba del logo y debajo del menú oculto) en vez de animar la altura:
  // animar hacia height "auto" terminaba con un salto, porque "auto" se medía al empezar.
  const logoRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const [introPad, setIntroPad] = useState<{ top: number; bottom: number } | null>(null);

  useIsoLayoutEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setSkipped(true);
      setIntro(false);
      return;
    }
    const center = () => {
      const vh = window.innerHeight;
      const logo = logoRef.current?.offsetHeight ?? 0;
      const nav = navRef.current?.offsetHeight ?? 0;
      const top = Math.max(0, (vh - logo) / 2);
      setIntroPad({ top, bottom: Math.max(0, vh - top - logo - nav) });
    };
    center();
    window.addEventListener("resize", center);
    return () => window.removeEventListener("resize", center);
  }, []);

  useEffect(() => {
    if (!intro) return;
    const end = () => setIntro(false);
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
        // Hasta medir (primer cuadro, antes de hidratar) ocupa la pantalla con min-h-svh.
        className={cn("hero-shell relative isolate flex flex-col items-center overflow-hidden px-4 text-center", intro && !introPad && "min-h-svh")}
        initial={false}
        animate={{ paddingBottom: intro ? (introPad?.bottom ?? 0) : 0 }}
        transition={intro ? { duration: 0 } : move}
      >
        <HeroVideo intro={intro} instant={instant} />

        <motion.div
          className="hero-logo"
          initial={false}
          animate={{ paddingTop: intro ? (introPad?.top ?? "34svh") : SETTLED_PAD }}
          // Mientras dura la intro el centrado se ajusta al instante (medición, giro del celular).
          transition={intro ? { duration: 0 } : move}
        >
          <div ref={logoRef} className="flex flex-col items-center gap-6">
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
          </div>
        </motion.div>

        <motion.div ref={navRef} className="hero-nav w-full max-w-xl" initial={false} animate={{ marginTop: intro ? 0 : SETTLED_NAV_GAP }} transition={move}>
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
