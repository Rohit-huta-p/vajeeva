import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  email:        { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true },
  role:         { type: String, enum: ['user', 'admin'], default: 'user' },
  lastSyncAt:   { type: Date, default: () => new Date(0) },
  createdAt:    { type: Date, default: Date.now },
});

export const User = mongoose.model('User', UserSchema);
