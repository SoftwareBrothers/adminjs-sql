import { Knex } from 'knex';

import { DatabaseDialect } from '../dialects/index.js';
import { Property } from '../Property.js';

export class ResourceMetadata {
  public idProperty: Property;

  constructor(
    public dialect: DatabaseDialect,
    public readonly knex: Knex,
    public readonly database: string,
    public readonly tableName: string,
    public readonly properties: Property[],
  ) {
    const idProperty = properties.find((p) => p?.isId?.());
    if (!idProperty) {
      throw new Error(`Table "${tableName}" has no primary key`);
    }

    this.idProperty = idProperty;
  }
}
