import { BaseProperty, Filter } from 'adminjs';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { buildPost, buildProfile, buildUser, getAdapter } from './test/fixtures.js';
import { Resource } from './Resource.js';
import { getDatabase } from './test/db.js';
import { ResourceMetadata } from './metadata/index.js';
import { Database } from './Database.js';
import { Property } from './Property.js';

const dbConfig = getDatabase();

async function getResource(table: string) {
  const adapter = getAdapter(dbConfig.config);
  const databaseMetadata = await adapter.init();
  return new Database(databaseMetadata).resource(table);
}

describe('Resource', () => {
  let database: Database;

  beforeAll(async () => {
    const adapter = getAdapter(dbConfig.config);
    const databaseMetadata = await adapter.init();
    database = new Database(databaseMetadata);
  });

  describe('.isAdapterFor', () => {
    it('returns true when resource metadata class is given', () => {
      const resourceMetadata = new ResourceMetadata(
        dbConfig.config.dialect,
        dbConfig.knex,
        dbConfig.config.database,
        dbConfig.config.schema,
        'user',
        [
          new Property({
            isEditable: false,
            isId: true,
            isNullable: false,
            name: 'id',
            position: 0,
            referencedTable: null,
            type: 'number',
          }),
        ],
      );

      expect(Resource.isAdapterFor(resourceMetadata)).toEqual(true);
    });

    it('returns false for any other kind of resources', () => {
      expect(Resource.isAdapterFor({} as ResourceMetadata)).toEqual(false);
    });
  });

  describe('#databaseType', () => {
    it('returns database dialect', async () => {
      expect(database.resource('user').databaseType()).toEqual(dbConfig.config.databaseType);
    });
  });

  describe('#id', () => {
    it('returns the name of the entity', async () => {
      expect(database.resource('post').id()).toEqual('post');
    });
  });

  describe('#properties', () => {
    it('returns all the properties', async () => {
      expect(database.resource('post').properties()).toHaveLength(9);
    });
  });

  describe('#property', () => {
    it('returns selected property', async () => {
      const property = database.resource('post').property('id');
      expect(property).toBeInstanceOf(BaseProperty);
    });
  });

  describe('#count', () => {
    it('returns number of records', async () => {
      const count = await database.resource('post').count({} as Filter);
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  describe('#create', () => {
    it('returns params', async () => {
      const user = await database.resource('user').create(buildUser());

      expect(user.id).toBeDefined();
    });
  });

  describe('#update', () => {
    it('updates record name', async () => {
      const user = await database.resource('user').create(buildUser());
      const post = await database.resource('post').create(buildPost({ id: user.id! }));
      const record = await database.resource('post').findOne(post.id);
      const title = 'Michael';

      await database.resource('post').update(record?.id() as string, {
        title,
      });
      const recordInDb = await database.resource('post').findOne(record?.id() as string);
      expect(recordInDb?.get('title')).toEqual(title);
    });
  });

  describe('#findOne', () => {
    it('finds record by id', async () => {
      const userObject = buildUser();
      await database.resource('user').create(userObject);
      const record = await database.resource('user').findOne(userObject.id!);
      expect(record?.params).toMatchObject(userObject);
    });
  });

  describe('#findMany', () => {
    it('finds records by ids', async () => {
      const users = await Promise.all(
        [
          database.resource('user').create(buildUser()),
          database.resource('user').create(buildUser()),
        ],
      );

      const records = await database
        .resource('user')
        .findMany(users.map((u) => u.id));

      const insertedRecordIds = records.map((r) => r.id());
      expect(insertedRecordIds).toContain(users[0].id);
      expect(insertedRecordIds).toContain(users[1].id);
    });
  });

  describe('#find', () => {
    it('finds by record name', async () => {
      const users = [buildUser(), buildUser()];
      await database.resource('user').create(users[0]);
      await database.resource('user').create(users[1]);
      const filter = new Filter(undefined, database.resource('user'));
      filter.filters = {
        name: {
          path: 'name',
          value: users[0].name,
          property: database.resource('user')
            .property('name') as BaseProperty,
        },
      };

      const record = await database.resource('user').find(filter, {});

      expect(record[0] && record[0].get('name'))
        .toEqual(users[0].name);
      expect(record[0] && record[0].get('email'))
        .toEqual(users[0].email);
      expect(record.length)
        .toEqual(1);
    });

    it('finds by record uuid column', async () => {
      const user = await database.resource('user')
        .create(buildUser());
      const user2 = await database.resource('user')
        .create(buildUser());

      const postResource = await getResource('profile');
      const profile = await postResource.create(buildProfile({ id: user.id! }));
      await postResource.create(buildProfile({ id: user2.id! }));

      const filter = new Filter(undefined, postResource);
      filter.filters = {
        id: {
          path: 'id',
          value: profile.id,
          property: postResource.property('id') as BaseProperty,
        },
      };
      const record = await postResource.find(filter, {});
      expect(record[0].params).toMatchObject(profile);
      expect(record.length).toEqual(1);
    });
  });

  describe.skip('references', () => {
    let profile;
    let user;
    let profileResource;

    beforeEach(async () => {
      user = await database.resource('user').create(buildUser());
      profileResource = await getResource('profile');
    });

    it('creates new resource', async () => {
      profile = await profileResource.create({
        bio: 'Example',
        user: user.id,
      });

      expect(profile.user)
        .toEqual(user.id);
    });
  });

  describe('#delete', () => {
    let user;

    beforeEach(async () => {
      user = await database.resource('user')
        .create(buildUser());
    });

    it('deletes the resource', async () => {
      await database.resource('user')
        .delete(user.id);
      expect(await database.resource('user')
        .findOne(user.id))
        .toBe(null);
    });
  });
});
