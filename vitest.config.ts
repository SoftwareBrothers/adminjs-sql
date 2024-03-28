import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globalSetup: ['src/test/setup.ts'],
    pool: 'forks',
    coverage: {
      exclude: [],
      clean: true,
      cleanOnRerun: true,
      provider: 'istanbul',
      reporter: ['cobertura', 'text', 'html'],
      thresholds: {
        functions: 80,
        lines: 80,
        statements: 80,
      },
    },
  },
});
