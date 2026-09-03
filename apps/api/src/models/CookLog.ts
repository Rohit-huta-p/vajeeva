import mongoose from 'mongoose';

// One row per confirmed "I made this" — the durable engagement + satisfaction
// anchor. Append-only (repeats are the signal, so NOT unique on user+recipe).
// The optional rating rides the same row. See docs/specs/2026-09-03-admin-outcomes.md.
const CookLogSchema = new mongoose.Schema({
  userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User',   required: true },
  recipeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipe', required: true },
  madeAt:   { type: Date, default: Date.now },
  rating:   { type: Number, min: 1, max: 5 },   // optional — "how did it go?"
  note:     { type: String, default: '' },
});

CookLogSchema.index({ userId: 1, recipeId: 1 }); // history + counts per recipe
CookLogSchema.index({ userId: 1, madeAt: -1 });  // recent activity / cadence

export const CookLog = mongoose.model('CookLog', CookLogSchema);
