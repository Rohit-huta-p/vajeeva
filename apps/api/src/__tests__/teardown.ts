export default async function teardown() {
  await (global as any).__MONGOD__.stop();
}
