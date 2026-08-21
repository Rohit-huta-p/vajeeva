import mongoose from 'mongoose';

const SubRecipeSchema = new mongoose.Schema({
  name:   { type: String, required: true },
  slug:   { type: String, required: true, unique: true },
  usedIn: { type: Number, default: 0 },
}, { timestamps: true });

export const SubRecipe = mongoose.model('SubRecipe', SubRecipeSchema);
