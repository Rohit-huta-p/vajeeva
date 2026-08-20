import mongoose from 'mongoose';

const SavedRecipeSchema = new mongoose.Schema({
  userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipe', required: true },
  savedAt:  { type: Date, default: Date.now },
});

SavedRecipeSchema.index({ userId: 1, recipeId: 1 }, { unique: true });

export const SavedRecipe = mongoose.model('SavedRecipe', SavedRecipeSchema);
