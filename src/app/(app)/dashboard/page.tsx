import { getAuthContext } from "@/lib/auth/context";
import { db } from "@/lib/db/client";
import { projects, workLogs, variations, billingPackets } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { Card } from "@/components/ui";

export default async function DashboardPage() {
  const ctx = await getAuthContext();
  if (!ctx) return null;
  const orgId = ctx.organizationId;
  const projectList = await db.select().from(projects).where(eq(projects.organizationId, orgId));
  const wl = await db.select().from(workLogs).where(eq(workLogs.organizationId, orgId));
  const vs = await db.select().from(variations).where(eq(variations.organizationId, orgId));
  const pks = await db.select().from(billingPackets).where(eq(billingPackets.organizationId, orgId));

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="text-sm text-slate-600">Demo data only. All values are user-entered; nothing is auto-submitted.</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card><div className="text-xs text-slate-500">Projects</div><div className="text-2xl font-bold">{projectList.length}</div></Card>
        <Card><div className="text-xs text-slate-500">Work logs</div><div className="text-2xl font-bold">{wl.length}</div></Card>
        <Card><div className="text-xs text-slate-500">Variations</div><div className="text-2xl font-bold">{vs.length}</div></Card>
        <Card><div className="text-xs text-slate-500">Packets</div><div className="text-2xl font-bold">{pks.length}</div></Card>
      </div>
      <Card>
        <h2 className="mb-2 font-medium">Projects needing review</h2>
        {projectList.length === 0 ? <p className="text-sm text-slate-500">No projects yet. Create one to get started.</p> : (
          <ul className="space-y-1 text-sm">
            {projectList.map(p => (
              <li key={p.id}><a className="text-blue-600 hover:underline" href={`/projects/${p.id}`}>{p.name}</a> — {p.clientName ?? "no client"} ({p.status})</li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
