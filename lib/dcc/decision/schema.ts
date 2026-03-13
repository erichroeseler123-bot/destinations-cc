import { z } from "zod";

const RouteHrefSchema = z.string().regex(/^\/[^\s]*$/, "must be a site-relative route");

const QuestionAnswerSchema = z.object({
  q: z.string().min(6),
  a: z.string().min(20),
});

export const DecisionHeroSchema = z.object({
  eyebrow: z.string().min(2),
  summary: z.string().min(30),
  imageHint: z.string().min(8).optional(),
  quickLinks: z.array(
    z.object({
      label: z.string().min(2),
      href: RouteHrefSchema,
    })
  ).min(2),
});

export const DecisionQuickFactSchema = z.object({
  label: z.string().min(2),
  value: z.string().min(2),
});

export const DecisionLinkSchema = z.object({
  label: z.string().min(2),
  href: RouteHrefSchema,
});

export const DecisionActionSchema = z.object({
  label: z.string().min(2),
  href: z.string().min(2),
  kind: z.enum(["internal", "external"]),
});

export const DecisionRelatedExperienceSchema = z.object({
  label: z.string().min(2),
  href: RouteHrefSchema,
  // Marks links backed by explicit entity/route relationships in the DCC graph.
  graphLinked: z.boolean(),
});

export const DecisionActivitySchema = z.object({
  title: z.string().min(4),
  description: z.string().min(20),
  href: RouteHrefSchema.optional(),
});

export const DecisionMistakeSchema = z.object({
  mistake: z.string().min(8),
  avoid: z.string().min(12),
});

export const DecisionFreshnessEvidenceSchema = z.object({
  title: z.string().min(2),
  source: z.string().min(2),
  href: z.string().url(),
  note: z.string().min(8),
});

export const DecisionFreshnessSchema = z.object({
  updatedAt: z.string().min(4),
  refreshIntervalDays: z.number().int().positive(),
  evidence: z.array(DecisionFreshnessEvidenceSchema).min(1),
});

export const DecisionEnginePageSchema = z.object({
  id: z.string().min(3),
  canonicalPath: RouteHrefSchema,
  nodeType: z.enum(["city", "port", "venue", "route", "attraction"]),
  title: z.string().min(6),
  hero: DecisionHeroSchema,
  quickFacts: z.array(DecisionQuickFactSchema).min(4),
  whyThisPlaceMatters: z.string().min(30),
  whenToGo: z.object({
    bestMonths: z.string().min(6),
    bestDays: z.string().min(6),
    bestWeather: z.string().min(6),
    crowdPatterns: z.string().min(12),
    seasonalDifferences: z.string().min(12),
  }),
  howToGetThere: z.array(z.string().min(8)).min(3),
  whatToDo: z.array(DecisionActivitySchema).min(3),
  nearbyThings: z.array(DecisionLinkSchema).min(3),
  insiderTips: z.array(z.string().min(10)).min(3),
  commonMistakes: z.array(DecisionMistakeSchema).min(3),
  localIntel: z.array(z.string().min(12)).min(3),
  relatedExperiences: z.array(DecisionRelatedExperienceSchema).min(3),
  authorityActions: z.array(DecisionActionSchema).min(2),
  executionCtas: z.array(DecisionActionSchema).min(1),
  faq: z.array(QuestionAnswerSchema).min(4),
  freshness: DecisionFreshnessSchema,
});

export type DecisionEnginePage = z.infer<typeof DecisionEnginePageSchema>;
