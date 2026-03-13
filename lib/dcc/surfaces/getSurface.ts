import goldEntitiesJson from "@/data/surfaces/entities/gold.json";
import { z } from "zod";
import { resolveCountsModule } from "@/lib/dcc/surfaces/modules/counts";
import { resolveGraphModule } from "@/lib/dcc/surfaces/modules/graph";
import { resolveMediaModule } from "@/lib/dcc/surfaces/modules/media";
import { resolveDecisionModule } from "@/lib/dcc/surfaces/modules/decision";
import { resolveNext48Module } from "@/lib/dcc/surfaces/modules/next48";
import { resolveLivePulseModule } from "@/lib/dcc/surfaces/modules/livePulse";
import { resolveShareModule } from "@/lib/dcc/surfaces/modules/share";
import {
  SurfaceEntityKeySchema,
  SurfaceEntityTypeSchema,
  SurfaceModuleNameSchema,
  type EntitySurfaceIndex,
  type EntitySurfaceIndexEntry,
  type SurfaceModuleName,
  type SurfaceRequest,
  type SurfaceResponse,
} from "@/lib/dcc/surfaces/types";

const EntitySurfaceIndexSchema: z.ZodType<EntitySurfaceIndex> = z.object({
  version: z.number().int().positive(),
  updated_at: z.string().min(8),
  entities: z.array(
    z.object({
      key: SurfaceEntityKeySchema,
      entityType: SurfaceEntityTypeSchema,
      slug: z.string().min(2),
      canonicalPath: z.string().regex(/^\/[^\s]*$/),
      priority: z.enum(["gold", "high", "standard"]),
      placeGraphSlug: z.string().min(2).optional(),
      enabledModules: z.array(SurfaceModuleNameSchema).min(1),
    })
  ),
});

const SURFACE_INDEX = EntitySurfaceIndexSchema.parse(goldEntitiesJson);
const BY_KEY = new Map<string, EntitySurfaceIndexEntry>(
  SURFACE_INDEX.entities.map((entry) => [entry.key, entry])
);
const BY_PATH = new Map<string, EntitySurfaceIndexEntry>(
  SURFACE_INDEX.entities.map((entry) => [entry.canonicalPath, entry])
);

function parseEntityKey(entityKey: string) {
  const [entityType, slug] = entityKey.split(":");
  return { entityType, slug };
}

export function listSurfaceEntities(): EntitySurfaceIndexEntry[] {
  return SURFACE_INDEX.entities;
}

export function hasSurfaceEntity(entityKey: string): boolean {
  return BY_KEY.has(entityKey);
}

export function getSurfaceEntityByPath(canonicalPath: string): EntitySurfaceIndexEntry | null {
  return BY_PATH.get(canonicalPath) || null;
}

export async function getSurface(request: SurfaceRequest): Promise<SurfaceResponse> {
  const validatedKey = SurfaceEntityKeySchema.parse(request.entityKey);
  const strict = request.strict ?? true;
  const now = request.now || new Date();

  const entity = BY_KEY.get(validatedKey);
  if (!entity) {
    const { entityType, slug } = parseEntityKey(validatedKey);
    throw new Error(`Surface index missing entity ${entityType}:${slug}`);
  }

  const requestedModules = request.modules?.length
    ? request.modules
    : (entity.enabledModules as SurfaceModuleName[]);

  const response: SurfaceResponse = {
    request: { ...request, entityKey: validatedKey, strict, now },
    entity,
    modules: {},
    diagnostics: {
      generatedAt: now.toISOString(),
      errors: [],
      warnings: [],
      moduleStatus: {},
    },
  };

  for (const moduleName of requestedModules) {
    if (!entity.enabledModules.includes(moduleName)) {
      const message = `Module ${moduleName} not enabled for ${entity.key}`;
      response.diagnostics.moduleStatus[moduleName] = { status: "missing", message };
      response.diagnostics.warnings.push(message);
      if (strict) response.diagnostics.errors.push(message);
      continue;
    }

    try {
      switch (moduleName) {
        case "counts": {
          const result = resolveCountsModule(entity);
          response.modules.counts = result.data;
          response.diagnostics.moduleStatus.counts = { status: "ok" };
          if (result.warning) response.diagnostics.warnings.push(result.warning);
          break;
        }
        case "graph": {
          const result = resolveGraphModule(entity);
          response.modules.graph = result.data;
          response.diagnostics.moduleStatus.graph = { status: "ok" };
          if (result.warning) response.diagnostics.warnings.push(result.warning);
          break;
        }
        case "media": {
          const result = resolveMediaModule(entity);
          response.modules.media = result.data;
          response.diagnostics.moduleStatus.media = { status: "ok" };
          if (result.warning) response.diagnostics.warnings.push(result.warning);
          break;
        }
        case "decision": {
          const result = resolveDecisionModule(entity);
          response.modules.decision = result.data;
          response.diagnostics.moduleStatus.decision = { status: "ok" };
          if (result.warning) response.diagnostics.warnings.push(result.warning);
          break;
        }
        case "next48": {
          const result = await resolveNext48Module(entity, now);
          response.modules.next48 = result.data;
          response.diagnostics.moduleStatus.next48 = { status: "ok" };
          if (result.warning) response.diagnostics.warnings.push(result.warning);
          break;
        }
        case "livePulse": {
          const result = resolveLivePulseModule(entity, now);
          response.modules.livePulse = result.data;
          response.diagnostics.moduleStatus.livePulse = { status: "ok" };
          if (result.warning) response.diagnostics.warnings.push(result.warning);
          break;
        }
        case "share": {
          const result = resolveShareModule(entity);
          response.modules.share = result.data;
          response.diagnostics.moduleStatus.share = { status: "ok" };
          break;
        }
        default: {
          const exhaustive: never = moduleName;
          throw new Error(`Unhandled module ${exhaustive}`);
        }
      }
    } catch (error) {
      const message = `${moduleName} module failed for ${entity.key}: ${String(error)}`;
      response.diagnostics.moduleStatus[moduleName] = { status: "error", message };
      response.diagnostics.errors.push(message);
    }
  }

  const nullCountModules: SurfaceModuleName[] = [];
  if (response.modules.counts) {
    const totals = response.modules.counts.totals;
    if (totals.tours === null && totals.cruises === null && totals.transport === null && totals.events === null) {
      nullCountModules.push("counts");
    }
  }

  if (nullCountModules.length > 0) {
    response.diagnostics.warnings.push(
      `Counts unavailable for ${entity.key}; no silent zero fallback was applied.`
    );
  }

  return response;
}
