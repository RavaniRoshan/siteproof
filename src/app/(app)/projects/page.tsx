import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/context";
import { db } from "@/lib/db/client";
import { projects } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { projectSchema } from "@/lib/validation";
import { recordAudit } from "@/lib/audit";
import { Button, Card, Input, Label, Alert } from "@/components/ui";
import Link from "next/link";

async function createProject(formData: FormData) {
  "use server";
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");
  const parsed = projectSchema.safeParse({
    name: formData.get("name"),
    clientName: formData.get("clientName") || "",
    siteLabel: formData.get("siteLabel") || "",
    reference: formData.get("reference") || "",
    currency: formData.get("currency") || "INR",
    timezone: formData.get("timezone") || "Asia/Kolkata",
  });
  if (!parsed.success) redirect("/projects?error=invalid");
  const d = parsed.data;
  const id = crypto.randomUUID();
  await db.insert(projects).values({
    id,
    organizationId: ctx.organizationId,
    name: d.name,
    clientName: d.clientName || null,
    siteLabel: d.siteLabel || null,
    reference: d.reference || null,
    currency: d.currency,
    timezone: d.timezone,
  });
  await recordAudit({ organizationId: ctx.organizationId, actorId: ctx.userId, entityType: "project", entityId: id, eventType: "project.created", metadata: { name: d.name } });
  redirect(`/projects/${id}`);
}

export default async function ProjectsPage() {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");
  const list = await db.select().from(projects).where(eq(projects.organizationId, ctx.organizationId));

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Projects</h1>
      <Card>
        <h2 className="mb-2 font-medium">Create project</h2>
        <form action={createProject} className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2"><Label htmlFor="name">Project name</Label><Input id="name" name="name" required /></div>
          <div><Label htmlFor="clientName">Client name</Label><Input id="clientName" name="clientName" /></div>
          <div><Label htmlFor="siteLabel">Site / location</Label><Input id="siteLabel" name="siteLabel" /></div>
          <div><Label htmlFor="reference">Reference (PO/contract no.)</Label><Input id="reference" name="reference" /></div>
          <div><Label htmlFor="currency">Currency</Label><Input id="currency" name="currency" defaultValue="INR" /></div>
          <div><Label htmlFor="timezone">Timezone</Label><Input id="timezone" name="timezone" defaultValue="Asia/Kolkata" /></div>
          <div className="sm:col-span-2"><Button type="submit">Create project</Button></div>
        </form>
      </Card>
      <Card>
        <h2 className="mb-2 font-medium">Your projects</h2>
        {list.length === 0 ? <p className="text-sm text-slate-500">No projects yet.</p> : (
          <ul className="space-y-2 text-sm">
            {list.map(p => (
              <li key={p.id} className="flex items-center justify-between">
                <Link href={`/projects/${p.id}`} className="text-blue-600 hover:underline">{p.name}</Link>
                <span className="text-slate-500">{p.clientName ?? ""} · {p.status}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
