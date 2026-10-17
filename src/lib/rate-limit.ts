// Limitador en memoria por instancia: frena abusos simples (rafagas desde una IP).
// En serverless cada instancia tiene su propio contador, así que es una defensa de mejor esfuerzo,
// no una garantía; para algo estricto haría falta un almacén compartido (Redis/Upstash).

const hits = new Map<string, number[]>();

export function rateLimit(key: string, limit: number, windowMs: number, now: number = Date.now()): boolean {
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);

  if (hits.size > 5000) for (const [k, v] of hits) if (v.every((t) => now - t >= windowMs)) hits.delete(k);
  return true;
}

export function clientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}
