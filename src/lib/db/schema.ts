import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

const ts = (name: string) => integer(name, { mode: "timestamp_ms" });

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name"),
  createdAt: ts("created_at").notNull().default(sql`(unixepoch() * 1000)`),
});

export const organizations = sqliteTable("organizations", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: ts("created_at").notNull().default(sql`(unixepoch() * 1000)`),
});

export const organizationMembers = sqliteTable("organization_members", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: text("role").notNull().default("owner"), // owner | admin | supervisor | viewer
  createdAt: ts("created_at").notNull().default(sql`(unixepoch() * 1000)`),
});

export const projects = sqliteTable("projects", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  clientName: text("client_name"),
  siteLabel: text("site_label"),
  reference: text("reference"),
  status: text("status").notNull().default("active"), // active | archived
  currency: text("currency").notNull().default("INR"),
  timezone: text("timezone").notNull().default("Asia/Kolkata"),
  createdAt: ts("created_at").notNull().default(sql`(unixepoch() * 1000)`),
  updatedAt: ts("updated_at").notNull().default(sql`(unixepoch() * 1000)`),
  archivedAt: ts("archived_at"),
});

export const boqItems = sqliteTable("boq_items", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  sourceReference: text("source_reference"),
  lineCode: text("line_code"),
  description: text("description").notNull(),
  unit: text("unit").notNull(),
  agreedQuantity: real("agreed_quantity"), // nullable; never default to 0
  rateMinorUnits: integer("rate_minor_units"), // paise per unit
  currency: text("currency").notNull().default("INR"),
  notes: text("notes"),
  dataSource: text("data_source").notNull().default("user_entered"),
  createdAt: ts("created_at").notNull().default(sql`(unixepoch() * 1000)`),
  updatedAt: ts("updated_at").notNull().default(sql`(unixepoch() * 1000)`),
});

export const workLogs = sqliteTable("work_logs", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  boqItemId: text("boq_item_id").references(() => boqItems.id, { onDelete: "set null" }),
  workDate: text("work_date").notNull(), // ISO date
  description: text("description").notNull(),
  quantity: real("quantity"),
  unit: text("unit"),
  notes: text("notes"),
  status: text("status").notNull().default("draft"), // draft | submitted | approved
  sourceType: text("source_type").notNull().default("manual"),
  createdBy: text("created_by").references(() => users.id),
  createdAt: ts("created_at").notNull().default(sql`(unixepoch() * 1000)`),
  updatedAt: ts("updated_at").notNull().default(sql`(unixepoch() * 1000)`),
});

export const evidenceFiles = sqliteTable("evidence_files", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  workLogId: text("work_log_id").references(() => workLogs.id, { onDelete: "set null" }),
  variationId: text("variation_id").references(() => variations.id, { onDelete: "set null" }),
  storagePath: text("storage_path").notNull(),
  originalFilename: text("original_filename").notNull(),
  mimeType: text("mime_type").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  checksum: text("checksum"),
  sourceKind: text("source_kind").notNull().default("upload"),
  metadataJson: text("metadata_json"), // redacted JSON
  createdBy: text("created_by").references(() => users.id),
  createdAt: ts("created_at").notNull().default(sql`(unixepoch() * 1000)`),
});

export const variations = sqliteTable("variations", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  boqItemId: text("boq_item_id").references(() => boqItems.id, { onDelete: "set null" }),
  description: text("description").notNull(),
  workDate: text("work_date"),
  quantity: real("quantity"),
  unit: text("unit"),
  requestedAmountMinorUnits: integer("requested_amount_minor_units"),
  currency: text("currency").notNull().default("INR"),
  status: text("status").notNull().default("draft"), // draft | approval_requested | approved | rejected | disputed
  externalReference: text("external_reference"),
  decisionNote: text("decision_note"),
  reason: text("reason"),
  createdBy: text("created_by").references(() => users.id),
  reviewedBy: text("reviewed_by").references(() => users.id),
  decidedAt: ts("decided_at"),
  createdAt: ts("created_at").notNull().default(sql`(unixepoch() * 1000)`),
  updatedAt: ts("updated_at").notNull().default(sql`(unixepoch() * 1000)`),
});

// forward reference fix: evidence_files references variations; define variations before? SQLite/Drizzle allows string refs.
// We referenced variations above before declaration; convert to lazy by redefining? Drizzle supports .references with function. Adjust below by editing file.

export const billingPackets = sqliteTable("billing_packets", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("draft"), // draft | previewed | exported | submitted_paid? (user-entered)
  dateFrom: text("date_from"),
  dateTo: text("date_to"),
  currency: text("currency").notNull().default("INR"),
  warningsJson: text("warnings_json"),
  includedRecordIds: text("included_record_ids"), // JSON array
  createdBy: text("created_by").references(() => users.id),
  exportedAt: ts("exported_at"),
  createdAt: ts("created_at").notNull().default(sql`(unixepoch() * 1000)`),
});

export const billingPacketLines = sqliteTable("billing_packet_lines", {
  id: text("id").primaryKey(),
  packetId: text("packet_id").notNull().references(() => billingPackets.id, { onDelete: "cascade" }),
  organizationId: text("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  sourceType: text("source_type").notNull(), // work_log | variation
  sourceId: text("source_id").notNull(),
  descriptionSnapshot: text("description_snapshot").notNull(),
  quantitySnapshot: real("quantity_snapshot"),
  unitSnapshot: text("unit_snapshot"),
  rateMinorUnitsSnapshot: integer("rate_minor_units_snapshot"),
  amountMinorUnitsSnapshot: integer("amount_minor_units_snapshot"),
  approvalStateSnapshot: text("approval_state_snapshot"),
  createdAt: ts("created_at").notNull().default(sql`(unixepoch() * 1000)`),
});

export const auditEvents = sqliteTable("audit_events", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  actorId: text("actor_id").references(() => users.id),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  eventType: text("event_type").notNull(),
  metadataRedactedJson: text("metadata_redacted_json"),
  createdAt: ts("created_at").notNull().default(sql`(unixepoch() * 1000)`),
});

export const organizationSettings = sqliteTable("organization_settings", {
  organizationId: text("organization_id").primaryKey().references(() => organizations.id, { onDelete: "cascade" }),
  aiEnabled: integer("ai_enabled", { mode: "boolean" }).notNull().default(false),
  aiConsentAt: ts("ai_consent_at"),
  updatedAt: ts("updated_at").notNull().default(sql`(unixepoch() * 1000)`),
});
