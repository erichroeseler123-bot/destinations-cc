import { NextResponse } from "next/server";
import { z } from "zod";
import { getSurface } from "@/lib/dcc/surfaces/getSurface";
import { SurfaceModuleNameSchema } from "@/lib/dcc/surfaces/types";

const QuerySchema = z.object({
  entityKey: z.string().regex(/^(city|port|venue|attraction|route):[a-z0-9-]+$/),
  modules: z.string().optional(),
  strict: z.enum(["0", "1", "true", "false"]).optional(),
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = QuerySchema.safeParse({
    entityKey: url.searchParams.get("entityKey") || "",
    modules: url.searchParams.get("modules") || undefined,
    strict: url.searchParams.get("strict") || undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "Invalid query params",
        details: parsed.error.flatten(),
      },
      { status: 400 }
    );
  }

  const modules = parsed.data.modules
    ? parsed.data.modules
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    : undefined;

  const parsedModules = modules
    ? z.array(SurfaceModuleNameSchema).safeParse(modules)
    : { success: true as const, data: undefined };

  if (!parsedModules.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "Invalid modules list",
        details: parsedModules.error.flatten(),
      },
      { status: 400 }
    );
  }

  try {
    const surface = await getSurface({
      entityKey: parsed.data.entityKey as `city:${string}` | `port:${string}` | `venue:${string}` | `attraction:${string}` | `route:${string}`,
      modules: parsedModules.data,
      strict:
        parsed.data.strict === undefined ?
          true
        : parsed.data.strict === "1" || parsed.data.strict === "true",
    });

    const status = surface.diagnostics.errors.length > 0 ? 422 : 200;

    return NextResponse.json(
      {
        ok: status === 200,
        surface,
      },
      { status }
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: String(error),
      },
      { status: 500 }
    );
  }
}
