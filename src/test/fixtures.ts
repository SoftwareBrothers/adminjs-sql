import crypto from 'node:crypto';

import { afterAll, beforeAll } from 'vitest';

import { Adapter } from '../kysely/adapter.js';
import { Database } from '../kysely/database.js';
import { Resource } from '../kysely/resource.js';

import { TestDb, TestKyselyDb } from './types.js';
import { config, createDatabase } from './db.js';

export const testFixtures = () => {
  const db: TestKyselyDb = createDatabase();
  const testObjects = {
    db,
    config,
    adapter: null as unknown as Adapter,
    database: null as unknown as Database,
    getResource(id: keyof TestDb): Resource {
      return testObjects.adapter!.table(id) as unknown as Resource;
    },
  };

  beforeAll(async () => {
    testObjects.adapter = new Adapter(db, {
      connectionString: `postgres://${config.user}:${config.password}@${config.host}:${config.port}/${config.database}`,
    });

    await testObjects.adapter.init();
    testObjects.database = testObjects.adapter.database!;
  });

  afterAll(async () => {
    await testObjects.db.destroy();
  });

  return testObjects;
};

export const buildUser = () => ({
  id: crypto.randomInt(1000, 9000),
  name: `Someone ${crypto.randomInt(1000, 9000)}`,
  email: `random-${crypto.randomUUID()}@email.com`,
});

export const buildProfile = (user: any) => ({
  bio: 'Example',
  user: user.id,
  user_id: user.id,
});

export const buildPost = (user: any) => ({
  title: 'Example',
  content: 'Example content',
  someJson: { key: 'value' },
  status: 'ACTIVE',
  author_id: user.id,
  published: false,
});
