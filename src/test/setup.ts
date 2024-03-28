import { getDatabase, setupDatabase } from './db.js';

export async function setup() {
  const { knex, config } = getDatabase();

  try {
    await setupDatabase(config, knex);
    await knex.destroy();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}
