import { describe, expect, it } from 'vitest';
import { BaseResource } from 'adminjs';
import { EnumCollection } from 'kysely-codegen/dist/core/enum-collection.js';

import { testFixtures } from '../test/fixtures.js';

import { Database } from './database.js';
import { DATABASE_SYMBOL } from './types.js';

const fixtures = testFixtures();

describe('database', () => {
  it('should return true if adapter is correct', () => {
    expect(
      Database.isAdapterFor({
        _kind: DATABASE_SYMBOL,
        connectionString: '',
        db: fixtures.db,
        introspection: {
          enums: new EnumCollection(),
          tables: [],
        },
      }),
    )
      .toBe(true);
  });

  it('should return resource', () => {
    expect(fixtures.database.resource('user'))
      .toBeInstanceOf(BaseResource);
  });

  it('should error when no table is found', async () => {
    expect(() => fixtures.database.resource('random'))
      .toThrowError('Resource with id random not found');
  });

  it('should return resources', () => {
    expect(fixtures.database.resources())
      .toMatchSnapshot();
  });
});
