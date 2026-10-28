import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const root = () => process.env.STORAGE_DIR ?? "./data/uploads";

export function storageRootAbs() {
  const p = root();
  if (path.isAbsolute(p)) return p;
  return path.join(/*turbopackIgnore: true*/ process.cwd(), p);
}

export function saveFile(orgId: string, projectId: string, buffer: Buffer, originalName: string) {
  const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
  const id = crypto.randomUUID();
  const rel = path.join(orgId, projectId, `${id}-${safeName}`);
  const abs = path.join(storageRootAbs(), rel);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, buffer);
  return { storagePath: rel, size: buffer.length };
}

export function readFilePath(storagePath: string) {
  // prevent traversal
  const abs = path.resolve(storageRootAbs(), storagePath);
  const rootAbs = path.resolve(storageRootAbs());
  if (!abs.startsWith(rootAbs + path.sep)) throw new Error("INVALID_PATH");
  return abs;
}

export function deleteFile(storagePath: string) {
  try {
    fs.unlinkSync(readFilePath(storagePath));
  } catch {}
}
