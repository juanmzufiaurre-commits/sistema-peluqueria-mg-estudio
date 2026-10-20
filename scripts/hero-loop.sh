#!/usr/bin/env bash
# Arma el loop de fondo de la portada (public/video/hero-loop.mp4) a partir de los videos originales.
# Uso: bash scripts/hero-loop.sh <carpeta-con-los-videos>
# Cada clip: tramo normal + tramo en cámara lenta (interpolada); entre clips, un flash blanco corto.
set -euo pipefail
SRC="${1:?Pasá la carpeta con los videos}"
OUT="public/video"
V() { echo "$SRC/WhatsApp Video 2026-10-16 at 7.00.$1 PM.mp4"; }

# Interpolación para que la cámara lenta sea fluida y no a saltos.
SLOW="setpts=2*(PTS-STARTPTS),minterpolate=fps=30:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1"
NORM="setpts=PTS-STARTPTS"
BASE="scale=540:960:force_original_aspect_ratio=increase,crop=540:960,fps=30,format=yuv420p"
seg() { # entrada inicio fin filtro etiqueta
  echo "[$1:v]trim=$2:$3,$BASE,$4,settb=1/30[$5];"
}

F=""
F+=$(seg 0 0.0 2.0 "$NORM" a1); F+=$(seg 0 2.0 3.0 "$SLOW" a2)
F+=$(seg 1 1.0 3.0 "$NORM" b1); F+=$(seg 1 3.0 3.8 "$SLOW" b2)
F+=$(seg 2 0.2 1.2 "$NORM" c1); F+=$(seg 2 1.2 2.4 "$SLOW" c2)
F+=$(seg 3 1.6 2.8 "$NORM" d1); F+=$(seg 3 2.8 3.9 "$SLOW" d2)
F+="[a1][a2]concat=n=2:v=1[A];[b1][b2]concat=n=2:v=1[B];[c1][c2]concat=n=2:v=1[C];[d1][d2]concat=n=2:v=1[D];"
# Duraciones: A 4.0 · B 3.6 · C 3.4 · D 3.4, flashes de 0.25 s.
F+="[A][B]xfade=transition=fadewhite:duration=0.25:offset=3.75[AB];"
F+="[AB][C]xfade=transition=fadewhite:duration=0.25:offset=7.1[ABC];"
F+="[ABC][D]xfade=transition=fadewhite:duration=0.25:offset=10.25[ALL];"
# Look: menos saturación, contraste suave, tono cálido en las luces (combina con el crema), viñeta y grano.
F+="[ALL]eq=contrast=1.08:saturation=0.72:brightness=-0.03,colorbalance=rh=0.04:bh=-0.04,vignette=PI/4.5,noise=alls=5:allf=t,"
# Entrada y salida desde negro para que el loop empalme sin corte.
F+="fade=t=in:st=0:d=0.35,fade=t=out:st=13.25:d=0.4[OUT]"

ffmpeg -v error -y -i "$(V 34)" -i "$(V 36)" -i "$(V 33)" -i "$(V 35)" \
  -filter_complex "$F" -map "[OUT]" -an \
  -c:v libx264 -preset slow -crf 27 -profile:v high -pix_fmt yuv420p -movflags +faststart \
  "$OUT/hero-loop.mp4"

# Imagen fija mientras carga el video (y para quien prefiere menos movimiento).
ffmpeg -v error -y -ss 2.6 -i "$OUT/hero-loop.mp4" -frames:v 1 -q:v 4 "$OUT/hero-poster.jpg"

# Versión como imagen animada (WebP) para cuando el navegador no deja reproducir videos solos
# (iPhone en "ahorro de batería"): las imágenes animadas sí se mueven. Más chica y a 12 cuadros/s.
ffmpeg -v error -y -i "$OUT/hero-loop.mp4" -vf "fps=12,scale=360:-2:flags=lanczos" \
  -c:v libwebp -loop 0 -quality 50 -compression_level 6 -preset picture "$OUT/hero-loop.webp"
