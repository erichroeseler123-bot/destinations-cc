import fs from "fs";
import path from "path";

export function loadJsonl<T = any>(relPath: string): T[] {
  const abs = path.join(process.cwd(), relPath);
  const raw = fs.readFileSync(abs, "utf8");
  return raw
    .split("\n")
    .map(s => s.trim())
    .filter(Boolean)
    .map(line => JSON.parse(line) as T);
}
