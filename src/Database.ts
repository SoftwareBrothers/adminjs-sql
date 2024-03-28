import { BaseDatabase } from 'adminjs';

import { DatabaseMetadata } from './metadata/index.js';
import { Resource } from './Resource.js';

export class Database extends BaseDatabase {
  public static override isAdapterFor(info: any): boolean {
    return info instanceof DatabaseMetadata;
  }

  constructor(private readonly info: DatabaseMetadata) {
    super(info.database);
  }

  override resources(): Resource[] {
    const tables = this.info.tables();

    return tables.map((metadata) => new Resource(metadata));
  }

  resource(name: string): Resource {
    return new Resource(this.info.table(name));
  }
}
