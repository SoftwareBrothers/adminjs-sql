import { Knex } from 'knex/types';

export type DatabaseDialect = 'postgresql' | 'mysql' | 'mysql2'

export interface BaseConnectionConfig {
    database: string;
    schema?: string;
}

export type ConnectionOptions =
    (Knex.PgConnectionConfig | Knex.MySqlConnectionConfig | Knex.MySql2ConnectionConfig)
    & BaseConnectionConfig;
