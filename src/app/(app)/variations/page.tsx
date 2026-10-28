import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/context";
import { db } from "@/lib/db/client";
import { variations, projects } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { recordAudit } from "@/lib/audit";
import { Button, Card, Select } from "@/components/ui";
import Link from "next/link";

async function updateStatus(formData: FormData) {
  "use server";
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");
  const id = String(formData.get("id"));
  const status = String(formData.get("status"));
  const allowed = ["draft", "approval_requested", "approved", "rejected", "disputed"];
  if (!allowed.includes(status)) redirect("/variations");
  await db.update(variations).set({ status, updatedAt: new Date() }).where(and(eq(variations.id, id), eq(variations.organizationId, ctx.organizationId)));
  await recordAudit({ organizationId: ctx.organizationId, actorId: ctx.userId, entityType: "variation", entityId: id, eventType: "variation.status_changed", metadata: { status } });
  redirect("/variations");
}

export default async function VariationsPage() {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");
  const vs = await db.select().from(variations).where(eq(variations.organizationId, ctx.organizationId));
  const ps = await db.select().from(projects).where(eq(projects.organizationId, ctx.organizationId));
  const pmap = new Map(ps.map(p => [p.id, p.name]));
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Variations</h1>
      <Card>
        {vs.length === 0 ? <p className="text-sm text-slate-500">No variations.</p> : (
          <ul className="space-y-3 text-sm">
            {vs.map(v => (
              <li key={v.id} className="border-b pb-2">
                <div className="font-medium">{v.description}</div>
                <div className="text-slate-600">project: {pmap.get(v.projectId)} · status: {v.status} · amount: {v.requestedAmountMinorUnits != null ? (v.requestedAmountMinorUnits/100).toFixed(2) : "missing"}</div>
                <form action={updateStatus} className="mt-1 flex items-center gap-2">
                  <input type="hidden" name="id" value={v.id} />
                  <Select name="status" defaultValue={v.status}>
                    <option value="draft">draft</option>
                    <option value="approval_requested">approval requested</option>
                    <option value="approved">approved</option>
                    <option value="rejected">rejected</option>
                    <option value="disputed">disputed</option>
                  </Select>
                  <Button type="submit">Update status</Button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <p className="text-xs text-slate-500">Note: status changes require an authorized user action. Approval is never inferred from attachments.</p>
    </div>
  );
}
