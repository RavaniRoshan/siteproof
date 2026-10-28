import { db } from "./db/client";
import { auditEvents } from "./db/schema";

export async function recordAudit(params: {
  organizationId: string;
  actorId?: string | null;
  entityType: string;
  entityId: string;
  eventType: string;
  metadata?: Record<string, unknown>;
}) {
  await db.insert(auditEvents).values({
    id: crypto.randomUUID(),
    organizationId: params.organizationId,
    actorId: params.actorId ?? null,
    entityType: params.entityType,
    entityId: params.entityId,
    eventType: params.eventType,
    metadataRedactedJson: params.metadata ? JSON.stringify(params.metadata) : null,
  });
}
