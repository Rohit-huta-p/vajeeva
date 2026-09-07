import mongoose from 'mongoose';

// One document per texture/category (solid, liquid, semi-solid, …).
// The `category` field on Recipe references a texture's `code`.
const TextureConfigSchema = new mongoose.Schema({
  code:     { type: String, required: true }, // machine id: 'solid', 'liquid', 'semi-solid'
  label:    { type: String, required: true }, // display: 'Solid', 'Liquid', …
  subtitle: { type: String, default: '' },    // tagline shown on home pillar
  order:    { type: Number, default: 0 },
  enabled:  { type: Boolean, default: true },
  builtIn:  { type: Boolean, default: false }, // built-ins cannot be deleted
}, { timestamps: true });

TextureConfigSchema.index({ code: 1 }, { unique: true });

export const TextureConfig = mongoose.model('TextureConfig', TextureConfigSchema);

/** Seeded on first boot when the collection is empty. */
export const TEXTURE_DEFAULTS = [
  { code: 'solid',      label: 'Solid',      subtitle: 'Breads · sweets · snacks',        order: 1, builtIn: true, enabled: true },
  { code: 'liquid',     label: 'Liquid',     subtitle: 'Drinks · soups · buttermilk',     order: 2, builtIn: true, enabled: true },
  { code: 'semi-solid', label: 'Semi-solid', subtitle: 'Porridge · puddings · chutneys',  order: 3, builtIn: true, enabled: true },
];
