import { BaseDatabaseParser } from './base-database.parser.js';
import { MysqlParser } from './mysql.parser.js';
import { PostgresParser } from './postgres.parser.js';
import { ConnectionOptions, DatabaseDialect } from './types/index.js';

export * from './types/index.js';

const parsers: (typeof BaseDatabaseParser)[] = [PostgresParser, MysqlParser];

export function parse(dialect: DatabaseDialect, connection: ConnectionOptions) {
  const Parser = parsers.find((p) => p.dialects.includes(dialect));

  if (!Parser) {
    throw new Error(`${dialect} is not supported.`);
  }

  return new Parser(dialect, connection).parse();
}
