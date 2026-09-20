import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  email:        { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true },
  role:         { type: String, enum: ['user', 'admin'], default: 'user' },
  lastSyncAt:   { type: Date, default: () => new Date(0) },
  createdAt:    { type: Date, default: Date.now },
  // Extended fields (optional)
  name:          { type: String, default: '' },
  phone:         { type: String, default: '' },
  age:           { type: Number },
  gender:        { type: String, enum: ['female', 'male', 'other', 'prefer_not_to_say'] },
  healthProfile: { type: [String], default: [] },
  programStartAt: { type: Date }, // dietitian-set; Day 1 of the dietary diary. See docs/specs/2026-09-20-dietary-diary.md.
});

export const User = mongoose.model('User', UserSchema);
