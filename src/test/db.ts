import pg from 'pg';
import { CamelCasePlugin, Kysely, PostgresDialect, sql } from 'kysely';

import { TestDb } from './types.js';

export function createDatabase() {
  const pool = new pg.Pool({
    host: 'localhost',
    port: 5436,
    user: 'postgres',
    password: 'postgres',
    database: 'postgres',
    max: 10,
  });

  const dialect = new PostgresDialect({ pool });
  const db = new Kysely<TestDb>({
    dialect,
    plugins: [new CamelCasePlugin()],
  }).withSchema('public');

  return db;
}

export async function setupDatabase(db: Kysely<TestDb>) {
  // reset the database
  await db.schema.dropTable('post')
    .ifExists()
    .execute();

  await db.schema.dropTable('profile')
    .ifExists()
    .execute();

  await db.schema.dropTable('user')
    .ifExists()
    .execute();

  await db.schema.dropType('status')
    .ifExists()
    .execute();

  // create the tables + types
  await db.schema.createType('status')
    .asEnum(['ACTIVE', 'REMOVED'])
    .execute();

  await sql.raw('DROP SEQUENCE IF EXISTS user_id_seq')
    .execute(db);

  await db.schema
    .createTable('user')
    .addColumn('id', 'serial', (col) => col.notNull()
      .primaryKey())
    .addColumn('email', 'text', (col) => col.notNull()
      .unique())
    .addColumn('name', 'text')
    .execute();

  await db.schema
    .createTable('profile')
    .addColumn('id', 'uuid', (col) => col.notNull()
      .primaryKey()
      .defaultTo(sql.raw('gen_random_uuid()')))
    .addColumn('bio', 'text', (col) => col.notNull())
    .addColumn('name', 'text')
    .addColumn('user_id', 'integer', (col) => col.notNull()
      .references('user.id'))
    .execute();

  await db.schema
    .createTable('post')
    .addColumn('id', 'serial', (col) => col.notNull()
      .primaryKey())
    .addColumn('created_at', 'timestamp', (col) => col.notNull()
      .defaultTo(sql.raw('now()')))
    .addColumn('title', 'text', (col) => col.notNull())
    .addColumn('content', 'text')

    .addColumn('updated_at', 'timestamp', (col) => col.notNull()
      .defaultTo(sql.raw('now()')))
    .addColumn('some_json', 'json')
    .addColumn('status', sql.ref('public.status'), (col) => col.notNull())
    .addColumn('author_id', 'integer', (col) => col.notNull()
      .references('user.id'))
    .addColumn('published', 'boolean', (col) => col.notNull()
      .defaultTo(false))
    .execute();
}

export async function seedDatabaes(db: Kysely<TestDb>) {
  await db.insertInto('user')
    .values([
      {
        id: 1,
        email: 'hello@world.1.com',
        name: 'Hello World 1',
      },
      {
        id: 2,
        email: 'hello@world.2.com',
        name: 'Hello World 1',
      },
    ])
    .execute();
}

export const config = {
  host: 'localhost',
  port: 5436,
  user: 'postgres',
  password: 'postgres',
  database: 'postgres',
  max: 10,
};
