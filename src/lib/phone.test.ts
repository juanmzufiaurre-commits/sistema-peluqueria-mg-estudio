import { describe, expect, it } from "vitest";
import { normalizeArgentinePhone, toWaMeNumber } from "./phone";

describe("normalizeArgentinePhone", () => {
  it.each([
    ["11 2345-6789", "+5491123456789"],
    ["1123456789", "+5491123456789"],
    ["011 15 2345-6789", "+5491123456789"],
    ["+54 9 11 2345 6789", "+5491123456789"],
    ["5491123456789", "+5491123456789"],
    ["+5491123456789", "+5491123456789"],
    ["0054 9 11 2345 6789", "+5491123456789"],
    ["0351 15 123 4567", "+5493511234567"],
    ["351 123-4567", "+5493511234567"],
    ["(11) 2345-6789", "+5491123456789"],
  ])("%s -> %s", (input, expected) => {
    expect(normalizeArgentinePhone(input)).toBe(expected);
  });

  it.each(["", "abc", "123", "0000000000", "+1 415 555 2671 99"])("rechaza '%s'", (input) => {
    expect(normalizeArgentinePhone(input)).toBeNull();
  });

  it("convierte a formato wa.me", () => expect(toWaMeNumber("+5491123456789")).toBe("5491123456789"));
});
