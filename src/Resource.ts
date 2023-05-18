import {
  BaseRecord,
  BaseResource,
  Filter,
  ParamsType,
  SupportedDatabasesType,
} from 'adminjs';
import type { Knex } from 'knex';

import { ResourceMetadata } from './metadata/index.js';
import { Property } from './Property.js';

export class Resource extends BaseResource {
  static override isAdapterFor(resource: any): boolean {
    const r = resource instanceof ResourceMetadata;

    if (!r) {
      throw new Error('Resource must contain valid metadata.');
    }

    return r;
  }

  private knex: Knex;

  private propertyMap = new Map<string, Property>();

  private tableName: string;

  private schemaName = 'public';

  private _database: string;

  private _properties: Property[];

  private idColumn: string;

  constructor(info: ResourceMetadata) {
    super(info.tableName);
    this.knex = info.knex;
    this.schemaName = info.schemaName;
    this.tableName = info.tableName;
    this._database = info.database;
    this._properties = info.properties;
    this._properties.forEach((p) => {
      this.propertyMap.set(p.path(), p);
    });
    this.idColumn = info.idProperty.path();
  }

  override databaseName(): string {
    return this._database;
  }

  // eslint-disable-next-line class-methods-use-this
  override databaseType(): SupportedDatabasesType | string {
    return 'Postgres';
  }

  override id(): string {
    return this.tableName;
  }

  override properties(): Property[] {
    return this._properties;
  }

  override property(path: string): Property | null {
    return this.propertyMap.get(path) ?? null;
  }

  override async count(filter: Filter): Promise<number> {
    const [r] = await this.filterQuery(filter).count('* as cnt');
    return r.cnt;
  }

  override async find(
    filter: Filter,
    options: {
      limit?: number;
      offset?: number;
      sort?: {
        sortBy?: string;
        direction?: 'asc' | 'desc';
      };
    },
  ): Promise<BaseRecord[]> {
    const query = this.filterQuery(filter);
    if (options.limit) {
      query.limit(options.limit);
    }
    if (options.offset) {
      query.offset(options.offset);
    }
    if (options.sort?.sortBy) {
      query.orderBy(options.sort.sortBy, options.sort.direction);
    }
    const rows: any[] = await query;
    return rows.map((row) => new BaseRecord(row, this));
  }

  override async findOne(id: string): Promise<BaseRecord | null> {
    const res = await this.knex(this.tableName).withSchema(this.schemaName).where(this.idColumn, id);
    return res[0] ? this.build(res[0]) : null;
  }

  override async findMany(ids: (string | number)[]): Promise<BaseRecord[]> {
    const res = await this.knex(this.tableName).withSchema(this.schemaName).whereIn(this.idColumn, ids);
    return res.map((r) => this.build(r));
  }

  override build(params: Record<string, any>): BaseRecord {
    return new BaseRecord(params, this);
  }

  override async create(params: Record<string, any>): Promise<ParamsType> {
    await this.knex(this.tableName).withSchema(this.schemaName).insert(params);

    return params;
  }

  override async update(
    id: string,
    params: Record<string, any>,
  ): Promise<ParamsType> {
    await this.knex
      .from(this.tableName)
      .update(params)
      .where(this.idColumn, id);
    const [row] = await this.knex(this.tableName).withSchema(this.schemaName).where(this.idColumn, id);
    return row;
  }

  override async delete(id: string): Promise<void> {
    await this.knex.withSchema(this.schemaName).from(this.tableName).delete().where(this.idColumn, id);
  }

  private filterQuery(filter: Filter | undefined): Knex.QueryBuilder {
    const q = this.knex(this.tableName).withSchema(this.schemaName);

    if (!filter) {
      return q;
    }

    const { filters } = filter;

    Object.entries(filters ?? {}).forEach(([key, filter]) => {
      if (typeof filter.value === 'object') {
        q.whereBetween(key, [filter.value.from, filter.value.to]);
      } else {
        q.where(key, filter.value);
      }
    });

    return q;
  }
}
