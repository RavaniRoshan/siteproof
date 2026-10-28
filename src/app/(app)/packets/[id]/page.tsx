import { redirect, notFound } from "next/navigation";
import { getAuthContext } from "@/lib/auth/context";
import { db } from "@/lib/db/client";
import { billingPackets, billingPacketLines, projects } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { Button, Card, Alert } from "@/components/ui";
import { formatMinor } from "@/lib/money";
import Link from "next/link";

async function confirmExport(formData: FormData) {
  "use server";
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");
  const id = String(formData.get("id"));
  await db.update(billingPackets).set({ status: "exported", exportedAt: new Date() }).where(and(eq(billingPackets.id, id), eq(billingPackets.organizationId, ctx.organizationId)));
  redirect(`/api/packets/${id}/export?format=html`);
}

export default async function PacketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");
  const [packet] = await db.select().from(billingPackets).where(and(eq(billingPackets.id, id), eq(billingPackets.organizationId, ctx.organizationId))).limit(1);
  if (!packet) notFound();
  const lines = await db.select().from(billingPacketLines).where(and(eq(billingPacketLines.packetId, id), eq(billingPacketLines.organizationId, ctx.organizationId)));
  const [project] = await db.select().from(projects).where(eq(projects.id, packet.projectId)).limit(1);
  const warnings = packet.warningsJson ? JSON.parse(packet.warningsJson) : [];

  const total = lines.reduce((a, l) => l.approvalStateSnapshot === "approved" || l.sourceType === "work_log" ? a + (l.amountMinorUnitsSnapshot ?? 0) : a, 0);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Packet preview</h1>
      <Card>
        <p className="text-sm">Project: {project?.name} · Status: {packet.status} · Generated: {new Date(packet.createdAt).toLocaleString()}</p>
        <p className="text-sm">Date range: {packet.dateFrom ?? "—"} to {packet.dateTo ?? "—"}</p>
      </Card>
      {warnings.length > 0 && (
        <Card>
          <h2 className="mb-2 font-medium text-amber-700">Unresolved warnings</h2>
          <ul className="list-disc pl-5 text-sm space-y-1">
            {warnings.map((w: { message: string }, i: number) => <li key={i}>{w.message}</li>)}
          </ul>
        </Card>
      )}
      <Card>
        <h2 className="mb-2 font-medium">Itemized records</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left"><th>Source</th><th>Description</th><th>Qty</th><th>Rate</th><th>Amount</th><th>Approval</th><th>In approved total</th></tr></thead>
            <tbody>
              {lines.map(l => (
                <tr key={l.id} className="border-t">
                  <td>{l.sourceType}</td>
                  <td>{l.descriptionSnapshot}</td>
                  <td>{l.quantitySnapshot ?? "missing"}</td>
                  <td>{l.rateMinorUnitsSnapshot != null ? (l.rateMinorUnitsSnapshot/100).toFixed(2) : "missing"}</td>
                  <td>{l.amountMinorUnitsSnapshot != null ? (l.amountMinorUnitsSnapshot/100).toFixed(2) : "missing"}</td>
                  <td>{l.approvalStateSnapshot ?? "—"}</td>
                  <td>{(l.sourceType === "work_log" || l.approvalStateSnapshot === "approved") ? "yes" : "no"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-sm font-medium">Approved total (minor): {formatMinor(total, packet.currency)}</p>
        <p className="text-xs text-slate-500">Unapproved/rejected/disputed/incomplete variations are excluded from the approved total and labeled above.</p>
      </Card>
      <Card>
        <h2 className="mb-2 font-medium">Export</h2>
        <p className="text-sm text-slate-600 mb-2">Preview above. Confirm export to generate a downloadable artifact (print-ready HTML + CSV/JSON). This records the export timestamp and selected record IDs.</p>
        <form action={confirmExport}>
          <input type="hidden" name="id" value={id} />
          <Button type="submit">Confirm export</Button>
        </form>
        <div className="mt-2 flex gap-2 text-sm">
          <Link className="text-blue-600 hover:underline" href={`/api/packets/${id}/export?format=csv`}>Download CSV</Link>
          <Link className="text-blue-600 hover:underline" href={`/api/packets/${id}/export?format=json`}>Download JSON</Link>
        </div>
      </Card>
      <Link href="/packets" className="text-sm text-blue-600">Back to packets</Link>
    </div>
  );
}
