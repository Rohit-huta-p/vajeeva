import mongoose from 'mongoose';

// One document per admin-defined filter group (effort / taste / occasion …).
// Filter tags in TagConfig reference a group by `code`; label is the display name.
const FilterGroupConfigSchema = new mongoose.Schema({
  code:  { type: String, required: true }, // slug: 'effort', 'taste', …
  label: { type: String, required: true }, // display: 'Effort', 'Taste', …
  order: { type: Number, default: 0 },     // sort order in home page + admin kanban
}, { timestamps: true });

FilterGroupConfigSchema.index({ code: 1 }, { unique: true });

export const FilterGroupConfig = mongoose.model('FilterGroupConfig', FilterGroupConfigSchema);

/** Seeds used when the collection is empty on first boot. */
export const FILTER_GROUP_DEFAULTS = [
  { code: 'effort',   label: 'Effort',   order: 1 },
  { code: 'taste',    label: 'Taste',    order: 2 },
  { code: 'occasion', label: 'Occasion', order: 3 },
];
