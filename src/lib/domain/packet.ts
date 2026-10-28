import { multiplyMinor } from "../money";

export type PacketWarning = { code: string; message: string; sourceType?: string; sourceId?: string };

export type PacketLineInput = {
  sourceType: "work_log" | "variation";
  sourceId: string;
  description: string;
  quantity: number | null;
  unit: string | null;
  rateMinor: number | null; // for work logs via boq; for variations requested amount
  requestedAmountMinorUnits: number | null;
  boqRateMinor: number | null;
  approvalStatus: string | null; // variation status or work log status
  boqItemId: string | null;
  hasEvidence: boolean;
};

export type PacketLine = {
  sourceType: "work_log" | "variation";
  sourceId: string;
  descriptionSnapshot: string;
  quantitySnapshot: number | null;
  unitSnapshot: string | null;
  rateMinorUnitsSnapshot: number | null;
  amountMinorUnitsSnapshot: number | null;
  approvalStateSnapshot: string | null;
  includedInApprovedTotal: boolean;
};

export function buildPacketLines(inputs: PacketLineInput[]): { lines: PacketLine[]; warnings: PacketWarning[] } {
  const lines: PacketLine[] = [];
  const warnings: PacketWarning[] = [];

  for (const i of inputs) {
    let rate = i.rateMinor;
    // work logs: use BOQ rate if present
    if (i.sourceType === "work_log" && rate == null) rate = i.boqRateMinor;

    let amount: number | null = null;
    if (i.sourceType === "work_log") {
      amount = multiplyMinor(i.quantity, rate);
      if (i.quantity == null) warnings.push({ code: "MISSING_QUANTITY", message: `Work log ${i.sourceId}: quantity missing`, sourceType: i.sourceType, sourceId: i.sourceId });
      if (rate == null) warnings.push({ code: "MISSING_RATE", message: `Work log ${i.sourceId}: rate missing`, sourceType: i.sourceType, sourceId: i.sourceId });
      if (!i.hasEvidence) warnings.push({ code: "MISSING_EVIDENCE", message: `Work log ${i.sourceId}: no evidence attached`, sourceType: i.sourceType, sourceId: i.sourceId });
      if (i.boqItemId == null) warnings.push({ code: "NO_BOQ_LINK", message: `Work log ${i.sourceId}: not linked to a BOQ item`, sourceType: i.sourceType, sourceId: i.sourceId });
    } else {
      // variation
      if (i.requestedAmountMinorUnits != null) {
        // amount may be requested; use requested amount
      }
      amount = i.requestedAmountMinorUnits ?? multiplyMinor(i.quantity, rate);
      const status = i.approvalStatus ?? "draft";
      if (status !== "approved") {
        warnings.push({ code: "UNAPPROVED_VARIATION", message: `Variation ${i.sourceId}: status is "${status}" (not approved)`, sourceType: i.sourceType, sourceId: i.sourceId });
      }
      if (!i.hasEvidence) warnings.push({ code: "MISSING_EVIDENCE", message: `Variation ${i.sourceId}: no evidence attached`, sourceType: i.sourceType, sourceId: i.sourceId });
    }

    const includedInApprovedTotal =
      i.sourceType === "work_log" ? true : (i.approvalStatus === "approved");

    lines.push({
      sourceType: i.sourceType,
      sourceId: i.sourceId,
      descriptionSnapshot: i.description,
      quantitySnapshot: i.quantity,
      unitSnapshot: i.unit,
      rateMinorUnitsSnapshot: rate,
      amountMinorUnitsSnapshot: amount,
      approvalStateSnapshot: i.approvalStatus,
      includedInApprovedTotal,
    });
  }

  return { lines, warnings };
}

export function approvedTotalMinor(lines: PacketLine[]): number {
  return lines.reduce((acc, l) => {
    if (!l.includedInApprovedTotal) return acc;
    return acc + (l.amountMinorUnitsSnapshot ?? 0);
  }, 0);
}
