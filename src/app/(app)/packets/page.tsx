import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/context";
import { db } from "@/lib/db/client";
import { billingPackets, projects } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Button, Card } from "@/components/ui";
import Link from "next/link";

export default async function PacketsPage() {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");
  const ps = await db.select().from(billingPackets).where(eq(billingPackets.organizationId, ctx.organizationId));
  const prs = await db.select().from(projects).where(eq(projects.organizationId, ctx.organizationId));
  const pmap = new Map(prs.map(p => [p.id, p.name]));
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Billing packets</h1>
      <Card>
        <Link href="/packets/new" className="text-blue-600 hover:underline">Create new packet →</Link>
      </Card>
      <Card>
        {ps.length === 0 ? <p className="text-sm text-slate-500">No packets yet.</p> : (
          <ul className="space-y-2 text-sm">
            {ps.map(p => (
              <li key={p.id} className="flex items-center justify-between">
                <Link href={`/packets/${p.id}`} className="text-blue-600 hover:underline">{pmap.get(p.projectId)} · {p.status}</Link>
                <span className="text-slate-500">{new Date(p.createdAt).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
