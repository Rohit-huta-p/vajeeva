import mongoose from 'mongoose';

const SourceSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  slug:        { type: String, required: true, unique: true },
  type:        { type: String, required: true },
  recipeCount: { type: Number, default: 0 },
  // Narrative fields (all optional) — editing surface for human-authored copy
  period:        { type: String, default: '' },
  author:        { type: String, default: '' },
  genre:         { type: String, default: '' },
  chapter:       { type: String, default: '' },
  about:         { type: String, default: '' },
  citationRef:   { type: String, default: '' },
  citationNote:  { type: String, default: '' },
  whyItMatters:  { type: String, default: '' },
}, { timestamps: true });

export const Source = mongoose.model('Source', SourceSchema);
