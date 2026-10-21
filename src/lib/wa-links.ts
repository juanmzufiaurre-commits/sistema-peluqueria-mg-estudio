import { toWaMeNumber } from "./phone";

export type WaTemplate = "confirmation" | "reminder" | "reschedule" | "moved" | "cancellation" | "morning" | "proximity";

export interface WaContext {
  firstName: string;
  /** Ej. "Sábado, 17 de octubre" */
  dateLabel: string;
  /** Ej. "14:00" */
  timeLabel: string;
  serviceName: string;
  businessName: string;
  address?: string | null;
  rebookUrl: string;
}

export const WA_TEMPLATE_LABEL: Record<WaTemplate, string> = {
  confirmation: "Confirmación",
  reminder: "Recordatorio",
  reschedule: "Reprogramación",
  moved: "Turno movido",
  cancellation: "Cancelación",
  morning: "Aviso del día",
  proximity: "Aviso 1 h antes",
};

export function waMessage(template: WaTemplate, c: WaContext): string {
  const where = c.address ? ` Te esperamos en ${c.address}.` : "";
  switch (template) {
    case "confirmation":
      return `Hola ${c.firstName}, te confirmamos tu turno de ${c.serviceName} el ${c.dateLabel} a las ${c.timeLabel} hs en ${c.businessName}.${where} ¡Te esperamos!`;
    case "reminder":
      return `Hola ${c.firstName}, te recordamos tu turno de ${c.serviceName} mañana, ${c.dateLabel}, a las ${c.timeLabel} hs en ${c.businessName}.${where} Si no podés venir, avisanos así liberamos el horario.`;
    case "reschedule":
      return `Hola ${c.firstName}, necesitamos reprogramar tu turno de ${c.serviceName} del ${c.dateLabel} a las ${c.timeLabel} hs. ¿Te queda bien otro horario? Podés elegirlo acá: ${c.rebookUrl} o respondé este mensaje para coordinar.`;
    case "moved":
      return `Hola ${c.firstName}, movimos tu turno de ${c.serviceName} al ${c.dateLabel} a las ${c.timeLabel} hs en ${c.businessName}.${where} Si no te viene bien, avisanos respondiendo este mensaje.`;
    case "morning":
      return `Hola ${c.firstName}, hoy tenés turno de ${c.serviceName} a las ${c.timeLabel} hs en ${c.businessName}.${where} ¡Te esperamos!`;
    case "proximity":
      return `Hola ${c.firstName}, tu turno de ${c.serviceName} es en 1 hora (${c.timeLabel} hs).${where} Si surge algún imprevisto avisanos respondiendo este mensaje.`;
    case "cancellation":
      return `Hola ${c.firstName}, tu turno para el día ${c.dateLabel} a las ${c.timeLabel} hs debió ser cancelado por el local. Podés volver a agendar en el siguiente enlace: ${c.rebookUrl} o responder a este mensaje para coordinar directamente con nosotros.`;
  }
}

/** Saludo para escribirle a un cliente desde su ficha, sin un turno en particular. */
export const waGreeting = (firstName: string, businessName: string): string => `Hola ${firstName}, te escribimos de ${businessName}.`;

/** Para invitar a volver a un cliente que hace tiempo que no viene. */
export const waComeBack = (firstName: string, businessName: string, rebookUrl: string): string =>
  `Hola ${firstName}, ¿cómo estás? Hace un tiempo que no te vemos por ${businessName}. Cuando quieras, reservá tu próximo turno acá: ${rebookUrl} ¡Te esperamos!`;

export function waLink(phoneE164: string, text: string): string {
  return `https://wa.me/${toWaMeNumber(phoneE164)}?text=${encodeURIComponent(text)}`;
}
