import { describe, it, expect } from "vitest";
import { multiplyMinor, formatMinor } from "@/lib/money";

describe("money", () => {
  it("multiplies quantity by rate in minor units", () => {
    expect(multiplyMinor(40, 85000)).toBe(3400000);
  });
  it("returns null when quantity missing", () => {
    expect(multiplyMinor(null, 85000)).toBeNull();
  });
  it("returns null when rate missing", () => {
    expect(multiplyMinor(40, null)).toBeNull();
  });
  it("formats missing as 'missing'", () => {
    expect(formatMinor(null)).toBe("missing");
  });
  it("formats minor units as currency", () => {
    expect(formatMinor(3400000, "INR")).toContain("34,000");
  });
});
