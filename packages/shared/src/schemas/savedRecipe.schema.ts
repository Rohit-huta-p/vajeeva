import { z } from 'zod';

export const SavedRecipeSchema = z.object({
  userId: z.string(),   // ObjectId as string
  recipeId: z.string(), // ObjectId as string
  savedAt: z.date().default(() => new Date()),
});

export type SavedRecipe = z.infer<typeof SavedRecipeSchema>;
