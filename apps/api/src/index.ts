import dotenv from 'dotenv';
dotenv.config();

import { createApp } from './app';
import { connectDB } from './db';

const PORT = process.env.PORT ?? 4000;
const MONGO_URI = process.env.MONGO_URI!;

connectDB(MONGO_URI).then(() => {
  createApp().listen(PORT, () => {
    console.log(`API running on port ${PORT}`);
  });
});
