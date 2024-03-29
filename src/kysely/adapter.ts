import { BaseResource } from 'adminjs';
import { Kysely } from 'kysely';
import {
  ConnectionStringParser,
  DatabaseMetadata,
  DialectManager,
  DialectName,
  ParsedConnectionString,
} from 'kysely-codegen';

import { Database } from './database.js';
import { DATABASE_SYMBOL } from './types.js';

export class Adapter {
  database?: Database;

  connection: ParsedConnectionString;

  constructor(dialectName: DialectName, config: {
    connectionString: string
  }) {
    const connectionStringParser = new ConnectionStringParser();
    this.connection = connectionStringParser.parse({
      dialectName,
      connectionString: config.connectionString,
    });
  }

  async init() {
    const introspection = await this.introspect();
    const dialect = await this.getDialect()
      .createKyselyDialect({ connectionString: this.connection.connectionString });
    this.database = new Database({
      _kind: DATABASE_SYMBOL,
      // @ts-ignore not sure why the typing isn't working
      db: new Kysely({ dialect }),
      introspection,
    });

    return this;
  }

  table(name: string): BaseResource {
    if (!this.database) {
      throw new Error('Adapter not initialized');
    }

    return this.database.resource(name);
  }

  getDialect() {
    const dialectManager = new DialectManager();
    return dialectManager.getDialect(this.connection.inferredDialectName);
  }

  private async introspect() {
    const dialect = this.getDialect();
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
