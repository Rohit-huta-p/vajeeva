import { connectDB, disconnectDB } from '../db';

beforeAll(async () => {
  await connectDB(process.env.MONGO_URI!);
});

afterAll(async () => {
  await disconnectDB();
});
