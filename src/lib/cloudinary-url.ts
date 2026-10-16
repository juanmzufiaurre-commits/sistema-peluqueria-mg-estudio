/** Inserta una transformación en una URL de entrega de Cloudinary (miniaturas, WebP/AVIF automático). */
export function cloudinaryThumb(secureUrl: string, size: number): string {
  return secureUrl.replace("/upload/", `/upload/c_fill,w_${size},h_${size},f_auto,q_auto/`);
}

export function cloudinaryFull(secureUrl: string): string {
  return secureUrl.replace("/upload/", "/upload/c_limit,w_1600,f_auto,q_auto/");
}
