import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/context";
import { db } from "@/lib/db/client";
import { organizationSettings, organizations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Button, Card } from "@/components/ui";

async function toggleAi(formData: FormData) {
  "use server";
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");
  const enable = formData.get("enable") === "on";
  await db.insert(organizationSettings).values({ organizationId: ctx.organizationId, aiEnabled: enable, aiConsentAt: enable ? new Date() : null, updatedAt: new Date() })
    .onConflictDoUpdate({ target: organizationSettings.organizationId, set: { aiEnabled: enable, aiConsentAt: enable ? new Date() : null, updatedAt: new Date() } });
  redirect("/settings");
}

export default async function SettingsPage() {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");
  const [org] = await db.select().from(organizations).where(eq(organizations.id, ctx.organizationId)).limit(1);
  const [settings] = await db.select().from(organizationSettings).where(eq(organizationSettings.organizationId, ctx.organizationId)).limit(1);
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <Card>
        <p className="text-sm">Organization: {org?.name}</p>
        <p className="text-sm">Role: {ctx.role}</p>
        <p className="text-sm">AI processing: {settings?.aiEnabled ? "enabled (consent recorded)" : "disabled (manual mode)"}</p>
      </Card>
      <Card>
        <h2 className="mb-2 font-medium">AI extraction consent</h2>
        <p className="text-sm text-slate-600 mb-2">AI is disabled unless configured and explicitly enabled. No evidence is sent externally without consent. Manual workflow remains fully functional.</p>
        <form action={toggleAi} className="flex items-center gap-2">
          <input type="checkbox" name="enable" defaultChecked={!!settings?.aiEnabled} />
          <span className="text-sm">Enable AI extraction (requires server-configured provider)</span>
          <Button type="submit">Save</Button>
        </form>
      </Card>
    </div>
  );
}
