import { defineConfig } from 'vitest/config';
import path from 'path';
import unpluginSwc from 'unplugin-swc';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  plugins: [unpluginSwc.vite()],
  test: {
    environment: 'node',
    globals: true,
    include: ['**/*.spec.ts', '**/*.e2e-spec.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
});