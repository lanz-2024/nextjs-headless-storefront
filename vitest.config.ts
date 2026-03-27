import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules',
        '.next',
        'tests/e2e',
        '**/*.config.*',
        '**/types.ts',
        'src/mocks',
        // Next.js pages and React components — covered by E2E tests, not unit tests
        'src/app/**',
        'src/components/**',
        // HTTP adapters and clients — require network/integration tests
        'src/lib/commerce/**/*adapter*',
        'src/lib/commerce/**/*client*',
        'src/lib/commerce/**/fragments*',
        'src/lib/commerce/provider*',
        'src/lib/commerce/mock/data*',
        'src/lib/algolia/**',
        'src/lib/gtm/provider*',
        // Server Actions — require Next.js runtime
        'src/lib/cart/actions*',
        'src/proxy*',
      ],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 60,
        statements: 70,
      },
    },
    include: ['tests/unit/**/*.test.ts', 'tests/integration/**/*.test.ts'],
    exclude: ['tests/e2e/**', 'node_modules', '.next'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
