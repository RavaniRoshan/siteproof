import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/context";
import { db } from "@/lib/db/client";
import { evidenceFiles } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { readFilePath } from "@/lib/storage";
import fs from "node:fs";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await getAuthContext();
  if (!auth) return new NextResponse("Unauthorized", { status: 401 });
  const { id } = await ctx.params;
  const [ev] = await db.select().from(evidenceFiles).where(and(eq(evidenceFiles.id, id), eq(evidenceFiles.organizationId, auth.organizationId))).limit(1);
  if (!ev) return new NextResponse("Not found", { status: 404 });
  const abs = readFilePath(ev.storagePath);
  const buf = fs.readFileSync(abs);
  return new NextResponse(buf, {
    headers: {
      "Content-Type": ev.mimeType,
      "Content-Disposition": `inline; filename="${ev.originalFilename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
