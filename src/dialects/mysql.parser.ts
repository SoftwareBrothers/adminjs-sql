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
      .from('information_schema.columns as col')
      .select(
        'col.column_name',
        'col.ordinal_position',
        'col.column_default',
        'col.is_nullable',
        'col.data_type',
        'col.column_type',
        'col.column_key',
        'col.extra',
        'col.column_comment',
        'key.referenced_table_name',
        'key.referenced_column_name',
      )
      .leftJoin('information_schema.key_column_usage as key', (c) => c
        .on('key.table_schema', 'col.table_schema')
        .on('key.table_name', 'col.table_name')
        .on('key.column_name', 'col.column_name')
        .on('key.referenced_table_schema', 'col.table_schema'))
      .where('col.table_schema', this.connectionOptions.database)
      .where('col.table_name', table);

    const columns = await query;

    return columns.map((col) => new Property(getColumnInfo(col)));
  }
}
