import { getSession } from "./session";
import { db } from "../db/client";
import { organizationMembers, organizations } from "../db/schema";
import { eq } from "drizzle-orm";

export type AuthContext = {
  userId: string;
  email: string;
  organizationId: string;
  role: string;
};

export async function getAuthContext(): Promise<AuthContext | null> {
  const session = await getSession();
  if (!session) return null;
  const [membership] = await db
    .select({ orgId: organizationMembers.organizationId, role: organizationMembers.role })
    .from(organizationMembers)
    .where(eq(organizationMembers.userId, session.userId))
    .limit(1);
  if (!membership) return null;
  return { userId: session.userId, email: session.email, organizationId: membership.orgId, role: membership.role };
}

export async function requireAuth(): Promise<AuthContext> {
  const ctx = await getAuthContext();
  if (!ctx) throw new Error("UNAUTHORIZED");
  return ctx;
}

export async function ensureOrganizationForUser(userId: string, name: string) {
  const id = crypto.randomUUID();
  await db.insert(organizations).values({ id, name });
  await db.insert(organizationMembers).values({ id: crypto.randomUUID(), organizationId: id, userId, role: "owner" });
  const { organizationSettings } = await import("../db/schema");
  await db.insert(organizationSettings).values({ organizationId: id, aiEnabled: false });
  return id;
}
