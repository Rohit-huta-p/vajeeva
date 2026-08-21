import mongoose from 'mongoose';

// Stores admin-customised labels and descriptions for health condition codes.
const HealthFlagConfigSchema = new mongoose.Schema({
  code:        { type: String, required: true, unique: true },
  label:       { type: String, required: true },
  description: { type: String, required: true },
  enabled:     { type: Boolean, default: false },
});

export const HealthFlagConfig = mongoose.model('HealthFlagConfig', HealthFlagConfigSchema);
