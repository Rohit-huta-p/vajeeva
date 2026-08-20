import { MongoMemoryServer } from 'mongodb-memory-server';

// Runs in Jest's main context, not the test sandbox — mongoose connected here
// would not be connected inside tests. Only manage the server + share its URI.
export default async function setup() {
  const mongod = await MongoMemoryServer.create();
  (global as any).__MONGOD__ = mongod;
  process.env.MONGO_URI = mongod.getUri();
}
