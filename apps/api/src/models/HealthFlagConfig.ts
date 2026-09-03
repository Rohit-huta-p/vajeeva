import mongoose from 'mongoose';

// The single admin-owned condition vocabulary — the source of truth for both the
// patient health-profile grid and recipe health-flag conditions.
// See docs/specs/2026-09-03-condition-vocabulary.md.
const HealthFlagConfigSchema = new mongoose.Schema({
  code:        { type: String, required: true, unique: true },  // lowercase slug
  label:       { type: String, required: true },
  description: { type: String, required: true },
  emoji:       { type: String, default: '' },   // shown on the admin card / patient grid
  order:       { type: Number, default: 0 },     // admin-controlled sort
  enabled:     { type: Boolean, default: false }, // gates visibility to patients
});

export const HealthFlagConfig = mongoose.model('HealthFlagConfig', HealthFlagConfigSchema);
