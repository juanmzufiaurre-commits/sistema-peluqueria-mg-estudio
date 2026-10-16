import "server-only";
import { toWaMeNumber } from "@/lib/phone";

export interface SendResult {
  ok: boolean;
  providerId?: string;
  error?: string;
}

export interface WhatsAppProvider {
  send(phoneE164: string, text: string): Promise<SendResult>;
}

/**
 * Gateway autoalojado compatible con Evolution API v2:
 *   POST {URL}/message/sendText/{INSTANCE}   header `apikey`   body { number, text }
 * Si el gateway elegido usa otro formato, solo hay que cambiar esta clase.
 */
class EvolutionApiProvider implements WhatsAppProvider {
  constructor(
    private readonly baseUrl: string,
    private readonly instance: string,
    private readonly apiKey: string,
  ) {}

  async send(phoneE164: string, text: string): Promise<SendResult> {
    try {
      const res = await fetch(`${this.baseUrl.replace(/\/$/, "")}/message/sendText/${encodeURIComponent(this.instance)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: this.apiKey },
        body: JSON.stringify({ number: toWaMeNumber(phoneE164), text }),
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) return { ok: false, error: `Gateway respondió ${res.status}` };
      const body = (await res.json().catch(() => ({}))) as { key?: { id?: string } };
      return { ok: true, providerId: body.key?.id };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : "Error de red con el gateway" };
    }
  }
}

/** null si el gateway no está configurado: en ese caso se usan los enlaces wa.me manuales. */
export function getWhatsAppProvider(): WhatsAppProvider | null {
  const url = process.env.WHATSAPP_GATEWAY_URL;
  const instance = process.env.WHATSAPP_GATEWAY_INSTANCE;
  const token = process.env.WHATSAPP_GATEWAY_TOKEN;
  if (!url || !instance || !token) return null;
  return new EvolutionApiProvider(url, instance, token);
}
