import mongoose from 'mongoose';

const SourceSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  slug:        { type: String, required: true, unique: true },
  type:        { type: String, required: true },
  recipeCount: { type: Number, default: 0 },
}, { timestamps: true });

export const Source = mongoose.model('Source', SourceSchema);
