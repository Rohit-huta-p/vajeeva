import mongoose from 'mongoose';

const IngredientSchema = new mongoose.Schema({
  nameEn: String, quantityG: String, quantityMl: { type: String, default: '' },
  quantityCup: String, note: { type: String, default: '' },
}, { _id: false });

/** Shared image sub-document for hero gallery and per-step gallery. */
const ImageSchema = new mongoose.Schema({
  url:   { type: String, required: true },
  alt:   { type: String, default: '' },
  order: { type: Number, required: true },
}, { _id: false });

const StepSchema = new mongoose.Schema({
  order: Number, text: String, phase: String,
  heat: { type: String, default: null },
  timerStr: { type: String, default: null },
  stepIngredients: [String],
  illColor: String,
  images: { type: [ImageSchema], default: [] },
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
  // Discovery tags — codes from the TagConfig vocab.
  // See docs/specs/2026-08-24-discovery-tags.md.
  type:            { type: String, default: '' },
  meals:           { type: [String], default: [] },
  mainIngredients: { type: [String], default: [] },
  methods:         { type: [String], default: [] },
  dietTags:        { type: [String], default: [] },
  makeAhead:       { type: Boolean, default: false },
  prepAheadNote:   { type: String, default: '' },
  totalTimeMin:    { type: Number },
  status:      { type: String, enum: ['published', 'draft'], default: 'draft' },
  images:      { type: [ImageSchema], default: [] },
}, { timestamps: true });

export const Recipe = mongoose.model('Recipe', RecipeSchema);
