import { describe, it, expect } from "vitest";
import { validateAiSuggestion, aiSuggestionSchema } from "@/lib/ai/adapter";

describe("AI schema", () => {
  it("accepts valid suggestion with reviewRequired true", () => {
    const s = validateAiSuggestion({
      workDescription: "Installed lights",
      confidence: 0.8,
      reviewRequired: true,
      sourceFile: "a.pdf",
    });
    expect(s.reviewRequired).toBe(true);
  });

  it("rejects suggestion where reviewRequired is false", () => {
    expect(() => validateAiSuggestion({
      confidence: 0.8,
      reviewRequired: false,
      sourceFile: "a.pdf",
    })).toThrow();
  });

  it("rejects malformed output (missing sourceFile)", () => {
    expect(() => validateAiSuggestion({ confidence: 0.5, reviewRequired: true })).toThrow();
  });

  it("rejects confidence out of range", () => {
    expect(() => validateAiSuggestion({ confidence: 2, reviewRequired: true, sourceFile: "a.pdf" })).toThrow();
  });

  it("rejects invalid date format", () => {
    expect(() => validateAiSuggestion({ documentDate: "01-10-2026", confidence: 0.5, reviewRequired: true, sourceFile: "a.pdf" })).toThrow();
  });
});
