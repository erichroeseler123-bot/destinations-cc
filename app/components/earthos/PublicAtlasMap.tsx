"use client";

import { useMemo, useState } from "react";
import PublicAtlasFilters from "@/app/components/earthos/PublicAtlasFilters";
import PublicAtlasNodeCard, { PublicAtlasStatusBadge } from "@/app/components/earthos/PublicAtlasNodeCard";
import type { PublicAtlasNode, PublicAtlasStatusFilter } from "@/lib/earthos/publicAtlas";

type ProjectedNode = PublicAtlasNode & {
  x: number;
  y: number;
};

const VIEWBOX_WIDTH = 1180;
const VIEWBOX_HEIGHT = 650;
const MIN_LNG = -155;
const MAX_LNG = -60;
const MIN_LAT = 14;
const MAX_LAT = 62;

function projectNode(node: PublicAtlasNode): ProjectedNode {
  const x = ((node.lng - MIN_LNG) / (MAX_LNG - MIN_LNG)) * VIEWBOX_WIDTH;
  const normalizedY = (MAX_LAT - node.lat) / (MAX_LAT - MIN_LAT);
  const y = normalizedY * VIEWBOX_HEIGHT;
  return {
    ...node,
    x: Math.max(42, Math.min(VIEWBOX_WIDTH - 42, x)),
    y: Math.max(42, Math.min(VIEWBOX_HEIGHT - 42, y)),
  };
}

function arcPath(from: ProjectedNode, to: ProjectedNode) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const lift = Math.min(180, Math.max(58, Math.abs(dx) * 0.22 + Math.abs(dy) * 0.16));
  const cx = from.x + dx * 0.5;
  const cy = from.y + dy * 0.5 - lift;
  return `M ${from.x.toFixed(1)} ${from.y.toFixed(1)} Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${to.x.toFixed(1)} ${to.y.toFixed(1)}`;
}

function statusColor(status: PublicAtlasNode["public_status"]) {
  switch (status) {
    case "live":
      return "#34d399";
    case "building":
      return "#22d3ee";
    case "field_test":
      return "#f5c66c";
    case "fallback_market":
      return "#ff9f6e";
    default:
      return "rgba(255,255,255,0.72)";
  }
}

function filterNodes(nodes: PublicAtlasNode[], filter: PublicAtlasStatusFilter) {
  if (filter === "all") return nodes;
  return nodes.filter((node) => node.public_status === filter);
}

export default function PublicAtlasMap({ nodes }: { nodes: PublicAtlasNode[] }) {
  const [activeFilter, setActiveFilter] = useState<PublicAtlasStatusFilter>("all");
  const [selectedNodeId, setSelectedNodeId] = useState(nodes[0]?.id || "");

  const visibleNodes = useMemo(() => filterNodes(nodes, activeFilter), [activeFilter, nodes]);
  const projectedNodes = useMemo(() => visibleNodes.map(projectNode), [visibleNodes]);
  const projectedById = useMemo(() => new Map(projectedNodes.map((node) => [node.id, node])), [projectedNodes]);
  const selectedNode = visibleNodes.find((node) => node.id === selectedNodeId) || visibleNodes[0] || nodes[0];
  const selectedProjectedId = selectedNode?.id || "";

  const arcs = useMemo(() => {
    const next: Array<{ id: string; path: string; active: boolean; status: PublicAtlasNode["public_status"] }> = [];
    for (const node of projectedNodes) {
      for (const targetId of node.arc_targets) {
        const target = projectedById.get(targetId);
        if (!target) continue;
        next.push({
          id: `${node.id}-${target.id}`,
          path: arcPath(node, target),
          active: node.id === selectedProjectedId || target.id === selectedProjectedId,
          status: target.public_status,
        });
      }
    }
    return next;
  }, [projectedById, projectedNodes, selectedProjectedId]);

  function handleFilterChange(filter: PublicAtlasStatusFilter) {
    setActiveFilter(filter);
    const nextNodes = filterNodes(nodes, filter);
    setSelectedNodeId(nextNodes[0]?.id || nodes[0]?.id || "");
  }

  return (
    <section id="atlas-map" className="relative mx-auto max-w-7xl px-6 py-12 md:py-16">
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="text-[11px] font-black uppercase tracking-[0.28em] text-[#f5c66c]">Atlas layer</div>
          <h2 className="mt-3 text-3xl font-black uppercase tracking-[-0.04em] text-white md:text-5xl">
            Public corridors, safely exposed.
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-white/66 md:text-base">
            Filter the visible network by public status. This surface uses approved copy and
            static public metadata only.
          </p>
        </div>
        <PublicAtlasFilters activeFilter={activeFilter} onFilterChange={handleFilterChange} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_420px]">
        <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_22%_12%,rgba(34,211,238,0.16),transparent_26%),radial-gradient(circle_at_80%_18%,rgba(245,198,108,0.16),transparent_28%),linear-gradient(180deg,rgba(9,15,31,0.96),rgba(4,7,14,0.98))] shadow-[0_30px_120px_rgba(0,0,0,0.42)]">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.055)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:48px_48px] opacity-35" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.1)_52%,rgba(0,0,0,0.5)_100%)]" />
          <div className="relative min-h-[28rem] p-3 sm:p-5">
            <svg
              viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
              role="img"
              aria-label="Public EarthOS Atlas map"
              className="h-[30rem] w-full sm:h-[34rem] lg:h-[40rem]"
            >
              <style>{`
                @keyframes atlas-dash {
                  to {
                    stroke-dashoffset: -84;
                  }
                }

                .atlas-route-dash {
                  animation: atlas-dash 8s linear infinite;
                }
              `}</style>
              <defs>
                <filter id="atlasGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="8" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <linearGradient id="atlasLand" x1="0%" x2="100%" y1="0%" y2="100%">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.09)" />
                  <stop offset="50%" stopColor="rgba(255,255,255,0.035)" />
                  <stop offset="100%" stopColor="rgba(34,211,238,0.08)" />
                </linearGradient>
                <linearGradient id="atlasArc" x1="0%" x2="100%" y1="0%" y2="0%">
                  <stop offset="0%" stopColor="#f5c66c" stopOpacity="0.15" />
                  <stop offset="45%" stopColor="#22d3ee" stopOpacity="0.85" />
                  <stop offset="100%" stopColor="#f5c66c" stopOpacity="0.28" />
                </linearGradient>
              </defs>

              <path
                d="M70 150 C160 80 260 95 310 155 C370 225 450 170 520 220 C610 282 690 250 750 320 C825 405 930 340 1015 408 C1080 462 1105 545 1010 585 L190 585 C105 520 88 450 138 382 C190 305 8 232 70 150Z"
                fill="url(#atlasLand)"
                stroke="rgba(255,255,255,0.12)"
                strokeWidth="1.5"
              />
              <path
                d="M650 585 C725 515 735 455 706 390 C684 340 704 286 776 254 C862 216 960 248 1038 218 C1095 196 1150 212 1164 268 C1186 354 1108 390 1080 455 C1053 518 1093 560 1126 585Z"
                fill="rgba(255,255,255,0.035)"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="1.2"
              />
              <path
                d="M140 120 C285 88 454 100 618 152 C780 204 940 212 1090 174"
                fill="none"
                stroke="rgba(255,255,255,0.08)"
                strokeDasharray="6 14"
              />
              <path
                d="M82 462 C236 430 400 448 548 478 C714 511 870 500 1076 456"
                fill="none"
                stroke="rgba(255,255,255,0.07)"
                strokeDasharray="4 12"
              />

              {arcs.map((arc) => (
                <path
                  key={arc.id}
                  d={arc.path}
                  fill="none"
                  stroke={arc.active ? statusColor(arc.status) : "url(#atlasArc)"}
                  strokeWidth={arc.active ? 3.6 : 1.8}
                  strokeOpacity={arc.active ? 0.95 : 0.42}
                  strokeDasharray="9 12"
                  className="atlas-route-dash"
                  filter={arc.active ? "url(#atlasGlow)" : undefined}
                />
              ))}

              {projectedNodes.map((node) => {
                const selected = node.id === selectedProjectedId;
                const radius = node.visual_weight === 3 ? 10 : node.visual_weight === 2 ? 8 : 6;
                const color = statusColor(node.public_status);
                return (
                  <g key={node.id}>
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={selected ? radius * 3.2 : radius * 2.4}
                      fill={color}
                      opacity={selected ? 0.14 : 0.08}
                      filter="url(#atlasGlow)"
                    />
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={selected ? radius * 1.8 : radius * 1.35}
                      fill="none"
                      stroke={color}
                      strokeWidth={selected ? 2.8 : 1.4}
                      opacity={selected ? 0.9 : 0.52}
                    />
                    <circle cx={node.x} cy={node.y} r={radius} fill={color} stroke="#05070b" strokeWidth="2" />
                    <foreignObject x={node.x - 80} y={node.y + 14} width="160" height="44" className="pointer-events-none">
                      <div className={`text-center text-[10px] font-black uppercase tracking-[0.14em] ${selected ? "text-white" : "text-white/48"}`}>
                        {node.public_label}
                      </div>
                    </foreignObject>
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={radius * 3.5}
                      fill="transparent"
                      role="button"
                      tabIndex={0}
                      aria-label={`Select ${node.public_label}`}
                      className="cursor-pointer outline-none"
                      onClick={() => setSelectedNodeId(node.id)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setSelectedNodeId(node.id);
                        }
                      }}
                    />
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        <div className="space-y-4">
          {selectedNode ? <PublicAtlasNodeCard node={selectedNode} /> : null}
          <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.04] p-5">
            <div className="text-[11px] font-black uppercase tracking-[0.22em] text-white/44">Visible nodes</div>
            <div className="mt-4 grid gap-2">
              {visibleNodes.map((node) => (
                <button
                  key={node.id}
                  type="button"
                  onClick={() => setSelectedNodeId(node.id)}
                  className={`rounded-[1.1rem] border p-3 text-left transition ${
                    selectedNode?.id === node.id
                      ? "border-[#f5c66c]/50 bg-[#f5c66c]/12"
                      : "border-white/10 bg-black/18 hover:border-white/22 hover:bg-white/[0.06]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-black text-white">{node.public_label}</div>
                    <PublicAtlasStatusBadge status={node.public_status} />
                  </div>
                  <div className="mt-1 text-xs text-white/44">{node.region}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
