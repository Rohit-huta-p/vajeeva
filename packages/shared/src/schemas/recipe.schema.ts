import { z } from 'zod';

export const IngredientSchema = z.object({
  nameEn: z.string().min(1),
  quantityG: z.string(),
  quantityCup: z.string(),
});

export const StepSchema = z.object({
  order: z.number().int().min(1),
  text: z.string().min(1),
  phase: z.string(),
  heat: z.string().nullable(),
  timerStr: z.string().regex(/^\d{2}:\d{2}$/).nullable(),
  stepIngredients: z.array(z.string()),
  illColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
});

export const HealthFlagSchema = z.object({
  condition: z.string().min(1),
  severity: z.enum(['safe', 'caution', 'avoid']),
  note: z.string(),
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
  status: z.enum(['published', 'draft']).default('draft'),
  updatedAt: z.date().default(() => new Date()),
  createdAt: z.date().default(() => new Date()),
});

export const RecipeInputSchema = RecipeSchema.omit({
  updatedAt: true,
  createdAt: true,
});

export type Ingredient = z.infer<typeof IngredientSchema>;
export type Step = z.infer<typeof StepSchema>;
export type HealthFlag = z.infer<typeof HealthFlagSchema>;
export type Source = z.infer<typeof SourceSchema>;
export type Recipe = z.infer<typeof RecipeSchema>;
export type RecipeInput = z.infer<typeof RecipeInputSchema>;
