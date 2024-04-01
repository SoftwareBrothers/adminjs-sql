import crypto from 'node:crypto';

import { Adapter } from '../Adapter.js';

import { DatabaseConfig, Post, Profile, User } from './types.js';

export const buildUser = (): User => ({
  id: crypto.randomInt(1000, 9000),
  name: `Someone ${crypto.randomInt(1000, 9000)}`,
  email: `random-${crypto.randomUUID()}@email.com`,
});

export const buildProfile = (user: { id: number }): Profile => ({
  bio: 'Example',
  name: 'John Doe',
  user_id: user.id,
  id: crypto.randomUUID(),
});

export const buildPost = (user: { id: number }): Post => ({
  id: crypto.randomInt(1000, 9000),
  title: 'Example',
  content: 'Example content',
  some_json: { key: 'value' },
  status: 'ACTIVE',
  author_id: user.id,
  published: false,
});

export const getAdapter = (config: DatabaseConfig) => new Adapter(config.dialect, {
  database: config.database,
  host: config.host,
  port: config.port,
  user: config.user,
  password: config.password,
  charset: config.charset,
});
