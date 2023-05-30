import stream from 'stream';

export type DatabaseDialect = 'postgresql' | 'mysql' | 'mysql2'

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

export interface MysqlSslConfiguration {
  key?: string;
  cert?: string;
  ca?: string;
  capath?: string;
  cipher?: string;
  rejectUnauthorized?: boolean;
  expirationChecker?(): boolean;
}

// Config object for mysql: https://github.com/mysqljs/mysql#connection-options
export interface MysqlConnectionConfig {
  host?: string;
  port?: number;
  localAddress?: string;
  socketPath?: string;
  user?: string;
  password?: string;
  charset?: string;
  timezone?: string;
  connectTimeout?: number;
  stringifyObjects?: boolean;
  insecureAuth?: boolean;
  typeCast?: any;
  queryFormat?: (query: string, values: any) => string;
  supportBigNumbers?: boolean;
  bigNumberStrings?: boolean;
  dateStrings?: boolean;
  debug?: boolean;
  trace?: boolean;
  multipleStatements?: boolean;
  flags?: string;
  ssl?: string | MysqlSslConfiguration;
  decimalNumbers?: boolean;
  expirationChecker?(): boolean;
}

export interface BaseConnectionConfig {
  database: string;
  schema?: string;
}

export type ConnectionOptions = (PostgresConnectionConfig | MysqlConnectionConfig) & BaseConnectionConfig;
