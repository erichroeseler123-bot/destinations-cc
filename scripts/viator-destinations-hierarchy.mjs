#!/usr/bin/env node
/* Viator Destinations Hierarchy Builder (2026) */

import dotenv from "dotenv";
import path from "node:path";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

dotenv.config({ path: path.join(ROOT, ".env.local") });

const DATA_DIR = path.join(ROOT, "data");
const OUT_FILE = path.join(DATA_DIR, "destinations-hierarchy.json");

async function ensureDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function buildHierarchy() {
  console.log("Building destination hierarchy...");

  // Load from existing fetch (or re-fetch if needed)
  const rawPath = path.join(DATA_DIR, "destinations.json");
  let raw;
  try {
    raw = JSON.parse(await fs.readFile(rawPath, "utf8"));
  } catch (err) {
    console.error("No destinations.json found — run viator-destinations.mjs first");
    process.exit(1);
  }

  const destList = raw.destinations || [];
  if (!destList.length) {
    console.error("No destinations array in file");
    return;
  }

  const idToNode = new Map();
  const roots = [];

  // Normalize & build nodes
  for (const d of destList) {
    const node = {
      id: d.destinationId,
      name: d.name,
      type: d.type,
      parentId: d.parentDestinationId || null,
      lookupId: d.lookupId || null,
      url: d.destinationUrl,
      center: d.center || null,
      children: [],
    };
    idToNode.set(node.id, node);
  }

  // Link children
  for (const node of idToNode.values()) {
    if (node.parentId && idToNode.has(node.parentId)) {
      idToNode.get(node.parentId).children.push(node);
    } else {
      roots.push(node);
    }
  }

  // Optional: Sort children alphabetically by name
  const sortChildren = (node) => {
    node.children.sort((a, b) => a.name.localeCompare(b.name));
    node.children.forEach(sortChildren);
  };
  roots.forEach(sortChildren);

  const tree = { roots, total: destList.length };
  await fs.writeFile(OUT_FILE, JSON.stringify(tree, null, 2) + "\n");
  console.log(`Hierarchy saved to ${OUT_FILE} (${roots.length} root nodes, ${tree.total} total destinations)`);

  // Quick Denver check
  const denverNode = Array.from(idToNode.values()).find(n => n.name.toLowerCase().includes("denver"));
  if (denverNode) {
    console.log("\nDenver hierarchy path (from lookupId):", denverNode.lookupId);
    console.log("Parent ID:", denverNode.parentId);
  }
}

async function main() {
  await ensureDir();
  await buildHierarchy().catch(err => console.error("Error:", err.message));
}

main();
