import "dotenv/config";
import { db } from "../src/lib/db/client";
import { users, organizations, organizationMembers, organizationSettings, projects, boqItems, workLogs, evidenceFiles, variations } from "../src/lib/db/schema";
import { hashPassword } from "../src/lib/auth/password";
import fs from "node:fs";
import path from "node:path";

async function main() {
  const email = "demo@siteproof.local";
  const password = "demo-password-123";
  const userId = "demo-user-1";
  const orgId = "demo-org-1";
  const projectId = "demo-project-1";

  await db.insert(users).values({ id: userId, email, passwordHash: await hashPassword(password), name: "Demo Owner" }).onConflictDoNothing();
  await db.insert(organizations).values({ id: orgId, name: "Demo Electrical Contractors (synthetic)" }).onConflictDoNothing();
  await db.insert(organizationMembers).values({ id: "demo-mem-1", organizationId: orgId, userId, role: "owner" }).onConflictDoNothing();
  await db.insert(organizationSettings).values({ organizationId: orgId, aiEnabled: false }).onConflictDoNothing();

  await db.insert(projects).values({
    id: projectId, organizationId: orgId, name: "Site A – Electrical Fit-out (DEMO)", clientName: "Acme Builders (synthetic)",
    siteLabel: "Block 2, Phase 1", reference: "PO-DEMO-001", currency: "INR", timezone: "Asia/Kolkata", status: "active",
  }).onConflictDoNothing();

  const boq1 = "demo-boq-1", boq2 = "demo-boq-2";
  await db.insert(boqItems).values([
    { id: boq1, organizationId: orgId, projectId, sourceReference: "PO-DEMO-001", lineCode: "E-101", description: "LED panel lights supply & install", unit: "nos", agreedQuantity: 120, rateMinorUnits: 85000, currency: "INR", dataSource: "user_entered" },
    { id: boq2, organizationId: orgId, projectId, sourceReference: "PO-DEMO-001", lineCode: "E-202", description: "Copper cable 4 sqmm", unit: "m", agreedQuantity: 500, rateMinorUnits: 12000, currency: "INR", dataSource: "user_entered" },
  ]).onConflictDoNothing();

  const wl1 = "demo-wl-1", wl2 = "demo-wl-2";
  await db.insert(workLogs).values([
    { id: wl1, organizationId: orgId, projectId, boqItemId: boq1, workDate: "2026-10-01", description: "Installed 40 LED panel lights on 2nd floor", quantity: 40, unit: "nos", createdBy: userId },
    { id: wl2, organizationId: orgId, projectId, boqItemId: boq2, workDate: "2026-10-03", description: "Laid 120 m cable in corridor", quantity: 120, unit: "m", createdBy: userId },
  ]).onConflictDoNothing();

  // synthetic evidence file (text placeholder)
  const storageRoot = path.resolve(process.env.STORAGE_DIR ?? "./data/uploads");
  fs.mkdirSync(path.join(storageRoot, orgId, projectId), { recursive: true });
  const evPath = path.join(orgId, projectId, "demo-evidence-1.txt");
  fs.writeFileSync(path.join(storageRoot, evPath), "Synthetic demo evidence file. Not real customer data.");
  await db.insert(evidenceFiles).values({
    id: "demo-ev-1", organizationId: orgId, projectId, workLogId: wl1, storagePath: evPath,
    originalFilename: "demo-photo-1.txt", mimeType: "text/plain", sizeBytes: 60, sourceKind: "upload", createdBy: userId,
  }).onConflictDoNothing();

  await db.insert(variations).values({
    id: "demo-var-1", organizationId: orgId, projectId, boqItemId: boq1, description: "Extra conduit run for revised layout",
    workDate: "2026-10-05", quantity: 30, unit: "m", requestedAmountMinorUnits: 450000, status: "approval_requested",
    reason: "Client changed layout", createdBy: userId,
  }).onConflictDoNothing();

  console.log("Seeded demo user:", email, "/", password);
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
