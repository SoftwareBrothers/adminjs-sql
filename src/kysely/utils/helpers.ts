/* eslint-disable no-restricted-globals */
/* eslint-disable max-len */
import { PropertyType } from 'adminjs';

/**
 * This function is used to map actual model name to it's prisma manager.
 * Ref: https://github.com/prisma/prisma/blob/ba74c81fdbc9e6405946fdc6f9d42d103d008dc2/packages/client/src/runtime/utils/common.ts#L452
 * @param name    string value
 * @returns       `name` with it's first character converted to lowercase
 */
export const lowerCase = (name: string): string => name.substring(0, 1)
  .toLowerCase() + name.substring(1);
/* eslint-enable max-len */

export const isNumeric = (
  value: null | string | number | boolean | Record<string, any> | undefined,
): boolean => {
  const stringValue = (String(value)).replace(/,/g, '.');

  if (isNaN(parseFloat(stringValue))) return false;

  return isFinite(Number(stringValue));
};

export const safeParseNumber = (
  value?: null | string | number | boolean | Record<string, any>,
): string | number | null | boolean | Record<string, any> | undefined => {
  if (isNumeric(value)) return Number(value);

  return value;
};

export const safeParseJSON = (json: string): Record<string, any> | null => {
  try {
    return JSON.parse(json);
  } catch (e) {
    return null;
  }
};

export const getColumnType = (dbType: string): PropertyType => {
  switch (dbType) {
  case 'uuid':
    return 'uuid';
  case 'bigint':
  case 'int8':
  case 'bigserial':
  case 'serial8':
  case 'integer':
  case 'int':
  case 'int4':
  case 'smallint':
  case 'int2':
  case 'serial':
  case 'serial4':
  case 'smallserial':
  case 'serial2':
    return 'number';
  case 'double precision':
  case 'float8':
  case 'numeric':
  case 'decimal':
  case 'real':
  case 'float4':
    return 'float';
  case 'money':
    return 'currency';
  case 'boolean':
    return 'boolean';
  case 'time':
  case 'time with time zone':
  case 'timetz':
  case 'time without time zone':
  case 'timestamp':
  case 'timestamp with time zone':
  case 'timestamptz':
  case 'timestamp without time zone':
    return 'datetime';
  case 'date':
    return 'date';
  case 'json':
  case 'jsonb':
    return 'key-value';
  case 'text':
  case 'character varying':
  case 'char':
  case 'varchar':
  default:
    return 'string';
  }
};
