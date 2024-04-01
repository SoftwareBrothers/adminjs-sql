import path from 'node:path';
import { fileURLToPath } from 'url';

import { configDotenv } from 'dotenv';

import { DatabaseDialect } from '../dialects/index.js';

type Env = {
    DIALECT: DatabaseDialect
    MYSQL_DATABASE: string
    MYSQL_DEFAULT_USER: string
    MYSQL_HOST: string
    MYSQL_PASSWORD: string
    MYSQL_ROOT_PASSWORD: string
    POSTGRES_DB: string
    POSTGRES_HOST: string
    POSTGRES_PASSWORD: string
    POSTGRES_USER: string
    POSTGRES_SCHEMA: string
}

export const getEnv = (): Env => {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const config = configDotenv({
    path: [path.join(__dirname, '../../test.env')],
  });

  return {
    DIALECT: 'mysql',
    ...process.env,
    ...config.parsed,
  } as Env;
};
