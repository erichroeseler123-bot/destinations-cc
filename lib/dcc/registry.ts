import fs from "fs";
import path from "path";
import type { DccNode, DccRegistryPointer } from "./schema";

type ByIdIndex = Record<string, DccRegistryPointer>;
type StringToStringOrArray = Record<string, string | string[]>;
type BySlugClassIndex = Record<string, StringToStringOrArray>;

const ROOT = process.cwd();
const INDEX_DIR = path.join(ROOT, "data", "index");

function loadJson<T>(filename: string): T {
  const full = path.join(INDEX_DIR, filename);
  return JSON.parse(fs.readFileSync(full, "utf8")) as T;
}

export function loadByIdIndex(): ByIdIndex {
  return loadJson<ByIdIndex>("by-id.json");
}

export function loadBySlugIndex(): StringToStringOrArray {
  return loadJson<StringToStringOrArray>("by-slug.json");
}

export function loadBySlugClassIndex(): BySlugClassIndex {
  return loadJson<BySlugClassIndex>("by-slug-class.json");
}

export function loadByAliasIndex(): Record<string, string[]> {
  return loadJson<Record<string, string[]>>("by-alias.json");
}

export function loadByClassIndex(): Record<string, string[]> {
  return loadJson<Record<string, string[]>>("by-class.json");
}

export function readNodeByPointer(pointer: DccRegistryPointer): DccNode | null {
  const fullPath = path.join(ROOT, pointer.file);
  if (!fs.existsSync(fullPath)) return null;
  const lines = fs.readFileSync(fullPath, "utf8").split("\n");
  const raw = lines[pointer.line - 1];
  if (!raw || !raw.trim()) return null;
  return JSON.parse(raw) as DccNode;
}

export function getNodeById(id: string): DccNode | null {
  const byId = loadByIdIndex();
  const ptr = byId[id];
  if (!ptr) return null;
  return readNodeByPointer(ptr);
}

export function getNodeBySlug(slug: string): DccNode | null {
  const bySlug = loadBySlugIndex();
  const hit = bySlug[slug];
  if (!hit) return null;
  const id = Array.isArray(hit) ? hit[0] : hit;
  return getNodeById(id);
}

export function getNodeBySlugInClass(slug: string, cls: string): DccNode | null {
  const bySlugClass = loadBySlugClassIndex();
  const bucket = bySlugClass[cls] || {};
  const hit = bucket[slug];
  if (!hit) return null;
  const id = Array.isArray(hit) ? hit[0] : hit;
  return getNodeById(id);
}

export function getNodesByClass(cls: string): DccNode[] {
  const byClass = loadByClassIndex();
  const ids = byClass[cls] || [];
  const out: DccNode[] = [];
  for (const id of ids) {
    const node = getNodeById(id);
    if (node) out.push(node);
  }
  return out;
}

export function getNodesByAlias(alias: string): DccNode[] {
  const byAlias = loadByAliasIndex();
  const ids = byAlias[alias] || [];
  const out: DccNode[] = [];
  for (const id of ids) {
    const node = getNodeById(id);
    if (node) out.push(node);
  }
  return out;
}
