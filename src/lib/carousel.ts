/** Cuántos elementos se ven a la vez en la rueda de horarios: 1 central + 2 por lado. */
export const VISIBLE_ITEMS = 5;

/** Índice del elemento centrado, a partir del desplazamiento horizontal del contenedor. */
export function centeredIndex(scrollLeft: number, containerWidth: number, count: number): number {
  if (count <= 0 || containerWidth <= 0) return 0;
  const itemWidth = containerWidth / VISIBLE_ITEMS;
  return Math.min(count - 1, Math.max(0, Math.round(scrollLeft / itemWidth)));
}

/** Desplazamiento que deja centrado el elemento `index`. */
export function scrollLeftFor(index: number, containerWidth: number): number {
  return index * (containerWidth / VISIBLE_ITEMS);
}

/** Distancia (en posiciones) al elemento central; define qué tan fuerte o difuminado se ve. */
export const distanceFromCenter = (index: number, centered: number): number => Math.abs(index - centered);
