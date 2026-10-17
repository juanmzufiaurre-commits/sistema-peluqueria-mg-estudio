import { createHash } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { isOwnAsset, signUpload } from "./cloudinary";

const url = (path: string) => `https://res.cloudinary.com/mi-cuenta/image/upload/${path}`;

describe("isOwnAsset", () => {
  const ref = { secureUrl: url("v123/mg-estudio/reference/abc123.webp"), publicId: "mg-estudio/reference/abc123" };

  it("acepta una foto propia de la carpeta correcta", () => {
    expect(isOwnAsset("mi-cuenta", "reference", ref)).toBe(true);
    expect(isOwnAsset("mi-cuenta", "result", { secureUrl: url("v1/mg-estudio/results/x.webp"), publicId: "mg-estudio/results/x" })).toBe(true);
  });

  it("rechaza fotos de otra cuenta de Cloudinary", () => {
    expect(isOwnAsset("otra-cuenta", "reference", ref)).toBe(false);
  });

  it("rechaza una carpeta distinta a la esperada", () => {
    expect(isOwnAsset("mi-cuenta", "result", ref)).toBe(false);
    expect(isOwnAsset("mi-cuenta", "reference", { secureUrl: url("v1/otra/carpeta/x.webp"), publicId: "otra/carpeta/x" })).toBe(false);
  });

  it("rechaza URLs que no coinciden con el public_id", () => {
    expect(isOwnAsset("mi-cuenta", "reference", { secureUrl: url("v1/mg-estudio/reference/otra.webp"), publicId: "mg-estudio/reference/abc123" })).toBe(false);
  });

  it("rechaza hosts ajenos, http y recorridos de ruta", () => {
    expect(isOwnAsset("mi-cuenta", "reference", { ...ref, secureUrl: "https://evil.com/mi-cuenta/image/upload/v1/mg-estudio/reference/abc123.webp" })).toBe(false);
    expect(isOwnAsset("mi-cuenta", "reference", { ...ref, secureUrl: ref.secureUrl.replace("https", "http") })).toBe(false);
    expect(isOwnAsset("mi-cuenta", "reference", { secureUrl: url("v1/mg-estudio/reference/../x.webp"), publicId: "mg-estudio/reference/../x" })).toBe(false);
    expect(isOwnAsset("mi-cuenta", "reference", { secureUrl: "no es una url", publicId: "mg-estudio/reference/a" })).toBe(false);
  });
});

describe("signUpload", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.useRealTimers();
  });

  it("devuelve null si Cloudinary no está configurado", () => {
    vi.stubEnv("CLOUDINARY_CLOUD_NAME", "");
    expect(signUpload("reference")).toBeNull();
  });

  it("firma con SHA-1 de los parámetros ordenados + secreto, y nunca expone el secreto", () => {
    vi.stubEnv("CLOUDINARY_CLOUD_NAME", "mi-cuenta");
    vi.stubEnv("CLOUDINARY_API_KEY", "123456");
    vi.stubEnv("CLOUDINARY_API_SECRET", "s3cr3t");
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2030-01-07T12:00:00Z"));

    const sig = signUpload("result");
    const timestamp = Math.round(new Date("2030-01-07T12:00:00Z").getTime() / 1000);
    const expected = createHash("sha1")
      .update(`allowed_formats=jpg,png,webp&folder=mg-estudio/results&timestamp=${timestamp}s3cr3t`)
      .digest("hex");

    expect(sig).toMatchObject({ cloudName: "mi-cuenta", apiKey: "123456", folder: "mg-estudio/results", timestamp });
    expect(sig?.signature).toBe(expected);
    expect(JSON.stringify(sig)).not.toContain("s3cr3t");
  });

  it("usa carpetas distintas para referencia y resultado", () => {
    vi.stubEnv("CLOUDINARY_CLOUD_NAME", "c");
    vi.stubEnv("CLOUDINARY_API_KEY", "k");
    vi.stubEnv("CLOUDINARY_API_SECRET", "s");
    expect(signUpload("reference")?.folder).toBe("mg-estudio/reference");
    expect(signUpload("result")?.folder).toBe("mg-estudio/results");
  });
});
