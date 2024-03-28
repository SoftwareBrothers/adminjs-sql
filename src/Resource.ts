import { BaseRecord, BaseResource, Filter, ParamsType, SupportedDatabasesType } from 'adminjs';
import type { Knex } from 'knex';

import { ResourceMetadata } from './metadata/index.js';
import { Property } from './Property.js';
import { DatabaseDialect } from './dialects/index.js';

type PrimaryKey = string | number

export class Resource extends BaseResource {
  private knex: Knex;

  private dialect: DatabaseDialect;

  private propertyMap = new Map<string, Property>();

  private tableName: string;

  private schemaName: string | null;

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
    this.dialect = info.dialect;
  }

  static override isAdapterFor(resource: any): boolean {
    return resource instanceof ResourceMetadata;
  }

  override databaseName(): string {
    return this._database;
  }

  // eslint-disable-next-line class-methods-use-this
  override databaseType(): SupportedDatabasesType | string {
    const dialectMap: Record<DatabaseDialect, SupportedDatabasesType> = {
      mysql: 'MySQL',
      mysql2: 'MySQL',
      postgresql: 'Postgres',
    };

    return dialectMap[this.dialect];
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
    const [r] = await this.filterQuery(filter).count('* as count');
    return Number(r.count);
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

  override async findOne(id: PrimaryKey): Promise<BaseRecord | null> {
    const knex = this.schemaName
      ? this.knex(this.tableName).withSchema(this.schemaName)
      : this.knex(this.tableName);
    const res = await knex.where(this.idColumn, id);
    return res[0] ? this.build(res[0]) : null;
  }

  override async findMany(ids: PrimaryKey[]): Promise<BaseRecord[]> {
    const knex = this.schemaName
      ? this.knex(this.tableName).withSchema(this.schemaName)
      : this.knex(this.tableName);
    const res = await knex.whereIn(this.idColumn, ids);
    return res.map((r) => this.build(r));
  }

  override build(params: Record<string, any>): BaseRecord {
    return new BaseRecord(params, this);
  }

  override async create(params: Record<string, any>): Promise<ParamsType> {
    const knex = this.schemaName
      ? this.knex(this.tableName).withSchema(this.schemaName)
      : this.knex(this.tableName);
    await knex.insert(params);

    return params;
  }

  override async update(
    id: string,
    params: Record<string, any>,
  ): Promise<ParamsType> {
    const knex = this.schemaName
      ? this.knex.withSchema(this.schemaName)
      : this.knex;

    await knex.from(this.tableName).update(params).where(this.idColumn, id);

    const knexQb = this.schemaName
      ? this.knex(this.tableName).withSchema(this.schemaName)
      : this.knex(this.tableName);
    const [row] = await knexQb.where(this.idColumn, id);
    return row;
  }

  override async delete(id: string): Promise<void> {
    const knex = this.schemaName
      ? this.knex.withSchema(this.schemaName)
      : this.knex;
    await knex.from(this.tableName).delete().where(this.idColumn, id);
  }

  private filterQuery(filter: Filter | undefined): Knex.QueryBuilder {
    const knex = this.schemaName
      ? this.knex(this.tableName).withSchema(this.schemaName)
      : this.knex(this.tableName);
    const q = knex;

    if (!filter) {
      return q;
    }

    const { filters } = filter;

    Object.entries(filters ?? {}).forEach(([key, filter]) => {
      if (
        typeof filter.value === 'object'
        && ['date', 'datetime'].includes(filter.property.type())
      ) {
        q.whereBetween(key, [filter.value.from, filter.value.to]);
      } else if (filter.property.type() === 'string') {
        if (this.dialect === 'postgresql') {
          q.whereILike(key, `%${filter.value}%`);
        } else {
          q.whereLike(key, `%${filter.value}%`);
        }
      } else {
        q.where(key, filter.value);
      }
    });

    return q;
  }
}
