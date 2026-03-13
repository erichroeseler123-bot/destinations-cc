import { z } from "zod";

export const DccEntityTypeSchema = z.enum(["city", "port", "venue", "attraction", "route"]);
export type DccEntityType = z.infer<typeof DccEntityTypeSchema>;

export const DccEntityTierSchema = z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]);
export type DccEntityTier = z.infer<typeof DccEntityTierSchema>;

export const DccEntityStatusSchema = z.enum(["indexed", "active", "authority"]);
export type DccEntityStatus = z.infer<typeof DccEntityStatusSchema>;

export const DccEntitySchema = z.object({
  entityKey: z.string().regex(/^(city|port|venue|attraction|route):[a-z0-9-]+$/),
  type: DccEntityTypeSchema,
  slug: z.string().min(2),
  name: z.string().min(2),
  aliases: z.array(z.string().min(1)).default([]),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  countryCode: z.string().length(2),
  regionCode: z.string().min(1).optional(),
  population: z.number().int().nonnegative().optional(),
  tier: DccEntityTierSchema,
  status: DccEntityStatusSchema,
  canonicalPath: z.string().regex(/^\/[^\s]*$/).optional(),
});

export const DccEntityRegistrySchema = z.object({
  version: z.number().int().positive(),
  updated_at: z.string().min(8),
  entities: z.array(DccEntitySchema).min(1),
});

export type DccEntity = z.infer<typeof DccEntitySchema>;
export type DccEntityRegistry = z.infer<typeof DccEntityRegistrySchema>;
