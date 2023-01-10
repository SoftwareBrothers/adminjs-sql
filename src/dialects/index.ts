import { ConnectionOptions } from './types/index';
import { PostgresParser } from './postgres.parser';
import { BaseDatabaseParser } from './base-database.parser';

export * from './types';

export type DatabaseDialect = 'postgresql'

const parsers: (typeof BaseDatabaseParser)[] = [PostgresParser];

export function parse(dialect: DatabaseDialect, connection: ConnectionOptions) {
  const Parser = parsers.find((p) => p.dialects.includes(dialect));

  if (!Parser) {
    throw new Error(`${dialect} is not supported.`);
  }

  return new Parser(dialect, connection).parse();
}
