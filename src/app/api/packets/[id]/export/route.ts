import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/context";
import { db } from "@/lib/db/client";
import { billingPackets, billingPacketLines, projects } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await getAuthContext();
  if (!auth) return new NextResponse("Unauthorized", { status: 401 });
  const { id } = await ctx.params;
  const [packet] = await db.select().from(billingPackets).where(and(eq(billingPackets.id, id), eq(billingPackets.organizationId, auth.organizationId))).limit(1);
  if (!packet) return new NextResponse("Not found", { status: 404 });
  const lines = await db.select().from(billingPacketLines).where(and(eq(billingPacketLines.packetId, id), eq(billingPacketLines.organizationId, auth.organizationId)));
  const [project] = await db.select().from(projects).where(eq(projects.id, packet.projectId)).limit(1);
  const warnings = packet.warningsJson ? JSON.parse(packet.warningsJson) : [];
  const url = new URL(req.url);
  const format = url.searchParams.get("format") ?? "html";

  if (format === "json") {
    const payload = { packet, project, lines, warnings, generatedAt: new Date().toISOString() };
    return new NextResponse(JSON.stringify(payload, null, 2), {
      headers: { "Content-Type": "application/json", "Content-Disposition": `attachment; filename="packet-${id}.json"` },
    });
  }
  if (format === "csv") {
    const header = "sourceType,sourceId,description,quantity,unit,rate,amount,approvalState,includedInApprovedTotal\n";
    const rows = lines.map(l =>
      [l.sourceType, l.sourceId, `"${l.descriptionSnapshot.replace(/"/g, '""')}"`, l.quantitySnapshot ?? "", l.unitSnapshot ?? "", l.rateMinorUnitsSnapshot ?? "", l.amountMinorUnitsSnapshot ?? "", l.approvalStateSnapshot ?? "", (l.sourceType === "work_log" || l.approvalStateSnapshot === "approved") ? "yes" : "no"].join(",")
    ).join("\n");
    return new NextResponse(header + rows, {
      headers: { "Content-Type": "text/csv", "Content-Disposition": `attachment; filename="packet-${id}.csv"` },
    });
  }

  // html print-ready
  const total = lines.reduce((a, l) => (l.sourceType === "work_log" || l.approvalStateSnapshot === "approved") ? a + (l.amountMinorUnitsSnapshot ?? 0) : a, 0);
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>SiteProof Packet ${id}</title>
<style>body{font-family:system-ui,sans-serif;margin:2rem;color:#111}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ddd;padding:6px;font-size:12px}h1{font-size:18px} .warn{color:#92400e}</style>
</head><body>
<h1>SiteProof Draft Billing Packet (for human review)</h1>
<p><strong>Project:</strong> ${project?.name ?? ""} · ${project?.clientName ?? ""} · ${project?.siteLabel ?? ""}</p>
<p><strong>Reference:</strong> ${project?.reference ?? "n/a"} · <strong>Currency:</strong> ${packet.currency}</p>
<p><strong>Generated (UTC):</strong> ${new Date().toISOString()}</p>
<p><strong>Packet ID:</strong> ${packet.id} · <strong>Status:</strong> ${packet.status} · <strong>Exported at:</strong> ${packet.exportedAt ? new Date(packet.exportedAt).toISOString() : "not yet"}</p>
<p><strong>Date range:</strong> ${packet.dateFrom ?? "—"} to ${packet.dateTo ?? "—"}</p>
<p><strong>Selected record IDs:</strong> ${packet.includedRecordIds ?? "[]"}</p>
<h2>Itemized register</h2>
<table><thead><tr><th>Source</th><th>Description</th><th>Qty</th><th>Unit</th><th>Rate</th><th>Amount</th><th>Approval</th><th>In approved total</th></tr></thead><tbody>
${lines.map(l => `<tr><td>${l.sourceType}</td><td>${escapeHtml(l.descriptionSnapshot)}</td><td>${l.quantitySnapshot ?? "missing"}</td><td>${l.unitSnapshot ?? ""}</td><td>${l.rateMinorUnitsSnapshot != null ? (l.rateMinorUnitsSnapshot/100).toFixed(2) : "missing"}</td><td>${l.amountMinorUnitsSnapshot != null ? (l.amountMinorUnitsSnapshot/100).toFixed(2) : "missing"}</td><td>${l.approvalStateSnapshot ?? "—"}</td><td>${(l.sourceType === "work_log" || l.approvalStateSnapshot === "approved") ? "yes" : "no (unapproved)"}</td></tr>`).join("")}
</tbody></table>
<p><strong>Approved total:</strong> ${(total/100).toFixed(2)} ${packet.currency}</p>
<h2>Unresolved warnings</h2>
${warnings.length === 0 ? "<p>None.</p>" : `<ul>${warnings.map((w: { message: string }) => `<li class="warn">${escapeHtml(w.message)}</li>`).join("")}</ul>`}
<p class="warn"><strong>Note:</strong> Draft packet for human review only. Missing values shown as missing (not fabricated). Unapproved variations excluded from approved total. No GST/tax calculation. Submission is the user's responsibility.</p>
</body></html>`;
  return new NextResponse(html, { headers: { "Content-Type": "text/html", "Content-Disposition": `inline; filename="packet-${id}.html"` } });
}

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
