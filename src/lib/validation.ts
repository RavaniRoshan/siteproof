import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(80).optional(),
  organizationName: z.string().min(1).max(120),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const projectSchema = z.object({
  name: z.string().min(1).max(120),
  clientName: z.string().max(120).optional().or(z.literal("")),
  siteLabel: z.string().max(120).optional().or(z.literal("")),
  reference: z.string().max(120).optional().or(z.literal("")),
  currency: z.string().min(3).max(6).default("INR"),
  timezone: z.string().min(3).max(60).default("Asia/Kolkata"),
});

export const boqSchema = z.object({
  projectId: z.string().uuid().or(z.string().min(1)),
  sourceReference: z.string().max(120).optional().or(z.literal("")),
  lineCode: z.string().max(40).optional().or(z.literal("")),
  description: z.string().min(1).max(500),
  unit: z.string().min(1).max(40),
  agreedQuantity: z.coerce.number().nonnegative().optional().nullable(),
  rateMinorUnits: z.coerce.number().int().nonnegative().optional().nullable(),
  notes: z.string().max(1000).optional().or(z.literal("")),
});

export const workLogSchema = z.object({
  projectId: z.string().min(1),
  boqItemId: z.string().optional().or(z.literal("")),
  workDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  description: z.string().min(1).max(2000),
  quantity: z.coerce.number().nonnegative().optional().nullable(),
  unit: z.string().max(40).optional().or(z.literal("")),
  notes: z.string().max(2000).optional().or(z.literal("")),
});

export const variationSchema = z.object({
  projectId: z.string().min(1),
  boqItemId: z.string().optional().or(z.literal("")),
  description: z.string().min(1).max(2000),
  workDate: z.string().optional().or(z.literal("")),
  quantity: z.coerce.number().nonnegative().optional().nullable(),
  unit: z.string().max(40).optional().or(z.literal("")),
  requestedAmountMinorUnits: z.coerce.number().int().nonnegative().optional().nullable(),
  reason: z.string().max(2000).optional().or(z.literal("")),
  status: z.enum(["draft", "approval_requested", "approved", "rejected", "disputed"]).default("draft"),
  externalReference: z.string().max(120).optional().or(z.literal("")),
});

export const ALLOWED_MIME = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "text/plain",
];
export const MAX_FILE_BYTES = 10 * 1024 * 1024;
export const MAX_FILES_PER_UPLOAD = 5;
