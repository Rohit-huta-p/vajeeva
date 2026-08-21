import mongoose from 'mongoose';

const IngredientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  qty:  { type: String, required: true },
}, { _id: false });

const SubRecipeSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  slug:        { type: String, required: true, unique: true },
  usedIn:      { type: Number, default: 0 },
  // Extended fields (optional, additive — existing admin CRUD keeps working)
  ingredients: { type: [IngredientSchema], default: [] },
  note:        { type: String, default: '' },
  method:      { type: String, default: '' },
}, { timestamps: true });

export const SubRecipe = mongoose.model('SubRecipe', SubRecipeSchema);
