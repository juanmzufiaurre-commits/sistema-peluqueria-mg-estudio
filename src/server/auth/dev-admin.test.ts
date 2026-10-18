import { afterEach, describe, expect, it, vi } from "vitest";
import { devAdminEmail } from "./dev-admin";

describe("devAdminEmail", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("nunca se activa en producción, aunque la variable exista", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DEV_ADMIN_EMAIL", "admin@local.test");
    expect(devAdminEmail()).toBeNull();
  });

  it("tampoco en tests", () => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("DEV_ADMIN_EMAIL", "admin@local.test");
    expect(devAdminEmail()).toBeNull();
  });

  it("en desarrollo, solo si DEV_ADMIN_EMAIL está definida", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("DEV_ADMIN_EMAIL", "");
    expect(devAdminEmail()).toBeNull();
    vi.stubEnv("DEV_ADMIN_EMAIL", " Admin@Local.Test ");
    expect(devAdminEmail()).toBe("admin@local.test");
  });
});
