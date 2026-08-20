import { disconnectDB } from '../db';

export default async function teardown() {
  await disconnectDB();
  await (global as any).__MONGOD__.stop();
}
