import { Kysely } from 'kysely';
import { ColumnMetadata, TableMetadata, EnumCollection } from 'kysely-codegen';

export type FindOptions = {
  limit?: number;
  offset?: number;
  sort?: {
    direction?: 'asc' | 'desc';
    sortBy?: string;
  };
};

export type Introspection = {
  enums: EnumCollection;
  tables: TableMetadata[];
}

export type DatabaseInformation = {
  _kind: symbol;
  db: Kysely<any>;
  introspection: Introspection;
}

export type ResourceInformation = {
  _kind: symbol;
  db: Kysely<any>;
  introspection: Introspection;
  table: TableMetadata;
}

export type PropertyInformation = {
  _kind: symbol;
  column: ColumnMetadata;
  introspection: Introspection;
}

export const DATABASE_SYMBOL = Symbol('database');
export const RESOURCE_SYMBOL = Symbol('resource');
export const PROPERTY_SYMBOL = Symbol('property');
