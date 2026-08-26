/**
 * seed-admin.ts — idempotent admin account creator/promoter.
 * Run: npx ts-node src/scripts/seed-admin.ts <email> <password>
 *  or: ADMIN_EMAIL=… ADMIN_PASSWORD=… npx ts-node src/scripts/seed-admin.ts
 *
 * Existing user with that email -> promoted to admin (password updated).
 * No user -> created as admin. Same bcrypt cost as the register route.
 * Never touches other accounts; safe to re-run.
 */

import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) throw new Error('MONGO_URI not set in .env');

const email = (process.argv[2] ?? process.env.ADMIN_EMAIL ?? '').trim().toLowerCase();
const password = process.argv[3] ?? process.env.ADMIN_PASSWORD ?? '';
if (!email || !password) {
  console.error('usage: ts-node src/scripts/seed-admin.ts <email> <password>  (min 8 chars)');
  process.exit(1);
}
if (password.length < 8) {
  console.error('password must be at least 8 characters (register-route policy)');
  process.exit(1);
}

(async () => {
  await mongoose.connect(MONGO_URI);
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.findOneAndUpdate(
    { email },
    { $set: { passwordHash, role: 'admin' }, $setOnInsert: { email } },
    { new: true, upsert: true },
  );
  console.log(`admin ready: ${user.email} (role=${user.role}, id=${user._id})`);
  await mongoose.disconnect();
})().catch(err => { console.error(err); process.exit(1); });
