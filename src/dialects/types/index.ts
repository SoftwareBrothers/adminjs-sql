import stream from 'stream';

export type PgGetTypeParser = (oid: number, format: string) => any;

export interface PgCustomTypesConfig {
  getTypeParser: PgGetTypeParser;
}

// Config object for pg: https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/pg/index.d.ts
export interface PostgresConnectionConfig {
  user?: string;
  database?: string;
  password?: string | (() => string | Promise<string>);
  port?: number;
  host?: string;
  connectionString?: string;
  keepAlive?: boolean;
  stream?: stream.Duplex;
  statement_timeout?: false | number;
  parseInputDatesAsUTC?: boolean;
  ssl?: boolean | ConnectionOptions;
  query_timeout?: number;
  keepAliveInitialDelayMillis?: number;
  idle_in_transaction_session_timeout?: number;
  application_name?: string;
  connectionTimeoutMillis?: number;
  types?: PgCustomTypesConfig;
  options?: string;
}

export type ConnectionOptions = PostgresConnectionConfig & { database: string };
