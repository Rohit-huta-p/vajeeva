/**
 * create-search-index.ts — creates (or reports on) the Atlas Search index
 * backing GET /api/recipes/search — see recipes.routes.ts for the query
 * shape this index supports, and search/recipesSearchIndex.ts for the
 * mapping/analyzer definition itself.
 * Run: npm run search:create-index
 *
 * Atlas Search indexes only exist on MongoDB Atlas (7.0+ cluster tier), not
 * on a local/self-hosted mongod — this must be run against the real
 * MONGO_URI, never mongodb-memory-server. Safe to re-run: it skips creation
 * (and just prints current status) if an index with this name already
 * exists. To apply a definition change, edit search/recipesSearchIndex.ts and
 * either update it in the Atlas UI or drop the index and re-run this script.
 *
 * Index builds run asynchronously on Atlas — after "creation submitted",
 * allow roughly 30-60s (re-run this script to poll status) before the
 * search route will return results.
 */

import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import mongoose from 'mongoose';
import { SEARCH_INDEX_NAME, SEARCH_INDEX_DEFINITION } from '../search/recipesSearchIndex';

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) throw new Error('MONGO_URI not set in .env');

async function main() {
  console.log('Connecting…');
  await mongoose.connect(MONGO_URI!);
  console.log('Connected.\n');

  const db = mongoose.connection.db;
  if (!db) throw new Error('No active db connection');
  const collection = db.collection('recipes');

  // The driver's ListSearchIndexesCursor only types `{ name: string }`, but the
  // server actually returns status/queryable/latestDefinition too.
  const existing: any[] = await collection.listSearchIndexes(SEARCH_INDEX_NAME).toArray().catch(() => []);
  if (existing.length > 0) {
    console.log(`Index "${SEARCH_INDEX_NAME}" already exists — status: ${existing[0].status} (queryable: ${existing[0].queryable}).`);
    console.log('Skipping creation. Edit search/recipesSearchIndex.ts + update via Atlas UI (or drop and re-run this script) to change the mapping.');
  } else {
    console.log(`Creating search index "${SEARCH_INDEX_NAME}" on collection "recipes"…`);
    const name = await collection.createSearchIndex({ name: SEARCH_INDEX_NAME, definition: SEARCH_INDEX_DEFINITION });
    console.log(`Submitted index "${name}". It builds asynchronously on Atlas.`);
    console.log('Re-run this script in ~30-60s to poll status; queryable:true means GET /api/recipes/search is ready to use.');
  }

  await mongoose.disconnect();
}

main().catch(err => { console.error(err); process.exit(1); });
