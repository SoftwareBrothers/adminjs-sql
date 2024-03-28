import { BaseDatabase, BaseResource } from 'adminjs';

import { Resource } from './resource.js';
import { DATABASE_SYMBOL, DatabaseInformation, RESOURCE_SYMBOL } from './types.js';

export class Database extends BaseDatabase {
  info: DatabaseInformation;

  constructor(info: DatabaseInformation) {
    super({});
    this.info = info;
  }

  static isAdapterFor(info: DatabaseInformation): boolean {
    return Boolean(
      info.db
      && info.db.constructor.name === 'Kysely'
      && info._kind === DATABASE_SYMBOL,
    );
  }

  resources(): Array<BaseResource> {
    return this.info.introspection.tables.map((table) => new Resource({
      _kind: RESOURCE_SYMBOL,
      introspection: this.info.introspection,
      db: this.info.db,
      table,
    }));
  }

  resource(name: string): BaseResource {
    const resources = this.resources();
    const resource = resources.find((resource) => resource.id() === name);
    if (!resource) {
      throw new Error(`Resource with id ${name} not found`);
    }

    return resource;
  }
}
