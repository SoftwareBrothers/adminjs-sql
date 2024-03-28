import { Knex } from 'knex';

import { DatabaseDialect } from '../dialects/index.js';

const isMySqlDialect = (dialect: DatabaseDialect) => dialect === 'mysql' || dialect === 'mysql2';

const getMigration = (schema: string, dialect: DatabaseDialect): Knex.Migration & { id: string } => ({
  async up(knex: Knex) {
    return knex.schema
      .withSchema(schema)
      .createTable('user', (table) => {
        table.increments('id').notNullable();
        table.string('email', 255).notNullable();
        table.string('name', 255).notNullable();
      })
      .createTable('profile', (table) => {
        if (dialect === 'postgresql') {
          table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
          table.integer('user_id').notNullable().references('user.id');
        } else if (isMySqlDialect(dialect)) {
          table.uuid('id').primary().defaultTo(knex.raw('(uuid())'));
          table.integer('user_id').unsigned().notNullable().references('user.id');
        }

        table.text('bio').notNullable();
        table.text('name').notNullable();
      })
      .createTable('post', (table) => {
        table.increments('id').notNullable();
        table.dateTime('created_at').notNullable().defaultTo(knex.fn.now());
        table.dateTime('updated_at').notNullable().defaultTo(knex.fn.now());
        table.json('some_json');
        table.enum('status', ['ACTIVE', 'INACTIVE']).notNullable();
        table.text('content').notNullable();
        table.string('title', 255).notNullable();
        table.boolean('published').notNullable().defaultTo(false);

        if (dialect === 'postgresql') {
          table.integer('author_id').notNullable().references('user.id');
        } else if (isMySqlDialect(dialect)) {
          table.integer('author_id').unsigned().notNullable().references('user.id');
        }
      });
  },
  async down(knex: Knex) {
    return knex.schema
      .dropTableIfExists('post')
      .dropTableIfExists('profile')
      .dropTableIfExists('user');
  },
  id: 'initialize',
});

export const getMigrationSource = (schema: string, dialect: DatabaseDialect): Knex.MigrationSource<any> => {
  const migration = getMigration(schema, dialect);
  return {
    getMigration: async () => migration,
    getMigrationName: (migration: string) => migration,
    getMigrations: async () => [migration.id],
  };
};
