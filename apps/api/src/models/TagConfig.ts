import mongoose from 'mongoose';

// Admin-managed controlled vocabulary for discovery facets (type / meal / main
// ingredient / method / diet). One row per allowed value, keyed by facet — the
// same pattern as HealthFlagConfig. Recipes store the `code`s; this is the
// source of truth for which values exist and how they're labelled/ordered.
export const TAG_FACETS = ['type', 'meal', 'ingredient', 'method', 'diet'] as const;
export type TagFacet = (typeof TAG_FACETS)[number];

const TagConfigSchema = new mongoose.Schema({
  facet:   { type: String, required: true, enum: TAG_FACETS },
  code:    { type: String, required: true }, // slug, e.g. 'black-gram'
  label:   { type: String, required: true }, // display, e.g. 'Black gram'
  order:   { type: Number, default: 0 },     // sort within a facet
  enabled: { type: Boolean, default: true }, // hide a value without deleting it
}, { timestamps: true });

// A code is unique within its facet (the same code may appear under two facets).
TagConfigSchema.index({ facet: 1, code: 1 }, { unique: true });

export const TagConfig = mongoose.model('TagConfig', TagConfigSchema);
