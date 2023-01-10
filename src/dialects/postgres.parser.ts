import { PropertyType } from 'adminjs';

import { DatabaseMetadata, ResourceMetadata } from '../metadata';
import { ColumnInfo, Property } from '../Property';

import { BaseDatabaseParser } from './base-database.parser';

const pgArrayAggToArray = (agg: string) => agg.replace(/{/g, '').replace(/}/g, '').split(',');

const getColumnType = (dbType: string): PropertyType => {
  switch (dbType) {
  case 'uuid': return 'uuid';
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

const getColumnInfo = (column: Record<string, number | string>): ColumnInfo => ({
  name: column.column_name as string,
  isId: column.key_type === 'PRIMARY KEY',
  position: column.ordinal_position as number,
  defaultValue: column.column_default,
  isNullable: column.is_nullable === 'YES',
  isEditable: column.is_updatable === 'YES',
  type: column.referenced_table ? 'reference' : getColumnType(column.data_type as string),
  referencedTable: (column.referenced_table ?? null) as string | null,
});

export class PostgresParser extends BaseDatabaseParser {
  public static dialects = ['postgresql' as const];

  public async parse() {
    const tableNames = await this.getTables();
    const resources = await this.getResources(
      tableNames,
    );
    const resourceMap = new Map<string, ResourceMetadata>();
    resources.forEach((r) => {
      resourceMap.set(r.tableName, r);
    });

    return new DatabaseMetadata(this.connectionOptions.database, resourceMap);
  }

  public async getTables() {
    const query = await this.knex.raw(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema='public'
        AND table_type='BASE TABLE';
    `);

    const result = await query;

    if (!result?.rows?.length) {
      // eslint-disable-next-line no-console
      console.warn(`No tables in database ${this.connectionOptions.database}`);

      return [];
    }

    return result.rows.map(({ table_name: table }) => table);
  }

  public async getResources(tables: string[]) {
    const resources = await Promise.all(
      tables.map(async (tableName) => {
        try {
          const resourceMetadata = new ResourceMetadata(
            this.dialect,
            this.knex,
            this.connectionOptions.database,
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
        'col.is_updatable',
        'col.data_type',
        'tco.constraint_type as key_type',
      )
      .leftJoin('information_schema.key_column_usage as kcu', (c) => c
        .on('kcu.column_name', 'col.column_name')
        .on('kcu.table_name', 'col.table_name'))
      .leftJoin('information_schema.table_constraints as tco', (c) => c
        .on('tco.constraint_name', 'kcu.constraint_name')
        .on('tco.constraint_schema', 'kcu.constraint_schema')
        .onVal('tco.constraint_type', 'PRIMARY KEY'))
      .where('col.table_schema', 'public')
      .where('col.table_name', table);

    const columns = await query;

    const relQuery = this.knex.raw(`
      select
        (select r.relname from pg_class r where r.oid = c.conrelid) as table, 
        (select array_agg(attname) from pg_attribute 
        where attrelid = c.conrelid and ARRAY[attnum] <@ c.conkey) as col, 
        (select r.relname from pg_class r where r.oid = c.confrelid) as referenced_table
      from pg_constraint c
      where c.conrelid = (select oid from pg_class where relname = '${table}')
      and (select r.relname from pg_class r where r.oid = c.confrelid) is not null
    `);

    const relations = await relQuery;

    return columns.map((col) => {
      const rel = relations.rows.find((r) => {
        const cols = pgArrayAggToArray(r.col);
        if (cols.length > 1) return null; // AdminJS doesn't support multiple foreign keys

        return cols.find((c) => c === col.column_name);
      });

      if (rel) {
        col.referenced_table = rel.referenced_table;
      }

      return new Property(getColumnInfo(col));
    });
  }
}
