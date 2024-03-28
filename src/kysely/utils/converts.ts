import { Filter } from 'adminjs';
import { Kysely, SelectQueryBuilder } from 'kysely';

import Property from '../property.js';

import { safeParseJSON, safeParseNumber } from './helpers.js';

export const convertParam = (
  property: Property,
  value: string | boolean | number | Record<string, any> | null | undefined,
): string | boolean | number | Record<string, any> | null | undefined => {
  const type = property.type();

  if (type === 'key-value') return value;
  if (type === 'number') {
    return safeParseNumber(value);
  }
  if (type === 'reference') {
    // todo references
    const foreignColumn = ([] as Array<{
      name: string,
      type: string
    }>).find((field) => field.name === property.foreignColumnName());
    if (!foreignColumn) return value;
    if (value === undefined || value === null) return value;

    const foreignColumnType = foreignColumn.type;
    if (foreignColumnType === 'String') return String(value);

    return safeParseNumber(value);
  }

  return value;
};

export const convertFilters = <Db>(
  db: Kysely<Db>,
  query: SelectQueryBuilder<Db, any, any>,
  filterObject?: Filter,
): SelectQueryBuilder<Db, any, any> => {
  if (!filterObject) return query;

  const uuidRegex = /^[0-9A-F]{8}-[0-9A-F]{4}-[5|4|3|2|1][0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i;
  const { filters = {} } = filterObject;
  return Object.entries(filters)
    .reduce((query, [name, filter]) => {
      if (['boolean', 'number', 'float', 'object', 'array'].includes(filter.property.type())) {
        query = query.where(db.dynamic.ref(name), '=', safeParseJSON(filter.value as string));
      } else if (['date', 'datetime'].includes(filter.property.type())) {
        if (typeof filter.value !== 'string' && filter.value.from && filter.value.to) {
          query = query.where(db.dynamic.ref(name), '>', filter.value.from);
          query = query.where(db.dynamic.ref(name), '<', filter.value.to);
        } else if (typeof filter.value !== 'string' && filter.value.from) {
          query = query.where(db.dynamic.ref(name), '>=', new Date(filter.value.from));
        } else if (typeof filter.value !== 'string' && filter.value.to) {
          query = query.where(db.dynamic.ref(name), '<=', new Date(filter.value.to));
        }
      } else if ((filter.property as Property).isEnum()) {
        query = query.where(db.dynamic.ref(name), '=', filter.value);
      } else if (filter.property.type() === 'uuid' && uuidRegex.test(filter.value.toString())) {
        query = query.where(db.dynamic.ref(name), '=', filter.value);
      } else if (filter.property.type() === 'reference' && (filter.property as Property).foreignColumnName()) {
        // where[(filter.property as Property).foreignColumnName() as string] = convertParam(
        //   filter.property as Property,
        //   modelFields,
        //   filter.value,
        // );
      } else {
        query = query.where(db.dynamic.ref(name), 'ilike', `%${filter.value.toString()}%`);
      }

      return query;
    }, query);
};
