import type { CommandStatusLevel } from "@/lib/dcc/command/types";

export function commandTone(level: CommandStatusLevel) {
  switch (level) {
    case "critical":
      return "border-rose-400/30 bg-rose-400/12 text-rose-100";
    case "busy":
      return "border-amber-300/30 bg-amber-300/12 text-amber-50";
    case "watch":
      return "border-yellow-300/30 bg-yellow-300/12 text-yellow-50";
    default:
      return "border-emerald-400/30 bg-emerald-400/12 text-emerald-100";
  }
}
