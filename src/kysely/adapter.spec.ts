import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { Kysely } from 'kysely';
import { BaseResource } from 'adminjs';

import { config, createDatabase } from '../test/db.js';
import { TestDb } from '../test/types.js';

import { Adapter } from './adapter.js';

describe('adapter', () => {
  let adapter: Adapter;
  const db: Kysely<TestDb> = createDatabase();

  beforeEach(() => {
    adapter = new Adapter('postgres', {
      connectionString: `postgres://${config.user}:${config.password}@${config.host}:${config.port}/${config.database}`,
    });
  });

  afterAll(() => {
    db.destroy();
  });

  it('should fetch tables', async () => {
    await adapter.init();

    expect(adapter.database?.info.introspection.tables)
      .toMatchSnapshot();
  });

  it('should retrieve table information', async () => {
    await adapter.init();

    expect(adapter.table('user'))
      .toBeInstanceOf(BaseResource);
  });

  it('should error when no table is found', async () => {
    await adapter.init();

    expect(() => adapter.table('random'))
      .toThrowError('Resource with id random not found');
  });

  it('should error if called before init', async () => {
    expect(() => adapter.table('random'))
      .toThrowError('Adapter not initialized');
  });
});
