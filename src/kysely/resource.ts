import { BaseProperty, BaseRecord, BaseResource, Filter, flat } from 'adminjs';

import Property from './property.js';
import { convertFilters, convertParam } from './utils/converts.js';
import { FindOptions, PROPERTY_SYMBOL, RESOURCE_SYMBOL, ResourceInformation } from './types.js';

export class Resource extends BaseResource {
  private info: ResourceInformation;

  constructor(info: ResourceInformation) {
    super();
    this.info = info;
  }

  static isAdapterFor(info: ResourceInformation): boolean {
    return Boolean(info._kind === RESOURCE_SYMBOL);
  }

  databaseName(): string {
    return 'kysely';
  }

  databaseType(): string {
    const executor = this.info
      .db
      .getExecutor();

    return executor.adapter.constructor.name
      .replace('Adapter', '')
      .toLowerCase();
  }

  id(): string {
    return this.info.table.name;
  }

  properties(): Array<BaseProperty> {
    return this.info
      .table
      .columns
      .map(
        (c) => new Property({
          _kind: PROPERTY_SYMBOL,
          introspection: this.info.introspection,
          column: c,
        }),
      );
  }

  property(path: string): BaseProperty | null {
    const column = this.info
      .table
      .columns
      .find((c) => c.name === path);

    if (!column) {
      throw new Error(`Column not found ${path}`);
    }

    return new Property({
      _kind: PROPERTY_SYMBOL,
      introspection: this.info.introspection,
      column: column!,
    });
  }

  async count(filter?: Filter) {
    let query = this.info
      .db
      .selectFrom(this.id())
      .select((eb) => eb.fn.count<number>(this.primaryKey())
        .as('count'));

    query = convertFilters(this.info.db, query, filter);
    const result = await query.executeTakeFirst();
    return result ? Number(result.count) : 0;
  }

  primaryKey(): string {
    // todo find real primary key
    return (
      this.info
        .table
        .columns
        .find((c) => c.dataTypeSchema === 'PRIMARY-KEY')
        ?.name || 'id'
    );
  }

  async find(filter: Filter, findOptions: FindOptions = {}) {
    findOptions = {
      limit: 20,
      offset: 0,
      ...findOptions,
    };

    const { info } = this;
    let query = info.db
      .selectFrom(this.id())
      .selectAll()
      .limit(findOptions.limit!)
      .offset(findOptions.offset!);

    if (findOptions.sort && findOptions.sort.sortBy) {
      query = query.orderBy(findOptions.sort.sortBy, findOptions.sort.direction || 'desc');
    }

    query = convertFilters(info.db, query, filter);
    const result = await query.execute();
    return result.map((row) => new BaseRecord(row, this));
  }

  async findOne(id: string | number): Promise<BaseRecord | null> {
    const row = await this.info
      .db
      .selectFrom(this.id())
      .selectAll()
      .where(this.info
        .db
        .dynamic
        .ref(this.primaryKey()), '=', id)
      .executeTakeFirst();

    if (!row) {
      return null;
    }

    return new BaseRecord(row, this);
  }

  async findMany(ids: Array<string | number>) {
    const rows = await this.info
      .db
      .selectFrom(this.info.table.name)
      .selectAll()
      .where(this.primaryKey(), 'in', ids)
      .execute();

    return rows.map((row) => new BaseRecord(row, this));
  }

  public async create(
    params: Record<string, any>,
  ): Promise<Record<string, any>> {
    const preparedParams = this.prepareParams(params);

    const result = await this.info.db.insertInto(this.id())
      .values(preparedParams)
      .returningAll()
      .executeTakeFirstOrThrow();

    return this.prepareReturnValues(result);
  }

  async update(id: string | number, params: Record<string, any>) {
    const preparedParams = this.prepareParams(params);

    const result = await this.info.db.updateTable(this.id())
      .set(preparedParams)
      .where(this.primaryKey(), '=', id)
      .returningAll()
      .executeTakeFirstOrThrow();

    return this.prepareReturnValues(result);
  }

  async delete(id: string | number): Promise<void> {
    await this.info.db.deleteFrom(this.id())
      .where(this.primaryKey(), '=', id)
      .execute();
  }

  private prepareReturnValues(
    params: Record<string, any>,
  ): Record<string, any> {
    const preparedValues: Record<string, any> = {};

    for (const property of this.properties()) {
      const param = flat.get(params, property.path());
      const key = property.path();

      if (param !== undefined && property.type() !== 'reference') {
        preparedValues[key] = param;
        // eslint-disable-next-line no-continue
        continue;
      }

      const foreignColumnName = (property as Property).foreignColumnName();
      // eslint-disable-next-line no-continue
      if (!foreignColumnName) continue;

      preparedValues[key] = params[foreignColumnName];
    }

    return preparedValues;
  }

  private prepareParams(params: Record<string, any>): Record<string, any> {
    const preparedParams: Record<string, any> = {};

    for (const property of this.properties() as Array<Property>) {
      const param = flat.get(params, property.path());
      const key = property.path();

      // eslint-disable-next-line no-continue
      if (param === undefined) continue;

      const type = property.type();
      const foreignColumnName = property.foreignColumnName();

      if (type === 'reference' && foreignColumnName) {
        preparedParams[foreignColumnName] = convertParam(
          property,
          param,
        );

        // eslint-disable-next-line no-continue
        continue;
      }

      if (property.isArray()) {
        preparedParams[key] = param
          ? param.map((p) => convertParam(property, p))
          : param;
      } else {
        preparedParams[key] = convertParam(property, param);
      }
    }

    return preparedParams;
  }
}
