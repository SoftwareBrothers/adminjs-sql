import { BaseResource } from 'adminjs';
import { Kysely } from 'kysely';
import { ConnectionStringParser, DialectManager } from 'kysely-codegen';
import { ParsedConnectionString } from 'kysely-codegen/dist/core/connection-string-parser.js';
import type { DatabaseMetadata } from 'kysely-codegen/dist/core/index.js';
import { EnumCollection } from 'kysely-codegen/dist/core/enum-collection.js';

import { Database } from './database.js';
import { DATABASE_SYMBOL, DatabaseInformation } from './types.js';

export class Adapter {
  info: DatabaseInformation;

  database?: Database;

  connection: ParsedConnectionString;

  constructor(db: Kysely<any>, config: {
    connectionString: string
  }) {
    this.info = {
      _kind: DATABASE_SYMBOL,
      connectionString: config.connectionString,
      introspection: {
        enums: new EnumCollection(),
        tables: [],
      },
      db,
    };

    const connectionStringParser = new ConnectionStringParser();
    this.connection = connectionStringParser.parse({
      connectionString: config.connectionString,
    });
  }

  async init() {
    this.database = new Database(this.info);
    this.info.introspection = await this.introspect();
    return this;
  }

  table(name: string): BaseResource {
    if (!this.database) {
      throw new Error('Adapter not initialized');
    }

    return this.database.resource(name);
  }

  private async introspect() {
    const dialectManager = new DialectManager();
    const dialect = dialectManager.getDialect(this.connection.inferredDialectName);
    const db = await dialect.introspector.connect({
      connectionString: this.connection.connectionString,
      dialect,
    });

    const metadata: DatabaseMetadata = await dialect.introspector.introspect({ db });
    return {
      tables: metadata.tables,
      enums: metadata.enums,
    };
  }
}
