import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    environment: 'node',
    include: ['server/**/*.test.ts', 'server/__tests__/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['server/**/*.ts'],
      exclude: [
        'server/__tests__/**',
        'server/**/*.test.ts',
        'server/**/*.spec.ts',
        'server/index.ts',
        'server/db/**',
        '**/*.d.ts',
        'node_modules/**',
        'dist/**',
      ],
      all: true,
      lines: 80,
      functions: 80,
      branches: 80,
      statements: 80,
    },
  },
});
