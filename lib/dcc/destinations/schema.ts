import { z } from "zod";

const IsoDateTimeSchema = z.string().datetime({ offset: true });
const SlugSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const DccIdSchema = z.string().regex(/^dcc:[a-z_]+:[a-z0-9-]+(?::\d{4})?$/);

export const DestinationProviderSchema = z.object({
  viator_destination_id: z.number().int().positive().nullable().optional(),
  rezdy_location: z.string().min(2).nullable().optional(),
  fareharbor_shortname: z.string().min(2).nullable().optional(),
});

export const DestinationIntentSchema = z.object({
  title: z.string().min(3),
  query: z.string().min(3),
  badge: z.string().min(2).optional(),
  description: z.string().min(8).optional(),
});

export const DestinationGatewaySchema = z.object({
  port_slug: SlugSchema,
  note: z.string().min(4).optional(),
});

export const DestinationRecordSchema = z.object({
  slug: SlugSchema,
  name: z.string().min(2),
  display_name: z.string().min(2).optional(),
  country_code: z.string().regex(/^[A-Z]{2}$/),
  status: z.enum(["seed", "beta", "live"]).default("seed"),
  visibility: z.enum(["public", "private", "hidden"]).default("public"),
  registry_nodes: z.array(DccIdSchema).min(1),
  port_gateways: z.array(DestinationGatewaySchema).default([]),
  aliases: z.array(SlugSchema).default([]),
  providers: DestinationProviderSchema.default({}),
  starter_intents: z.array(DestinationIntentSchema).min(1),
  tags: z.array(z.string().min(2)).default([]),
  notes: z.string().min(8).optional(),
  meta: z.object({
    version: z.number().int().positive().default(1),
    updated_at: IsoDateTimeSchema,
  }),
});

export const DestinationRegistrySchema = z.object({
  version: z.number().int().positive(),
  updated_at: IsoDateTimeSchema,
  destinations: z.array(
    z.object({
      slug: SlugSchema,
      name: z.string().min(2),
      country_code: z.string().regex(/^[A-Z]{2}$/),
      status: z.enum(["seed", "beta", "live"]),
      visibility: z.enum(["public", "private", "hidden"]),
    })
  ).min(1),
});

export type DestinationIntent = z.infer<typeof DestinationIntentSchema>;
export type DestinationRecord = z.infer<typeof DestinationRecordSchema>;
export type DestinationRegistry = z.infer<typeof DestinationRegistrySchema>;
