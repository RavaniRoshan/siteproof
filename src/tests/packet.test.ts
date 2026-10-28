import { describe, it, expect } from "vitest";
import { buildPacketLines, approvedTotalMinor } from "@/lib/domain/packet";

describe("packet selection", () => {
  it("keeps missing quantities missing and warns", () => {
    const { lines, warnings } = buildPacketLines([
      { sourceType: "work_log", sourceId: "w1", description: "work", quantity: null, unit: "nos", rateMinor: null, requestedAmountMinorUnits: null, boqRateMinor: null, approvalStatus: "draft", boqItemId: "b1", hasEvidence: true },
    ]);
    expect(lines[0].quantitySnapshot).toBeNull();
    expect(lines[0].amountMinorUnitsSnapshot).toBeNull();
    expect(warnings.some(w => w.code === "MISSING_QUANTITY")).toBe(true);
    expect(warnings.some(w => w.code === "MISSING_RATE")).toBe(true);
  });

  it("excludes unapproved variation from approved total", () => {
    const { lines } = buildPacketLines([
      { sourceType: "variation", sourceId: "v1", description: "extra", quantity: 30, unit: "m", rateMinor: null, requestedAmountMinorUnits: 450000, boqRateMinor: null, approvalStatus: "approval_requested", boqItemId: null, hasEvidence: false },
    ]);
    expect(lines[0].includedInApprovedTotal).toBe(false);
    expect(approvedTotalMinor(lines)).toBe(0);
    expect(lines[0].amountMinorUnitsSnapshot).toBe(450000);
  });

  it("includes approved variation in approved total", () => {
    const { lines } = buildPacketLines([
      { sourceType: "variation", sourceId: "v2", description: "extra", quantity: 30, unit: "m", rateMinor: null, requestedAmountMinorUnits: 450000, boqRateMinor: null, approvalStatus: "approved", boqItemId: null, hasEvidence: true },
    ]);
    expect(lines[0].includedInApprovedTotal).toBe(true);
    expect(approvedTotalMinor(lines)).toBe(450000);
  });

  it("warns on unapproved variation and missing evidence", () => {
    const { warnings } = buildPacketLines([
      { sourceType: "variation", sourceId: "v1", description: "extra", quantity: null, unit: null, rateMinor: null, requestedAmountMinorUnits: null, boqRateMinor: null, approvalStatus: "draft", boqItemId: null, hasEvidence: false },
    ]);
    expect(warnings.some(w => w.code === "UNAPPROVED_VARIATION")).toBe(true);
    expect(warnings.some(w => w.code === "MISSING_EVIDENCE")).toBe(true);
  });
});
