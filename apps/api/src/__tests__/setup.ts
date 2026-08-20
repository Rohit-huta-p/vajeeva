import { MongoMemoryServer } from 'mongodb-memory-server';
import { connectDB } from '../db';

let mongod: MongoMemoryServer;

export default async function setup() {
  mongod = await MongoMemoryServer.create();
  (global as any).__MONGOD__ = mongod;
  process.env.MONGO_URI = mongod.getUri();
  await connectDB(mongod.getUri());
}
