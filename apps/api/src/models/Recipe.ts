import mongoose from 'mongoose';

const IngredientSchema = new mongoose.Schema({
  nameEn: String, quantityG: String, quantityCup: String,
}, { _id: false });

const StepSchema = new mongoose.Schema({
  order: Number, text: String, phase: String,
  heat: { type: String, default: null },
  timerStr: { type: String, default: null },
  stepIngredients: [String],
  illColor: String,
}, { _id: false });

const HealthFlagSchema = new mongoose.Schema({
  condition: String,
  severity: { type: String, enum: ['safe', 'caution', 'avoid'] },
  note: String,
}, { _id: false });

const RecipeSchema = new mongoose.Schema({
  slug:        { type: String, required: true, unique: true },
  nameEn:      { type: String, required: true },
  nameTa:      String,
  category:    { type: String, enum: ['solid', 'liquid', 'semi-solid'] },
  description: String,
  ingredients: [IngredientSchema],
  steps:       [StepSchema],
  healthFlags: [HealthFlagSchema],
  sources:     [{ text: String, citation: String }],
  yieldStr:    String,
  shelfLife:   String,
  status:      { type: String, enum: ['published', 'draft'], default: 'draft' },
}, { timestamps: true });

export const Recipe = mongoose.model('Recipe', RecipeSchema);
