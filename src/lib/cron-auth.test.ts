import { afterEach, describe, expect, it, vi } from "vitest";
import { checkCronAuth } from "./cron-auth";

const req = (auth?: string) => new Request("http://x/api/cron/morning", { headers: auth ? { authorization: auth } : {} });

describe("checkCronAuth", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("cierra el endpoint si no hay CRON_SECRET", () => {
    vi.stubEnv("CRON_SECRET", "");
    expect(checkCronAuth(req("Bearer algo"))).toBe(503);
  });

  it("rechaza sin header, con esquema incorrecto o con secreto equivocado", () => {
    vi.stubEnv("CRON_SECRET", "s3cr3t");
    expect(checkCronAuth(req())).toBe(401);
    expect(checkCronAuth(req("s3cr3t"))).toBe(401);
    expect(checkCronAuth(req("Bearer otro"))).toBe(401);
    expect(checkCronAuth(req("Bearer s3cr3t-extra"))).toBe(401);
  });

  it("acepta el secreto correcto", () => {
    vi.stubEnv("CRON_SECRET", "s3cr3t");
    expect(checkCronAuth(req("Bearer s3cr3t"))).toBeNull();
  });
});
