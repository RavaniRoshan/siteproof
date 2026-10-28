import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/context";
import { db } from "@/lib/db/client";
import { projects, workLogs, variations, boqItems, evidenceFiles, billingPackets, billingPacketLines } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { Button, Card, Input, Label, Select } from "@/components/ui";
import Link from "next/link";
import { buildPacketLines } from "@/lib/domain/packet";

async function createPacket(formData: FormData) {
  "use server";
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");
  const projectId = String(formData.get("projectId"));
  const dateFrom = (formData.get("dateFrom") as string) || null;
  const dateTo = (formData.get("dateTo") as string) || null;
  const selectedLogs = formData.getAll("workLogIds").map(String);
  const selectedVars = formData.getAll("variationIds").map(String);

  // load data
  const logs = await db.select().from(workLogs).where(and(eq(workLogs.projectId, projectId), eq(workLogs.organizationId, ctx.organizationId)));
  const vars = await db.select().from(variations).where(and(eq(variations.projectId, projectId), eq(variations.organizationId, ctx.organizationId)));
  const boqs = await db.select().from(boqItems).where(and(eq(boqItems.projectId, projectId), eq(boqItems.organizationId, ctx.organizationId)));
  const evs = await db.select().from(evidenceFiles).where(and(eq(evidenceFiles.projectId, projectId), eq(evidenceFiles.organizationId, ctx.organizationId)));
  const boqMap = new Map(boqs.map(b => [b.id, b]));

  const inputs = [];
  for (const id of selectedLogs) {
    const l = logs.find(x => x.id === id);
    if (!l) continue;
    const boq = l.boqItemId ? boqMap.get(l.boqItemId) : null;
    inputs.push({
      sourceType: "work_log" as const,
      sourceId: l.id,
      description: l.description,
      quantity: l.quantity,
      unit: l.unit,
      rateMinor: null,
      requestedAmountMinorUnits: null,
      boqRateMinor: boq?.rateMinorUnits ?? null,
      approvalStatus: l.status,
      boqItemId: l.boqItemId,
      hasEvidence: evs.some(e => e.workLogId === l.id),
    });
  }
  for (const id of selectedVars) {
    const v = vars.find(x => x.id === id);
    if (!v) continue;
    const boq = v.boqItemId ? boqMap.get(v.boqItemId) : null;
    inputs.push({
      sourceType: "variation" as const,
      sourceId: v.id,
      description: v.description,
      quantity: v.quantity,
      unit: v.unit,
      rateMinor: null,
      requestedAmountMinorUnits: v.requestedAmountMinorUnits,
      boqRateMinor: boq?.rateMinorUnits ?? null,
      approvalStatus: v.status,
      boqItemId: v.boqItemId,
      hasEvidence: evs.some(e => e.variationId === v.id),
    });
  }

  const { lines, warnings } = buildPacketLines(inputs);
  const packetId = crypto.randomUUID();
  await db.insert(billingPackets).values({
    id: packetId,
    organizationId: ctx.organizationId,
    projectId,
    status: "draft",
    dateFrom: dateFrom,
    dateTo: dateTo,
    currency: "INR",
    warningsJson: JSON.stringify(warnings),
    includedRecordIds: JSON.stringify([...selectedLogs.map(i=>`work_log:${i}`), ...selectedVars.map(i=>`variation:${i}`)]),
    createdBy: ctx.userId,
  });
  for (const line of lines) {
    await db.insert(billingPacketLines).values({
      id: crypto.randomUUID(),
      packetId,
      organizationId: ctx.organizationId,
      sourceType: line.sourceType,
      sourceId: line.sourceId,
      descriptionSnapshot: line.descriptionSnapshot,
      quantitySnapshot: line.quantitySnapshot,
      unitSnapshot: line.unitSnapshot,
      rateMinorUnitsSnapshot: line.rateMinorUnitsSnapshot,
      amountMinorUnitsSnapshot: line.amountMinorUnitsSnapshot,
      approvalStateSnapshot: line.approvalStateSnapshot,
    });
  }
  redirect(`/packets/${packetId}`);
}

export default async function NewPacketPage({ searchParams }: { searchParams: Promise<{ projectId?: string }> }) {
  const sp = await searchParams;
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");
  const prs = await db.select().from(projects).where(eq(projects.organizationId, ctx.organizationId));
  const projectId = sp.projectId;

  if (!projectId) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">New packet — choose project</h1>
        <Card>
          <ul className="space-y-2 text-sm">
            {prs.map(p => (
              <li key={p.id}><Link className="text-blue-600 hover:underline" href={`/packets/new?projectId=${p.id}`}>{p.name}</Link></li>
            ))}
          </ul>
        </Card>
      </div>
    );
  }

  const logs = await db.select().from(workLogs).where(and(eq(workLogs.projectId, projectId), eq(workLogs.organizationId, ctx.organizationId)));
  const vars = await db.select().from(variations).where(and(eq(variations.projectId, projectId), eq(variations.organizationId, ctx.organizationId)));

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">New packet</h1>
      <form action={createPacket} className="space-y-4">
        <input type="hidden" name="projectId" value={projectId} />
        <Card>
          <div className="grid gap-3 sm:grid-cols-2">
            <div><Label>Date from</Label><Input name="dateFrom" type="date" /></div>
            <div><Label>Date to</Label><Input name="dateTo" type="date" /></div>
          </div>
        </Card>
        <Card>
          <h2 className="mb-2 font-medium">Select work logs</h2>
          {logs.length === 0 ? <p className="text-sm text-slate-500">None.</p> : logs.map(l => (
            <label key={l.id} className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="workLogIds" value={l.id} />
              {l.workDate} — {l.description}
            </label>
          ))}
        </Card>
        <Card>
          <h2 className="mb-2 font-medium">Select variations</h2>
          {vars.length === 0 ? <p className="text-sm text-slate-500">None.</p> : vars.map(v => (
            <label key={v.id} className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="variationIds" value={v.id} />
              {v.description} ({v.status})
            </label>
          ))}
        </Card>
        <Button type="submit">Create draft packet</Button>
      </form>
    </div>
  );
}
