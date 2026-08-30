import { z } from 'zod';

export const IngredientSchema = z.object({
  nameEn:      z.string().min(1),
  quantityG:   z.string(),
  // nullish: handles both absent (undefined) and explicitly-null values from older DB docs
  quantityMl:  z.string().nullish().transform(v => v ?? ''),
  quantityCup: z.string(),
  note:        z.string().nullish().transform(v => v ?? ''),
});

/** Image attachment for recipe hero gallery or per-step gallery. */
export const ImageSchema = z.object({
  url:   z.string().url(),
  alt:   z.string().optional(),
  order: z.number().int().min(0),
});

export const StepSchema = z.object({
  order: z.number().int().min(1),
  text: z.string().min(1),
  phase: z.string(),
  // nullish: older step docs may lack the 'heat' key entirely (undefined), not just null
  heat: z.string().nullish().transform(v => v ?? null),
  stepIngredients: z.array(z.string()),
  illColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  images: z.array(ImageSchema).optional().default([]),
});

export const HealthFlagSchema = z.object({
  condition: z.string().min(1),
  severity: z.enum(['safe', 'caution', 'avoid']),
  // default: older health-flag docs may not have stored 'note' at all
  note: z.string().default(''),
});

export const SourceSchema = z.object({
  text: z.string().min(1),
  citation: z.string(),
});

export const RecipeSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  nameEn: z.string().min(1),
  nameTa: z.string(),
  category: z.enum(['solid', 'liquid', 'semi-solid']),
  description: z.string(),
  ingredients: z.array(IngredientSchema).min(1),
  steps: z.array(StepSchema).min(1),
  healthFlags: z.array(HealthFlagSchema),
  sources: z.array(SourceSchema),
  yieldStr: z.string(),
  shelfLife: z.string(),
  // Discovery tags — codes validated against the TagConfig vocab at the API.
  // All optional/defaulted, so existing recipes and payloads stay valid.
  // See docs/specs/2026-08-24-discovery-tags.md.
  type: z.string().default(''),
  meals: z.array(z.string()).default([]),
  mainIngredients: z.array(z.string()).default([]),
  methods: z.array(z.string()).default([]),
  dietTags: z.array(z.string()).default([]),
  makeAhead: z.boolean().default(false),
  prepAheadNote: z.string().default(''),
  totalTimeMin: z.number().int().min(0).optional(),
  status: z.enum(['published', 'draft']).default('draft'),
  images: z.array(ImageSchema).optional().default([]),
  updatedAt: z.date().default(() => new Date()),
  createdAt: z.date().default(() => new Date()),
});

export const RecipeInputSchema = RecipeSchema.omit({
  updatedAt: true,
  createdAt: true,
});

export type Ingredient = z.infer<typeof IngredientSchema>;
export type Image = z.infer<typeof ImageSchema>;
export type Step = z.infer<typeof StepSchema>;
export type HealthFlag = z.infer<typeof HealthFlagSchema>;
export type Source = z.infer<typeof SourceSchema>;
export type Recipe = z.infer<typeof RecipeSchema>;
export type RecipeInput = z.infer<typeof RecipeInputSchema>;
