import { describe, it, expect, beforeAll } from "vitest";
import { runMigrations } from "@/lib/db/migrate";
import { db } from "@/lib/db/client";
import { organizations, organizationMembers, users, projects } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

describe("tenant isolation (app-level)", () => {
  beforeAll(() => {
    process.env.DATABASE_URL = "file:./data/test.db";
    runMigrations();
  });

  it("filters projects by organization", async () => {
    const u1 = "tu1", u2 = "tu2", o1 = "to1", o2 = "to2";
    await db.insert(users).values([
      { id: u1, email: "t1@x.com", passwordHash: "x", name: "T1" },
      { id: u2, email: "t2@x.com", passwordHash: "x", name: "T2" },
    ]).onConflictDoNothing();
    await db.insert(organizations).values([
      { id: o1, name: "Org1" }, { id: o2, name: "Org2" },
    ]).onConflictDoNothing();
    await db.insert(organizationMembers).values([
      { id: "tm1", organizationId: o1, userId: u1, role: "owner" },
      { id: "tm2", organizationId: o2, userId: u2, role: "owner" },
    ]).onConflictDoNothing();
    await db.insert(projects).values([
      { id: "tp1", organizationId: o1, name: "P1" },
      { id: "tp2", organizationId: o2, name: "P2" },
    ]).onConflictDoNothing();

    const org1Projects = await db.select().from(projects).where(eq(projects.organizationId, o1));
    expect(org1Projects.map(p => p.id)).toContain("tp1");
    expect(org1Projects.map(p => p.id)).not.toContain("tp2");

    // simulated cross-tenant access: query org1 with org2's project id -> empty
    const cross = await db.select().from(projects).where(and(eq(projects.id, "tp2"), eq(projects.organizationId, o1)));
    expect(cross.length).toBe(0);
  });
});
