import type { SVGProps } from "react";

// Íconos propios para servicios que lucide no cubre. Mismo trazo y grilla 24×24 que lucide.

function Svg({ strokeWidth = 1.5, children, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      {children}
    </svg>
  );
}

/** Mechas: gorra de mechas con agujeritos y mechones que salen por arriba. */
export function HighlightCapIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Svg {...props}>
      <path d="M4 18c0-6.6 3.6-10.5 8-10.5s8 3.9 8 10.5" />
      <path d="M3 18h18" />
      {/* mechones que salen por los agujeros de la gorra */}
      <path d="M8.2 9.6C7.2 8.6 6.8 7.2 7 5.8" />
      <path d="M12 7.5c0-1.6.6-3 1.6-4" />
      <path d="M15.8 9.6c.9-1.2 2.2-1.9 3.6-1.9" />
      <circle cx="9" cy="14" r=".5" fill="currentColor" />
      <circle cx="12" cy="12" r=".5" fill="currentColor" />
      <circle cx="15" cy="14" r=".5" fill="currentColor" />
    </Svg>
  );
}

/** Global: bowl de tintura con el pincel apoyado, para teñir todo el pelo. */
export function DyeBowlIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Svg {...props}>
      <path d="M3 13h14a7 7 0 0 1-14 0Z" />
      <path d="M6 20.5h8" />
      <path d="M14 11 20.5 4.5" />
      <path d="m19.5 3.5 2 2" />
      <path d="M11.5 13c.4-1 1.2-1.8 2.5-2l1 1c-.2 1.3-1 2.1-2 2.5" />
    </Svg>
  );
}

/** Navaja de barbero (lucide no trae una). */
export function RazorIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Svg {...props}>
      <path d="M3 9.5 12.5 4c1.2-.7 2.6.3 2.4 1.6L14.5 8 5 12.2c-1 .4-2-.3-2-1.3Z" />
      <circle cx="14" cy="9" r="1" />
      <path d="m14.6 9.8 5.9 8.4c.5.7.2 1.6-.6 1.9-.6.2-1.2 0-1.5-.5l-5-7.6" />
    </Svg>
  );
}
