import { createHash, randomBytes, randomInt } from "node:crypto";

// Sin 0/O/1/I/L para que el código sea fácil de dictar.
const CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

export function generatePublicCode(): string {
  let code = "";
  for (let i = 0; i < 6; i++) code += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  return `MG-${code}`;
}

/** Token de cancelación: se entrega una vez al cliente y en la DB solo se guarda el hash. */
export function generateCancelToken(): { token: string; hash: string } {
  const token = randomBytes(24).toString("base64url");
  return { token, hash: hashToken(token) };
}

export const hashToken = (token: string): string => createHash("sha256").update(token).digest("hex");
