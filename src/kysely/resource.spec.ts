import { BaseProperty, BaseRecord, Filter } from 'adminjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { EnumCollection } from 'kysely-codegen';

import { buildPost, buildProfile, buildUser, testFixtures } from '../test/fixtures.js';

import { Resource } from './resource.js';
import { RESOURCE_SYMBOL } from './types.js';

const fixtures = testFixtures();

describe('Resource', () => {
  describe('.isAdapterFor', () => {
    it('returns true when Prisma model is given', () => {
      expect(Resource.isAdapterFor({
        _kind: RESOURCE_SYMBOL,
        db: fixtures.db,
        introspection: {
          tables: [],
          enums: new EnumCollection(),
        },
        table: {
          name: 'user',
          columns: [],
          schema: 'public',
        },
      }))
        .toEqual(true);
    });

    it('returns false for any other kind of resources', () => {
      expect(Resource.isAdapterFor({} as any))
        .toEqual(false);
    });
  });

  describe('#databaseType', () => {
    it('returns database dialect', () => {
      expect(fixtures.getResource('post')
        .databaseType())
        .toEqual('postgres');
    });
  });

  describe('#id', () => {
    it('returns the name of the entity', () => {
      expect(fixtures.getResource('post')
        .id())
        .toEqual('post');
    });
  });

  describe('#properties', () => {
    it('returns all the properties', () => {
      expect(fixtures.getResource('post')
        .properties())
        .toHaveLength(9);
    });
  });

  describe('#property', () => {
    it('returns selected property', () => {
      const property = fixtures.getResource('post')
        .property('id');

      expect(property)
        .toBeInstanceOf(BaseProperty);
    });
  });

  describe('#count', () => {
    it('returns number of records', async () => {
      expect(await fixtures.getResource('post')
        .count({} as Filter))
        .toBeGreaterThanOrEqual(0);
    });
  });

  describe.skip('#create', () => {
    it('returns params', async () => {
      const params = await fixtures.getResource('post')
        .create(buildUser());

      expect(params.id)
        .toBeDefined();
    });
  });

  describe('#update', () => {
    it('updates record name', async () => {
      const user = await fixtures.getResource('user')
        .create(buildUser());
      const params = await fixtures.getResource('post')
        .create(buildPost({ id: user.id }));
      const record = await fixtures.getResource('post')
        .findOne(params.id);
      const title = 'Michael';

      await fixtures.getResource('post')
        .update(record?.id() as string, {
          title,
        });
      const recordInDb = await fixtures.getResource('post')
        .findOne(record?.id() as string);
      expect(recordInDb?.get('title'))
        .toEqual(title);
    });
  });

  describe('#findOne', () => {
    it('finds record by id', async () => {
      const userObject = buildUser();
      const user = await fixtures.getResource('user')
        .create(userObject);
      const record = await fixtures.getResource('user')
        .findOne(user.id);
      expect(record?.params)
        .toMatchObject(userObject);
    });
  });

  describe('#findMany', () => {
    it('finds records by ids', async () => {
      const users = await Promise.all(
        [
          fixtures.getResource('user')
            .create(buildUser()),
          fixtures.getResource('user')
            .create(buildUser()),
        ],
      );

      const userIds = users.map((u) => u.id);
      const records = await fixtures.getResource('user')
        .findMany(userIds);
      expect(records.map((r) => r.params.id))
        .toStrictEqual(userIds);
    });
  });

  describe('#find', () => {
    let record: BaseRecord[];

    it('finds by record name', async () => {
      const users = [buildUser(), buildUser()];
      await fixtures.getResource('user')
        .create(users[0]);
      await fixtures.getResource('user')
        .create(users[1]);
      const filter = new Filter(undefined, fixtures.getResource('user'));
      filter.filters = {
        name: {
          path: 'name',
          value: users[0].name,
          property: fixtures.getResource('user')
            .property('name') as BaseProperty,
        },
      };
      record = await fixtures.getResource('user')
        .find(filter);

      expect(record[0] && record[0].get('name'))
        .toEqual(users[0].name);
      expect(record[0] && record[0].get('email'))
        .toEqual(users[0].email);
      expect(record.length)
        .toEqual(1);
    });

    it('finds by record uuid column', async () => {
      const user = await fixtures.getResource('user')
        .create(buildUser());
      const user2 = await fixtures.getResource('user')
        .create(buildUser());
      const uuidResource = fixtures.getResource('profile');
      const profile = await uuidResource.create(buildProfile(user));
      await uuidResource.create(buildProfile(user2));

      const filter = new Filter(undefined, uuidResource);
      filter.filters = {
        id: {
          path: 'id',
          value: profile.id,
          property: uuidResource.property('id') as BaseProperty,
        },
      };
      record = await uuidResource.find(filter);
      expect(record[0].params)
        .toMatchObject(profile);
      expect(record.length)
        .toEqual(1);
    });
  });

  describe.skip('references', () => {
    let profile;
    let user;
    let profileResource;

    beforeEach(async () => {
      user = await fixtures.getResource('post')
        .create(buildUser);
      profileResource = fixtures.getResource('profile');
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
      user = await fixtures.getResource('user')
        .create(buildUser());
    });

    it('deletes the resource', async () => {
      await fixtures.getResource('user')
        .delete(user.id);
      expect(await fixtures.getResource('user')
        .findOne(user.id))
        .toBe(null);
    });
  });
});
