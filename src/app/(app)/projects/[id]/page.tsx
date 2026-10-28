import { redirect, notFound } from "next/navigation";
import { getAuthContext } from "@/lib/auth/context";
import { db } from "@/lib/db/client";
import { projects, boqItems, workLogs, variations, evidenceFiles } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { projectSchema, boqSchema, workLogSchema, variationSchema } from "@/lib/validation";
import { recordAudit } from "@/lib/audit";
import { Button, Card, Input, Label, Textarea, Select, Alert } from "@/components/ui";
import Link from "next/link";

async function addBoq(formData: FormData) {
  "use server";
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");
  const projectId = String(formData.get("projectId"));
  const parsed = boqSchema.safeParse({
    projectId,
    sourceReference: formData.get("sourceReference") || "",
    lineCode: formData.get("lineCode") || "",
    description: formData.get("description"),
    unit: formData.get("unit"),
    agreedQuantity: formData.get("agreedQuantity") || null,
    rateMinorUnits: formData.get("rateMinorUnits") || null,
    notes: formData.get("notes") || "",
  });
  if (!parsed.success) redirect(`/projects/${projectId}?error=invalid`);
  const d = parsed.data;
  const boqId = crypto.randomUUID();
  await db.insert(boqItems).values({
    id: boqId,
    organizationId: ctx.organizationId,
    projectId: d.projectId,
    sourceReference: d.sourceReference || null,
    lineCode: d.lineCode || null,
    description: d.description,
    unit: d.unit,
    agreedQuantity: d.agreedQuantity ?? null,
    rateMinorUnits: d.rateMinorUnits ?? null,
    notes: d.notes || null,
  });
  await recordAudit({ organizationId: ctx.organizationId, actorId: ctx.userId, entityType: "boq_item", entityId: boqId, eventType: "boq_item.created" });
  redirect(`/projects/${projectId}`);
}

async function addWorkLog(formData: FormData) {
  "use server";
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");
  const projectId = String(formData.get("projectId"));
  const parsed = workLogSchema.safeParse({
    projectId,
    boqItemId: formData.get("boqItemId") || "",
    workDate: formData.get("workDate"),
    description: formData.get("description"),
    quantity: formData.get("quantity") || null,
    unit: formData.get("unit") || "",
    notes: formData.get("notes") || "",
  });
  if (!parsed.success) redirect(`/projects/${projectId}?error=invalid`);
  const d = parsed.data;
  const wlId = crypto.randomUUID();
  await db.insert(workLogs).values({
    id: wlId,
    organizationId: ctx.organizationId,
    projectId: d.projectId,
    boqItemId: d.boqItemId || null,
    workDate: d.workDate,
    description: d.description,
    quantity: d.quantity ?? null,
    unit: d.unit || null,
    notes: d.notes || null,
    createdBy: ctx.userId,
  });
  await recordAudit({ organizationId: ctx.organizationId, actorId: ctx.userId, entityType: "work_log", entityId: wlId, eventType: "work_log.created" });
  redirect(`/projects/${projectId}`);
}

async function addVariation(formData: FormData) {
  "use server";
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");
  const projectId = String(formData.get("projectId"));
  const parsed = variationSchema.safeParse({
    projectId,
    boqItemId: formData.get("boqItemId") || "",
    description: formData.get("description"),
    workDate: formData.get("workDate") || "",
    quantity: formData.get("quantity") || null,
    unit: formData.get("unit") || "",
    requestedAmountMinorUnits: formData.get("requestedAmountMinorUnits") || null,
    reason: formData.get("reason") || "",
    status: formData.get("status") || "draft",
    externalReference: formData.get("externalReference") || "",
  });
  if (!parsed.success) redirect(`/projects/${projectId}?error=invalid`);
  const d = parsed.data;
  const varId = crypto.randomUUID();
  await db.insert(variations).values({
    id: varId,
    organizationId: ctx.organizationId,
    projectId: d.projectId,
    boqItemId: d.boqItemId || null,
    description: d.description,
    workDate: d.workDate || null,
    quantity: d.quantity ?? null,
    unit: d.unit || null,
    requestedAmountMinorUnits: d.requestedAmountMinorUnits ?? null,
    reason: d.reason || null,
    status: d.status,
    externalReference: d.externalReference || null,
    createdBy: ctx.userId,
  });
  await recordAudit({ organizationId: ctx.organizationId, actorId: ctx.userId, entityType: "variation", entityId: varId, eventType: "variation.created", metadata: { status: d.status } });
  redirect(`/projects/${projectId}`);
}

async function uploadEvidence(formData: FormData) {
  "use server";
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");
  const projectId = String(formData.get("projectId"));
  const workLogId = (formData.get("workLogId") as string) || null;
  const variationId = (formData.get("variationId") as string) || null;
  const files = formData.getAll("files") as File[];
  const { ALLOWED_MIME, MAX_FILE_BYTES, MAX_FILES_PER_UPLOAD } = await import("@/lib/validation");
  if (files.length > MAX_FILES_PER_UPLOAD) redirect(`/projects/${projectId}?error=too_many`);
  const { saveFile } = await import("@/lib/storage");
  for (const f of files) {
    if (!(f instanceof File) || f.size === 0) continue;
    if (!ALLOWED_MIME.includes(f.type)) redirect(`/projects/${projectId}?error=bad_mime`);
    if (f.size > MAX_FILE_BYTES) redirect(`/projects/${projectId}?error=too_big`);
    const buf = Buffer.from(await f.arrayBuffer());
    const { storagePath, size } = saveFile(ctx.organizationId, projectId, buf, f.name);
    const evId = crypto.randomUUID();
    await db.insert(evidenceFiles).values({
      id: evId,
      organizationId: ctx.organizationId,
      projectId,
      workLogId,
      variationId,
      storagePath,
      originalFilename: f.name,
      mimeType: f.type,
      sizeBytes: size,
      sourceKind: "upload",
      createdBy: ctx.userId,
    });
    await recordAudit({ organizationId: ctx.organizationId, actorId: ctx.userId, entityType: "evidence_file", entityId: evId, eventType: "evidence.uploaded", metadata: { mimeType: f.type, size } });
  }
  redirect(`/projects/${projectId}`);
}

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");
  const [project] = await db.select().from(projects).where(and(eq(projects.id, id), eq(projects.organizationId, ctx.organizationId))).limit(1);
  if (!project) notFound();

  const boq = await db.select().from(boqItems).where(and(eq(boqItems.projectId, id), eq(boqItems.organizationId, ctx.organizationId)));
  const logs = await db.select().from(workLogs).where(and(eq(workLogs.projectId, id), eq(workLogs.organizationId, ctx.organizationId)));
  const vars = await db.select().from(variations).where(and(eq(variations.projectId, id), eq(variations.organizationId, ctx.organizationId)));
  const evs = await db.select().from(evidenceFiles).where(and(eq(evidenceFiles.projectId, id), eq(evidenceFiles.organizationId, ctx.organizationId)));

  // missing checklist
  const warnings: string[] = [];
  if (boq.length === 0) warnings.push("No BOQ/purchase-order items added.");
  for (const l of logs) {
    if (l.boqItemId == null) warnings.push(`Work log ${l.workDate}: not linked to a BOQ item.`);
    if (l.quantity == null) warnings.push(`Work log ${l.workDate}: quantity missing.`);
    const hasEv = evs.some(e => e.workLogId === l.id);
    if (!hasEv) warnings.push(`Work log ${l.workDate}: no evidence attached.`);
  }
  for (const v of vars) {
    if (v.status !== "approved") warnings.push(`Variation: ${v.description.slice(0, 40)} — status ${v.status}.`);
    const hasEv = evs.some(e => e.variationId === v.id);
    if (!hasEv) warnings.push(`Variation: ${v.description.slice(0, 40)} — no evidence attached.`);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{project.name}</h1>
        <Link href="/projects" className="text-sm text-blue-600">Back</Link>
      </div>
      <Card>
        <p className="text-sm text-slate-600">{project.clientName} · {project.siteLabel} · {project.reference} · {project.currency} · {project.timezone}</p>
        <p className="text-xs text-amber-700 mt-1">Status: {project.status}. Missing items below affect packet readiness.</p>
      </Card>

      {warnings.length > 0 && (
        <Card>
          <h2 className="mb-2 font-medium text-amber-700">Missing information checklist</h2>
          <ul className="list-disc pl-5 text-sm space-y-1">
            {warnings.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
        </Card>
      )}

      {/* BOQ items */}
      <Card>
        <h2 className="mb-2 font-medium">BOQ / Purchase order items</h2>
        {boq.length === 0 ? <p className="text-sm text-slate-500">No BOQ items.</p> : (
          <ul className="text-sm space-y-1">
            {boq.map(b => (
              <li key={b.id}>{b.lineCode ? `${b.lineCode} ` : ""}{b.description} — unit: {b.unit}, qty: {b.agreedQuantity ?? "missing"}, rate: {b.rateMinorUnits != null ? (b.rateMinorUnits/100).toFixed(2) : "missing"} {b.currency}</li>
            ))}
          </ul>
        )}
        <details className="mt-3">
          <summary className="cursor-pointer text-sm text-blue-600">Add BOQ item</summary>
          <form action={addBoq} className="mt-2 grid gap-2 sm:grid-cols-2">
            <input type="hidden" name="projectId" value={id} />
            <div><Label>Source reference</Label><Input name="sourceReference" /></div>
            <div><Label>Line code</Label><Input name="lineCode" /></div>
            <div className="sm:col-span-2"><Label>Description</Label><Input name="description" required /></div>
            <div><Label>Unit</Label><Input name="unit" required /></div>
            <div><Label>Agreed quantity (optional)</Label><Input name="agreedQuantity" type="number" step="any" /></div>
            <div><Label>Rate (minor units, optional)</Label><Input name="rateMinorUnits" type="number" /></div>
            <div className="sm:col-span-2"><Label>Notes</Label><Input name="notes" /></div>
            <div className="sm:col-span-2"><Button type="submit">Add BOQ item</Button></div>
          </form>
        </details>
      </Card>

      {/* Work logs */}
      <Card>
        <h2 className="mb-2 font-medium">Work logs</h2>
        {logs.length === 0 ? <p className="text-sm text-slate-500">No work logs.</p> : (
          <ul className="text-sm space-y-2">
            {logs.map(l => (
              <li key={l.id} className="border-b pb-2">
                <div className="font-medium">{l.workDate} — {l.description}</div>
                <div className="text-slate-600">qty: {l.quantity ?? "missing"} {l.unit ?? ""} · BOQ: {l.boqItemId ? "linked" : "none"} · evidence: {evs.filter(e=>e.workLogId===l.id).length}</div>
              </li>
            ))}
          </ul>
        )}
        <details className="mt-3">
          <summary className="cursor-pointer text-sm text-blue-600">Add work log</summary>
          <form action={addWorkLog} className="mt-2 grid gap-2 sm:grid-cols-2">
            <input type="hidden" name="projectId" value={id} />
            <div><Label>Work date</Label><Input name="workDate" type="date" required defaultValue={new Date().toISOString().slice(0,10)} /></div>
            <div><Label>BOQ item</Label>
              <Select name="boqItemId" defaultValue="">
                <option value="">(none)</option>
                {boq.map(b => <option key={b.id} value={b.id}>{b.lineCode ? b.lineCode+" " : ""}{b.description}</option>)}
              </Select>
            </div>
            <div className="sm:col-span-2"><Label>Description</Label><Textarea name="description" required rows={2} /></div>
            <div><Label>Quantity (optional)</Label><Input name="quantity" type="number" step="any" /></div>
            <div><Label>Unit</Label><Input name="unit" /></div>
            <div className="sm:col-span-2"><Label>Notes</Label><Input name="notes" /></div>
            <div className="sm:col-span-2"><Button type="submit">Add work log</Button></div>
          </form>
        </details>
      </Card>

      {/* Variations */}
      <Card>
        <h2 className="mb-2 font-medium">Variations / extra work</h2>
        {vars.length === 0 ? <p className="text-sm text-slate-500">No variations.</p> : (
          <ul className="text-sm space-y-2">
            {vars.map(v => (
              <li key={v.id} className="border-b pb-2">
                <div className="font-medium">{v.description}</div>
                <div className="text-slate-600">status: {v.status} · qty: {v.quantity ?? "missing"} {v.unit ?? ""} · amount: {v.requestedAmountMinorUnits != null ? (v.requestedAmountMinorUnits/100).toFixed(2) : "missing"} · evidence: {evs.filter(e=>e.variationId===v.id).length}</div>
              </li>
            ))}
          </ul>
        )}
        <details className="mt-3">
          <summary className="cursor-pointer text-sm text-blue-600">Add variation</summary>
          <form action={addVariation} className="mt-2 grid gap-2 sm:grid-cols-2">
            <input type="hidden" name="projectId" value={id} />
            <div className="sm:col-span-2"><Label>Description</Label><Textarea name="description" required rows={2} /></div>
            <div><Label>Work date</Label><Input name="workDate" type="date" /></div>
            <div><Label>BOQ item</Label>
              <Select name="boqItemId" defaultValue="">
                <option value="">(none)</option>
                {boq.map(b => <option key={b.id} value={b.id}>{b.lineCode ? b.lineCode+" " : ""}{b.description}</option>)}
              </Select>
            </div>
            <div><Label>Quantity (optional)</Label><Input name="quantity" type="number" step="any" /></div>
            <div><Label>Unit</Label><Input name="unit" /></div>
            <div><Label>Requested amount (minor units, optional)</Label><Input name="requestedAmountMinorUnits" type="number" /></div>
            <div><Label>Status</Label>
              <Select name="status" defaultValue="draft">
                <option value="draft">draft</option>
                <option value="approval_requested">approval requested</option>
                <option value="approved">approved</option>
                <option value="rejected">rejected</option>
                <option value="disputed">disputed</option>
              </Select>
            </div>
            <div><Label>External approval reference</Label><Input name="externalReference" /></div>
            <div className="sm:col-span-2"><Label>Reason</Label><Input name="reason" /></div>
            <div className="sm:col-span-2"><Button type="submit">Add variation</Button></div>
          </form>
        </details>
      </Card>

      {/* Evidence upload */}
      <Card>
        <h2 className="mb-2 font-medium">Attach evidence</h2>
        <form action={uploadEvidence} className="space-y-2" encType="multipart/form-data">
          <input type="hidden" name="projectId" value={id} />
          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <Label>Link to work log</Label>
              <Select name="workLogId" defaultValue="">
                <option value="">(none)</option>
                {logs.map(l => <option key={l.id} value={l.id}>{l.workDate} — {l.description.slice(0,40)}</option>)}
              </Select>
            </div>
            <div>
              <Label>Link to variation</Label>
              <Select name="variationId" defaultValue="">
                <option value="">(none)</option>
                {vars.map(v => <option key={v.id} value={v.id}>{v.description.slice(0,40)}</option>)}
              </Select>
            </div>
          </div>
          <div><Label>Files (max 5, 10MB each)</Label><input type="file" name="files" multiple accept="image/*,application/pdf,text/plain" className="text-sm" /></div>
          <Button type="submit">Upload</Button>
        </form>
        {evs.length > 0 && (
          <ul className="mt-3 text-xs space-y-1">
            {evs.map(e => (
              <li key={e.id}><a className="text-blue-600 hover:underline" href={`/api/evidence/${e.id}`}>{e.originalFilename}</a> · {e.mimeType} · {Math.round(e.sizeBytes/1024)}KB</li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
