import { describe, it, expect } from "vitest";
import { ALLOWED_MIME, MAX_FILE_BYTES, MAX_FILES_PER_UPLOAD, boqSchema, workLogSchema, variationSchema } from "@/lib/validation";

describe("validation", () => {
  it("allowlist excludes executables", () => {
    expect(ALLOWED_MIME).not.toContain("application/x-msdownload");
    expect(ALLOWED_MIME).toContain("application/pdf");
  });
  it("file size limit is 10MB", () => {
    expect(MAX_FILE_BYTES).toBe(10 * 1024 * 1024);
  });
  it("max files 5", () => {
    expect(MAX_FILES_PER_UPLOAD).toBe(5);
  });
  it("boqSchema rejects empty description", () => {
    expect(boqSchema.safeParse({ projectId: "p", description: "", unit: "nos" }).success).toBe(false);
  });
  it("boqSchema keeps quantity optional (missing stays missing)", () => {
    const r = boqSchema.safeParse({ projectId: "p", description: "x", unit: "nos" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.agreedQuantity).toBeUndefined();
  });
  it("variationSchema enum rejects unknown status", () => {
    expect(variationSchema.safeParse({ projectId: "p", description: "x", status: "approved_by_ai" }).success).toBe(false);
  });
  it("workLogSchema requires ISO date", () => {
    expect(workLogSchema.safeParse({ projectId: "p", workDate: "01-10-2026", description: "x" }).success).toBe(false);
  });
});
