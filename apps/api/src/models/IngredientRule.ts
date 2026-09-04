import mongoose from 'mongoose';

// An ingredient's effect on health conditions, authored once and derived onto
// every recipe that contains the ingredient. Rules never produce 'safe' — absence
// of a flag is the safe default; rules only assert caution / avoid / indication.
// See the Diet Rules engine (docs/specs/2026-09-03-admin-outcomes.md).
const EffectSchema = new mongoose.Schema({
  condition: { type: String, required: true },  // HealthFlagConfig code
  severity:  { type: String, enum: ['caution', 'avoid', 'indication'], required: true },
}, { _id: false });

const IngredientRuleSchema = new mongoose.Schema({
  ingredient: { type: String, required: true },      // display name, e.g. "Jaggery"
  match:      { type: [String], default: [] },        // lowercase keywords matched in ingredients[].nameEn
  effects:    { type: [EffectSchema], default: [] },
  enabled:    { type: Boolean, default: true },
}, { timestamps: true });

IngredientRuleSchema.index({ ingredient: 1 }, { unique: true });

export const IngredientRule = mongoose.model('IngredientRule', IngredientRuleSchema);
