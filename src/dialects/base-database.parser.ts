/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable class-methods-use-this */
import * as Knex from 'knex';

import { DatabaseMetadata, ResourceMetadata } from '../metadata/index.js';

import { ConnectionOptions, DatabaseDialect } from './types/index.js';

export class BaseDatabaseParser {
  protected knex: Knex.Knex;

  protected dialect: DatabaseDialect;

  protected connectionOptions: ConnectionOptions;

  public static dialects: DatabaseDialect[];

  constructor(
    dialect: DatabaseDialect,
    connection: ConnectionOptions,
  ) {
    if (!connection.database) {
      throw new Error('Please provide your database');
    }

    const knex = Knex.knex({
      client: dialect,
      connection,
    });

    this.dialect = dialect;
    this.connectionOptions = connection;
    this.knex = knex;
  }

  public async parse(): Promise<DatabaseMetadata> {
    throw new Error('Implement "parse" method for your database parser!');
  }

  public async getSchema(): Promise<string> {
    throw new Error('Implement "getSchema" method for your database parser!');
  }

  public async getTables(schemaName: string): Promise<string[]> {
    throw new Error('Implement "getTables" method for your database parser!');
  }

  public async getResources(tables: string[], schemaName: string): Promise<ResourceMetadata[]> {
    throw new Error('Implement "getResources" method for your database parser!');
  }

  public async getProperties(table: string): Promise<any[]> {
    throw new Error('Implement "getProperties" method for your database parser!');
  }
}
