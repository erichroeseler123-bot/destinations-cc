export const CLEANUP_PRIORITIES = ["high", "medium", "low"] as const;
export const CLEANUP_ACTIONS = ["redirect", "merge", "trim", "kill", "review"] as const;

export type CleanupPriority = (typeof CLEANUP_PRIORITIES)[number];
export type CleanupAction = (typeof CLEANUP_ACTIONS)[number];

export type CleanupQueueEntry = {
  path: `/${string}`;
  issue: string;
  impact: string;
  action: CleanupAction;
  target?: `/${string}` | `${"https://" | "http://"}${string}`;
  priority: CleanupPriority;
  owner: "dcc" | "wts" | "wta" | "parr" | "internal";
  notes?: string;
};

function defineCleanupQueue<const T extends readonly CleanupQueueEntry[]>(entries: T) {
  return entries;
}

export const cleanupQueue = defineCleanupQueue([
  {
    path: "/book/red-rocks",
    issue: "DCC-local Red Rocks booking entry duplicates the standalone PARR act layer.",
    impact: "Splits booking intent and makes DCC behave like an operator.",
    action: "redirect",
    target: "https://www.partyatredrocks.com/book/red-rocks-amphitheatre/custom/shared",
    priority: "high",
    owner: "dcc",
    notes: "Runtime redirect already in place.",
  },
  {
    path: "/book/red-rocks-amphitheatre",
    issue: "DCC-local Red Rocks booking path competes with the canonical standalone PARR shared flow.",
    impact: "Splits conversions and weakens the DCC to PARR seam.",
    action: "redirect",
    target: "https://www.partyatredrocks.com/book/red-rocks-amphitheatre/custom/shared",
    priority: "high",
    owner: "dcc",
    notes: "Runtime redirect already in place.",
  },
  {
    path: "/book/red-rocks-amphitheatre/private",
    issue: "DCC-local private Red Rocks booking path competes with the canonical standalone PARR private flow.",
    impact: "Creates duplicate private-booking execution paths.",
    action: "redirect",
    target: "https://www.partyatredrocks.com/book/red-rocks-amphitheatre/private",
    priority: "high",
    owner: "dcc",
    notes: "Runtime redirect already in place.",
  },
  {
    path: "/best-transportation-options-denver-to-red-rocks",
    issue: "Broad transport comparison duplicates the main Red Rocks decision page.",
    impact: "Splits SEO and decision intent across overlapping DCC surfaces.",
    action: "redirect",
    target: "/red-rocks-transportation",
    priority: "high",
    owner: "dcc",
    notes: "Collapse into the canonical DCC decision hub once internal links are preserved.",
  },
  {
    path: "/denver-concert-shuttle",
    issue: "High-overlap Red Rocks shuttle route competes with the canonical DCC decision page.",
    impact: "Creates another transport entry path with too much duplicated intent.",
    action: "redirect",
    target: "/red-rocks-transportation",
    priority: "high",
    owner: "dcc",
    notes: "Preserve unique query coverage first if any exists.",
  },
  {
    path: "/red-rocks-transportation",
    issue: "Canonical Red Rocks decision page must stay pure understand-layer routing.",
    impact: "If it drifts into execution, the DCC to PARR seam breaks again.",
    action: "review",
    target: "https://www.partyatredrocks.com/book/red-rocks-amphitheatre/custom/shared",
    priority: "high",
    owner: "dcc",
    notes: "Keep only if it explains the constraint, recommends a path, and hands off to PARR.",
  },
  {
    path: "/old-shuttle-page",
    issue: "Legacy duplicate booking path.",
    impact: "Adds clutter without any routing value.",
    action: "kill",
    priority: "medium",
    owner: "dcc",
  },
  {
    path: "/guide/random-article",
    issue: "Does not reduce booking uncertainty.",
    impact: "Adds content clutter without improving decision quality.",
    action: "kill",
    priority: "medium",
    owner: "parr",
  },
] as const);

export function getCleanupQueueByPriority(priority: CleanupPriority) {
  return cleanupQueue.filter((entry) => entry.priority === priority);
}
