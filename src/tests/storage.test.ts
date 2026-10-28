import { describe, it, expect } from "vitest";
import { readFilePath } from "@/lib/storage";

describe("storage path safety", () => {
  it("rejects traversal", () => {
    expect(() => readFilePath("../etc/passwd")).toThrow();
  });
  it("accepts normal relative path", () => {
    // may not exist but path resolution should not throw
    expect(() => readFilePath("org/proj/file.txt")).not.toThrow();
  });
});
