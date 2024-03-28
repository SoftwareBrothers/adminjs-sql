import { ColumnType, Kysely } from 'kysely';

export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>;

export type Timestamp = ColumnType<Date, Date | string, Date | string>;

export type TestDb = {
  post: {
    author_id: number;
    content: string
    created_at: Generated<Timestamp>
    id: Generated<number>;
    published: boolean;
    status: 'ACTIVE' | 'REMOVED';
    title: string
    updated_at: Generated<Timestamp>;
  }
  profile: {
    bio: string;
    id: Generated<string>;
    name: string;
    user_id: number;
  }
  user: {
    email: string;
    id: Generated<number>;
    name: string;
  }
}

export type TestKyselyDb = Kysely<TestDb>;
