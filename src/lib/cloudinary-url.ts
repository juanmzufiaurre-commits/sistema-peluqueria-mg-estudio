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

/** Video optimizado (formato y calidad automáticos) con ancho máximo. */
export function cloudinaryVideo(secureUrl: string, width: number): string {
  return secureUrl.replace("/video/upload/", `/video/upload/c_limit,w_${width},q_auto,f_auto/`);
}

/** Primer cuadro de un video como imagen (póster / miniatura). `size` recorta cuadrado. */
export function cloudinaryVideoPoster(secureUrl: string, width: number, square = false): string {
  const crop = square ? `c_fill,w_${width},h_${width}` : `c_limit,w_${width}`;
  return secureUrl.replace("/video/upload/", `/video/upload/so_0,${crop},q_auto/`).replace(/\.[a-z0-9]+$/i, ".jpg");
}

/** Ancho máximo conservando la proporción original (grillas tipo mosaico). */
export function cloudinaryWidth(secureUrl: string, width: number): string {
  return secureUrl.replace("/upload/", `/upload/c_limit,w_${width},f_auto,q_auto/`);
}
