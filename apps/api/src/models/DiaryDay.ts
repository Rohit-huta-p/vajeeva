import mongoose from 'mongoose';

// One row per patient per day — the day-level fields the dietary diary needs that
// don't belong to a single make (adherence + remarks). Meal recipes and photos are
// derived from CookLog; this holds only what a make can't. Keyed by the patient's
// LOCAL calendar day ('YYYY-MM-DD') so "which day" never drifts with timezone.
// Self-reported by the patient; the dietitian may amend. See docs/specs/2026-09-20-dietary-diary.md.
const DiaryDaySchema = new mongoose.Schema({
  userId:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date:           { type: String, required: true },   // patient-local 'YYYY-MM-DD'
  adherence:      { type: String, enum: ['followed', 'partial', 'deviated'] },
  remarks:        { type: String, default: '' },      // reason for deviation / notes
  amendedByAdmin: { type: Boolean, default: false },
});

DiaryDaySchema.index({ userId: 1, date: 1 }, { unique: true }); // one row per patient-day

export const DiaryDay = mongoose.model('DiaryDay', DiaryDaySchema);
