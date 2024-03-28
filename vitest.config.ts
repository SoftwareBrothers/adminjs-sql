import { defineConfig } from 'vitest/config';

const isPostgres = process.env.DIALECT === 'postgresql'

export default defineConfig({
  test: {
    globalSetup: ['src/test/setup.ts'],
    pool: 'forks',
    coverage: {
      exclude: [
          '.eslintrc.cjs',
          'src/test',
          'commitlint.config.cjs',
          `${isPostgres ? 'src/dialects/mysql.parser.ts' : 'src/dialects/postgres.parser.ts'}`,
      ],
      clean: true,
      cleanOnRerun: true,
      provider: 'istanbul',
      reportOnFailure: true,
      reporter: ['cobertura', 'text', 'html'],
      thresholds: {
        functions: 80,
        lines: 80,
        statements: 80,
      },
    },
  },
});
