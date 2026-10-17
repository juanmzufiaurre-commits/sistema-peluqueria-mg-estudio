/** Inserta una transformación en una URL de entrega de Cloudinary (miniaturas, WebP/AVIF automático). */
export function cloudinaryThumb(secureUrl: string, size: number): string {
  return secureUrl.replace("/upload/", `/upload/c_fill,w_${size},h_${size},f_auto,q_auto/`);
}

export function cloudinaryFull(secureUrl: string): string {
  return secureUrl.replace("/upload/", "/upload/c_limit,w_1600,f_auto,q_auto/");
}

/** Recorte vertical (retratos), centrado en la cara cuando Cloudinary la detecta. */
export function cloudinaryPortrait(secureUrl: string, width: number): string {
  return secureUrl.replace("/upload/", `/upload/c_fill,g_auto,w_${width},h_${Math.round((width * 4) / 3)},f_auto,q_auto/`);
}

/** Ancho máximo conservando la proporción original (grillas tipo mosaico). */
export function cloudinaryWidth(secureUrl: string, width: number): string {
  return secureUrl.replace("/upload/", `/upload/c_limit,w_${width},f_auto,q_auto/`);
}
