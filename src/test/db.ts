import * as Knex from 'knex';

import { getMigrationSource } from './migration.js';
import { DatabaseConfig } from './types.js';
import { getEnv } from './env.js';

export async function setupDatabase(config: DatabaseConfig, knex: Knex.Knex) {
  const migrationSource = getMigrationSource(config.schema, config.dialect);

  await knex.migrate.down({
    database: config.database,
    schemaName: config.schema,
    migrationSource,
  });

  await knex.migrate.up({
    database: config.database,
    schemaName: config.schema,
    migrationSource,
  });
}

export const getDatabaseConfig = (): DatabaseConfig => {
  const env = getEnv();
  switch (env.DIALECT) {
  case 'postgresql':
    return {
      client: 'pg',
      database: env.POSTGRES_DB,
      databaseType: 'Postgres',
      dialect: 'postgresql',
      host: env.POSTGRES_HOST,
      password: env.POSTGRES_PASSWORD,
      port: 5432,
      schema: 'public',
      user: env.POSTGRES_USER,
    };
  case 'mysql2':
  case 'mysql':
    return {
      client: 'mysql2',
      database: env.MYSQL_DATABASE,
      databaseType: 'MySQL',
      dialect: 'mysql2',
      host: env.MYSQL_HOST,
      password: env.MYSQL_ROOT_PASSWORD,
      port: 3306,
      schema: env.MYSQL_DATABASE,
      user: env.MYSQL_DEFAULT_USER,
      charset: 'utf8',
    };
  default:
    throw new Error(`Unknown database dialect: ${env.DIALECT}`);
  }
};

export const getDatabase = () => {
  const config = getDatabaseConfig();
  return {
    config,
    knex: createKnex(config),
  };
};

export const createKnex = (databaseConfig: DatabaseConfig): Knex.Knex => Knex.knex({
  client: databaseConfig.client,
  connection: {
    charset: databaseConfig.charset,
    database: databaseConfig.database,
    host: databaseConfig.host,
    password: databaseConfig.password,
    port: databaseConfig.port,
    user: databaseConfig.user,
  },
});
