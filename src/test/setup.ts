import { createDatabase, seedDatabaes, setupDatabase } from './db.js';

export async function setup() {
  const db = createDatabase();
  await setupDatabase(db);
  await seedDatabaes(db);
  await db.destroy();
}
