/**
 * MySQL parser originally authored by https://github.com/wirekang
 * Source: https://github.com/wirekang/adminjs-sql/blob/main/src/parser/mysql.ts
 */
import { PropertyType } from 'adminjs';

import { DatabaseMetadata, ResourceMetadata } from '../metadata/index.js';
import { ColumnInfo, Property } from '../Property.js';

import { BaseDatabaseParser } from './base-database.parser.js';

const getColumnInfo = (column: Record<string, any>): ColumnInfo => {
  const type = column.DATA_TYPE.toLowerCase();
  const columnType = column.COLUMN_TYPE.toLowerCase();

  let availableValues: string[] | null = null;
  if (type === 'set' || type === 'enum') {
    if (!columnType.startsWith(type)) {
      throw new Error(`Unknown column type: ${type}`);
    }
    availableValues = columnType
      .split(type)[1]
      .replace(/^\('/, '')
      .replace(/'\)$/, '')
      .split('\',\'');
  }
  const reference = column.REFERENCED_TABLE_NAME;
  const isId = column.COLUMN_KEY.toLowerCase() === 'pri';
  const isNullable = column.IS_NULLABLE.toLowerCase() !== 'no';

  return {
    name: column.COLUMN_NAME,
    isId,
    position: column.ORDINAL_POSITION,
    defaultValue: column.COLUMN_DEFAULT,
    isNullable,
    isEditable: !isId,
    type: reference ? 'reference' : ensureType(type, columnType),
    referencedTable: reference ?? null,
    availableValues,
  };
};

const ensureType = (dataType: string, columnType: string): PropertyType => {
  switch (dataType) {
  case 'char':
  case 'varchar':
  case 'binary':
  case 'varbinary':
  case 'tinyblob':
  case 'blob':
  case 'mediumblob':
  case 'longblob':
  case 'enum':
  case 'set':
  case 'time':
  case 'year':
    return 'string';

  case 'tinytext':
  case 'text':
  case 'mediumtext':
  case 'longtext':
    return 'textarea';

  case 'bit':
  case 'smallint':
  case 'mediumint':
  case 'int':
  case 'integer':
  case 'bigint':
    return 'number';

  case 'float':
  case 'double':
  case 'decimal':
  case 'dec':
    return 'float';

  case 'tinyint':
    if (columnType === 'tinyint(1)') {
      return 'boolean';
    }
    return 'number';

  case 'bool':
  case 'boolean':
    return 'boolean';

  case 'date':
    return 'date';

  case 'datetime':
  case 'timestamp':
    return 'datetime';

  case 'json':
    return 'key-value';

  default:
    // eslint-disable-next-line no-console
    console.warn(
      `Unexpected type: ${dataType} ${columnType} fallback to string`,
    );
    return 'string';
  }
};

export class MysqlParser extends BaseDatabaseParser {
  public static dialects = ['mysql' as const, 'mysql2' as const];

  public async parse() {
    const tableNames = await this.getTables();
    const resources = await this.getResources(tableNames);
    const resourceMap = new Map<string, ResourceMetadata>();
    resources.forEach((r) => {
      resourceMap.set(r.tableName, r);
    });

    return new DatabaseMetadata(this.connectionOptions.database, resourceMap);
  }

  public async getTables() {
    const query = await this.knex.raw(`
      SHOW FULL TABLES FROM \`${this.connectionOptions.database}\` WHERE Table_type = 'BASE TABLE'
    `);

    const result = await query;
    const tables = result?.[0];

    if (!tables?.length) {
      // eslint-disable-next-line no-console
      console.warn(`No tables in database ${this.connectionOptions.database}`);

      return [];
    }

    return tables.reduce((memo, info) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars, camelcase
      const { Table_type, ...nameInfo } = info;

      const tableName = Object.values(nameInfo ?? {})[0];

      memo.push(tableName);

      return memo;
    }, []);
  }

  public async getResources(tables: string[]) {
    const resources = await Promise.all(
      tables.map(async (tableName) => {
        try {
          const resourceMetadata = new ResourceMetadata(
            this.dialect,
            this.knex,
            this.connectionOptions.database,
            null,
            tableName,
            await this.getProperties(tableName),
          );

          return resourceMetadata;
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error(error);

          return false;
        }
      }),
    );

    return resources.filter(Boolean) as ResourceMetadata[];
  }

  public async getProperties(table: string) {
    const query = this.knex
      .from('information_schema.COLUMNS as col')
      .select(
        'col.COLUMN_NAME as COLUMN_NAME',
        'col.ORDINAL_POSITION as ORDINAL_POSITION',
        'col.COLUMN_DEFAULT as COLUMN_DEFAULT',
        'col.IS_NULLABLE as IS_NULLABLE',
        'col.DATA_TYPE as DATA_TYPE',
        'col.COLUMN_TYPE as COLUMN_TYPE',
        'col.COLUMN_KEY as COLUMN_KEY',
        'col.EXTRA as EXTRA',
        'col.COLUMN_COMMENT as COLUMN_COMMENT',
        'key.REFERENCED_TABLE_NAME as REFERENCED_TABLE_NAME',
        'key.REFERENCED_COLUMN_NAME as REFERENCED_COLUMN_NAME',
      )
      .leftJoin('information_schema.KEY_COLUMN_USAGE as key', (c) => c
        .on('key.TABLE_SCHEMA', 'col.TABLE_SCHEMA')
        .on('key.TABLE_NAME', 'col.TABLE_NAME')
        .on('key.COLUMN_NAME', 'col.COLUMN_NAME')
        .on('key.REFERENCED_TABLE_SCHEMA', 'col.TABLE_SCHEMA'))
      .where('col.TABLE_SCHEMA', this.connectionOptions.database)
      .where('col.TABLE_NAME', table);

    const columns = await query;

    return columns.map((col) => new Property(getColumnInfo(col)));
  }
}
