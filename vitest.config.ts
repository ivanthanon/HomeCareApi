import { defineConfig } from 'vitest/config';
import path from 'path';
import unpluginSwc from 'unplugin-swc';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'src': path.resolve(__dirname, './src'),
      'test': path.resolve(__dirname, './testhelpers'),
      'testhelpers': path.resolve(__dirname, './testhelpers')
    },
  },
  plugins: [unpluginSwc.vite()],
  test: {
    environment: 'node',
    globals: true,
    include: ['**/*.spec.ts', '**/*.artifact-spec.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
});